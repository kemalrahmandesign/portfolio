/* Phone checks: no hover, so the face menu has to open on a tap and the
   case studies have to open on a tap. Run after build.py, with the server up. */
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
const ok = (n,c,d='') => console.log((c?'PASS':'FAIL')+'  '+n+(d?'  '+d:''));
(async () => {
  const b = await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
  const ctx = await b.newContext({...devices['iPhone 13'], defaultBrowserType:undefined});
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.route('**/d2ol7oe51mr4n9.cloudfront.net/**', r=>r.fulfill({status:200,body:'x'}));
  await p.route('**/framerusercontent.com/**', r=>r.abort());
  await p.goto('http://127.0.0.1:8099/index.html',{waitUntil:'load'}); await p.waitForTimeout(1500);
  await p.tap('#cta'); await p.waitForTimeout(300);
  await p.waitForSelector('#work:not([hidden])',{timeout:20000}); await p.waitForTimeout(1500);
  ok('no top bar on the phone either', (await p.evaluate(()=>getComputedStyle(document.getElementById('topnav')).display))==='none');
  await p.tap('.sn'); await p.waitForTimeout(700);
  ok('a tap on the rail opens the names', await p.evaluate(()=>document.querySelector('.sn').classList.contains('open')));
  await p.tap('.sn .sn-link >> nth=6'); await p.waitForTimeout(1800);
  const c = await p.evaluate(()=>{const r=document.getElementById('contact').getBoundingClientRect(); return {top:Math.round(r.top), open:document.querySelector('.sn').classList.contains('open')};});
  ok('tapping a name goes there and closes the rail', Math.abs(c.top) < 160 && !c.open, JSON.stringify(c));
  await p.evaluate(()=>document.querySelector('.case').scrollIntoView({block:'center'})); await p.waitForTimeout(600);
  await p.tap('.case .case-name');
  await p.waitForURL('**/work/osmosis.html',{timeout:5000}).catch(()=>{});
  ok('tapping a case study opens it', p.url().endsWith('/work/osmosis.html'), p.url());
  ok('no JS errors on the phone', errs.length===0, errs.join(' | '));
  await b.close();
})();
