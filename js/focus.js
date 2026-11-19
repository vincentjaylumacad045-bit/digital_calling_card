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
const SEC_ICON = {
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z"/></svg>',
  hide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 8.5 4.2 9.5 7a11 11 0 01-3 4.2M6.2 6.3A11 11 0 002.5 12c1 2.8 4.5 7 9.5 7a9.6 9.6 0 004-.9"/></svg>'
};
const SEC_EDIT = { about: ['profile', 'f_about'], highlights: ['profile', 'f_ach'], services: ['more', 'serviceEditor'], quote: ['more', 'quote_text'], hours: ['more', 'f_hours'], contact: ['contact', 'f_phone'], links: ['links'] };
function addSectionHandles() {
  document.querySelectorAll('.section').forEach((h) => {
    if (h.querySelector(':scope > .sec-tools')) return;
    const t = document.createElement('span'); t.className = 'sec-tools';
    const mk = (act, title) => `<button type="button" class="sec-btn" data-act="${act}" title="${title}" aria-label="${title}">${SEC_ICON[act]}</button>`;
    t.innerHTML = mk('edit', 'Edit this section') + mk('up', 'Move up') + mk('down', 'Move down') + mk('hide', 'Hide this section') +
      `<span class="sec-drag" title="Drag up or down to reorder" aria-label="Drag to reorder section">${svg('grip')}</span>`;
    h.appendChild(t);
  });
}
const visibleSecs = () => [...document.querySelectorAll('.section')].filter((s) => !s.hidden).sort((a, b) => (+a.style.order || 0) - (+b.style.order || 0));
function updateSecButtons() {
  const v = visibleSecs();
  v.forEach((s, i) => { const u = s.querySelector('[data-act=up]'), d = s.querySelector('[data-act=down]'); if (u) u.disabled = i === 0; if (d) d.disabled = i === v.length - 1; });
}
function applyVisibleOrder(keys) {                                   // put the visible sections in `keys` order, keeping hidden ones where they were
  const all = getSections(), vis = new Set(keys); let n = 0;
  card.sections = all.map((s) => (vis.has(s.key) ? { key: keys[n++], visible: s.visible } : s));
}
function moveSection(sec, delta) {
  const keys = visibleSecs().map((s) => s.dataset.sec), i = keys.indexOf(sec.dataset.sec), j = i + delta; if (i < 0 || j < 0 || j >= keys.length) return;
  const before = sec.getBoundingClientRect().top; [keys[i], keys[j]] = [keys[j], keys[i]];
  applyVisibleOrder(keys); render(); renderSectionList();
  window.__focusScrollUntil = Date.now() + 300; scrollBy(0, sec.getBoundingClientRect().top - before);      // keep the moved section under your finger
  sec.classList.remove('moved'); void sec.offsetWidth; sec.classList.add('moved');
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.sec-btn'); if (!btn) return;
  e.preventDefault(); e.stopPropagation(); if (!isEditing() || document.body.classList.contains('previewing')) return;
  const sec = btn.closest('.section'), act = btn.dataset.act;
  if (act === 'up') moveSection(sec, -1);
  else if (act === 'down') moveSection(sec, 1);
  else if (act === 'edit') { const t = SEC_EDIT[sec.dataset.sec]; if (t) { $('panel').classList.add('open'); jumpTo(t[0], t[1]); focusPart(sec, false); } }
  else if (act === 'hide') { card.sections = getSections().map((s) => (s.key === sec.dataset.sec ? { ...s, visible: false } : s)); render(); renderSectionList(); toast('Section hidden. Turn it back on in the Layout tab, or press Undo.'); }
}, true);
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
      applyVisibleOrder(keys);
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

/* 4. Arrange mode: every item on the card (contact rows, links, services, highlights, quick actions) can be dragged to a new place */
const moveIn = (arr, from, to) => { const a = [...arr], [x] = a.splice(from, 1); a.splice(to, 0, x); return a; };
function reslot(full, slots, values) { const out = [...full]; slots.forEach((s, n) => { out[s] = values[n]; }); return out; }     // put `values` back into their slots, everything else stays
const ITEM_CFG = [
  { box: '#rows', item: '.row-wrap', commit(els, from, to) { card.contactOrder = moveIn(els.map((n) => n.dataset.key), from, to); } },
  { box: '#quick', item: '.qa', commit(els, from, to) {
      const full = Array.isArray(card.quick) ? [...card.quick] : [...DEFAULT_QUICK], vis = new Set(els.map((n) => n.dataset.key)), slots = full.map((k, i) => (vis.has(k) ? i : -1)).filter((i) => i >= 0);
      card.quick = reslot(full, slots, moveIn(els.map((n) => n.dataset.key), from, to)); renderQuickList(); } },
  { box: '#socials', item: '.soc', commit(els, from, to) {
      const slots = card.socials.map((s, i) => (s.url ? i : -1)).filter((i) => i >= 0); card.socials = reslot(card.socials, slots, moveIn(slots.map((i) => card.socials[i]), from, to)); renderSocialEditor(); } },
  { box: '#services', item: '.svc', commit(els, from, to) {
      const sv = card.services || [], slots = sv.map((s, i) => ((s.title || '').trim() ? i : -1)).filter((i) => i >= 0); card.services = reslot(sv, slots, moveIn(slots.map((i) => sv[i]), from, to)); renderServiceEditor(); } },
  { box: '#chips', item: '.chip', commit(els, from, to) {
      const lines = (card.achievements || '').split('\n'), slots = lines.map((l, i) => (l.trim() ? i : -1)).filter((i) => i >= 0).slice(0, 12);
      card.achievements = reslot(lines, slots, moveIn(slots.map((i) => lines[i]), from, to)).join('\n'); $('f_ach').value = card.achievements; } }
];
function decorateItems() {
  ITEM_CFG.forEach((c) => { const box = document.querySelector(c.box); if (!box) return;
    box.querySelectorAll(':scope > ' + c.item).forEach((it) => { it.classList.add('arr-item'); if (!it.querySelector(':scope > .item-grip')) { const g = document.createElement('span'); g.className = 'item-grip'; g.title = 'Drag to move'; g.innerHTML = svg('grip'); it.appendChild(g); } }); });
}
decorateItems();
function setArrange(on) {
  document.body.classList.toggle('arrange', on); $('arrangeBtn').setAttribute('aria-pressed', on); $('arrangeBtn').classList.toggle('on', on);
  if (on) { if (document.body.classList.contains('previewing')) setPreview(false); $('panel').classList.remove('full'); setSheet('min'); toast('Arrange on: drag the ⋮⋮ handles to move anything'); }
  else if (sheetMode() === 'min') setSheet('mid');
}
$('arrangeBtn').onclick = () => setArrange(!document.body.classList.contains('arrange'));
document.addEventListener('pointerdown', (e) => {
  const grip = e.target.closest('.item-grip'); if (!grip || !isEditing() || !document.body.classList.contains('arrange') || e.button > 0) return;
  const item = grip.parentElement, cfg = ITEM_CFG.find((c) => item.matches(c.item) && item.parentElement && item.parentElement.matches(c.box)); if (!cfg) return;
  e.preventDefault(); e.stopPropagation(); grip.setPointerCapture(e.pointerId);
  const els = [...item.parentElement.querySelectorAll(':scope > ' + cfg.item)], from = els.indexOf(item), rects = els.map((n) => n.getBoundingClientRect());
  const cx = (r) => r.left + r.width / 2, cy = (r) => r.top + r.height / 2, startX = e.clientX, startY = e.clientY, startScroll = scrollY;
  let to = from, lx = e.clientX, ly = e.clientY, raf = 0;
  item.classList.add('item-dragging'); document.body.classList.add('sec-dragging');
  const place = () => {
    const dx = lx - startX, dy = ly - startY + (scrollY - startScroll); item.style.transform = `translate(${dx}px,${dy}px)`;
    const px = cx(rects[from]) + dx, py = cy(rects[from]) + dy; let best = Infinity;
    rects.forEach((r, i) => { const d = Math.hypot(cx(r) - px, cy(r) - py); if (d < best) { best = d; to = i; } });
    els.forEach((n, i) => n.classList.toggle('drop-target', i === to && to !== from));
  };
  const loop = () => { const band = visibleBand(), v = ly < band.top + 50 ? -10 : ly > band.bottom - 40 ? 10 : 0; if (v) { window.__focusScrollUntil = Date.now() + 600; scrollBy(0, v); place(); } raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  const move = (ev) => { lx = ev.clientX; ly = ev.clientY; place(); };
  const up = () => {
    cancelAnimationFrame(raf); grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up);
    els.forEach((n) => { n.style.transform = ''; n.classList.remove('item-dragging', 'drop-target'); }); document.body.classList.remove('sec-dragging');
    window.__suppressClick = Date.now() + 300;
    if (to !== from) { cfg.commit(els, from, to); render(); toast('Moved. Press Save to publish.'); }
  };
  grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
}, true);
