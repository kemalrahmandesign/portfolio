// Injected into every page the reel records. The cursor itself is drawn in
// post by render.py (so it moves at a true 60fps whatever the page manages);
// this layer only carries the in-page effects that belong to the content:
// emoji bursts, "look here" outlines, and the sync flash render.py uses to
// line the capture up with the event track.
//
// Runs as a Playwright init script: `opts` is serialised in by reel.js.
(opts) => {
  if (window.__reel) return;
  const { color } = opts;

  const css = `
  #__reel{position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden;}
  #__reel .emo{position:absolute;font-size:40px;line-height:1;margin:-20px 0 0 -20px;
    font-family:'Apple Color Emoji','Noto Color Emoji',sans-serif;
    animation:__reelEmo var(--d,1.3s) cubic-bezier(.2,.8,.3,1) forwards;}
  @keyframes __reelEmo{
    0%{transform:translate(0,0) scale(.3) rotate(0);opacity:0}
    15%{opacity:1;transform:translate(calc(var(--dx)*.25),calc(var(--dy)*.25)) scale(1.15) rotate(calc(var(--r)*.3))}
    100%{transform:translate(var(--dx),var(--dy)) scale(.9) rotate(var(--r));opacity:0}}
  #__reel .hl{position:absolute;border-radius:14px;border:3px solid ${color};
    box-shadow:0 0 0 6px ${color}33;opacity:0;transition:opacity .3s ease, transform .4s cubic-bezier(.3,1.5,.5,1);transform:scale(1.06);}
  #__reel .hl.on{opacity:1;transform:scale(1);}
  #__reel .sync{position:absolute;left:0;top:0;width:48px;height:48px;background:#ff00ff;}
  `;

  const st = (window.__reel = { x: -100, y: -100 });

  // Frameworks that hydrate <html> (Next.js) can strip foreign nodes, so
  // re-mount the style and the layer whenever either has gone missing.
  function mount() {
    if (!document.getElementById('__reelcss')) {
      const style = document.createElement('style');
      style.id = '__reelcss';
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }
    let root = document.getElementById('__reel');
    if (!root) {
      root = document.createElement('div');
      root.id = '__reel';
      (document.body || document.documentElement).appendChild(root);
    }
    st.root = root;
    return root;
  }

  // Hide Chrome's link-preview bubble: park the href while a link is hovered.
  // (Clicks on links therefore do not navigate; shots use goto() for that.)
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (a) { a.dataset.reelHref = a.getAttribute('href'); a.removeAttribute('href'); }
  }, true);
  document.addEventListener('mouseout', (e) => {
    const a = e.target.closest && e.target.closest('a[data-reel-href]');
    if (a && !a.contains(e.relatedTarget)) { a.setAttribute('href', a.dataset.reelHref); delete a.dataset.reelHref; }
  }, true);

  st.set = (x, y) => { mount(); st.x = x; st.y = y; };

  // Emoji burst from a point, like FigJam emotes.
  st.react = (emoji, x, y, n = 7) => {
    const root = mount();
    for (let i = 0; i < n; i++) {
      const e = document.createElement('div');
      e.className = 'emo';
      e.textContent = emoji;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
      const d = 110 + Math.random() * 130;
      e.style.left = x + 'px'; e.style.top = y + 'px';
      e.style.setProperty('--dx', Math.cos(a) * d + 'px');
      e.style.setProperty('--dy', Math.sin(a) * d + 'px');
      e.style.setProperty('--r', (Math.random() - 0.5) * 70 + 'deg');
      e.style.setProperty('--d', 1.1 + Math.random() * 0.5 + 's');
      e.style.fontSize = 30 + Math.random() * 20 + 'px';
      root.appendChild(e);
      setTimeout(() => e.remove(), 1800);
    }
  };

  st.highlight = (r, pad = 8) => {
    const root = mount();
    const h = document.createElement('div');
    h.className = 'hl';
    Object.assign(h.style, { left: r.x - pad + 'px', top: r.y - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
    root.appendChild(h);
    requestAnimationFrame(() => h.classList.add('on'));
  };
  st.unhighlight = () => st.root && st.root.querySelectorAll('.hl').forEach((h) => { h.classList.remove('on'); setTimeout(() => h.remove(), 400); });

  // Resolves once the flash is actually on screen (two frames after insert).
  st.flash = (on) => new Promise((res) => {
    const root = mount();
    if (on) { const s = document.createElement('div'); s.className = 'sync'; s.style.cssText = 'position:fixed;left:0;top:0;width:48px;height:48px;background:#f0f;z-index:2147483647'; root.appendChild(s); }
    else root.querySelectorAll('.sync').forEach((s) => s.remove());
    requestAnimationFrame(() => requestAnimationFrame(() => res()));
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
}
