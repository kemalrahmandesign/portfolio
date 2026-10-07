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
  ok('no side rail on the phone', (await p.evaluate(()=>getComputedStyle(document.querySelector('.sn')).display))==='none');
  await p.tap('#tnFace'); await p.waitForTimeout(700);
  const drop = await p.evaluate(()=>({on:document.getElementById('topnav').classList.contains('dropped'),
    items:[...document.querySelectorAll('#tnDrop a')].map(a=>a.textContent),
    op:getComputedStyle(document.getElementById('tnDrop')).opacity}));
  ok('a tap on the face rolls the menu down', drop.on && drop.op==='1', JSON.stringify(drop));
  ok('the menu has home written out', drop.items[0]==='home' && drop.items.length===5);
  await p.tap('#tnDrop a[data-go="contact"]'); await p.waitForTimeout(1500);
  const c = await p.evaluate(()=>{const r=document.getElementById('contact').getBoundingClientRect(); return {top:Math.round(r.top), dropped:document.getElementById('topnav').classList.contains('dropped')};});
  ok('tapping a line goes there and closes the menu', Math.abs(c.top) < 120 && !c.dropped, JSON.stringify(c));
  await p.evaluate(()=>document.querySelector('.case').scrollIntoView({block:'center'})); await p.waitForTimeout(600);
  await p.tap('.case .case-name');
  await p.waitForURL('**/work/osmosis.html',{timeout:5000}).catch(()=>{});
  ok('tapping a case study opens it', p.url().endsWith('/work/osmosis.html'), p.url());
  ok('no JS errors on the phone', errs.length===0, errs.join(' | '));
  await b.close();
})();
