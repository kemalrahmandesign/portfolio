// Pipeline smoke test against the local portfolio (no network needed).
//   npx http-server -p 8123 -s . &   node tools/reel/shots/_demo.js
const { shot } = require('../reel');
shot({ name: '_demo', url: 'http://127.0.0.1:8123/work/osmosis.html' }, async (r) => {
  await r.move({ x: 700, y: 400 });
  await r.say('hi, this is Osmosis ✨', 1500);
  await r.zoom(1.8, { focus: 'cursor' });
  await r.wait(900);
  await r.move({ x: 1100, y: 520 });
  await r.click({ x: 1180, y: 665 });
  await r.react('🚀');
  await r.wait(800);
  await r.unzoom();
  await r.scroll(900, { duration: 1500 });
  await r.move({ x: 500, y: 700 });
  await r.zoom(2.2, { focus: { x: 500, y: 700 } });
  await r.wait(1400);
  await r.unzoom();
  await r.wait(900);
});
