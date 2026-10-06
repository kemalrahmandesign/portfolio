/* Case study motion: the title pops in letter by letter on a spring, the
   sections rise as they arrive, and any .scrub film is driven by the scroll
   rather than by a clock. */
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const big = document.querySelector('.big');
  if (big && !still && window.gsap){
    const t = big.textContent; big.textContent = '';
    const ws = [...t].map(ch => { const s = document.createElement('span'); s.className = 'w';
      s.textContent = ch === ' ' ? ' ' : ch; big.append(s); return s; });
    big.setAttribute('aria-label', t);
    gsap.fromTo(ws, { y: '0.6em', rotation: i => (i % 2 ? 12 : -12), opacity: 0, scaleY: 1.4, transformOrigin: '50% 100%' },
      { y: 0, rotation: 0, opacity: 1, scaleY: 1, duration: 0.9, ease: 'elastic.out(1,0.55)', stagger: 0.045, delay: 0.1 });
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.rise').forEach(el => still ? el.classList.add('in') : io.observe(el));

  /* Films in the storyboard play while on screen and rest otherwise. */
  document.querySelectorAll('video[data-auto]').forEach(v => {
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && !still) v.play().catch(() => {}); else v.pause();
    }), { threshold: 0.25 }).observe(v);
  });

  /* Scroll as the playhead, the way the Loco site does it: never seek while
     a seek is in flight, ease toward the target, skip moves under a frame. */
  document.querySelectorAll('.scrub').forEach(sec => {
    const v = sec.querySelector('video'); if (!v) return;
    let target = 0, cur = 0;
    const read = () => {
      const r = sec.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
      sec.style.setProperty('--p', p.toFixed(4));
      if (v.duration) target = p * (v.duration - 0.05);
    };
    const tick = () => {
      cur += (target - cur) * 0.22;
      if (v.duration && !v.seeking && Math.abs(v.currentTime - cur) > 1 / 30) v.currentTime = cur;
      requestAnimationFrame(tick);
    };
    addEventListener('scroll', read, { passive: true }); addEventListener('resize', read);
    v.addEventListener('loadedmetadata', read);
    read(); requestAnimationFrame(tick);
  });

  /* Portrait phones get the portrait cut of the opening film. */
  document.querySelectorAll('video[data-portrait]').forEach(v => {
    if (matchMedia('(max-aspect-ratio: 1/1)').matches){
      v.src = v.dataset.portrait;
      if (v.dataset.portraitPoster) v.poster = v.dataset.portraitPoster;
    }
  });

  /* ---- the menu: the same as the main site ----
     A pointer opens the pills on hover and the face goes home; a finger taps
     the face to roll the card down. */
  const nav = document.getElementById('topnav');
  const wall = document.getElementById('wall');
  /* Every way out of the page, the face included, drops the wall first and
     leaves when it covers. The main site is told to start under it. */
  const leave = href => {
    if (!wall || still){ location.href = href; return; }
    try { sessionStorage.setItem('wallIn', '1'); } catch (e) {}
    wall.classList.add('down');
    setTimeout(() => { location.href = href; }, 560);
  };
  window.__leave = leave;
  addEventListener('pageshow', e => { if (e.persisted && wall) wall.classList.remove('down'); });
  if (nav){
    nav.querySelectorAll('.tn-drop a').forEach(a => a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault(); leave(a.getAttribute('href'));
    }));
    const face = document.getElementById('tnFace');
    const touchy = matchMedia('(hover: none)').matches;
    if (!touchy){
      document.querySelectorAll('.tn-drop a').forEach(a => {
        const text = a.textContent; a.setAttribute('aria-label', text); a.textContent = '';
        const wrap = document.createElement('span'); wrap.className = 'tk';
        [...text].forEach((ch, i) => {
          const c = document.createElement('span'); c.className = 'tk-c'; c.style.setProperty('--i', i);
          const t = document.createElement('span'); t.className = 'a'; t.textContent = ch;
          const b = document.createElement('span'); b.className = 'b'; b.textContent = ch; b.setAttribute('aria-hidden', 'true');
          c.append(t, b); wrap.append(c);
        });
        a.append(wrap);
        const bl = document.createElement('span'); bl.className = 'bl'; bl.setAttribute('aria-hidden', 'true'); a.prepend(bl);
        const at = e => { const r = a.getBoundingClientRect();
          a.style.setProperty('--bx', Math.min(r.width, Math.max(0, e.clientX - r.left)) + 'px');
          a.style.setProperty('--by', Math.min(r.height, Math.max(0, e.clientY - r.top)) + 'px'); };
        a.addEventListener('pointerenter', at); a.addEventListener('pointerleave', at);
      });
      nav.addEventListener('pointerenter', () => nav.classList.add('open'));
      const WIDE = matchMedia('(min-width:761px)').matches;
      if (WIDE) nav.classList.add('open');
      nav.addEventListener('pointerleave', () => { if (!WIDE) nav.classList.remove('open'); });
      nav.addEventListener('focusin', () => nav.classList.add('open'));
      nav.addEventListener('focusout', e => { if (!WIDE && !nav.contains(e.relatedTarget)) nav.classList.remove('open'); });
      face.addEventListener('click', () => leave('../index.html'));
    } else {
      const set = o => { nav.classList.toggle('dropped', o); face.setAttribute('aria-expanded', o ? 'true' : 'false'); };
      face.addEventListener('click', () => set(!nav.classList.contains('dropped')));
      document.addEventListener('click', e => { if (!nav.contains(e.target)) set(false); });
    }
  }

  /* ---- the archetypes map (Polaris) ---- */
  const map = document.getElementById('archMap'), card = document.getElementById('archCard');
  if (map && card){
    /* [initials, name, x%, y% (top is seasoned), what they are like,
        what it changed in Polaris, the parts of Polaris it touched] */
    const A = [
      ['Tr','The Trader',9,34,'Buys the dips, sells the rips. Checks technical signals daily. Loves to win. Focused on short-term gains.','One search box to any token, live charts and a route preview, so a trade is a few taps.',['Trading','Live charts','Route preview']],
      ['Hu','The Hunter',16,10,'Likes to be ahead of the crowd. Always on the lookout for the next big thing. Knows all the obscure coins.','Trending and new tokens are surfaced early, with signals on what is moving.',['Trending','Signal cards']],
      ['Ea','The Early Adopter',36,22,'Extremely bullish on the future of crypto. Part of thriving communities on X, Discord and Telegram. In it for the tech and profit.','News and the narrative around a token sit right beside the trade button.',['News','For You']],
      ['Cn','The Crypto Native',56,8,'Lived through multiple market cycles, used to high volatility. Understands the technical and financial aspects of crypto.','The real detail is one tap away: routes, networks and balances across every chain.',['Cross-chain routes','Wallet balances']],
      ['Ee','The Ecosystem Expert',72,26,'The go-to expert in an area of crypto. Identifies promising projects. Always up to date with ecosystem news.','A Following tab keeps the projects they track at the top of their feed.',['Following','News']],
      ['Wh','The Whale',92,10,'High net worth, experienced investor, manages risk carefully.','Privacy mode hides balances with a tap, and every trade is previewed before it is signed.',['Privacy mode','Transaction preview']],
      ['Bm','The Bitcoin Maximalist',90,42,'Buys every dip. Believes in the vision of Bitcoin as sound money. Satoshi is their hero.','Bitcoin is a first-class asset everywhere: priced, charted and tradeable like any other.',['Token pages','Trading']],
      ['Hd','The HODLer',68,54,'Here to get rich but not rich quick. Focuses on fundamentals, not FOMO. Mostly unfazed by volatility.','The portfolio shows the long view, with history and performance rather than only today\u2019s move.',['Portfolio','History']],
      ['Ti','The Traditional Investor',86,68,'Treats crypto like any asset class: managing risk, maximizing profits. Long-term horizon, three years or more. Plans and prepares, never panics.','A clean portfolio, plain language and the careful previews they expect from any broker.',['Portfolio','Plain language']],
      ['Be','The Beginner',50,88,'Interested in crypto, but not sure where to start. Looking to increase wealth and knowledge. Excited to start investing.','The For You feed explains the news in plain words, and nothing is signed before a clear preview.',['For You','Transaction preview']],
      ['Fo','The FOMOer',14,72,'Overly excited or fearful, buys high and sells low. Applies investment strategies to prevent FOMO.','Calm signal cards and a preview before every trade slow the panic down.',['Signal cards','Transaction preview']],
    ];
    const nodes = A.map((a, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'an' + (a[2] > 75 ? ' lr' : a[2] < 20 ? ' ll' : '');
      /* Kept off the very edge so the axis words and the labels have room. */
      b.style.left = (6 + a[2] * 0.88) + '%'; b.style.top = (8 + a[3] * 0.82) + '%';
      b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', a[1]);
      b.innerHTML = a[0] + '<span class="lb">' + a[1].replace('The ', '') + '</span>';
      b.addEventListener('click', () => pick(i));
      map.append(b); return b;
    });
    let first = true;
    function pick(i){
      nodes.forEach((n, j) => n.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
      map.classList.add('has-pick');
      const a = A[i];
      card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
      /* On a phone the card sits under the map, so bring it into view. */
      if (matchMedia('(max-width:800px)').matches && !first){ const r = card.getBoundingClientRect(); if (r.bottom > innerHeight || r.top < 0) card.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      card.innerHTML = '<span class="ac-dot">' + a[0] + '</span><h3>' + a[1] + '</h3><p class="ac-d">' + a[4] +
        '</p><p class="ac-k">What it changed in Polaris</p><p class="ac-s">' + a[5] + '</p>' +
        '<ul class="pills">' + a[6].map(t => '<li>' + t + '</li>').join('') + '</ul>';
    }
    pick(0); first = false;
    /* Quiet until touched: the first choice should not look like a decision
       already made. */
    map.classList.remove('has-pick');
  }
})();

/* The side rail: one line per titled section. */
(() => {
  if (!window.SideNav) return;
  const names = { 'hero-c': 'Overview', nums: 'In numbers', reflect: 'The lesson' };
  const items = [...document.querySelectorAll('section')].map(el => {
    const h = el.querySelector('h2');
    let label = el.dataset.nav || (h && h.textContent.trim()) || names[[...el.classList].find(c => names[c])] || '';
    if (label.length > 26) label = label.slice(0, 25).trim() + '\u2026';
    return { label, el };
  }).filter(i => i.label);
  const sn = SideNav.init([{ label: 'Home', home: true }, ...items], it => { if (it.home) window.__leave('../index.html'); else it.el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  sn.showHome(true);
  sn.show(true);
})();

/* The way back: to the case-study list on the main site, under the wall. */
(() => {
  const a = document.createElement('a');
  a.className = 'back'; a.href = '../index.html#cases';
  a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>Back to work';
  a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); window.__leave(a.getAttribute('href'));
  });
  document.body.append(a);
})();
