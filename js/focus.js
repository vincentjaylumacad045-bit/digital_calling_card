/* js/focus.js */
/* ---------- Focus + drag on the live card (owner editing only) ---------- */

/* 1. Whatever you adjust in the panel is found, scrolled into view above the panel, and highlighted on the card */
const PART_MAP = [
  [/^(f_name|nameSize|nameFont|nameLine|nameLetter|nameLayout|nameX|nameY|nameAnim)$|^align/, () => $('name')],
  [/^(f_title|titleSize|titleAnim|titlePlace)$/, () => $('title').textContent ? $('title') : $('aboutTitle')],
  [/^f_status$/, () => $('status')],
  [/^f_about$/, () => document.querySelector('[data-sec=about]')],
  [/^f_ach$/, () => document.querySelector('[data-sec=highlights]')],
  [/^f_hours$/, () => document.querySelector('[data-sec=hours]')],
  [/^(f_phone|f_wa|f_email|f_web|f_loc)$/, () => document.querySelector('[data-sec=contact]')],
  [/^(cta_label|cta_url)$/, () => $('cta')],
  [/^quote_/, () => document.querySelector('[data-sec=quote]')],
  [/^(roundness|sectionSpace|revealAnim)$/, () => document.querySelector('.section:not([hidden])')],
  [/^(photo|pv|zoom|bright|contrast|fade)/i, () => $('photoBox')]
];
function partFor(el) {
  if (el.closest('#serviceEditor')) return document.querySelector('[data-sec=services]');
  if (el.closest('#socialEditor,#quickAdd')) return document.querySelector('[data-sec=links]');
  if (el.closest('#pv,#pvWrap')) return $('photoBox');
  const key = el.id || el.dataset.f || '';
  const hit = PART_MAP.find(([re]) => re.test(key)); const node = hit && hit[1]();
  return node && !node.hidden ? node : null;
}
let spotEl = null, spotTimer = 0;
function visibleBand() {            // the part of the screen not covered by the editor panel
  const p = $('panel').getBoundingClientRect(), mobile = innerWidth <= 700;
  return mobile ? { top: 56, bottom: Math.max(120, p.top - 16) } : { top: 20, bottom: innerHeight - 20 };
}
function focusPart(node, scroll) {
  if (!node || !isEditing() || document.body.classList.contains('previewing')) return;
  if (spotEl && spotEl !== node) spotEl.classList.remove('spot');
  spotEl = node; node.classList.add('spot'); document.body.classList.add('has-spot'); clearTimeout(spotTimer);
  if (!scroll) return;
  const r = node.getBoundingClientRect(), band = visibleBand(), size = band.bottom - band.top;
  if (r.top >= band.top && r.bottom <= band.bottom) return;                           // already fully visible
  const target = r.height > size ? r.top - band.top - 8 : r.top + r.height / 2 - (band.top + size / 2);
  window.__focusScrollUntil = Date.now() + 1400;                                      // tells the phone keyboard lock not to undo this
  window.scrollBy({ top: target, behavior: 'smooth' });
}
function releasePart(delay) {
  clearTimeout(spotTimer);
  spotTimer = setTimeout(() => { if (spotEl) spotEl.classList.remove('spot'); spotEl = null; document.body.classList.remove('has-spot'); }, delay);
}
(function () {
  const body = $('pbody'); let lastKey = '';
  body.addEventListener('focusin', (e) => { if (!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; const n = partFor(e.target); if (n) { lastKey = e.target.id; setTimeout(() => focusPart(n, true), 120); } });
  body.addEventListener('focusout', () => releasePart(900));
  body.addEventListener('input', (e) => { const n = partFor(e.target); if (n) { focusPart(n, e.target.id !== lastKey); lastKey = e.target.id; if (e.target.type === 'range') releasePart(1400); } });
  body.addEventListener('pointerdown', (e) => { const n = e.target.closest('input[type=range]') && partFor(e.target); if (n) focusPart(n, true); });
  body.addEventListener('change', (e) => { const n = partFor(e.target); if (n) { focusPart(n, true); releasePart(1600); } });
  /* Picking a tab or template also points at what it changes */
})();

/* 2. Drag sections up and down on the card itself */
function addSectionHandles() {
  document.querySelectorAll('.section h2').forEach((h) => {
    if (h.querySelector('.sec-drag')) return;
    const g = document.createElement('span'); g.className = 'sec-drag'; g.title = 'Drag up or down to reorder'; g.setAttribute('aria-label', 'Drag to reorder section'); g.innerHTML = svg('grip'); h.appendChild(g);
  });
}
addSectionHandles();
document.addEventListener('pointerdown', (e) => {
  const grip = e.target.closest('.sec-drag'); if (!grip || !isEditing() || document.body.classList.contains('previewing') || e.button > 0) return;
  e.preventDefault(); e.stopPropagation(); grip.setPointerCapture(e.pointerId);
  const item = grip.closest('.section'), items = [...document.querySelectorAll('.section')].filter((s) => !s.hidden).sort((a, b) => (+a.style.order || 0) - (+b.style.order || 0));
  const from = items.indexOf(item); if (from < 0) return;
  const rects = items.map((n) => n.getBoundingClientRect()), startY = e.clientY, startScroll = scrollY, h = rects[from].height;
  let to = from, lastY = e.clientY, raf = 0;
  document.body.classList.add('sec-dragging'); item.classList.add('dragging-sec'); items.forEach((n) => n !== item && n.classList.add('sec-shift'));
  const place = () => {
    const dy = lastY - startY + (scrollY - startScroll); item.style.transform = `translateY(${dy}px)`;
    const mid = rects[from].top + h / 2 + dy; to = 0; rects.forEach((r, i) => { if (i !== from && mid > r.top + r.height / 2) to++; });
    items.forEach((n, i) => { if (n === item) return; const s = from < to && i > from && i <= to ? -h : from > to && i >= to && i < from ? h : 0; n.style.transform = s ? `translateY(${s}px)` : ''; });
  };
  const loop = () => {                                                                // scroll the page while dragging near the screen edges
    const band = visibleBand(), v = lastY < band.top + 50 ? -10 : lastY > band.bottom - 40 ? 10 : 0;
    if (v) { window.__focusScrollUntil = Date.now() + 600; scrollBy(0, v); place(); } raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const move = (ev) => { lastY = ev.clientY; place(); };
  const up = () => {
    cancelAnimationFrame(raf); grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up);
    items.forEach((n) => { n.style.transform = ''; n.classList.remove('dragging-sec', 'sec-shift'); }); document.body.classList.remove('sec-dragging');
    if (to !== from) {
      const keys = items.map((n) => n.dataset.sec), [k] = keys.splice(from, 1); keys.splice(to, 0, k);
      const all = getSections(), vis = new Set(keys); let n = 0;
      card.sections = all.map((s) => (vis.has(s.key) ? { key: keys[n++], visible: s.visible } : s));
      render(); renderSectionList(); toast('Section moved');
    }
  };
  grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
}, true);

/* 3. Drag the name and title block to move it (mouse: drag; phone: press and hold, then drag) */
(function () {
  const id = $('idBlock'); let st = null, hold = 0;
  const armed = () => st && st.armed;
  const begin = (e) => {
    if (!isEditing() || document.body.classList.contains('previewing') || e.button > 0 || !e.target.closest('#name,#title,#status')) return;
    st = { x: e.clientX, y: e.clientY, ox: card.nameX || 0, oy: card.nameY || 0, armed: e.pointerType !== 'touch', moved: false, id: e.pointerId };
    if (e.pointerType === 'touch') hold = setTimeout(() => { if (st) { st.armed = true; navigator.vibrate && navigator.vibrate(12); id.classList.add('grabbing'); } }, 380);
  };
  id.addEventListener('pointerdown', begin);
  addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.armed) { if (Math.hypot(dx, dy) > 8) { clearTimeout(hold); st = null; } return; }           // finger moved before the hold: let the page scroll
    if (!st.moved && Math.hypot(dx, dy) < 5) return;
    st.moved = true; id.classList.add('grabbing'); document.body.classList.add('moving-name');
    card.nameX = clampN(Math.round(st.ox + dx), -40, 40); card.nameY = clampN(Math.round(st.oy + dy), -80, 80);
    $('nameX').value = card.nameX; $('nameY').value = card.nameY; updateStyleValues(); render();
  });
  const end = () => { clearTimeout(hold); if (st && st.moved) { window.__suppressClick = Date.now() + 300; toast('Name moved. Press Save to publish.'); } st = null; id.classList.remove('grabbing'); document.body.classList.remove('moving-name'); };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
  document.addEventListener('touchmove', (e) => { if (armed() && e.cancelable) e.preventDefault(); }, { passive: false });
  document.addEventListener('click', (e) => { if (e.target.closest('.sec-drag')) { e.preventDefault(); e.stopPropagation(); return; } if (window.__suppressClick && Date.now() < window.__suppressClick) { e.preventDefault(); e.stopPropagation(); } }, true);
})();
