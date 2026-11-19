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
