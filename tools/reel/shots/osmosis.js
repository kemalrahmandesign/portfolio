// Osmosis showcase takes. DRAFT: written before the container could reach
// osmosis.zone, so selectors are text-based guesses at the live app and every
// beat is guarded. Tune against the real DOM on the first run.
//
//   node tools/reel/shots/osmosis.js            # every take
//   node tools/reel/shots/osmosis.js swap pools # just these
//   python3 tools/reel/render.py tools/reel/out/<take> [--framed]
const { shot } = require('../reel');

const APP = 'https://app.osmosis.zone';
const SITE = 'https://osmosis.zone';

// Try each candidate selector, act on the first that is visible.
async function first(r, sels, fn, timeout = 2500) {
  for (const s of [].concat(sels)) if (await r.exists(s, timeout)) return fn(s);
  console.warn(`[osmosis] none visible: ${[].concat(sels).join(' | ')}`);
}

const takes = {
  // Marketing site: hero, a scroll through the story, hand-off to the app.
  landing: () =>
    shot({ name: 'osmosis-landing', url: SITE }, async (r) => {
      await r.move({ x: 960, y: 520 });
      await r.say('welcome to Osmosis 👋', 1600);
      await r.zoom(1.5, { focus: 'cursor' });
      await first(r, ['a:has-text("Launch App")', 'a:has-text("Launch")', 'text=Trade'], (s) => r.move(s));
      await r.wait(700);
      await r.unzoom();
      await r.scroll(1400, { duration: 2200 });
      await r.wait(600);
      await r.scroll(1400, { duration: 2200 });
      await r.wait(900);
    }),

  // The swap card: pick tokens, type an amount, zoom on the quote.
  swap: () =>
    shot({ name: 'osmosis-swap', url: APP }, async (r) => {
      await r.move({ x: 960, y: 560 });
      await r.say('let’s swap ✨', 1300);
      await r.zoom(1.45, { focus: 'cursor' });
      await first(r, ['input[inputmode="decimal"]', 'input[placeholder="0"]', 'input[type="number"]'], async (s) => {
        await r.click(s);
        await r.type('250');
      });
      await r.wait(1200);
      await first(r, ['text=/1 OSMO ≈/', 'text=/Price impact/i', 'text=/Route/i'], async (s) => {
        await r.move(s);
        await r.zoom(1.9, { focus: s });
        await r.wait(1600);
      });
      await r.zoom(1.45, { focus: 'cursor' });
      await first(r, ['button[aria-label*="witch" i]', 'button[aria-label*="flip" i]', 'button:has(svg[class*="arrow" i])'], (s) => r.click(s));
      await r.react('🔁', 5);
      await r.wait(900);
      await r.unzoom();
      await r.wait(800);
    }),

  // Token picker: search, hover a few assets.
  picker: () =>
    shot({ name: 'osmosis-picker', url: APP }, async (r) => {
      await r.move({ x: 960, y: 500 });
      await first(r, ['button:has-text("OSMO")', 'button:has-text("Select")'], (s) => r.click(s));
      await r.zoom(1.5, { focus: 'cursor' });
      await first(r, ['input[placeholder*="Search" i]'], async (s) => {
        await r.click(s);
        await r.type('atom');
      });
      await r.wait(1200);
      await r.press('Escape');
      await r.unzoom();
      await r.wait(600);
    }),

  // Asset page with the price chart: scrub across it.
  asset: () =>
    shot({ name: 'osmosis-asset', url: `${APP}/assets/OSMO` }, async (r) => {
      await r.move({ x: 700, y: 420 });
      await r.say('real-time charts 📈', 1400);
      await r.zoom(1.6, { focus: 'cursor' });
      for (let x = 420; x <= 1180; x += 190) await r.move({ x, y: 460 + Math.sin(x / 90) * 40 }, { duration: 520 });
      await r.wait(500);
      await r.unzoom();
      await r.scroll(900, { duration: 1600 });
      await r.wait(800);
    }),

  // Pools table: scroll, hover the APR column.
  pools: () =>
    shot({ name: 'osmosis-pools', url: `${APP}/pools` }, async (r) => {
      await r.move({ x: 960, y: 540 });
      await r.scroll(700, { duration: 1500 });
      await first(r, ['text=/APR/i'], async (s) => {
        await r.move(s);
        await r.zoom(1.8, { focus: s });
        await r.wait(1500);
      });
      await r.unzoom();
      await r.scroll(900, { duration: 1800 });
      await r.wait(800);
    }),

  // Limit orders: switch the trade card to Buy/Sell with a limit price.
  limit: () =>
    shot({ name: 'osmosis-limit', url: APP }, async (r) => {
      await r.move({ x: 960, y: 520 });
      await first(r, ['button:has-text("Buy")', 'text=Buy'], (s) => r.click(s));
      await r.zoom(1.5, { focus: 'cursor' });
      await first(r, ['button:has-text("Limit")', 'text=Limit'], (s) => r.click(s));
      await r.wait(1000);
      await first(r, ['button:has-text("Sell")', 'text=Sell'], (s) => r.click(s));
      await r.wait(1000);
      await r.unzoom();
      await r.wait(600);
    }),

  // 1-Click Trading. Needs a connected wallet (see README): run it with
  // USER_DATA_DIR pointing at a profile where Keplr is unlocked and 1CT is on.
  oneclick: () =>
    shot({ name: 'osmosis-1ct', url: APP }, async (r) => {
      await r.move({ x: 960, y: 520 });
      await r.say('1-Click Trading ⚡', 1500);
      await first(r, ['text=/1-Click Trading/i', 'button:has-text("1-Click")'], async (s) => {
        await r.move(s);
        await r.zoom(1.8, { focus: s });
        await r.highlight(s, 1400);
      });
      await r.zoom(1.45, { focus: 'cursor' });
      await first(r, ['input[inputmode="decimal"]', 'input[placeholder="0"]'], async (s) => {
        await r.click(s);
        await r.type('5');
      });
      await r.wait(900);
      if (process.env.EXECUTE === '1') {
        // Real trade. Only with EXECUTE=1, and only with 1CT enabled so no popup.
        await first(r, ['button:has-text("Swap")', 'button:has-text("Buy")'], (s) => r.click(s));
        await r.wait(2500);
        await r.react('⚡', 8);
        await r.say('no pop-ups 🙌', 1600);
      } else {
        await first(r, ['button:has-text("Swap")', 'button:has-text("Buy")'], (s) => r.move(s));
        await r.wait(1200);
      }
      await r.unzoom();
      await r.wait(800);
    }),
};

(async () => {
  const want = process.argv.slice(2);
  for (const [k, fn] of Object.entries(takes)) if (!want.length || want.includes(k)) await fn();
})();
