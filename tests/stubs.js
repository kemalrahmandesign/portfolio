/* Stand-in media for the test site.

   The real clips live on Kemal's machine and on a CDN this container cannot
   reach, so the suite runs against stubs: flat grey WebM clips of the right
   lengths, a flat poster, and 1x1 social icons. They are deliberately plain.
   The suite tests behaviour (timing, layering, state), not pictures.

   WebM rather than MP4 because Playwright's Chromium has no H.264 decoder;
   build.py rewrites the clip paths to match. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });

(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const clip = async (grey, secs) => p.evaluate(async ([grey, secs]) => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 360;
    const x = c.getContext('2d');
    const draw = () => { x.fillStyle = `rgb(${grey},${grey},${grey})`; x.fillRect(0, 0, 640, 360); };
    draw();
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: 'video/webm;codecs=vp8' });
    const chunks = []; rec.ondataavailable = e => chunks.push(e.data);
    rec.start(); const iv = setInterval(draw, 33);
    await new Promise(r => setTimeout(r, secs * 1000));
    clearInterval(iv); rec.stop(); await new Promise(r => rec.onstop = r);
    const u = new Uint8Array(await new Blob(chunks).arrayBuffer());
    let s = ''; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
    return btoa(s);
  }, [grey, secs]);
  for (const [name, grey, secs] of [['wave', 237, 3], ['idle', 237, 6], ['walk', 242, 6]])
    fs.writeFileSync(path.join(out, name + '.webm'), Buffer.from(await clip(grey, secs), 'base64'));

  const img = async (w, h, type) => p.evaluate(([w, h, type]) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.fillStyle = '#f1f0ee'; x.fillRect(0, 0, w, h);
    return c.toDataURL(type, 0.8).split(',')[1];
  }, [w, h, type]);
  fs.writeFileSync(path.join(out, 'hub.jpg'), Buffer.from(await img(16, 9, 'image/jpeg'), 'base64'));
  const dot = Buffer.from(await img(1, 1, 'image/png'), 'base64');
  for (const k of ['ig', 'li', 'em', 'xx']) fs.writeFileSync(path.join(out, `social-${k}.png`), dot);
  await b.close();
  console.log('stubs written to', out);
})();
