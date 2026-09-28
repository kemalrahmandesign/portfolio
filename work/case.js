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
})();
