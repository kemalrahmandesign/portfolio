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
  ok('arc revealed', arc.undersideOnScreen && arc.textOnScreen, JSON.stringify(arc));
  ok('no sideways shift', (await E(()=>Math.round(document.querySelector('h1').getBoundingClientRect().left))) === x0);
  await p.waitForTimeout(400);
  ok('arc holds before springing', (await E(()=>getComputedStyle(document.getElementById('heroSlide')).transform))!=='none');
  await p.waitForTimeout(1400);
  ok('springs back', (await E(()=>getComputedStyle(document.getElementById('heroSlide')).transform))==='none');

  // socials
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
  await p.click('.prop-hit[data-k="ball"]'); await p.waitForTimeout(420);
  ok('prop opens a sheet', (await E(()=>!document.getElementById('propSheet').hidden)));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  ok('sheet closes on escape', (await E(()=>document.getElementById('propSheet').hidden)));

  // cta -> take
  ok('fast forward hidden before press', (await E(()=>getComputedStyle(document.getElementById('skip')).opacity))==='0');
  await p.click('#cta'); await p.waitForTimeout(800);
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
  const order = await E(()=>[...document.querySelectorAll('.tn-side a')]
      .sort((a,c)=>a.getBoundingClientRect().left-c.getBoundingClientRect().left).map(a=>a.getAttribute('aria-label')));
  ok('nav reads about, experience, work, contact',
     order.join(',')==='about,experience,work,contact', order.join(','));
  ok('menu is lowercase', order.every(t=>t===t.toLowerCase()));
  /* Against the masthead, not against innerWidth. The page reserves a
     scrollbar gutter, so the column everything is centred in is narrower
     than the window; lining the menu up with the window would put it off
     the masthead it sits above. */
  const centred = await E(()=>{const f=document.getElementById('tnFace').getBoundingClientRect();
    const h=document.querySelector('.cv').getBoundingClientRect();
    return Math.abs((f.left+f.right)/2 - (h.left+h.right)/2);});
  ok('face lines up with the masthead when open', centred<2, centred.toFixed(1)+'px');
  const sym = await E(()=>{const l=document.querySelector('.tn-left').getBoundingClientRect(),
    r=document.querySelector('.tn-right').getBoundingClientRect(); return Math.abs(l.width-r.width);});
  ok('sides are the same width', sym<1, sym.toFixed(1)+'px');
  const gap = await E(()=>{const l=document.querySelector('.tn-left').getBoundingClientRect(),
    a=document.querySelector('.tn-left a:last-child').getBoundingClientRect();
    return a.left - l.left;});
  ok('no dead space on the left of the menu', gap<3, gap.toFixed(1)+'px');
  const flip = await E(()=>document.querySelectorAll('.tn-side a .tk-c').length);
  ok('links split into flip cells', flip>20, flip+' cells');
  await p.mouse.move(700,700); await p.waitForTimeout(500);

  // about
  ok('about is on the page colour, not a block', (await E(()=>{
    const bg=getComputedStyle(document.getElementById('about')).backgroundColor;
    return bg==='rgba(0, 0, 0, 0)' || bg==='transparent';})));
  ok('about is one paragraph at one size', (await E(()=>{
    const p=document.querySelectorAll('.about .lede'); if (p.length!==1) return false;
    return document.querySelectorAll('.about .lede-line').length===0;})));
  ok('about copy mentions end to end', (await E(()=>
    document.querySelector('.lede').textContent.includes('end to end'))));
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
  ok('montage grows as its section arrives',
     parseFloat(grow[1].split(':')[1])>0.1 && parseFloat(grow[4].split(':')[1])>0.75, grow.join(' '));
  /* Sticky: pinned to the top while its section passes, then carried off by
     it. Nothing to fade, nothing to toggle. */
  ok('montage stage is sticky', (await E(()=>getComputedStyle(document.querySelector('.montage-stage')).position))==='sticky');
  /* Full window, not the width of the centred column it lives in. */
  ok('montage spans the window', (await E(()=>{
    const m=document.getElementById('reel').getBoundingClientRect();
    return Math.round(m.left)===0 && Math.round(m.width)===document.documentElement.clientWidth;})));
  ok('about block is centred on the window', (await E(()=>{
    const a=document.querySelector('.lede').getBoundingClientRect();
    const vw=document.documentElement.clientWidth;
    return Math.abs(a.left-(vw-a.right))<4;})));
  const reelBot = await E(()=>{const r=document.getElementById('reel'); return r.offsetTop+r.offsetHeight;});
  await p.evaluate(v=>scrollTo(0,v), reelBot-1400); await p.waitForTimeout(200);
  const p1 = await E(()=>Math.round(document.querySelector('.montage-stage').getBoundingClientRect().top));
  await p.evaluate(v=>scrollTo(0,v), reelBot-200); await p.waitForTimeout(200);
  const p2 = await E(()=>Math.round(document.querySelector('.montage-stage').getBoundingClientRect().top));
  ok('montage pins, then leaves with its section', p1===0 && p2<0, p1+' -> '+p2);

  // the new sections
  await p.evaluate(()=>{const r=document.querySelectorAll('.cv-row')[1];
    scrollTo(0, r.getBoundingClientRect().top + scrollY - innerHeight*0.30);});
  await p.waitForTimeout(500);
  const cv = await E(()=>{const rows=[...document.querySelectorAll('.cv-row')];
    const on=rows.filter(r=>r.classList.contains('on'));
    return {rows:rows.length, on:on.length, notes:document.querySelectorAll('.cv-notes').length,
      lit:on[0]&&+getComputedStyle(on[0]).opacity, dim:+getComputedStyle(rows.find(r=>!r.classList.contains('on'))).opacity};});
  ok('three experience rows, exactly one lit', cv.rows===3 && cv.on===1, JSON.stringify(cv));
  ok('no bullet lists left in experience', cv.notes===0);
  ok('lit row is full strength, the rest are not', cv.lit>0.95 && cv.dim<0.3, cv.lit+' vs '+cv.dim);
  /* The year hangs outside the name's box, so the name and the role under it
     share one axis instead of disagreeing by half a date. */
  const axes = await E(()=>[...document.querySelectorAll('.cv-row')].map(r=>{
    const w=r.querySelector('.cv-who').getBoundingClientRect(), t=r.querySelector('.cv-what').getBoundingClientRect();
    return Math.abs((w.left+w.right)/2 - (t.left+t.right)/2);}));
  ok('name and role share an axis', axes.every(d=>d<2), axes.map(d=>d.toFixed(1)).join(' '));
  const cases = await E(()=>({n:document.querySelectorAll('.case').length,
    titles:document.querySelectorAll('.case-title,.case-meta').length}));
  ok('four case studies, image only', cases.n===4 && cases.titles===0, JSON.stringify(cases));
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
  const covers = () => E(()=>{const r=document.getElementById('wall').getBoundingClientRect();
    return r.top<=0 && r.bottom>=innerHeight;});
  await p.click('#tnFace');
  let sawCover = false;
  for (let i=0;i<20 && !sawCover;i++){ await p.waitForTimeout(40); sawCover = await covers(); }
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
  await p.click('#tnFace');
  await p.waitForTimeout(240);
  const topAt = () => E(()=>Math.round(document.getElementById('wall').getBoundingClientRect().top));
  const a1 = await topAt(); await p.waitForTimeout(130); const a2 = await topAt();
  /* Descending from above the fold, not rising from below it: the top edge
     starts off-screen negative and climbs toward 0. */
  ok('wall falls from above on the second run', a1 < 0 && a2 > a1, a1+' -> '+a2);
  await p.waitForTimeout(150);
  ok('wall covers on the second run too',
     (await E(()=>{const r=document.getElementById('wall').getBoundingClientRect();return r.top<=0&&r.bottom>=innerHeight;})));
  await p.waitForTimeout(1400);

  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(300);
  ok('no horizontal overflow at 390', (await E(()=>document.documentElement.scrollWidth-innerWidth))<=0);
  ok('no JS errors', errs.length===0, errs.join(' | '));
  await b.close();
})();
