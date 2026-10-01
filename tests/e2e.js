/* End-to-end suite. See tests/README.md: build, serve on :8099, then run. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ok = (n,c,d='') => console.log((c?'PASS':'FAIL')+'  '+n+(d?'  '+d:''));
(async () => {
  const b = await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
  const ctx = await b.newContext({viewport:{width:1440,height:900}});
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.route('**/d2ol7oe51mr4n9.cloudfront.net/**', r=>r.fulfill({status:200,body:'x'}));
  await p.goto('http://127.0.0.1:8099/index.html',{waitUntil:'load'});
  await p.waitForTimeout(1700);
  const E = f => p.evaluate(f);

  // hero
  const hero = await E(()=>{const n=document.querySelector('.topnav').getBoundingClientRect(),
    h=document.querySelector('h1').getBoundingClientRect();
    return {navB:Math.round(n.bottom), h1T:Math.round(h.top), h1B:Math.round(h.bottom)};});
  ok('masthead clears the menu', hero.h1T > hero.navB, JSON.stringify(hero));
  ok('avatar loaded', await E(()=>{const i=document.getElementById('tnFaceImg');return i.naturalWidth>0;}));

  // overscroll
  const x0 = await E(()=>Math.round(document.querySelector('h1').getBoundingClientRect().left));
  await p.mouse.move(700,600);
  for (let i=0;i<8;i++) await p.mouse.wheel(0,140);
  await p.waitForTimeout(70);
  const arc = await E(()=>{const u=document.getElementById('underside').getBoundingClientRect(),
    t=document.querySelector('#underside text').getBoundingClientRect();
    return {undersideOnScreen:u.top<innerHeight, textOnScreen:t.top<innerHeight&&t.width>0, textW:Math.round(t.width)};});
  ok('the underside is the studio flipped upside down, with the black arc layered over it', (await E(()=>{const i=document.getElementById('uFlip'); const c=getComputedStyle(i);
    const f=getComputedStyle(document.querySelector('.underside .fill')).fill;
    return c.transform==='matrix(1, 0, 0, -1, 0, 0)' && (c.maskImage||c.webkitMaskImage||'').includes('gradient') && f.startsWith('rgb(10') &&
      getComputedStyle(document.querySelector('.underside svg')).zIndex==='1';})));
  ok('arc revealed', arc.undersideOnScreen && arc.textOnScreen, JSON.stringify(arc));
  ok('no sideways shift', (await E(()=>Math.round(document.querySelector('h1').getBoundingClientRect().left))) === x0);
  await p.waitForTimeout(400);
  ok('arc holds before springing', (await E(()=>getComputedStyle(document.getElementById('heroSlide')).transform))!=='none');
  await p.waitForTimeout(1400);
  ok('springs back', (await E(()=>getComputedStyle(document.getElementById('heroSlide')).transform))==='none');

  // socials
  const want = {Instagram:'instagram.com/k.e.m.a.l__r', LinkedIn:'linkedin.com/in/kemal-rahman203', X:'x.com/kemal_rahman_', Email:'mailto:kemalrahmandesign@gmail.com'};
  const sl = await E(()=>[...document.querySelectorAll('.social a, .hello-social a')].map(a=>[a.getAttribute('aria-label'),a.getAttribute('href')]));
  ok('both rows of socials point at the real accounts', sl.length===8 && sl.every(([k,h])=>h.includes(want[k])), JSON.stringify(sl.map(x=>x[0])));
  ok('socials sway idle', (await E(()=>getComputedStyle(document.querySelector('.social img')).animationName))==='sway');
  await p.hover('.social a'); await p.waitForTimeout(80);
  const sh = await E(()=>{const c=getComputedStyle(document.querySelector('.social img'));return c.animationName+'|'+c.animationIterationCount;});
  ok('socials shake once on hover', sh==='shake|1', sh);

  // menu is not in the hero at all
  ok('menu absent over the hero', (await E(()=>getComputedStyle(document.getElementById('topnav')).opacity))==='0');

  // props
  const pc = await E(()=>document.querySelectorAll('.prop-hit').length);
  ok('five prop hotspots', pc===5, pc+'');
  ok('labels hidden at rest', (await E(()=>getComputedStyle(document.querySelector('.prop-ink')).clipPath)).includes('inset'));
  const hf = await E(()=>getComputedStyle(document.querySelector('.prop-tag')).fontFamily);
  ok('labels set in Kaushan Script', hf.includes('Kaushan'), hf);
  await p.hover('.prop-hit[data-k="moto"]'); await p.waitForTimeout(1100);
  const wrote = await E(()=>{const t=document.querySelector('.prop-tag');
    const ink=t.querySelector('.prop-ink'), path=document.querySelector('.prop-curls path');
    return {on:t.classList.contains('on'), clip:getComputedStyle(ink).clipPath,
            dash:getComputedStyle(path).strokeDashoffset, w:Math.round(ink.getBoundingClientRect().width)};});
  ok('label writes itself in on hover', wrote.on && wrote.w>40 && parseFloat(wrote.dash)<0.6, JSON.stringify(wrote));
  await p.mouse.move(700,700); await p.waitForTimeout(400);
  ok('label clears on leave', !(await E(()=>document.querySelector('.prop-tag').classList.contains('on'))));
  /* The props answer to hover only: nothing opens, and the cursor must not
     treat them as pressable. */
  ok('props are not buttons and open nothing', (await E(()=>!document.getElementById('propSheet') &&
    [...document.querySelectorAll('.prop-hit')].every(h=>h.tagName!=='BUTTON'))));
  const hitSize = await E(()=>[...document.querySelectorAll('.prop-hit')].map(h=>{
    const r=h.getBoundingClientRect(); const a=getComputedStyle(h,'::after'); return Math.round(Math.min(r.width,r.height))+'|'+a.inset;}));
  ok('every hotspot reaches past its drawn box', hitSize.every(x=>x.endsWith('-18px -18px -18px -18px')||x.includes('-18px')), hitSize.join(' '));

  // cta -> take
  ok('fast forward hidden before press', (await E(()=>getComputedStyle(document.getElementById('skip')).opacity))==='0');
  await p.click('#cta'); await p.waitForTimeout(800);
  ok('fast forward is just the icon, muted', (await E(()=>{const k=document.getElementById('skip'); const c=getComputedStyle(k);
    return k.textContent.trim()==='' && c.backgroundColor==='rgba(0, 0, 0, 0)' && k.querySelector('svg').getBoundingClientRect().width>=28 && +c.color.match(/[\d.]+/g)[3]<0.6;})));
  ok('props are inert and unlabelled while the take plays', (await E(()=>{
    return [...document.querySelectorAll('.prop-hit')].every(h=>getComputedStyle(h).pointerEvents==='none') &&
      [...document.querySelectorAll('.prop-tag')].every(t=>+getComputedStyle(t).opacity<0.1);})));
  ok('fast forward shown during take', (await E(()=>getComputedStyle(document.getElementById('skip')).opacity))==='1');
  ok('socials gone during take', (await E(()=>getComputedStyle(document.querySelector('.social')).opacity))==='0');
  ok('menu out of the shot', (await E(()=>getComputedStyle(document.getElementById('topnav')).opacity))==='0');
  const t0=Date.now();
  await p.click('#skip');
  await p.waitForTimeout(150);
  ok('fast forward speeds the clip up',
     (await E(()=>{const v=[...document.querySelectorAll('.stage video')].map(x=>x.playbackRate);
       return Math.max(...v);}))>1);
  await p.waitForSelector('#work:not([hidden])',{timeout:15000});
  ok('fast forward lands in the monitor', true, (Date.now()-t0)+'ms');
  await p.waitForTimeout(2000);
  ok('menu arrives with the monitor', (await E(()=>getComputedStyle(document.getElementById('topnav')).opacity))==='1');
  await p.hover('#tnFace'); await p.waitForTimeout(700);
  const order = await E(()=>[...document.querySelectorAll('.tn-drop a')]
      .filter(a=>getComputedStyle(a).display!=='none')
      .sort((a,c)=>a.getBoundingClientRect().left-c.getBoundingClientRect().left).map(a=>a.getAttribute('aria-label')));
  ok('hover opens about, experience | work, contact (no home pill)',
     order.join(',')==='about,experience,work,contact', order.join(','));
  ok('menu is lowercase', order.every(t=>t===t.toLowerCase()));
  const pills = await E(()=>{const f=document.getElementById('tnFace').getBoundingClientRect();
    const as=[...document.querySelectorAll('.tn-drop a')].filter(a=>getComputedStyle(a).display!=='none').map(a=>a.getBoundingClientRect());
    const fc=(f.left+f.right)/2;
    return {left:as.filter(r=>r.right<f.left).length, right:as.filter(r=>r.left>f.right).length,
      sym:Math.round((fc-as[0].left)-(as[3].right-fc)), mid:Math.round((as[0].top+as[0].bottom)/2-(f.top+f.bottom)/2)};});
  ok('each pill carries its fill blob and does not tilt', (await E(()=>{
    const as=[...document.querySelectorAll('.tn-drop a')].filter(a=>getComputedStyle(a).display!=='none');
    return as.length===4 && as.every(a=>a.querySelector('.bl') && getComputedStyle(a).transform==='matrix(1, 0, 0, 1, 0, 0)' || getComputedStyle(a).transform==='none');})));
  ok('two pills each side of the face, level and symmetric', pills.left===2 && pills.right===2 && Math.abs(pills.sym)<3 && Math.abs(pills.mid)<3, JSON.stringify(pills));
  const flip = await E(()=>document.querySelectorAll('.tn-drop a .tk-c').length);
  ok('links split into flip cells', flip>20, flip+' cells');
  await p.mouse.move(700,700); await p.waitForTimeout(500);

  // about
  ok('about is on the page colour, not a block', (await E(()=>{
    const bg=getComputedStyle(document.getElementById('about')).backgroundColor;
    return bg==='rgba(0, 0, 0, 0)' || bg==='transparent';})));
  ok('about is one paragraph at one size', (await E(()=>{
    const p=document.querySelectorAll('.about .lede'); if (p.length!==1) return false;
    return document.querySelectorAll('.about .lede-line').length===0;})));
  ok('about copy says who he is', (await E(()=>
    document.querySelector('.lede').textContent.includes('product designer'))));
  ok('no ramp, no scroll cue', (await E(()=>!document.getElementById('rampFloor') && !document.getElementById('scrollCta'))));
  ok('no skater canvas', (await E(()=>!document.getElementById('skater'))));

  // montage
  /* Measured from where the montage actually starts. It used to sit one
     screen down; it is now behind a full About block and the experience
     list, so absolute scroll positions mean nothing. */
  const reelTop = await E(()=>document.getElementById('reel').offsetTop);
  const grow=[];
  for (const d of [-900,-750,-550,-300,0]){
    await p.evaluate(v=>scrollTo(0,v), reelTop+d); await p.waitForTimeout(150);
    grow.push(d+':'+(await E(()=>getComputedStyle(document.getElementById('montageFrame')).getPropertyValue('--grow').trim())));
  }
  ok('montage is full size by the time it reaches the top',
     parseFloat(grow[1].split(':')[1])>0.1 && parseFloat(grow[4].split(':')[1])>=0.999, grow.join(' '));
  const frameSz = await E(()=>{const f=document.getElementById('montageFrame').getBoundingClientRect(); return {w:Math.round(f.width/document.documentElement.clientWidth*100), h:Math.round(f.height/innerHeight*100)};});
  ok('montage ends at 95% of the window width', frameSz.w===95, JSON.stringify(frameSz));
  ok('montage stage is sticky', (await E(()=>getComputedStyle(document.querySelector('.montage-stage')).position))==='sticky');
  /* Full window, not the width of the centred column it lives in. */
  ok('montage spans the window', (await E(()=>{
    const m=document.getElementById('reel').getBoundingClientRect();
    return Math.round(m.left)===0 && Math.round(m.width)===document.documentElement.clientWidth;})));
  ok('about block is centred on the window', (await E(()=>{
    const a=document.querySelector('.lede').getBoundingClientRect();
    const vw=document.documentElement.clientWidth;
    return Math.abs(a.left-(vw-a.right))<4;})));
  /* No pinned stretch: one screen tall, and the next section's title is
     already in view under the frame when the frame is at its biggest. */
  ok('montage is one screen tall, not a long pin', (await E(()=>document.getElementById('reel').offsetHeight===innerHeight)));
  await p.evaluate(()=>{const r=document.getElementById('reel'); scrollTo(0, r.getBoundingClientRect().top + scrollY - innerHeight*0.05);}); await p.waitForTimeout(300);
  const peek = await E(()=>{const t=document.querySelector('#cases .sec-title').getBoundingClientRect(); const f=document.getElementById('montageFrame').getBoundingClientRect();
    return {titleTop:Math.round(t.top), vh:innerHeight, frameBottom:Math.round(f.bottom), grow:+getComputedStyle(document.getElementById('montageFrame')).getPropertyValue('--grow')};});
  ok('Things I\u2019ve made sits a good way under the montage, not tight against it', peek.titleTop-peek.frameBottom>=80 && peek.grow>0.99, JSON.stringify(peek));

  // the reel: about and experience
  ok('about words keep their spaces', (await E(()=>
    document.querySelector('.lede').textContent.replace(/\s+/g,' ').includes('I’m a product designer who spent'))));
  const aboutRead = async at => { await p.evaluate(v=>{const a=document.getElementById('about');
      scrollTo(0, a.getBoundingClientRect().top + scrollY + (a.offsetHeight - innerHeight) * v);}, at);
    await p.waitForTimeout(400);
    return E(()=>{const ws=[...document.querySelectorAll('.lede .w')].map(w=>+getComputedStyle(w).opacity);
      return {lit:ws.filter(o=>o>0.95).length, n:ws.length, cue:+getComputedStyle(document.querySelector('.about-cue')).opacity};}); };
  const r0 = await aboutRead(0), r1 = await aboutRead(1);
  ok('about starts with the hello lit and a scroll cue', r0.lit>0 && r0.lit<r0.n && r0.cue>0.9, JSON.stringify(r0));
  ok('scrolling reads the whole paragraph and the cue leaves', r1.lit===r1.n && r1.cue<0.1, JSON.stringify(r1));
  await p.evaluate(()=>scrollTo(0, document.getElementById('experience').getBoundingClientRect().top + scrollY));
  await p.waitForTimeout(2500);
  const xp = await E(()=>({cards:[...document.querySelectorAll('.xp-card')].map(c=>c.querySelector('.xp-who').textContent),
    fam:[...document.querySelectorAll('.xp-fam .xp-who')].map(c=>c.textContent),
    shown:[...document.querySelectorAll('.xp-card')].every(c=>getComputedStyle(c).opacity==='1')}));
  ok('four places, Osmosis and Polaris as one family', xp.cards.length===4 && xp.fam.join()==='Polaris,Osmosis DEX', JSON.stringify(xp));
  ok('experience cards land', xp.shown);
  ok('no reel chrome left', (await E(()=>!document.querySelector('.chrome,.ch-k,.xp-dot'))));
  const hello = await E(()=>({fields:[...document.querySelectorAll('#contact form input:not(.hp)')].map(i=>i.name),
    send:!!document.querySelector('#contact .send')}));
  ok('contact email is the new address', (await E(()=>document.querySelector('.hello-mail').href==='mailto:kemalrahmandesign@gmail.com')));
  ok('contact is just name, email and a button', hello.fields.join()==='name,email' && hello.send, JSON.stringify(hello));
  const build = await E(()=>[...document.querySelectorAll('#building .build')].map(b=>({n:b.querySelector('.case-name').textContent, link:!!b.closest('a')||b.tagName==='A'})));
  ok('currently building shows both clients, not clickable', build.length===2 && build.map(b=>b.n).join()==='Alexandria Car Clinic,Tokiwa Matcha' && build.every(b=>!b.link), JSON.stringify(build));
  const cases = await E(()=>({n:document.querySelectorAll('.case').length,
    titles:document.querySelectorAll('.case-title,.case-meta').length}));
  ok('three case studies, each linking to its page', cases.n===3 && (await E(()=>[...document.querySelectorAll('.case')].map(c=>c.getAttribute('href')).join())) === 'work/osmosis.html,work/loco.html,work/polaris.html', JSON.stringify(cases));
  await p.evaluate(()=>{const c=document.querySelectorAll('.case')[1];
    scrollTo(0, c.getBoundingClientRect().top + scrollY - innerHeight*0.25);});
  await p.waitForTimeout(700);
  const par = await E(()=>[...document.querySelectorAll('.case-img')]
    .map(i=>+getComputedStyle(i).getPropertyValue('--par')));
  ok('case images parallax apart', new Set(par.map(v=>v.toFixed(2))).size>1, par.map(v=>v.toFixed(2)).join(' '));
  ok('case cards revealed', (await E(()=>[...document.querySelectorAll('.case')].some(c=>c.classList.contains('seen')))));
  // cursor
  /* Baseline taken over empty page, not over whatever happened to be at the
     middle of the screen, which was a case card. */
  await p.mouse.move(6,6); await p.waitForTimeout(350);
  ok('custom cursor active', (await E(()=>document.documentElement.classList.contains('cursored'))));
  const cbox = await E(()=>{const c=document.getElementById('cur').getBoundingClientRect(); return Math.round(c.width);});
  /* Moved to the card's own coordinates rather than hovered by selector: a
     card that has not been revealed yet is opacity 0, which Playwright
     refuses to hover, and the cursor listens on the window anyway. */
  /* The card nearest the middle of the screen, and the point clamped into
     the viewport: the cards are now nearly a screen tall, so "entirely
     inside the window" often matches none of them. */
  const spot = await E(()=>{
    const cs=[...document.querySelectorAll('.case')];
    const mid=innerHeight/2;
    const c=cs.reduce((a,b)=>{const ra=a.getBoundingClientRect(), rb=b.getBoundingClientRect();
      return Math.abs((rb.top+rb.bottom)/2-mid) < Math.abs((ra.top+ra.bottom)/2-mid) ? b : a;});
    const b=c.getBoundingClientRect();
    const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
    return [Math.round(cl(b.left+b.width/2, 4, innerWidth-4)),
            Math.round(cl(b.top+b.height/2, 4, innerHeight-4))];});
  await p.mouse.move(spot[0], spot[1]); await p.waitForTimeout(450);
  const cbig = await E(()=>{const c=document.getElementById('cur');
    const t=c.querySelector('.cur-tag');
    return {big:c.classList.contains('big'), word:t.textContent, tag:+getComputedStyle(t).opacity};});
  ok('cursor shows a view tag on a case', cbig.big && cbig.word==='view' && cbig.tag>0.9, JSON.stringify(cbig));
  ok('cursor is a pointer, not a dot', (await E(()=>!!document.querySelector('.cur svg path'))));
  void cbox;

  // studio
  await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(200);
  await p.hover('#tnFace'); await p.waitForTimeout(500);
  /* Polled across the fall rather than sampled on one instant. The wall
     covers for about 150ms before the swap, and where in the run that lands
     depends on how busy the page was; a fixed sample point tests the
     scheduler, not the wall. */
  /* Sampled inside the page on every animation frame, from before the click,
     so a busy page (the montage reel is decoding video) cannot make the test
     miss a 150ms window between its own round trips. */
  await E(()=>{window.__cov=false; const w=document.getElementById('wall');
    (function f(){const r=w.getBoundingClientRect(); if (r.top<=0 && r.bottom>=innerHeight) window.__cov=true; else if(!window.__stop) requestAnimationFrame(f);})();});
  await p.click('#tnFace');
  await p.waitForTimeout(1200);
  const sawCover = await E(()=>window.__cov);
  ok('wall covers before the swap', sawCover);
  await p.waitForTimeout(1500);
  const backState = await E(()=>({workHidden:document.getElementById('work').hidden,
    shell:getComputedStyle(document.getElementById('heroShell')).display,
    cta:document.getElementById('cta').disabled}));
  ok('back in the studio', backState.workHidden && backState.shell!=='none' && !backState.cta, JSON.stringify(backState));

  // second lap: everything that only worked once
  ok('playback rate reset', (await E(()=>[...document.querySelectorAll('.stage video')].every(v=>v.playbackRate===1))));
  ok('fast forward re-enabled', (await E(()=>!document.getElementById('skip').disabled)));
  await p.waitForTimeout(2600);
  await p.click('#cta'); await p.waitForTimeout(900);
  ok('second take starts', (await E(()=>document.getElementById('hero').className)).includes('is-leaving'));
  await p.click('#skip'); await p.waitForTimeout(150);
  ok('fast forward works the second time',
     (await E(()=>Math.max(...[...document.querySelectorAll('.stage video')].map(x=>x.playbackRate))))>1);
  await p.waitForSelector('#work:not([hidden])',{timeout:15000});
  await p.waitForTimeout(1800);
  await E(()=>{window.__cov2=false; const w=document.getElementById('wall');
    (function f(){const r=w.getBoundingClientRect(); if (r.top<=0 && r.bottom>=innerHeight) window.__cov2=true; else requestAnimationFrame(f);})();});
  await p.click('#tnFace');
  await p.waitForTimeout(240);
  const topAt = () => E(()=>Math.round(document.getElementById('wall').getBoundingClientRect().top));
  const a1 = await topAt(); await p.waitForTimeout(130); const a2 = await topAt();
  /* Descending from above the fold, not rising from below it: the top edge
     starts off-screen negative and climbs toward 0. */
  ok('wall falls from above on the second run', a1 < 0 && a2 > a1, a1+' -> '+a2);
  await p.waitForTimeout(150);
  ok('wall covers on the second run too', (await E(()=>window.__cov2)));
  await p.waitForTimeout(1400);

  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(300);
  ok('no horizontal overflow at 390', (await E(()=>document.documentElement.scrollWidth-innerWidth))<=0);
  ok('no JS errors', errs.length===0, errs.join(' | '));
  await b.close();
})();
