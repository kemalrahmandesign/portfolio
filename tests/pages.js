/* The case study pages and arriving from them. Run after build.py, with the
   server up on :8099. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ok = (n,c,d='') => console.log((c?'PASS':'FAIL')+'  '+n+(d?'  '+d:''));
(async () => {
  const b = await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
  const ctx = await b.newContext({viewport:{width:1440,height:900}});
  const errs=[];
  const open = async (path) => { const p = await ctx.newPage(); p.on('pageerror',e=>errs.push(path+': '+e));
    await p.route('**/framerusercontent.com/**', r=>r.abort());
    await p.route('**/d2ol7oe51mr4n9.cloudfront.net/**', r=>r.fulfill({status:200,body:'x'}));
    await p.goto('http://127.0.0.1:8099/'+path,{waitUntil:'load'}); await p.waitForTimeout(900); return p; };

  for (const w of ['osmosis','polaris','loco']){
    const p = await open(`work/${w}.html`);
    const nav = await p.evaluate(()=>({face:!!document.getElementById('tnFace'),
      links:[...document.querySelectorAll('.tn-drop a')].map(a=>a.getAttribute('aria-label')||a.textContent)}));
    ok(`${w}: has the regular top nav`, nav.face && nav.links.join()==='home,about,experience,work,contact', JSON.stringify(nav));
    await p.hover('#tnFace'); await p.waitForTimeout(700);
    const pills = await p.evaluate(()=>{const f=document.getElementById('tnFace').getBoundingClientRect();
      const as=[...document.querySelectorAll('.tn-drop a')].filter(a=>getComputedStyle(a).display!=='none').map(a=>a.getBoundingClientRect());
      return {l:as.filter(r=>r.right<f.left).length, r:as.filter(r=>r.left>f.right).length,
        tip:+getComputedStyle(document.querySelector('.tn-tip')).opacity};});
    ok(`${w}: hover opens two pills each side, face shows its tag`, pills.l===2 && pills.r===2 && pills.tip>0.9, JSON.stringify(pills));
    ok(`${w}: pills have the fill blob`, (await p.evaluate(()=>document.querySelectorAll('.tn-drop .bl').length))===5 || (await p.evaluate(()=>document.querySelectorAll('.tn-drop .bl').length))===4);
    const text = await p.evaluate(()=>document.body.innerText);
    ok(`${w}: no Toyota/Lexus, no little sibling`, !/toyota|lexus|little sibling/i.test(text));
    await p.close();
  }
  const pol = await open('work/polaris.html');
  ok('polaris: described as an aggregator', /aggregator/i.test(await pol.evaluate(()=>document.body.innerText)));
  await pol.close();

  const l = await open('work/loco.html');
  const hero = await l.evaluate(()=>{const h=document.querySelector('.hl');const r=h.getBoundingClientRect();
    return {name:document.querySelector('.hl-name').textContent, sub:document.querySelector('.hl-sub').textContent,
      tag:document.querySelector('.hl-tag').textContent, inView:r.top>=0 && r.bottom<=innerHeight, op:+getComputedStyle(h).opacity,
      video:!!document.querySelector('.hero-film video')};});
  ok('loco: hero shows the site text over the film', hero.name==='Loco Exotics' && /exotic car repair/i.test(hero.sub) && /Sterling/.test(hero.tag) && hero.inView && hero.op===1 && hero.video, JSON.stringify(hero));
  await l.evaluate(()=>scrollTo(0, innerHeight*1.2)); await l.waitForTimeout(500);
  const held = await l.evaluate(()=>{const r=document.querySelector('.hl').getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight;});
  ok('loco: the text stays while the film scrubs', held);
  const board = await l.evaluate(()=>{const fs=[...document.querySelectorAll('.board .frame')].map(f=>f.getBoundingClientRect());
    const rows={}; fs.forEach(r=>{const k=Math.round(r.top); (rows[k]=rows[k]||[]).push(r);});
    const ks=Object.keys(rows).map(Number).sort((a,b)=>a-b);
    const top=rows[ks[0]], bot=rows[ks[1]];
    const span=a=>Math.round(Math.max(...a.map(r=>r.right))-Math.min(...a.map(r=>r.left)));
    return {n:fs.length, rows:ks.length, top:top.length, bottom:bot.length, topSpan:span(top), botSpan:span(bot)};});
  ok('loco: five scenes as two over three, same width', board.n===5 && board.rows===2 && board.top===2 && board.bottom===3 && Math.abs(board.topSpan-board.botSpan)<3, JSON.stringify(board));
  const ov = await l.evaluate(()=>[...document.querySelectorAll('.board .frame')].map(f=>f.querySelector('.ov').textContent.trim().length>15));
  ok('loco: every scene carries the site text', ov.length===5 && ov.every(Boolean), JSON.stringify(ov));
  await l.close();

  // arriving from a case page with a section in the address
  const m = await open('index.html#contact');
  await m.waitForSelector('#work:not([hidden])',{timeout:8000}).catch(()=>{});
  await m.waitForTimeout(1500);
  const arrived = await m.evaluate(()=>({shown:!document.getElementById('work').hidden,
    top:Math.round(document.getElementById('contact').getBoundingClientRect().top),
    nav:getComputedStyle(document.getElementById('topnav')).opacity}));
  await m.waitForTimeout(800);
  const veil = await m.evaluate(()=>+getComputedStyle(document.getElementById('cover')).opacity);
  ok('the white cover lifts after a deep link', veil===0, String(veil));
  ok('a deep link lands on its section, past the hero', arrived.shown && Math.abs(arrived.top)<140 && arrived.nav==='1', JSON.stringify(arrived));
  await m.close();
  const w = await open('index.html#cases'); await w.waitForTimeout(2200);
  const wk = await w.evaluate(()=>({veil:+getComputedStyle(document.getElementById('cover')).opacity, top:Math.round(document.getElementById('cases').getBoundingClientRect().top)}));
  ok('Work from a case page shows the work, not a white screen', wk.veil===0 && Math.abs(wk.top)<140, JSON.stringify(wk));
  await w.close();
  ok('no JS errors', errs.length===0, errs.join(' | '));
  await b.close();
})();
