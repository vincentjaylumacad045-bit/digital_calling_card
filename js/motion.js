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
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();

/* Run a change inside a view transition when the browser supports it, so layout and theme switches morph instead of snapping */
function withTransition(fn) {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || (card && card.motion === 'off');
  if (!document.startViewTransition || calm) return fn();
  try { document.startViewTransition(fn); } catch (e) { fn(); }
}
