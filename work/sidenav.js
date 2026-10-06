/* A quiet side rail: a column of short horizontal lines whose lengths swell
   like a wave around wherever you are on the page. Point at it and it opens
   into a list of names you can jump to.

   Shared by the home page and the case studies, so it brings its own styles.

     SideNav.init([{ label, el }, ...], jump)

   `el` is the section to track. `jump(item)` is called on a click and
   defaults to a smooth scroll. Returns { show(bool) }. */
(function(){
  const CSS = `
.sn{position:fixed;z-index:60;left:clamp(10px,1.6vw,26px);top:50%;transform:translateY(-50%);
  opacity:0;pointer-events:none;transition:opacity .4s ease}
.sn.on{opacity:1;pointer-events:auto}
.sn-bg{position:absolute;left:-12px;top:-14px;bottom:-14px;width:44px;border-radius:22px;background:#fff;
  box-shadow:0 1px 2px rgba(10,10,10,.06),0 8px 24px rgba(10,10,10,.1);opacity:0;
  transition:width .38s cubic-bezier(.16,1,.3,1),opacity .25s ease}
.sn.open .sn-bg{opacity:1;width:var(--snw,210px)}
.sn-list{position:relative;list-style:none;margin:0;padding:0}
.sn-row{position:relative;height:13px;display:flex;align-items:center}
.sn-bar{display:block;width:30px;height:2px;border-radius:2px;background:#0a0a0a;
  transform-origin:0 50%;transform:scaleX(var(--s,.3));opacity:var(--a,.25);will-change:transform}
.sn-row.major{height:15px}
.sn-row.major .sn-bar{height:2.5px}
.sn-link{position:absolute;left:-6px;top:-3px;bottom:-3px;display:flex;align-items:center;
  width:calc(var(--snw,210px) - 14px);padding-left:46px;text-decoration:none;color:#0a0a0a;
  font:600 13px/1 Inter,sans-serif;letter-spacing:-.005em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  opacity:0;transform:translateX(-6px);pointer-events:none;
  transition:opacity .2s ease,transform .35s cubic-bezier(.16,1,.3,1),color .2s ease}
.sn.open .sn-link{opacity:.5;transform:none;pointer-events:auto;transition-delay:.05s}
.sn.open .sn-link:hover,.sn.open .sn-link:focus-visible{opacity:1;outline:0}
.sn.open .sn-link.cur{opacity:1;font-weight:800}
@media (max-width:1100px){.sn{display:none}}
@media (prefers-reduced-motion:reduce){.sn,.sn-bg,.sn-link{transition:none}}
`;
  const MINOR = 2;                      // quiet lines between two names

  function init(items, jump){
    items = items.filter(i => i && (i.el || i.home));
    if (items.length < 2) return { show(){} };
    const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);

    const root = document.createElement('nav');
    root.className = 'sn'; root.setAttribute('aria-label', 'On this page');
    const bg = document.createElement('div'); bg.className = 'sn-bg';
    const list = document.createElement('ul'); list.className = 'sn-list';
    root.append(bg, list);

    const ticks = [];                   // { bar, u }  u = position in item units
    const links = [];
    const homeRows = [];
    items.forEach((it, i) => {
      for (let m = 0; m <= (i < items.length - 1 ? MINOR : 0); m++){
        const li = document.createElement('li'); li.className = 'sn-row' + (m ? '' : ' major');
        const bar = document.createElement('i'); bar.className = 'sn-bar'; li.append(bar);
        if (!m){
          const a = document.createElement('a'); a.className = 'sn-link'; a.href = '#';
          a.textContent = it.label;
          a.addEventListener('click', e => {
            e.preventDefault();
            if (jump) jump(it); else it.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            root.classList.remove('open');
          });
          li.append(a); links.push(a);
        }
        list.append(li);
        if (it.home) homeRows.push(li);
        ticks.push({ bar, u: i + m / (MINOR + 1), major: !m });
      }
    });

    const widest = Math.min(260, 70 + Math.max(...items.map(i => i.label.length)) * 7.4);
    root.style.setProperty('--snw', Math.round(widest) + 'px');
    document.body.append(root);

    /* Where we are, as a fractional index: how far through the gap between
       one tracked section's top and the next one's the reading line has got. */
    const lead = Math.max(0, items.findIndex(i => i.el));
    function where(){
      const line = innerHeight * 0.4;
      const real = items.slice(lead);
      const tops = real.map(i => i.el.getBoundingClientRect().top);
      if (tops[0] > line) return Math.max(0, lead - 1);
      let k = 0;
      for (let i = 0; i < tops.length; i++) if (tops[i] <= line) k = i;
      const next = tops[k + 1];
      const f = next === undefined ? 0 : Math.min(1, Math.max(0, (line - tops[k]) / Math.max(1, next - tops[k])));
      return lead + k + f;
    }
    let raf = 0, last = -1;
    function draw(){
      raf = 0;
      const p = where();
      if (Math.abs(p - last) < 0.002) return;
      last = p;
      ticks.forEach(t => {
        const d = Math.abs(t.u - p);
        const bell = Math.exp(-Math.pow(d / 0.85, 2));
        const s = (t.major ? 0.34 : 0.2) + (1 - (t.major ? 0.34 : 0.2)) * bell;
        t.bar.style.setProperty('--s', s.toFixed(3));
        t.bar.style.setProperty('--a', (0.18 + 0.82 * bell).toFixed(3));
      });
      const cur = Math.round(p);
      links.forEach((a, i) => a.classList.toggle('cur', i === cur));
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', kick);
    draw();

    root.addEventListener('pointerenter', () => root.classList.add('open'));
    root.addEventListener('pointerleave', () => root.classList.remove('open'));
    root.addEventListener('focusin', () => root.classList.add('open'));
    root.addEventListener('focusout', e => { if (!root.contains(e.relatedTarget)) root.classList.remove('open'); });

    const showHome = on => { homeRows.forEach(r => { r.hidden = !on; r.style.display = on ? '' : 'none'; }); };
    return { showHome, show(on){ root.classList.toggle('on', !!on); if (on){ last = -1; kick(); } } };
  }
  window.SideNav = { init };
})();
