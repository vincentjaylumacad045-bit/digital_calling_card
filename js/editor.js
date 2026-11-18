/* js/editor.js */
/* ---------- Design Studio: form wiring for every tab (owner only) ---------- */
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

/* ===== Photo controls ===== */
function syncPhotoControls() {
  $('zoom').value = card.photoZoom || 100; $('posx').value = card.photoX ?? 50; $('posy').value = card.photoY || 0;
  $('bright').value = card.photoBright ?? 100; $('contrast').value = card.photoContrast ?? 100; $('fade').value = card.photoFade ?? 25;
  $('zoomV').textContent = $('zoom').value + '%'; $('posxV').textContent = $('posx').value + '%'; $('posyV').textContent = $('posy').value + '%';
  $('brightV').textContent = $('bright').value + '%'; $('contrastV').textContent = $('contrast').value + '%'; $('fadeV').textContent = $('fade').value + '%';
}

/* ===== Layout picker (thumbnails drawn as tiny wireframes) ===== */
const LAYOUT_THUMBS = {
  tap: '<rect width="60" height="80" fill="#2c3b5e"/><rect y="38" width="60" height="42" rx="7" fill="#fff"/><rect x="6" y="26" width="30" height="5" rx="2" fill="#fff"/><rect x="6" y="44" width="10" height="9" rx="2" fill="#dfe5ef"/><rect x="19" y="44" width="10" height="9" rx="2" fill="#dfe5ef"/><rect x="32" y="44" width="10" height="9" rx="2" fill="#dfe5ef"/><rect x="45" y="44" width="10" height="9" rx="2" fill="#dfe5ef"/><rect x="6" y="59" width="40" height="3" rx="1.5" fill="#c9d1de"/><rect x="6" y="66" width="32" height="3" rx="1.5" fill="#dfe5ef"/>',
  cards: '<rect width="60" height="80" fill="#1d2a4a"/><rect width="60" height="34" fill="#2c3b5e"/><rect x="5" y="22" width="30" height="5" rx="2" fill="#fff"/><rect x="5" y="38" width="50" height="10" rx="3" fill="#fff"/><rect x="5" y="51" width="50" height="12" rx="3" fill="#fff"/><rect x="5" y="66" width="50" height="10" rx="3" fill="#fff"/>',
  editorial: '<rect width="60" height="80" fill="#fff"/><rect width="60" height="38" fill="#c3cbd9"/><rect x="5" y="42" width="38" height="7" rx="2" fill="#172033"/><rect x="5" y="55" width="10" height="2.5" rx="1" fill="#8f9bb0"/><rect x="20" y="55" width="34" height="2.5" rx="1" fill="#c9d1de"/><rect x="5" y="62" width="50" height=".8" fill="#dfe5ef"/><rect x="5" y="66" width="10" height="2.5" rx="1" fill="#8f9bb0"/><rect x="20" y="66" width="30" height="2.5" rx="1" fill="#c9d1de"/><rect x="5" y="73" width="50" height=".8" fill="#dfe5ef"/>',
  minimal: '<rect width="60" height="80" fill="#10192e"/><rect width="60" height="40" fill="#24324f" opacity=".7"/><rect x="6" y="30" width="26" height="5" rx="2" fill="#fff"/><circle cx="12" cy="48" r="4" fill="none" stroke="#6d7ea1"/><circle cx="25" cy="48" r="4" fill="none" stroke="#6d7ea1"/><circle cx="38" cy="48" r="4" fill="none" stroke="#6d7ea1"/><rect x="6" y="60" width="44" height="2.5" rx="1" fill="#34456a"/><rect x="6" y="67" width="34" height="2.5" rx="1" fill="#34456a"/>',
  poster: '<rect width="60" height="80" fill="#fff"/><rect width="60" height="50" fill="#c6f432"/><rect y="12" width="60" height="28" fill="#2c3b5e"/><polygon points="0,40 60,32 60,50 0,50" fill="#c6f432"/><rect x="5" y="39" width="36" height="9" rx="1.5" fill="#0b1437"/><rect x="5" y="56" width="22" height="9" rx="2" fill="#e8edf5"/><rect x="31" y="56" width="22" height="9" rx="2" fill="#e8edf5"/><rect x="5" y="69" width="48" height="3" rx="1.5" fill="#c9d1de"/>',
  compact: '<rect width="60" height="80" fill="#fff"/><rect width="60" height="26" fill="#2c3b5e"/><circle cx="14" cy="13" r="7" fill="#c9d1de"/><rect x="25" y="9" width="26" height="4.5" rx="2" fill="#fff"/><rect x="25" y="16" width="18" height="2.5" rx="1" fill="#8f9bb0"/><rect x="5" y="32" width="50" height="11" rx="3" fill="#eef1f6"/><rect x="5" y="46" width="50" height="11" rx="3" fill="#eef1f6"/><rect x="5" y="60" width="50" height="11" rx="3" fill="#eef1f6"/>'
};
function renderLayoutPicker() {
  const box = $('layGrid'), cur = normLayout(card.layout); box.innerHTML = '';
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lay-opt'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', l.id === cur);
    b.innerHTML = `<svg viewBox="0 0 60 80" aria-hidden="true">${LAYOUT_THUMBS[l.id]}</svg><span>${l.name}</span>`;
    b.onclick = () => { card.layout = l.id; withTransition(render); renderLayoutPicker(); };
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
    row.innerHTML = `<span>${label}</span>`;
    const mk = (icon, title, fn, disabled) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ibtn'; b.title = title; b.setAttribute('aria-label', title + ' ' + label); b.innerHTML = svg(icon); b.disabled = !!disabled; b.onclick = fn; return b; };
    row.append(
      mk('up', 'Move up', () => { const n = list.map((x) => ({ ...x })); [n[i - 1], n[i]] = [n[i], n[i - 1]]; commit(n); }, i === 0),
      mk('down', 'Move down', () => { const n = list.map((x) => ({ ...x })); [n[i + 1], n[i]] = [n[i], n[i + 1]]; commit(n); }, i === list.length - 1),
      mk(s.visible ? 'eye' : 'eyeoff', s.visible ? 'Hide' : 'Show', () => { const n = list.map((x) => ({ ...x })); n[i].visible = !n[i].visible; commit(n); })
    );
    box.appendChild(row);
  });
}
function renderQuickList() {
  const on = Array.isArray(card.quick) ? card.quick : DEFAULT_QUICK, box = $('quickList'); box.innerHTML = '';
  QUICK_DEFS.forEach((d) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tog'; b.setAttribute('role', 'checkbox'); b.setAttribute('aria-checked', on.includes(d.key));
    b.innerHTML = `${svg(d.icon)}<b>${d.label}</b><span class="sw"></span>`;
    b.onclick = () => { const cur = Array.isArray(card.quick) ? [...card.quick] : [...DEFAULT_QUICK]; const k = cur.indexOf(d.key); k >= 0 ? cur.splice(k, 1) : cur.push(d.key); card.quick = QUICK_DEFS.map((x) => x.key).filter((x) => cur.includes(x)); render(); renderQuickList(); };
    box.appendChild(b);
  });
}
function renderShapePick() { document.querySelectorAll('#shapePick [data-shape]').forEach((b) => b.setAttribute('aria-checked', b.dataset.shape === (PROFILE_STYLES.includes(card.profileStyle) ? card.profileStyle : 'full'))); }
function renderSegs() {
  document.querySelectorAll('#motionSeg [data-motion]').forEach((b) => b.setAttribute('aria-checked', b.dataset.motion === (card.motion || 'cinematic')));
  document.querySelectorAll('#alignSeg [data-align]').forEach((b) => b.setAttribute('aria-checked', b.dataset.align === (card.nameAlign || 'auto')));
}
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
  const box = $('pairGrid'); box.innerHTML = '';
  PAIRS.forEach((p) => {
    const on = card.nameFont === p.name && card.theme.font === p.body;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pair-chip' + (on ? ' on' : '');
    b.innerHTML = `<b style="font-family:${p.name.replace(/"/g, '')}">Aa Name</b><small>${p.label}</small>`;
    b.onclick = () => { withTransition(() => { card.nameFont = p.name; card.theme.font = p.body; fillForm(); render(); }); };
    box.appendChild(b);
  });
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
function fillForm() {
  document.querySelectorAll('[data-f]').forEach((i) => (i.value = card[i.dataset.f] ?? ''));
  document.querySelectorAll('[data-t]').forEach((i) => (i.value = card.theme[i.dataset.t] ?? THEME_FALLBACK[i.dataset.t] ?? ''));
  syncPhotoControls();
  $('nameFont').value = card.nameFont || 'inherit'; $('nameLayout').value = card.nameLayout || 'natural'; $('titlePlace').value = card.titlePlacement === 'about' ? 'about' : 'hero';
  const computed = Math.round(parseFloat(getComputedStyle($('name')).fontSize)) || 48;
  $('nameSize').value = typeof card.nameSize === 'number' ? card.nameSize : clampN(computed, 20, 72);
  $('nameLine').value = typeof card.nameLine === 'number' ? card.nameLine : 1; $('nameLetter').value = typeof card.nameLetter === 'number' ? card.nameLetter : 0;
  [['nameX', 0], ['nameY', 0], ['titleSize', 16], ['roundness', 14], ['sectionSpace', 26]].forEach(([id, fb]) => { $(id).value = card[id] ?? fb; });
  updateStyleValues(); renderLayoutPicker(); renderSectionList(); renderQuickList(); renderShapePick(); renderSegs(); renderThemeGrid(); renderPairs(); renderContrast();
  $('matchPhoto').disabled = !card.avatar && !lastPhotoBlob;
  renderSocialEditor(); updateStrength(); hydrateIcons();
}

/* ===== Links ===== */
function renderSocialEditor() {
  const box = $('socialEditor'); box.innerHTML = '';
  card.socials.forEach((s, idx) => {
    const row = document.createElement('div'); row.className = 'social-row';
    row.innerHTML = `<input type="text" placeholder="Name" aria-label="Link name" value="${esc(s.label)}"><input type="text" inputmode="url" autocapitalize="off" placeholder="https://..." aria-label="Link address" value="${esc(s.url)}"><button type="button" aria-label="Remove link">${svg('close')}</button>`;
    const [l, u, x] = row.children;
    l.oninput = () => { s.label = l.value; render(); };
    u.oninput = () => { s.url = u.value; render(); };
    x.onclick = () => { card.socials.splice(idx, 1); renderSocialEditor(); render(); };
    box.appendChild(row);
  });
}
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
document.querySelectorAll('#shapePick [data-shape]').forEach((b) => b.onclick = () => { card.profileStyle = b.dataset.shape; withTransition(render); renderShapePick(); });
document.querySelectorAll('#motionSeg [data-motion]').forEach((b) => b.onclick = () => { card.motion = b.dataset.motion; render(); renderSegs(); if (card.motion !== 'off') replayIntro(); });
document.querySelectorAll('#alignSeg [data-align]').forEach((b) => b.onclick = () => { if (b.dataset.align === 'auto') delete card.nameAlign; else card.nameAlign = b.dataset.align; render(); renderSegs(); });
$('matchPhoto').onclick = paletteFromPhoto;
$('fixContrast').onclick = () => { fixContrast(); fillForm(); render(); toast('Colors adjusted for readability'); };
$('undoBtn').onclick = () => historyJump(-1);
$('redoBtn').onclick = () => historyJump(1);
$('resetDesign').addEventListener('click', () => {
  ['nameX', 'nameY', 'nameAlign', 'nameSize', 'nameFont', 'nameLayout', 'nameLine', 'nameLetter', 'titleSize', 'roundness', 'sectionSpace', 'titlePlacement', 'dragPositions'].forEach((k) => delete card[k]);
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
document.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => setTab(b.dataset.tab));
