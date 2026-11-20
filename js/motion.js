/* js/motion.js */
/* ---------- Scroll motion + view transitions ---------- */
(function () {
  const root = document.documentElement; let ticking = false;
  function update() {
    ticking = false;
    const y = Math.max(0, window.scrollY || 0), hero = $('hero'), h = (hero && hero.offsetHeight) || 500;
    root.style.setProperty('--p', Math.min(1, y / (h * .62)).toFixed(3));             // 0 → 1 as the hero scrolls away
    root.style.setProperty('--py', Math.round(Math.min(y * .2, 40)) + 'px');          // whole pixels only, so the photo stays sharp
    document.body.classList.toggle('scrolled', y > h * .72 && !document.body.classList.contains('editing'));
    /* Reading progress, back-to-top button and the top bar's "stuck" shadow */
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    root.style.setProperty('--prog', Math.min(1, y / max).toFixed(4));
    document.body.classList.toggle('show-top', y > innerHeight * .9 && !document.body.classList.contains('editing'));
    document.body.classList.toggle('tb-stuck', y > 8);
  }
  let away = false;
  function heroReplay() {
    const y = window.scrollY || 0, h = ($('hero') && $('hero').offsetHeight) || 500;
    if (y > h * 0.9) away = true;
    else if (away && y < h * 0.15 && !document.body.classList.contains('editing') && card && card.motion !== 'off') { away = false; replayIntro(); }
  }
  addEventListener('scroll', heroReplay, { passive: true });
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();

/* Keep both the card and the editor panel exactly where they were while a design change redraws them */
function scrollSnapshot() { const pb = $('pbody'); return { y: window.scrollY, py: pb ? pb.scrollTop : 0 }; }
function scrollRestore(s) {
  const pb = $('pbody'); if (!isEditing()) return;
  if (pb && Math.abs(pb.scrollTop - s.py) > 1) pb.scrollTo({ top: s.py, behavior: 'instant' });
  if (Math.abs(window.scrollY - s.y) > 1) window.scrollTo({ top: s.y, behavior: 'instant' });
}
function keepScrolls(fn) { const s = scrollSnapshot(); try { return fn(); } finally { scrollRestore(s); } }

/* Run a change inside a view transition when the browser supports it, so layout and theme switches morph instead of snapping */
function withTransition(fn) {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || (card && card.motion === 'off');
  const snap = scrollSnapshot(), run = () => keepScrolls(fn), back = () => scrollRestore(snap);
  if (!document.startViewTransition || calm) { run(); return; }
  try { const vt = document.startViewTransition(run); vt.ready.then(back, () => {}); vt.finished.then(() => { back(); setTimeout(back, 60); }, () => {}); } catch (e) { run(); back(); }
}

/* Back to top: smooth scroll */
$('toTop').onclick = () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

/* "Let's Talk" with no contact details falls back to an in-page jump: scroll smoothly under the sticky bar */
$('tbBtn').addEventListener('click', (e) => {
  const h = $('tbBtn').getAttribute('href'); if (h !== '#contactWrap') return;
  e.preventDefault(); const t = $('contactWrap'); if (t && !t.hidden) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

/* Gentle pointer parallax on the decorative shapes and photo (mouse only, never on touch, never with reduced motion) */
(function () {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = $('hero'); let raf = 0, tx = 0, ty = 0;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5); ty = ((e.clientY - r.top) / r.height - .5);
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; hero.style.setProperty('--mx', tx.toFixed(3)); hero.style.setProperty('--my', ty.toFixed(3)); });
  });
  hero.addEventListener('pointerleave', () => { hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0); });
})();
