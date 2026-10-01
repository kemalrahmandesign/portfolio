// osmosis.zone takes, short and montage-sized.
//   node tools/reel/shots/landing.js [hero tokens orbit stats ecosystem cta tour]
const { shot } = require('../reel');

const URL = 'https://osmosis.zone/';
// Start each take already scrolled to just above its section (jump happens
// before recording), so the clip opens with a short scroll into it.
const o = (name, near) => ({
  name: `landing-${name}`,
  url: URL,
  before: near
    ? async (page) => {
        await page.locator(near).first().evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 900));
        await page.waitForTimeout(1500);
      }
    : undefined,
});

const takes = {
  // Hero: say gm, read the rotating headline, play with the swap card.
  hero: () =>
    shot(o('hero'), async (r) => {
      await r.wait(600);
      await r.move({ x: 620, y: 600 }, { duration: 900 });
      await r.say('gm ☀️ welcome to Osmosis', 1700);
      await r.zoom(1.6, { focus: { x: 560, y: 390 } });
      await r.move({ x: 700, y: 330 }, { duration: 900 });
      await r.wait(1800); // let the token in the headline rotate
      await r.zoom(1.5, { focus: { x: 1400, y: 420 } });
      await r.move({ x: 1300, y: 300 });
      await r.move({ x: 1460, y: 420 });
      await r.wait(500);
      await r.move('a:has-text("Start Trading")');
      await r.say('one click to trade ⚡', 1500);
      await r.react('🚀', 8);
      await r.wait(900);
      await r.unzoom();
      await r.wait(900);
    }),

  // Top volume / new listings, hover the rows.
  tokens: () =>
    shot(o('tokens', 'a[href*="assets/OSMO"]'), async (r) => {
      await r.move({ x: 960, y: 700 });
      await r.reveal('a[href*="assets/OSMO"]', { at: 0.35 });
      await r.zoom(1.55, { focus: { x: 720, y: 520 } });
      for (const sym of ['OSMO', 'ATOM', 'ETH', 'stATOM']) {
        await r.move(`a[href*="assets/${sym}?"]`, { at: 'left', dx: 120 });
        await r.wait(450);
      }
      await r.move('a[href*="assets/USDC?"]', { at: 'left', dx: 120 });
      await r.wait(400);
      await r.say('live prices 📈', 1500);
      await r.unzoom();
      await r.wait(700);
    }),

  // The orbit of chains/tokens.
  orbit: () =>
    shot(o('orbit', 'a[href*="assets/LINK?"]'), async (r) => {
      await r.move({ x: 960, y: 600 });
      await r.reveal('a[href*="assets/LINK?"]', { at: 0.45, duration: 2200 });
      await r.wait(500);
      await r.zoom(1.5, { focus: 'cursor' });
      for (const sym of ['ATOM?utm', 'DYM?', 'INJ?', 'STRD?', 'LINK?', 'ATONE?', 'NTRN?']) {
        if (await r.exists(`a[href*="assets/${sym}"]`, 800)) {
          await r.move(`a[href*="assets/${sym}"]`, { duration: 600 });
          await r.wait(250);
        }
      }
      await r.say('100+ chains 🪐', 1600);
      await r.unzoom();
      await r.wait(800);
    }),

  // Big numbers.
  stats: () =>
    shot(o('stats', 'text=All Time Volume'), async (r) => {
      await r.move({ x: 960, y: 640 });
      await r.reveal('text=All Time Volume', { at: 0.55, duration: 2400 });
      await r.wait(400);
      await r.move('text=All Time Volume', { dy: 30 });
      await r.zoom(1.7, { focus: 'cursor', speed: 0.8 });
      await r.wait(900);
      await r.say('$44B+ traded 🤯', 1600);
      await r.move('text=Assets on the Platform', { dy: 30 });
      await r.wait(700);
      await r.move('text=24h trading volume', { dy: 30 });
      await r.wait(800);
      await r.unzoom();
      await r.wait(800);
    }),

  // DeFi product cards: hover each.
  ecosystem: () =>
    shot(o('ecosystem', 'h2:has-text("Unlock the full potential")'), async (r) => {
      await r.move({ x: 960, y: 640 });
      await r.reveal('h2:has-text("Unlock the full potential")', { at: 0.18, duration: 2400 });
      await r.wait(500);
      await r.zoom(1.35, { focus: 'cursor' });
      for (const h of ['Liquidity Pools', 'Perpetuals', 'Margin Trading', 'Liquid Staking', 'More Possibilities']) {
        await r.move(`h3:has-text("${h}")`, { dy: -120 });
        await r.wait(750);
      }
      await r.react('✨', 7);
      await r.wait(500);
      await r.unzoom();
      await r.wait(800);
    }),

  // Closing CTA.
  cta: () =>
    shot(o('cta', 'h2:has-text("Start trading today")'), async (r) => {
      await r.move({ x: 960, y: 640 });
      await r.reveal('h2:has-text("Start trading today")', { at: 0.4, duration: 2400 });
      await r.wait(500);
      await r.move('a:has-text("Get Started") >> nth=1'); // nth=0 is the nav's "Get started"
      await r.zoom(1.8, { focus: 'cursor' });
      await r.say('let’s go 🧪', 1500);
      await r.react('💜', 8);
      await r.wait(1000);
      await r.unzoom();
      await r.wait(800);
    }),

  // Snappy, no cursor (render with --no-cursor): ease in on the headline while
  // the token flips, then pan right to the swap card.
  heroquick: () =>
    shot(o('heroquick'), async (r) => {
      await r.move({ x: 960, y: 1060 }, { duration: 200 }); // park the mouse off the hero
      await r.wait(300);
      await r.zoom(1.75, { focus: { x: 520, y: 330 }, speed: 1.9 });
      await r.wait(2300);
      await r.zoom(1.75, { focus: { x: 1400, y: 380 }, speed: 1.5 });
      await r.wait(1700);
      await r.unzoom({ speed: 1.9 });
      await r.wait(700);
    }),

  // One long scroll-through for b-roll.
  tour: () =>
    shot(o('tour'), async (r) => {
      await r.move({ x: 1500, y: 760 });
      await r.wait(1200);
      for (let i = 0; i < 8; i++) {
        await r.scroll(1000, { duration: 1800 });
        await r.wait(700);
      }
    }),
};

(async () => {
  const want = process.argv.slice(2);
  for (const [k, fn] of Object.entries(takes)) if (!want.length || want.includes(k)) await fn();
})();
