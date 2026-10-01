// Reel recorder. Drives a real Chromium and logs an event track (cursor path,
// clicks, camera beats, cursor chat) for render.py, which turns the capture
// into a smooth 60fps video with a FigJam-style cursor and Screen Studio-style
// zooms.
//
//   const reel = await Reel.start({ name: 'swap', url: 'https://app.osmosis.zone' });
//   await reel.click('text=Swap');
//   await reel.zoom(2, { focus: 'cursor' });
//   await reel.stop();
//
// Capture: a headed, fullscreen Chromium at 1.5x DPR on a virtual X display
// (Xvfb), grabbed by ffmpeg at 60fps. A 1920x1080 viewport is 2880x1620 real
// pixels, so zooms up to 1.5x in a 1080p export are native. (2x / 4K capture
// works with REEL_SCALE=2 on a machine with the cores to encode it live.)
// The cursor is not on the capture at all: it is composited in post.

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const OUT = process.env.REEL_OUT || path.join(__dirname, 'out');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const DEFAULTS = {
  user: 'Kemal',
  color: '#8C8AF9', // Osmosis lavender
  ink: '#ffffff',
};

class Reel {
  static async start(o = {}) {
    const r = new Reel();
    await r._start(o);
    return r;
  }

  async _start({
    name,
    url,
    width = 1920,
    height = 1080,
    scale = Number(process.env.REEL_SCALE || 1.5),
    user = DEFAULTS.user,
    color = DEFAULTS.color,
    ink = DEFAULTS.ink,
    userDataDir = process.env.USER_DATA_DIR,
    extensions = process.env.EXTENSIONS, // comma-separated unpacked extension dirs
    colorScheme = 'dark',
    before, // async (page) => {} run after load, before recording starts
    display = Number(process.env.REEL_DISPLAY || 90 + Math.floor(Math.random() * 400)),
  }) {
    this.name = name;
    this.dir = path.join(OUT, name);
    fs.rmSync(this.dir, { recursive: true, force: true });
    fs.mkdirSync(this.dir, { recursive: true });
    this.w = width;
    this.h = height;
    this.scale = scale;
    this.style = { user, color, ink };
    this.pos = { x: width * 0.55, y: height * 0.62 };
    this.track = [];
    this.t0 = Date.now();

    // Virtual display, exactly the size of the physical viewport.
    this.fps = Number(process.env.REEL_GRAB_FPS || 60);
    this.pw = width * scale;
    this.ph = height * scale;
    this.display = `:${display}`;
    this.xvfb = spawn('Xvfb', [this.display, '-screen', '0', `${this.pw}x${this.ph}x24`, '-nolisten', 'tcp'], { stdio: 'ignore' });
    await sleep(700);

    const args = [
      `--force-device-scale-factor=${scale}`,
      `--window-size=${width},${height}`,
      '--window-position=0,0',
      '--start-fullscreen',
      '--hide-scrollbars',
      '--disable-infobars',
      '--test-type',
      '--force-color-profile=srgb',
      '--no-first-run',
      '--disable-features=Translate,MediaRouter',
    ];
    if (extensions) args.push(`--disable-extensions-except=${extensions}`, `--load-extension=${extensions}`);
    const launch = {
      headless: false,
      args,
      ignoreDefaultArgs: ['--enable-automation'],
      env: { ...process.env, DISPLAY: this.display },
      viewport: null,
      colorScheme,
      locale: 'en-US',
    };
    if (userDataDir) {
      // Persistent profile: lets a wallet extension (Keplr etc.) stay signed in.
      this.ctx = await chromium.launchPersistentContext(userDataDir, launch);
      this.page = this.ctx.pages()[0] || (await this.ctx.newPage());
    } else {
      const { viewport, colorScheme: cs, locale, ...l } = launch;
      this.browser = await chromium.launch(l);
      this.ctx = await this.browser.newContext({ viewport: null, colorScheme: cs, locale });
      this.page = await this.ctx.newPage();
    }

    const overlay = fs.readFileSync(path.join(__dirname, 'overlay.js'), 'utf8');
    await this.ctx.addInitScript({ content: `(${overlay})(${JSON.stringify({ color })});` });

    const cdp = await this.ctx.newCDPSession(this.page);
    const { windowId } = await cdp.send('Browser.getWindowForTarget');
    await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'fullscreen' } }).catch(() => {});
    await sleep(500);

    await this.page.mouse.move(this.pos.x, this.pos.y);
    if (url) await this.goto(url);
    if (before) await before(this.page);
    await this._record();
  }

  async _record() {
    this.video = path.join(this.dir, 'capture.mp4');
    this.ff = spawn(
      'ffmpeg',
      ['-y', '-loglevel', 'error', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
        '-f', 'x11grab', '-draw_mouse', '0', '-framerate', String(this.fps),
        '-video_size', `${this.pw}x${this.ph}`, '-i', `${this.display}.0+0,0`,
        '-fps_mode', 'cfr', '-r', '60',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '12', '-pix_fmt', 'yuv420p', this.video],
      { stdio: ['pipe', 'inherit', 'inherit'] },
    );
    await sleep(1200);
    // Sync flash: render.py finds the first magenta frame and aligns the track to it.
    await this.page.evaluate(() => window.__reel.flash(true));
    this.log({ type: 'sync' });
    await sleep(250);
    await this.page.evaluate(() => window.__reel.flash(false));
    await sleep(250);
    this.log({ type: 'start' });
    this.log({ type: 'cursor', x: this.pos.x, y: this.pos.y });
  }

  now() {
    return (Date.now() - this.t0) / 1000;
  }

  log(ev) {
    this.track.push({ t: this.now(), ...ev });
  }

  async goto(url, { wait = 'domcontentloaded', settle = 1500, idle = 15000 } = {}) {
    await this.page.goto(url, { waitUntil: wait, timeout: 90000 });
    if (idle) await this.page.waitForLoadState('networkidle', { timeout: idle }).catch(() => {});
    await sleep(settle);
  }

  // Resolve a target (selector string, Locator, or {x,y}) to a viewport point.
  // Selectors may target a[href]; a hovered link has its href parked in data-reel-href.
  async point(target, { at = 'center', dx = 0, dy = 0, scroll = false } = {}) {
    if (target && typeof target.x === 'number' && target.width === undefined) return { x: target.x + dx, y: target.y + dy };
    const loc = typeof target === 'string' ? this.page.locator(target).first() : target;
    await loc.waitFor({ state: 'visible', timeout: 15000 });
    if (scroll) await loc.scrollIntoViewIfNeeded().catch(() => {});
    const b = await loc.boundingBox();
    if (!b) throw new Error(`no box for ${target}`);
    const px = at === 'left' ? b.x + Math.min(24, b.width / 2) : at === 'right' ? b.x + b.width - Math.min(24, b.width / 2) : b.x + b.width / 2;
    return { x: px + dx, y: b.y + b.height / 2 + dy, box: b };
  }

  async box(target) {
    const loc = typeof target === 'string' ? this.page.locator(target).first() : target;
    await loc.waitFor({ state: 'visible', timeout: 15000 });
    return loc.boundingBox();
  }

  async exists(target, timeout = 3000) {
    const loc = typeof target === 'string' ? this.page.locator(target).first() : target;
    return loc.waitFor({ state: 'visible', timeout }).then(() => true, () => false);
  }

  // Human-ish move: eased, with a slight arc, duration scaled by distance.
  async move(target, opts = {}) {
    const p = await this.point(target, opts);
    const from = { ...this.pos };
    const dist = Math.hypot(p.x - from.x, p.y - from.y);
    const dur = opts.duration ?? Math.min(1100, 380 + dist * 0.45);
    const bend = (opts.arc ?? 0.1) * dist * (Math.random() < 0.5 ? -1 : 1);
    const nx = -(p.y - from.y) / (dist || 1);
    const ny = (p.x - from.x) / (dist || 1);
    const start = Date.now();
    for (;;) {
      const k = Math.min(1, (Date.now() - start) / dur);
      const e = ease(k);
      const arc = Math.sin(Math.PI * e) * bend;
      const x = from.x + (p.x - from.x) * e + nx * arc;
      const y = from.y + (p.y - from.y) * e + ny * arc;
      await this.page.mouse.move(x, y);
      this.pos = { x, y };
      this.log({ type: 'cursor', x, y });
      if (k >= 1) break;
      await sleep(8);
    }
    // Re-hit-test once the overlay has parked a hovered link's href, so
    // Chrome's link-preview bubble clears.
    await sleep(30);
    await this.page.mouse.move(this.pos.x + 0.01, this.pos.y);
    return p;
  }

  async click(target, opts = {}) {
    const p = await this.move(target, opts);
    await sleep(opts.hover ?? 220);
    this.log({ type: 'down', x: this.pos.x, y: this.pos.y });
    await this.page.mouse.down();
    await sleep(100);
    await this.page.mouse.up();
    this.log({ type: 'up' });
    await sleep(opts.after ?? 450);
    return p;
  }

  async type(text, { delay = 80, jitter = 50 } = {}) {
    for (const ch of text) {
      await this.page.keyboard.type(ch);
      await sleep(delay + Math.random() * jitter);
    }
  }

  async press(key) {
    await this.page.keyboard.press(key);
  }

  // Smooth wheel scroll; the cursor stays put.
  async scroll(dy, { duration = 1200 } = {}) {
    const steps = Math.max(8, Math.round(duration / 16));
    let done = 0;
    for (let i = 1; i <= steps; i++) {
      const want = dy * ease(i / steps);
      await this.page.mouse.wheel(0, want - done);
      done = want;
      await sleep(duration / steps);
    }
    await sleep(250);
  }

  // Smooth-scroll until target sits at `at` (0 top .. 1 bottom) of the viewport.
  async reveal(target, { at = 0.45, duration } = {}) {
    const loc = typeof target === 'string' ? this.page.locator(target).first() : target;
    await loc.waitFor({ state: 'attached', timeout: 15000 });
    const b = await loc.evaluate((e) => { const r = e.getBoundingClientRect(); return { y: r.y, h: r.height }; });
    const dy = b.y + b.h / 2 - this.h * at;
    if (Math.abs(dy) > 4) await this.scroll(dy, { duration: duration ?? Math.min(2400, 700 + Math.abs(dy) * 0.9) });
  }

  // Camera. zoom 1 = full frame. focus: 'cursor' (follows with a dead zone),
  // a target (selector/Locator), or {x,y} in viewport px.
  async zoom(level, { focus = 'cursor', speed = 1, wait = 0 } = {}) {
    let f = focus;
    if (focus !== 'cursor') {
      const p = await this.point(focus, { scroll: false }).catch(() => null);
      f = p ? { x: p.x, y: p.y } : 'cursor';
    }
    this.log({ type: 'zoom', zoom: level, focus: f, speed });
    if (wait) await sleep(wait);
  }

  async unzoom(opts = {}) {
    return this.zoom(1, { focus: { x: this.w / 2, y: this.h / 2 }, ...opts });
  }

  // Cursor chat: the name tag grows into a speech bubble, like FigJam's "/".
  async say(text, ms = 1700) {
    this.log({ type: 'say', text });
    if (ms) {
      await sleep(ms);
      this.hush();
    }
  }

  hush() {
    this.log({ type: 'hush' });
  }

  async react(emoji, n = 7) {
    await this.page.evaluate(([e, x, y, k]) => window.__reel.react(e, x, y, k), [emoji, this.pos.x, this.pos.y, n]);
  }

  async highlight(target, ms = 1400, pad = 8) {
    const b = await this.box(target);
    await this.page.evaluate(([r, p]) => window.__reel.highlight(r, p), [b, pad]);
    if (ms) {
      await sleep(ms);
      await this.page.evaluate(() => window.__reel.unhighlight());
    }
  }

  async wait(ms) {
    await sleep(ms);
  }

  mark(label) {
    this.log({ type: 'mark', label });
  }

  async stop() {
    await sleep(700);
    this.log({ type: 'end' });
    await sleep(300);
    this.ff.stdin.write('q');
    await new Promise((r) => this.ff.on('close', r));
    if (this.browser) await this.browser.close();
    else await this.ctx.close();
    this.xvfb.kill();
    await this._sprites();
    fs.writeFileSync(
      path.join(this.dir, 'track.json'),
      JSON.stringify({ w: this.w, h: this.h, scale: this.scale, style: this.style, track: this.track }),
    );
    console.log(`[reel] ${this.name}: ${this.now().toFixed(1)}s -> ${this.dir}`);
    return this.dir;
  }

  // Render the cursor, name tag and every chat bubble this take used as
  // transparent PNGs at 3x, so they stay sharp under any zoom.
  async _sprites() {
    const dir = path.join(this.dir, 'sprites');
    fs.mkdirSync(dir, { recursive: true });
    const b = await chromium.launch({ headless: true });
    const p = await (await b.newContext({ deviceScaleFactor: 3, viewport: { width: 900, height: 600 } })).newPage();
    await p.goto('file://' + path.join(__dirname, 'sprites.html'));
    const { color, ink, user } = this.style;
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
    const arrow = `<svg width="26" height="30" viewBox="0 0 26 30"><path d="M2.6 2.2c-.5-.4-1.2 0-1.1.7l3.4 23.6c.1.8 1.1 1 1.6.4l5.3-7.2c.2-.3.6-.5 1-.5l9-.4c.7 0 1.1-.9.5-1.4L2.6 2.2z" fill="${color}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>`;
    const shots = { arrow: `<div class="s">${arrow}</div>`, tag: `<div class="s"><span class="tag">${esc(user)}</span></div>` };
    const chats = [...new Set(this.track.filter((e) => e.type === 'say').map((e) => e.text))];
    chats.forEach((t, i) => {
      shots[`chat${i}`] = `<div class="s"><span class="tag chat"><span class="nm">${esc(user)}</span><span class="tx">${esc(t)}</span></span></div>`;
    });
    const manifest = { pad: 12, dpr: 3, chats: {} };
    for (const [k, html] of Object.entries(shots)) {
      await p.evaluate(([h, c, i]) => {
        document.body.innerHTML = h;
        document.body.style.setProperty('--c', c);
        document.body.style.setProperty('--ink', i);
      }, [html, color, ink]);
      await p.evaluate(() => document.fonts.ready);
      await p.locator('.s').screenshot({ path: path.join(dir, `${k}.png`), omitBackground: true });
    }
    chats.forEach((t, i) => (manifest.chats[t] = `chat${i}`));
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
    await b.close();
  }
}

// Run a shot function and always tear down cleanly, even if a selector misses.
async function shot(opts, fn) {
  const r = await Reel.start(opts);
  try {
    await fn(r);
  } catch (e) {
    console.error(`[reel] ${opts.name}: ${e.message.split('\n')[0]} (keeping what was recorded)`);
  }
  return r.stop();
}

module.exports = { Reel, shot, sleep };
