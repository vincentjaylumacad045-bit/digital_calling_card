/* js/editor.js */
/* ---------- Design Studio: form wiring for every tab (owner only) ---------- */
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

/* ===== Drag and drop: sort a list by dragging its grip (mouse, pen or touch) ===== */
function makeSortable(box, itemSel, onSort) {
  box.addEventListener('pointerdown', (e) => {
    const grip = e.target.closest('.grip'); if (!grip || !box.contains(grip) || e.button > 0) return;
    const item = grip.closest(itemSel), items = [...box.querySelectorAll(itemSel)], from = items.indexOf(item); if (from < 0) return;
    e.preventDefault(); grip.setPointerCapture(e.pointerId);
    const rects = items.map((n) => n.getBoundingClientRect()), centers = rects.map((r) => r.top + r.height / 2);
    const step = rects[from].height + (rects.length > 1 ? Math.max(4, Math.abs((rects[1].top - rects[0].bottom))) : 8), startY = e.clientY, scroller = $('pbody');
    let to = from, startScroll = scroller.scrollTop;
    item.classList.add('dragging'); items.forEach((n) => n !== item && n.classList.add('sort-item')); item.classList.add('sort-item');
    const place = (ev) => {
      const dy = ev.clientY - startY + (scroller.scrollTop - startScroll); item.style.transform = `translateY(${dy}px)`;
      const mid = centers[from] + dy; to = 0; centers.forEach((c, i) => { if (i !== from && mid > c) to++; });
      items.forEach((n, i) => { if (n === item) return; const shift = from < to && i > from && i <= to ? -step : from > to && i >= to && i < from ? step : 0; n.style.transform = shift ? `translateY(${shift}px)` : ''; });
      const sr = scroller.getBoundingClientRect(); if (ev.clientY < sr.top + 50) scroller.scrollTop -= 8; else if (ev.clientY > sr.bottom - 90) scroller.scrollTop += 8;   // auto-scroll near the edges
    };
    const up = (ev) => {
      grip.removeEventListener('pointermove', place); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up);
      items.forEach((n) => { n.style.transform = ''; n.classList.remove('dragging', 'sort-item'); });
      if (to !== from) onSort(from, to);
    };
    grip.addEventListener('pointermove', place); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
  });
}
const gripEl = () => { const g = document.createElement('span'); g.className = 'grip'; g.title = 'Drag to reorder'; g.setAttribute('aria-hidden', 'true'); g.innerHTML = svg('grip'); return g; };
const moveItem = (arr, from, to) => { const a = [...arr], [x] = a.splice(from, 1); a.splice(to, 0, x); return a; };

/* ===== Photo controls ===== */
function syncPhotoControls() {
  $('zoom').value = card.photoZoom || 100; $('posx').value = card.photoX ?? 50; $('posy').value = card.photoY || 0;
  $('bright').value = card.photoBright ?? 100; $('contrast').value = card.photoContrast ?? 100; $('fade').value = card.photoFade ?? 25;
  $('zoomV').textContent = $('zoom').value + '%'; $('posxV').textContent = $('posx').value + '%'; $('posyV').textContent = $('posy').value + '%';
  $('brightV').textContent = $('bright').value + '%'; $('contrastV').textContent = $('contrast').value + '%'; $('fadeV').textContent = $('fade').value + '%';
}

/* When the frame changes shape, fill it with the photo (unless the owner already zoomed in themselves) so no empty bars show */
function autoFrame() {
  setTimeout(() => {
    if (!card.avatar) return; const g = photoGeom(); if (!g || (card.photoZoom || 100) > 100 || g.fill <= 1.02) return;
    card.photoZoom = Math.min(400, Math.ceil(g.fill * 100)); card.photoX = 50; card.photoY = 0; syncPhotoControls(); renderPhoto();
  }, 200);
}
/* ===== Layout picker (thumbnails drawn as tiny wireframes) ===== */
const LAYOUT_THUMBS = {
  tap: '<rect width="60" height="80" fill="#2c3b5e"/><rect y="38" width="60" height="42" rx="7" fill="#fff"/><rect x="6" y="26" width="30" height="5" rx="2" fill="#fff"/><rect x="6" y="44" width="10" height="9" rx="2" fill="#dfe5ef"/><rect x="19" y="44" width="10" height="9" rx="2" fill="#dfe5ef"/><rect x="32" y="44" width="10" height="9" rx="2" fill="#dfe5ef"/><rect x="45" y="44" width="10" height="9" rx="2" fill="#dfe5ef"/><rect x="6" y="59" width="40" height="3" rx="1.5" fill="#c9d1de"/><rect x="6" y="66" width="32" height="3" rx="1.5" fill="#dfe5ef"/>',
  cards: '<rect width="60" height="80" fill="#1d2a4a"/><rect width="60" height="34" fill="#2c3b5e"/><rect x="5" y="22" width="30" height="5" rx="2" fill="#fff"/><rect x="5" y="38" width="50" height="10" rx="3" fill="#fff"/><rect x="5" y="51" width="50" height="12" rx="3" fill="#fff"/><rect x="5" y="66" width="50" height="10" rx="3" fill="#fff"/>',
  editorial: '<rect width="60" height="80" fill="#fff"/><rect width="60" height="38" fill="#c3cbd9"/><rect x="5" y="42" width="38" height="7" rx="2" fill="#172033"/><rect x="5" y="55" width="10" height="2.5" rx="1" fill="#8f9bb0"/><rect x="20" y="55" width="34" height="2.5" rx="1" fill="#c9d1de"/><rect x="5" y="62" width="50" height=".8" fill="#dfe5ef"/><rect x="5" y="66" width="10" height="2.5" rx="1" fill="#8f9bb0"/><rect x="20" y="66" width="30" height="2.5" rx="1" fill="#c9d1de"/><rect x="5" y="73" width="50" height=".8" fill="#dfe5ef"/>',
  minimal: '<rect width="60" height="80" fill="#10192e"/><rect width="60" height="40" fill="#24324f" opacity=".7"/><rect x="6" y="30" width="26" height="5" rx="2" fill="#fff"/><circle cx="12" cy="48" r="4" fill="none" stroke="#6d7ea1"/><circle cx="25" cy="48" r="4" fill="none" stroke="#6d7ea1"/><circle cx="38" cy="48" r="4" fill="none" stroke="#6d7ea1"/><rect x="6" y="60" width="44" height="2.5" rx="1" fill="#34456a"/><rect x="6" y="67" width="34" height="2.5" rx="1" fill="#34456a"/>',
  poster: '<rect width="60" height="80" fill="#fff"/><rect width="60" height="50" fill="#c6f432"/><rect y="12" width="60" height="28" fill="#2c3b5e"/><polygon points="0,40 60,32 60,50 0,50" fill="#c6f432"/><rect x="5" y="39" width="36" height="9" rx="1.5" fill="#0b1437"/><rect x="5" y="56" width="22" height="9" rx="2" fill="#e8edf5"/><rect x="31" y="56" width="22" height="9" rx="2" fill="#e8edf5"/><rect x="5" y="69" width="48" height="3" rx="1.5" fill="#c9d1de"/>',
  glass: '<rect width="60" height="80" fill="#2c3b5e"/><circle cx="38" cy="22" r="11" fill="#4a5d86"/><rect x="5" y="30" width="30" height="5" rx="2" fill="#fff"/><rect x="5" y="44" width="50" height="14" rx="4" fill="#fff" opacity=".28"/><rect x="5" y="61" width="50" height="14" rx="4" fill="#fff" opacity=".28"/>',
  duo: '<rect width="60" height="80" fill="#fff"/><rect width="60" height="26" fill="#c6f432"/><circle cx="30" cy="25" r="13" fill="#2c3b5e" stroke="#fff" stroke-width="3"/><rect x="14" y="43" width="32" height="5" rx="2" fill="#172033"/><rect x="6" y="54" width="22" height="7" rx="3.5" fill="#e8edf5"/><rect x="32" y="54" width="22" height="7" rx="3.5" fill="#e8edf5"/><rect x="6" y="66" width="48" height="3" rx="1.5" fill="#c9d1de"/>',
  story: '<rect width="60" height="80" fill="#fff"/><rect width="60" height="62" fill="#2c3b5e"/><rect x="5" y="36" width="34" height="6" rx="2" fill="#fff"/><rect x="5" y="49" width="10" height="9" rx="2.5" fill="#fff" opacity=".4"/><rect x="18" y="49" width="10" height="9" rx="2.5" fill="#fff" opacity=".4"/><rect x="31" y="49" width="10" height="9" rx="2.5" fill="#fff" opacity=".4"/><rect x="44" y="49" width="10" height="9" rx="2.5" fill="#fff" opacity=".4"/><rect y="62" width="60" height="18" rx="6" fill="#fff"/>',
  bento: '<rect width="60" height="80" fill="#1d2a4a"/><rect width="60" height="26" fill="#2c3b5e"/><rect x="5" y="16" width="26" height="5" rx="2" fill="#fff"/><rect x="5" y="31" width="26" height="22" rx="4" fill="#c6f432"/><rect x="34" y="31" width="21" height="10" rx="3" fill="#fff"/><rect x="34" y="43" width="21" height="10" rx="3" fill="#fff"/><rect x="5" y="56" width="50" height="9" rx="4" fill="#fff"/><rect x="5" y="68" width="50" height="9" rx="4" fill="#fff"/>',
  timeline: '<rect width="60" height="80" fill="#fff"/><rect width="60" height="30" fill="#2c3b5e"/><rect x="6" y="19" width="26" height="5" rx="2" fill="#fff"/><rect x="11" y="36" width="1.6" height="40" fill="#c9d1de"/><circle cx="11.8" cy="38" r="3" fill="#c6f432"/><circle cx="11.8" cy="53" r="3" fill="#c6f432"/><circle cx="11.8" cy="68" r="3" fill="#c6f432"/><rect x="19" y="36" width="34" height="3" rx="1.5" fill="#c9d1de"/><rect x="19" y="43" width="26" height="3" rx="1.5" fill="#dfe5ef"/><rect x="19" y="51" width="34" height="3" rx="1.5" fill="#c9d1de"/><rect x="19" y="66" width="30" height="3" rx="1.5" fill="#c9d1de"/>',
  badge: '<rect width="60" height="80" fill="#1d2a4a"/><rect x="7" y="8" width="46" height="62" rx="8" fill="#fff"/><rect x="24" y="11" width="12" height="3" rx="1.5" fill="#1d2a4a"/><rect x="13" y="19" width="34" height="26" rx="4" fill="#c3cbd9"/><rect x="17" y="50" width="26" height="4.5" rx="2" fill="#172033"/><rect x="13" y="61" width="34" height="5" fill="#172033" opacity=".8"/>',
  neon: '<rect width="60" height="80" fill="#0b1228"/><rect x="5" y="14" width="34" height="6" rx="2" fill="#c6f432"/><rect x="5" y="31" width="50" height="13" rx="4" fill="#12204a" stroke="#c6f432" stroke-width="1"/><rect x="5" y="48" width="50" height="13" rx="4" fill="#12204a" stroke="#c6f432" stroke-width="1"/><rect x="5" y="65" width="50" height="11" rx="4" fill="#12204a" stroke="#c6f432" stroke-width="1"/>',
  compact: '<rect width="60" height="80" fill="#fff"/><rect width="60" height="26" fill="#2c3b5e"/><circle cx="14" cy="13" r="7" fill="#c9d1de"/><rect x="25" y="9" width="26" height="4.5" rx="2" fill="#fff"/><rect x="25" y="16" width="18" height="2.5" rx="1" fill="#8f9bb0"/><rect x="5" y="32" width="50" height="11" rx="3" fill="#eef1f6"/><rect x="5" y="46" width="50" height="11" rx="3" fill="#eef1f6"/><rect x="5" y="60" width="50" height="11" rx="3" fill="#eef1f6"/>',
  portfolio: '<defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c084fc"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs><rect width="60" height="80" fill="#fffbe6"/><rect width="60" height="9" fill="#fff"/><rect x="4" y="3" width="16" height="3" rx="1.5" fill="#222"/><rect x="38" y="2.5" width="18" height="5" rx="2.5" fill="none" stroke="#333" stroke-width=".8"/><path d="M34 22a15 15 0 0 1 20 5L36 40z" fill="url(#pg)"/><path d="M6 36a14 14 0 0 1 12 6l-9 4z" fill="#ffa63d"/><circle cx="30" cy="32" r="15" fill="#c3cbd9"/><circle cx="12" cy="56" r="2" fill="#222"/><circle cx="20" cy="56" r="2" fill="#222"/><circle cx="28" cy="56" r="2" fill="#222"/><circle cx="36" cy="56" r="2" fill="#222"/><rect x="6" y="62" width="40" height="5" rx="2" fill="#111"/><rect x="6" y="70" width="30" height="3" rx="1.5" fill="#c9d1de"/>',
  aurora: '<defs><radialGradient id="ag1" cx=".2" cy=".15" r=".6"><stop offset="0" stop-color="#7c3aed" stop-opacity=".9"/><stop offset="1" stop-color="#7c3aed" stop-opacity="0"/></radialGradient><radialGradient id="ag2" cx=".9" cy=".6" r=".6"><stop offset="0" stop-color="#22d3ee" stop-opacity=".7"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient></defs><rect width="60" height="80" fill="#10122b"/><rect width="60" height="80" fill="url(#ag1)"/><rect width="60" height="80" fill="url(#ag2)"/><circle cx="30" cy="22" r="12" fill="#4a5d86" stroke="#c4b5fd" stroke-width="2"/><rect x="14" y="39" width="32" height="5" rx="2" fill="#fff"/><rect x="5" y="50" width="50" height="11" rx="4" fill="#fff" opacity=".18"/><rect x="5" y="64" width="50" height="11" rx="4" fill="#fff" opacity=".18"/>',
  brutal: '<rect width="60" height="80" fill="#fff3cf"/><rect x="6" y="6" width="26" height="26" fill="#ffd23f" stroke="#111" stroke-width="1.6"/><rect x="9" y="9" width="26" height="26" fill="#c3cbd9" stroke="#111" stroke-width="1.6"/><rect x="6" y="42" width="40" height="7" fill="#111"/><rect x="6" y="54" width="48" height="9" fill="#fff" stroke="#111" stroke-width="1.4"/><rect x="8" y="56" width="48" height="9" fill="#111" opacity="0"/><rect x="6" y="66" width="48" height="9" fill="#ffd23f" stroke="#111" stroke-width="1.4"/>',
  spotlight: '<rect width="60" height="80" fill="#fde9ec"/><circle cx="30" cy="25" r="19" fill="none" stroke="#e11d48" stroke-width=".8" opacity=".5"/><circle cx="30" cy="25" r="14" fill="#c3cbd9" stroke="#fff" stroke-width="2"/><rect x="16" y="46" width="28" height="5" rx="2" fill="#3b0d1f"/><circle cx="14" cy="60" r="5" fill="#3b0d1f"/><circle cx="26" cy="60" r="5" fill="#3b0d1f"/><circle cx="38" cy="60" r="5" fill="#3b0d1f"/><circle cx="50" cy="60" r="5" fill="#3b0d1f"/><rect x="6" y="69" width="48" height="6" rx="3" fill="#fff"/>',
  counsel: '<rect width="60" height="80" fill="#fbfaf6"/><rect width="60" height="40" fill="#0f1a2e"/><rect x="21" y="6" width="18" height="23" fill="#c3cbd9" stroke="#c9a227" stroke-width="1"/><rect x="14" y="32" width="32" height="3.5" rx="1" fill="#fff"/><rect x="26" y="38" width="8" height="1.2" fill="#c9a227"/><rect x="6" y="48" width="48" height="1" fill="#c9a227"/><rect x="14" y="52" width="32" height="3" fill="#1a2233"/><rect x="6" y="60" width="48" height="8" fill="none" stroke="#e6e1d3"/><rect x="6" y="70" width="48" height="8" fill="none" stroke="#e6e1d3"/>',
  clinic: '<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4f0f2"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect width="60" height="80" fill="url(#cg)"/><circle cx="30" cy="22" r="13" fill="#c3cbd9" stroke="#fff" stroke-width="2.5"/><circle cx="40" cy="31" r="4.5" fill="#0e9aa7" stroke="#fff" stroke-width="1.5"/><path d="M38 31l1.6 1.6L42 29.6" fill="none" stroke="#fff" stroke-width="1.2"/><rect x="14" y="41" width="32" height="4" rx="2" fill="#0b2e33"/><rect x="21" y="47" width="18" height="2.5" rx="1" fill="#58767c"/><rect x="5" y="54" width="50" height="9" rx="4.5" fill="#0e9aa7"/><rect x="5" y="66" width="50" height="10" rx="4" fill="#fff" stroke="#d8ecee"/>',
  agent: '<rect width="60" height="80" fill="#e8edff"/><rect x="5" y="5" width="50" height="40" rx="8" fill="#c3cbd9"/><circle cx="30" cy="22" r="8" fill="#9aa6bd"/><rect x="9" y="36" width="42" height="18" rx="6" fill="#fff" stroke="#dde3ff"/><rect x="16" y="41" width="28" height="4" rx="2" fill="#0d1440"/><rect x="21" y="48" width="18" height="2.5" rx="1" fill="#55608f"/><rect x="5" y="60" width="50" height="8" rx="4" fill="#fff"/><rect x="5" y="70" width="50" height="8" rx="4" fill="#fff"/>',
  terminal: '<rect width="60" height="80" fill="#04100a"/><rect x="4" y="5" width="52" height="70" rx="4" fill="#07170f" stroke="#12402a"/><circle cx="9" cy="10" r="1.4" fill="#ff5f56"/><circle cx="14" cy="10" r="1.4" fill="#ffbd2e"/><circle cx="19" cy="10" r="1.4" fill="#27c93f"/><rect x="9" y="18" width="12" height="2.5" rx="1" fill="#34f58a"/><rect x="9" y="25" width="30" height="4" rx="1.5" fill="#d7ffe8"/><rect x="9" y="33" width="38" height="2.5" rx="1" fill="#86b79c"/><rect x="9" y="40" width="34" height="2.5" rx="1" fill="#86b79c"/><rect x="9" y="50" width="42" height="9" rx="2" fill="none" stroke="#34f58a" stroke-width=".8"/><rect x="9" y="63" width="6" height="3" fill="#34f58a"/>'
};
function renderLayoutPicker() {
  const box = $('layGrid'), cur = normLayout(card.layout); box.innerHTML = '';
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lay-opt'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', l.id === cur);
    b.innerHTML = `<svg viewBox="0 0 60 80" aria-hidden="true">${LAYOUT_THUMBS[l.id]}</svg><span>${l.name}</span>`;
    b.onclick = () => { card.layout = l.id; withTransition(render); renderLayoutPicker(); autoFrame(); };
    box.appendChild(b);
  });
  $('layHint').textContent = (LAYOUTS.find((l) => l.id === cur) || LAYOUTS[0]).hint;
}

/* ===== Sections, quick actions, shape, motion ===== */
function renderSectionList() {
  const list = getSections(), box = $('secList'); box.innerHTML = '';
  const commit = (next) => { card.sections = next; render(); renderSectionList(); };
  list.forEach((s, i) => {
    const row = document.createElement('div'); row.className = 'sec-row' + (s.visible ? '' : ' off');
    const label = SECTION_DEFS.find((d) => d.key === s.key).label;
    row.innerHTML = `<span>${label}</span>`; row.prepend(gripEl());
    const mk = (icon, title, fn, disabled) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ibtn'; b.title = title; b.setAttribute('aria-label', title + ' ' + label); b.innerHTML = svg(icon); b.disabled = !!disabled; b.onclick = fn; return b; };
    row.append(
      mk('up', 'Move up', () => { const n = list.map((x) => ({ ...x })); [n[i - 1], n[i]] = [n[i], n[i - 1]]; commit(n); }, i === 0),
      mk('down', 'Move down', () => { const n = list.map((x) => ({ ...x })); [n[i + 1], n[i]] = [n[i], n[i + 1]]; commit(n); }, i === list.length - 1),
      mk(s.visible ? 'eye' : 'eyeoff', s.visible ? 'Hide' : 'Show', () => { const n = list.map((x) => ({ ...x })); n[i].visible = !n[i].visible; commit(n); })
    );
    box.appendChild(row);
  });
}
makeSortable($('secList'), '.sec-row', (from, to) => { card.sections = moveItem(getSections(), from, to); render(); renderSectionList(); });
function renderQuickList() {
  const enabled = Array.isArray(card.quick) ? card.quick.filter((k) => QUICK_DEFS.some((d) => d.key === k)) : [...DEFAULT_QUICK], box = $('quickList'); box.innerHTML = '';
  const order = [...enabled, ...QUICK_DEFS.map((d) => d.key).filter((k) => !enabled.includes(k))];
  order.forEach((k) => {
    const d = QUICK_DEFS.find((x) => x.key === k), on = enabled.includes(k);
    const b = document.createElement('div'); b.className = 'tog' + (on ? ' qrow' : ''); b.setAttribute('role', 'checkbox'); b.tabIndex = 0; b.setAttribute('aria-checked', on); b.dataset.key = k;
    b.innerHTML = `${svg(d.icon)}<b>${d.label}</b><span class="sw"></span>`; if (on) b.prepend(gripEl());
    const toggle = () => { const cur = [...enabled], i = cur.indexOf(k); i >= 0 ? cur.splice(i, 1) : cur.push(k); card.quick = cur; render(); renderQuickList(); };
    b.onclick = (e) => { if (e.target.closest('.grip')) return; toggle(); };
    b.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } };
    box.appendChild(b);
  });
}
makeSortable($('quickList'), '.qrow', (from, to) => { const cur = Array.isArray(card.quick) ? [...card.quick] : [...DEFAULT_QUICK]; card.quick = moveItem(cur, from, to); render(); renderQuickList(); });
function renderShapePick() { document.querySelectorAll('#shapePick [data-shape]').forEach((b) => b.setAttribute('aria-checked', b.dataset.shape === (PROFILE_STYLES.includes(card.profileStyle) ? card.profileStyle : 'full'))); }
function renderSegs() {
  document.querySelectorAll('#motionSeg [data-motion]').forEach((b) => b.setAttribute('aria-checked', b.dataset.motion === (card.motion || 'cinematic')));
  document.querySelectorAll('#alignSeg [data-align]').forEach((b) => b.setAttribute('aria-checked', b.dataset.align === (card.nameAlign || 'auto')));
  document.querySelectorAll('#topbarSeg [data-topbar]').forEach((b) => b.setAttribute('aria-checked', b.dataset.topbar === (card.topbar || 'auto')));
}
function replayAll() {
  replayIntro();
  const secs = [...document.querySelectorAll('.section')]; secs.forEach((s) => s.classList.remove('in'));
  secs.filter((s) => !s.hidden).forEach((s, i) => setTimeout(() => s.classList.add('in'), 900 + i * 160));
  setTimeout(() => secs.forEach((s) => s.classList.add('in')), 900 + secs.length * 160 + 900);
}
['nameAnim', 'titleAnim', 'revealAnim'].forEach((id) => $(id).addEventListener('change', () => { keepScrolls(() => { card[id] = $(id).value; render(); replayAll(); }); }));
$('replayAnim').onclick = () => { if (card.motion === 'off') { card.motion = 'cinematic'; renderSegs(); render(); } replayAll(); };
function replayIntro() { document.body.classList.remove('intro'); void document.body.offsetWidth; document.body.classList.add('intro'); clearTimeout(replayIntro.t); replayIntro.t = setTimeout(() => document.body.classList.remove('intro'), 3200); }

/* ===== Themes + type pairs ===== */
function renderThemeGrid() {
  const box = $('themeGrid'), t = card.theme || {}; box.innerHTML = '';
  Object.keys(THEMES).forEach((k) => {
    const th = THEMES[k], on = th.bg === t.bg && th.accent === t.accent;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'theme-chip' + (on ? ' on' : ''); b.title = THEME_NAMES[k] || k;
    b.innerHTML = `<i style="background:linear-gradient(135deg,${th.accent} 50%,${th.bg} 50%)"></i><span>${THEME_NAMES[k] || k}</span>`;
    b.onclick = () => { withTransition(() => { Object.assign(card.theme, th); fillForm(); render(); }); };
    box.appendChild(b);
  });
}
function renderPairs() {
  const box = $('pairGrid'), isOn = (p) => card.nameFont === p.name && card.theme.font === p.body;
  /* Built once and then only highlighted, so tapping a font never rebuilds the list under your finger or moves the panel */
  if (box.children.length !== PAIRS.length) {
    box.innerHTML = '';
    PAIRS.forEach((p) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pair-chip'; b.dataset.pair = p.id;
      b.innerHTML = `<b style="font-family:${p.name.replace(/"/g, '')}">Aa Name</b><small>${p.label}</small>`;
      b.onclick = () => keepScrolls(() => { card.nameFont = p.name; card.theme.font = p.body; render(); renderPairs(); const nf = $('nameFont'); if (nf) nf.value = p.name; });
      box.appendChild(b);
    });
  }
  PAIRS.forEach((p, i) => { const b = box.children[i]; b.classList.toggle('on', isOn(p)); b.setAttribute('aria-pressed', isOn(p)); });
}
/* ===== Form fill ===== */
function updateStyleValues() {
  const val = (id, out, fn) => { if ($(id) && $(out)) $(out).textContent = fn ? fn($(id).value) : $(id).value; };
  val('roundness', 'roundV', (v) => v + 'px'); val('sectionSpace', 'spaceV', (v) => v + 'px');
  val('nameX', 'nameXV', (v) => v + 'px'); val('nameY', 'nameYV', (v) => v + 'px'); val('titleSize', 'titleSizeV', (v) => v + 'px');
  $('nameSizeV').textContent = typeof card.nameSize === 'number' ? card.nameSize + 'px' : 'Auto';
  $('nameLineV').textContent = typeof card.nameLine === 'number' ? Number(card.nameLine).toFixed(2) : 'Auto';
  $('nameLetterV').textContent = typeof card.nameLetter === 'number' ? card.nameLetter + 'px' : 'Auto';
}
function fillForm() { return keepScrolls(fillFormCore); }
function fillFormCore() {
  document.querySelectorAll('[data-f]').forEach((i) => (i.value = card[i.dataset.f] ?? ''));
  document.querySelectorAll('[data-t]').forEach((i) => (i.value = card.theme[i.dataset.t] ?? THEME_FALLBACK[i.dataset.t] ?? ''));
  syncPhotoControls();
  $('nameFont').value = card.nameFont || 'inherit'; $('nameLayout').value = card.nameLayout || 'natural'; $('titlePlace').value = card.titlePlacement === 'about' ? 'about' : 'hero'; $('nameAnim').value = card.nameAnim || 'rise'; $('titleAnim').value = card.titleAnim || 'fade'; $('revealAnim').value = card.revealAnim === undefined ? 'up' : card.revealAnim;
  const computed = Math.round(parseFloat(getComputedStyle($('name')).fontSize)) || 48;
  $('nameSize').value = typeof card.nameSize === 'number' ? card.nameSize : clampN(computed, 20, 72);
  $('nameLine').value = typeof card.nameLine === 'number' ? card.nameLine : 1; $('nameLetter').value = typeof card.nameLetter === 'number' ? card.nameLetter : 0;
  [['nameX', 0], ['nameY', 0], ['titleSize', 16], ['roundness', 14], ['sectionSpace', 26]].forEach(([id, fb]) => { $(id).value = card[id] ?? fb; });
  updateStyleValues(); renderLayoutPicker(); renderSectionList(); renderQuickList(); renderShapePick(); renderSegs(); renderThemeGrid(); renderPairs(); renderContrast();
  $('matchPhoto').disabled = !card.avatar && !lastPhotoBlob;
  renderSocialEditor(); renderTemplates(); fillMore(); updateStrength(); hydrateIcons();
}

/* ===== Links ===== */
function renderSocialEditor() {
  const box = $('socialEditor'); box.innerHTML = '';
  if (!card.socials.length) { box.innerHTML = '<div class="empty-links">No links yet. Add one below or tap a network.</div>'; return; }
  card.socials.forEach((s, idx) => {
    const row = document.createElement('div'); row.className = 'social-row';
    row.innerHTML = `<span class="s-ico">${svg(socialIcon(s))}</span><div class="s-fields"><input type="text" placeholder="Name, e.g. Instagram" aria-label="Link name" value="${esc(s.label)}"><input type="text" inputmode="url" autocapitalize="off" placeholder="https://..." aria-label="Link address" value="${esc(s.url)}"></div><div class="s-tools"></div>`;
    row.prepend(gripEl());
    const [, ico, fields, tools] = row.children, [l, u] = fields.children;
    const refreshIcon = () => { ico.innerHTML = svg(socialIcon(s)); };
    l.oninput = () => { s.label = l.value; refreshIcon(); render(); };
    u.oninput = () => { s.url = u.value; refreshIcon(); render(); };
    const mk = (icon, label, fn, off) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label; b.innerHTML = svg(icon); b.disabled = !!off; b.onclick = fn; tools.appendChild(b); };
    const move = (d) => { const j = idx + d; [card.socials[idx], card.socials[j]] = [card.socials[j], card.socials[idx]]; renderSocialEditor(); render(); };
    mk('up', 'Move link up', () => move(-1), idx === 0); mk('down', 'Move link down', () => move(1), idx === card.socials.length - 1);
    mk('close', 'Remove link', () => { card.socials.splice(idx, 1); renderSocialEditor(); render(); });
    box.appendChild(row);
  });
}
makeSortable($('socialEditor'), '.social-row', (from, to) => { card.socials = moveItem(card.socials, from, to); renderSocialEditor(); render(); });
const QUICK_LINKS = [['Instagram', 'instagram', 'https://instagram.com/'], ['Facebook', 'facebook', 'https://facebook.com/'], ['LinkedIn', 'linkedin', 'https://linkedin.com/in/'], ['TikTok', 'tiktok', 'https://tiktok.com/@'],
  ['YouTube', 'youtube', 'https://youtube.com/@'], ['X', 'x', 'https://x.com/'], ['Telegram', 'telegram', 'https://t.me/'], ['GitHub', 'github', 'https://github.com/']];
(function () {
  const box = $('quickAdd');
  QUICK_LINKS.forEach(([label, icon, url]) => {
    const b = document.createElement('button'); b.type = 'button'; b.innerHTML = svg(icon) + label;
    b.onclick = () => { card.socials.push({ label, url }); renderSocialEditor(); render(); const ins = $('socialEditor').querySelectorAll('input'); const last = ins[ins.length - 1]; if (last) { last.focus(); last.setSelectionRange(last.value.length, last.value.length); } };
    box.appendChild(b);
  });
})();
$('addSocial').onclick = () => { card.socials.push({ label: '', url: '' }); renderSocialEditor(); const ins = $('socialEditor').querySelectorAll('input'); if (ins.length) ins[ins.length - 2].focus(); };

/* ===== Generic bindings ===== */
document.querySelectorAll('[data-f]').forEach((i) => i.addEventListener('input', () => { card[i.dataset.f] = i.value; render(); }));
document.querySelectorAll('[data-t]').forEach((i) => {
  const update = () => { card.theme[i.dataset.t] = i.value; render(); renderContrast(); renderThemeGrid(); renderPairs(); };
  i.addEventListener('input', update); i.addEventListener('change', update);
});
[['roundness', 'roundness'], ['sectionSpace', 'sectionSpace'], ['nameX', 'nameX'], ['nameY', 'nameY'], ['nameSize', 'nameSize'], ['nameLine', 'nameLine'], ['nameLetter', 'nameLetter'], ['titleSize', 'titleSize']]
  .forEach(([id, key]) => $(id).addEventListener('input', () => { card[key] = +$(id).value; updateStyleValues(); render(); }));
$('nameFont').addEventListener('change', () => { card.nameFont = $('nameFont').value; render(); renderPairs(); });
$('nameLayout').addEventListener('change', () => { card.nameLayout = $('nameLayout').value; render(); });
$('titlePlace').addEventListener('change', () => { card.titlePlacement = $('titlePlace').value; withTransition(render); });
document.querySelectorAll('#shapePick [data-shape]').forEach((b) => b.onclick = () => { card.profileStyle = b.dataset.shape; withTransition(render); renderShapePick(); autoFrame(); });
document.querySelectorAll('#motionSeg [data-motion]').forEach((b) => b.onclick = () => { card.motion = b.dataset.motion; render(); renderSegs(); if (card.motion !== 'off') replayIntro(); });
document.querySelectorAll('#alignSeg [data-align]').forEach((b) => b.onclick = () => { if (b.dataset.align === 'auto') delete card.nameAlign; else card.nameAlign = b.dataset.align; render(); renderSegs(); });
document.querySelectorAll('#topbarSeg [data-topbar]').forEach((b) => b.onclick = () => { if (b.dataset.topbar === 'auto') delete card.topbar; else card.topbar = b.dataset.topbar; withTransition(render); renderSegs(); });
$('matchPhoto').onclick = paletteFromPhoto;
$('fixContrast').onclick = () => { fixContrast(); fillForm(); render(); toast('Colors adjusted for readability'); };
$('undoBtn').onclick = () => historyJump(-1);
$('redoBtn').onclick = () => historyJump(1);
$('resetDesign').addEventListener('click', () => {
  ['nameX', 'nameY', 'nameAlign', 'nameSize', 'nameFont', 'nameLayout', 'nameLine', 'nameLetter', 'titleSize', 'roundness', 'sectionSpace', 'titlePlacement', 'dragPositions', 'topbar', 'nameAnim', 'titleAnim', 'revealAnim', 'contactOrder'].forEach((k) => delete card[k]);
  card.layout = 'tap'; card.profileStyle = 'full'; card.theme = { ...THEME_FALLBACK };
  withTransition(() => { fillForm(); render(); }); toast('Design settings reset. Save to publish.');
});

/* ===== Photo adjustments ===== */
$('clearImg').onclick = () => { card.avatar = ''; render(); fillForm(); toast('Photo removed. Press Save to publish.'); };
[['zoom', 'photoZoom'], ['posx', 'photoX'], ['posy', 'photoY'], ['bright', 'photoBright'], ['contrast', 'photoContrast'], ['fade', 'photoFade']].forEach(([id, key]) => {
  $(id).oninput = (e) => { card[key] = +e.target.value; syncPhotoControls(); renderPhoto(); };
});
$('sharpImg').onclick = () => { card.photoZoom = sharpZoom(); card.photoX = 50; card.photoY = 0; syncPhotoControls(); renderPhoto(); };
$('fillImg').onclick = () => { const g = photoGeom(); if (!g) return; card.photoZoom = Math.min(400, Math.ceil(g.fill * 100)); card.photoX = 50; card.photoY = 0; syncPhotoControls(); renderPhoto(); };
$('resetImg').onclick = () => { card.photoZoom = 100; card.photoX = 50; card.photoY = 0; card.photoBright = 100; card.photoContrast = 100; card.photoFade = 25; syncPhotoControls(); renderPhoto(); };
(function () {
  const pv = $('pv'), ptrs = new Map(); let pinch = 0;
  const apply = () => { syncPhotoControls(); renderPhoto(); };
  pv.addEventListener('pointerdown', (e) => { pv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); pinch = 0; });
  pv.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const g = photoGeom(); if (!g) return;
    const r = pv.getBoundingClientRect();
    if (ptrs.size === 1) {
      const fx = (e.clientX - p.x) / r.width, fy = (e.clientY - p.y) / r.height;
      if (Math.abs(1 - g.wr) > .001) card.photoX = clampN((card.photoX ?? 50) + fx * 100 / (1 - g.wr), 0, 100);
      if (Math.abs(1 - g.hr) > .001) card.photoY = clampN((card.photoY || 0) + fy * 100 / (1 - g.hr), 0, 100);
    }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) card.photoZoom = clampN(Math.round((card.photoZoom || 100) * d / pinch), 30, 400);
      pinch = d;
    }
    apply();
  });
  ['pointerup', 'pointercancel'].forEach((t) => pv.addEventListener(t, (e) => { ptrs.delete(e.pointerId); pinch = 0; }));
  pv.addEventListener('wheel', (e) => { e.preventDefault(); card.photoZoom = clampN(Math.round((card.photoZoom || 100) - e.deltaY * .2), 30, 400); apply(); }, { passive: false });
})();

/* ===== Tabs ===== */
document.querySelectorAll('#tabs [data-tab]').forEach((b) => b.onclick = () => setTab(b.dataset.tab));


/* ===== Templates: one tap restyles layout, shape, colors and fonts (content untouched) ===== */
const SHAPE_RADIUS = { full: '4px', circle: '50%', portrait: '9px', square: '9px', side: '7px', arch: '20px 20px 6px 6px', hexagon: '14px', blob: '46% 54% 52% 48%', polaroid: '2px', wide: '7px' };
function templateIsOn(t) { const th = THEMES[t.theme]; return normLayout(card.layout) === t.layout && (card.profileStyle || 'full') === t.shape && th && card.theme.bg === th.bg && card.theme.accent === th.accent; }
function renderTemplates() {
  const box = $('tplGrid'); box.innerHTML = '';
  TEMPLATES.forEach((t) => {
    const th = THEMES[t.theme], on = templateIsOn(t), lay = LAYOUTS.find((l) => l.id === t.layout);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tpl' + (on ? ' on' : '');
    b.innerHTML = `<div class="tpl-pv" style="--b:${th.bg};--a:${th.accent};--t:${th.text};--s:${th.surface};--pr:${SHAPE_RADIUS[t.shape]}"><i class="p"></i><i class="n"></i><i class="r"></i><i class="q"></i></div><b>${t.name}</b><small>${lay.name} · ${t.shape[0].toUpperCase() + t.shape.slice(1)}</small>`;
    b.onclick = () => {
      const pair = PAIRS.find((p) => p.id === t.pair);
      withTransition(() => {
        card.layout = t.layout; card.profileStyle = t.shape; Object.assign(card.theme, THEMES[t.theme]);
        if (pair) { card.nameFont = pair.name; card.theme.font = pair.body; }
        ['nameAlign', 'nameSize', 'nameLine', 'nameLetter'].forEach((k) => delete card[k]);
        fillForm(); render();
      });
      autoFrame(); toast(t.name + ' applied. Undo anytime.');
    };
    box.appendChild(b);
  });
}

/* ===== More tab: main button, services, testimonial ===== */
function renderServiceEditor() {
  const box = $('serviceEditor'); box.innerHTML = ''; card.services = Array.isArray(card.services) ? card.services : [];
  if (!card.services.length) { box.innerHTML = '<div class="empty-links">No services yet. Add what you offer, with an optional price.</div>'; return; }
  card.services.forEach((x, idx) => {
    const row = document.createElement('div'); row.className = 'svc-row';
    row.innerHTML = `<div class="svc-fields"><div class="two"><input type="text" placeholder="Service" aria-label="Service name" value="${esc(x.title)}"><input type="text" placeholder="Price" aria-label="Price" value="${esc(x.price)}"></div><textarea placeholder="Short description" aria-label="Description">${esc(x.desc)}</textarea></div><button type="button" class="x" aria-label="Remove service">${svg('close')}</button>`;
    row.prepend(gripEl());
    const [, fields, rm] = row.children, [two, ta] = fields.children, [t, pr] = two.children;
    t.oninput = () => { x.title = t.value; render(); }; pr.oninput = () => { x.price = pr.value; render(); }; ta.oninput = () => { x.desc = ta.value; render(); };
    rm.onclick = () => { card.services.splice(idx, 1); renderServiceEditor(); render(); };
    box.appendChild(row);
  });
}
makeSortable($('serviceEditor'), '.svc-row', (from, to) => { card.services = moveItem(card.services, from, to); renderServiceEditor(); render(); });
$('addService').onclick = () => { card.services = card.services || []; card.services.push({ title: '', price: '', desc: '' }); renderServiceEditor(); const ins = $('serviceEditor').querySelectorAll('input'); if (ins.length) ins[ins.length - 2].focus(); };
/* Numbers and Skills editors share one small row builder */
function listEditor(boxId, key, mk, blank, emptyMsg) {
  const box = $(boxId); box.innerHTML = ''; card[key] = Array.isArray(card[key]) ? card[key] : [];
  if (!card[key].length) { box.innerHTML = `<div class="empty-links">${emptyMsg}</div>`; return; }
  card[key].forEach((x, idx) => {
    const row = document.createElement('div'); row.className = 'svc-row mini-row'; row.innerHTML = mk(x) + `<button type="button" class="x" aria-label="Remove">${svg('close')}</button>`;
    row.prepend(gripEl());
    row.querySelector('.x').onclick = () => { card[key].splice(idx, 1); listEditor(boxId, key, mk, blank, emptyMsg); render(); };
    row.querySelectorAll('[data-k]').forEach((inp) => inp.oninput = () => { x[inp.dataset.k] = inp.type === 'range' ? +inp.value : inp.value; const o = row.querySelector('.lv-out'); if (o && inp.type === 'range') o.textContent = inp.value + '%'; render(); });
    box.appendChild(row);
  });
}
const statRow = (x) => `<div class="svc-fields"><div class="two"><input type="text" data-k="value" placeholder="120+" aria-label="Number" value="${esc(x.value)}"><input type="text" data-k="label" placeholder="Projects" aria-label="Label" value="${esc(x.label)}"></div></div>`;
const skillRow = (x) => `<div class="svc-fields"><input type="text" data-k="name" placeholder="Skill, e.g. Branding" aria-label="Skill" value="${esc(x.name)}"><label class="lv-row"><input type="range" min="0" max="100" step="1" data-k="level" aria-label="Level" value="${+x.level || 0}"><span class="lv-out">${+x.level || 0}%</span></label></div>`;
const renderStatEditor = () => listEditor('statEditor', 'stats', statRow, { value: '', label: '' }, 'No numbers yet. Add things like “120+ Projects”.');
const renderSkillEditor = () => listEditor('skillEditor', 'skills', skillRow, { name: '', level: 80 }, 'No skills yet. Add what you are best at.');
makeSortable($('statEditor'), '.svc-row', (from, to) => { card.stats = moveItem(card.stats, from, to); renderStatEditor(); render(); });
makeSortable($('skillEditor'), '.svc-row', (from, to) => { card.skills = moveItem(card.skills, from, to); renderSkillEditor(); render(); });
$('addStat').onclick = () => { card.stats = card.stats || []; if (card.stats.length >= 6) return toast('Up to 6 numbers', true); card.stats.push({ value: '', label: '' }); renderStatEditor(); const i = $('statEditor').querySelectorAll('input'); if (i.length) i[i.length - 2].focus(); };
$('addSkill').onclick = () => { card.skills = card.skills || []; if (card.skills.length >= 12) return toast('Up to 12 skills', true); card.skills.push({ name: '', level: 80 }); renderSkillEditor(); const i = $('skillEditor').querySelectorAll('input[type=text]'); if (i.length) i[i.length - 1].focus(); };
function fillMore() {
  const c = card.cta || {}, q = card.quote || {}; $('cta_label').value = c.label || ''; $('cta_url').value = c.url || ''; $('quote_text').value = q.text || ''; $('quote_by').value = q.by || '';
  renderServiceEditor(); renderStatEditor(); renderSkillEditor();
}
[['cta_label', 'cta', 'label'], ['cta_url', 'cta', 'url'], ['quote_text', 'quote', 'text'], ['quote_by', 'quote', 'by']].forEach(([id, obj, key]) => $(id).addEventListener('input', () => { card[obj] = card[obj] || {}; card[obj][key] = $(id).value; render(); }));

/* ===== Drop a photo anywhere on the photo area (or on the card while editing) ===== */
[$('photoDrop'), $('pvWrap'), $('hero')].forEach((el) => {
  if (!el) return;
  el.addEventListener('dragover', (e) => { if (!isEditing() || !(e.dataTransfer && [...e.dataTransfer.types].includes('Files'))) return; e.preventDefault(); el.classList.add('dropping'); });
  ['dragleave', 'dragend'].forEach((t) => el.addEventListener(t, () => el.classList.remove('dropping')));
  el.addEventListener('drop', (e) => {
    el.classList.remove('dropping'); if (!isEditing()) return; e.preventDefault();
    const f = [...(e.dataTransfer.files || [])].find((x) => /^image\//.test(x.type)); if (f) handleFile(f); else toast('Drop an image file', true);
  });
});
