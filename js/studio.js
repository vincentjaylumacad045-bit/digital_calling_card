/* js/studio.js */
/* ---------- Design Studio tools: undo/redo, draft recovery, color helpers, readability, card strength, click-to-edit, preview ---------- */

/* ===== Undo / redo ===== */
const Hist = { stack: [], index: -1, timer: null, restoring: false, max: 60 };
const isEditing = () => document.body.classList.contains('editing');

function historyReset() {
  Hist.stack = [JSON.stringify(card)]; Hist.index = 0; clearTimeout(Hist.timer); updateHistoryUi();
}
function touchHistory() {
  if (!card || !isEditing() || Hist.restoring) return;
  clearTimeout(Hist.timer);
  Hist.timer = setTimeout(() => {
    const snap = JSON.stringify(card);
    if (snap === Hist.stack[Hist.index]) { updateStatus(); return; }
    Hist.stack = Hist.stack.slice(0, Hist.index + 1); Hist.stack.push(snap);
    if (Hist.stack.length > Hist.max) Hist.stack.shift();
    Hist.index = Hist.stack.length - 1;
    updateHistoryUi(); updateStatus(); saveDraft();
  }, 450);
  updateStatus();
}
function historyJump(delta) {
  clearTimeout(Hist.timer);
  // Flush any pending edit first so undo goes back one step, not zero
  const now = JSON.stringify(card);
  if (now !== Hist.stack[Hist.index]) { Hist.stack = Hist.stack.slice(0, Hist.index + 1); Hist.stack.push(now); Hist.index = Hist.stack.length - 1; }
  const next = Hist.index + delta; if (next < 0 || next >= Hist.stack.length) return updateHistoryUi();
  Hist.index = next; Hist.restoring = true;
  card = JSON.parse(Hist.stack[next]); card.socials = card.socials || []; card.theme = { ...THEME_FALLBACK, ...(card.theme || {}) };
  fillForm(); withTransition(render);
  Hist.restoring = false; updateHistoryUi(); updateStatus(); saveDraft();
}
function updateHistoryUi() {
  if (!$('undoBtn')) return;
  $('undoBtn').disabled = Hist.index <= 0 && JSON.stringify(card) === Hist.stack[0];
  $('redoBtn').disabled = Hist.index >= Hist.stack.length - 1;
}

/* ===== Save status + draft autosave ===== */
function updateStatus() {
  const el = $('saveState'); if (!el) return;
  const dirty = hasUnsavedChanges();
  el.dataset.state = dirty ? 'dirty' : 'saved'; el.textContent = dirty ? 'Unsaved changes' : 'Saved';
  updateStrength();
  updateHistoryUi();
}
const DRAFT_KEY = 'cardDraft';
function saveDraft() {
  try { if (hasUnsavedChanges()) localStorage.setItem(DRAFT_KEY, JSON.stringify({ t: Date.now(), card })); else localStorage.removeItem(DRAFT_KEY); } catch (e) { /* storage full or blocked: drafts are optional */ }
}
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }
function checkDraft() {
  let d = null; try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) {}
  const bar = $('draftBar'); if (!bar) return;
  if (!d || !d.card || JSON.stringify(d.card) === savedSnapshot) { bar.hidden = true; return; }
  const mins = Math.max(1, Math.round((Date.now() - d.t) / 60000));
  $('draftText').textContent = `You have unsaved changes from ${mins < 60 ? mins + ' min' : Math.round(mins / 60) + ' h'} ago. Restore them?`;
  bar.hidden = false;
  $('draftRestore').onclick = () => {
    card = d.card; card.socials = card.socials || []; card.theme = { ...THEME_FALLBACK, ...(card.theme || {}) };
    bar.hidden = true; fillForm(); render(); historyReset(); Hist.stack.unshift(savedSnapshot); Hist.index = 1; updateHistoryUi(); updateStatus(); toast('Draft restored');
  };
  $('draftDiscard').onclick = () => { clearDraft(); bar.hidden = true; };
}

/* ===== Color helpers ===== */
function hexToRgb(h) {
  h = String(h || '').replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16); return isNaN(n) || h.length !== 6 ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
function luminance(hex) { const c = hexToRgb(hex).map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
function contrastRatio(a, b) { const l1 = luminance(a), l2 = luminance(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); }
const bestInk = (bg) => (contrastRatio('#ffffff', bg) >= contrastRatio('#111111', bg) ? '#ffffff' : '#111111');
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) { const d = max - min; s = l > .5 ? d / (2 - max - min) : d / (max + min); h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  return [h, s, l];
}
function hslToHex(h, s, l) {
  const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  if (s === 0) return rgbToHex(l * 255, l * 255, l * 255);
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return rgbToHex(f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255);
}

/* ===== Readability report ===== */
const CONTRAST_PAIRS = [
  { label: 'Name on header', fg: 'text', bg: 'bg', min: 3 },
  { label: 'Body text', fg: 'sectionText', bg: 'surface', min: 4.5 },
  { label: 'Muted text', fg: 'muted', bg: 'surface', min: 4.5 },
  { label: 'Button text', fg: 'buttonText', bg: 'buttonBg', min: 4.5 },
  { label: 'Text on accent', fg: 'ink', bg: 'accent', min: 4.5 }
];
function renderContrast() {
  const box = $('contrastList'); if (!box) return;
  const t = { ...THEME_FALLBACK, ...(card.theme || {}) }; box.innerHTML = ''; let bad = 0;
  CONTRAST_PAIRS.forEach((p) => {
    const r = contrastRatio(t[p.fg], t[p.bg]), cls = r >= p.min ? 'ok' : r >= p.min * .75 ? 'low' : 'bad'; if (cls !== 'ok') bad++;
    const row = document.createElement('div'); row.className = 'ct-row ' + cls;
    row.innerHTML = `<span class="ct-sw" style="background:${t[p.bg]};color:${t[p.fg]}">Aa</span><span></span><b></b>`;
    row.children[1].textContent = p.label; row.children[2].textContent = r.toFixed(1) + ':1' + (cls === 'ok' ? ' ✓' : '');
    box.appendChild(row);
  });
  $('fixContrast').hidden = bad === 0;
}
function fixContrast() {
  const t = card.theme;
  t.text = bestInk(t.bg); t.sectionText = contrastRatio(t.sectionText, t.surface) >= 4.5 ? t.sectionText : bestInk(t.surface);
  t.buttonText = bestInk(t.buttonBg); t.ink = bestInk(t.accent);
  if (contrastRatio(t.muted, t.surface) < 4.5) {                       // nudge muted text toward black or white until it passes
    const target = hexToRgb(bestInk(t.surface)), m = hexToRgb(t.muted);
    for (let k = .05; k <= 1; k += .05) { const c = rgbToHex(m[0] + (target[0] - m[0]) * k, m[1] + (target[1] - m[1]) * k, m[2] + (target[2] - m[2]) * k); t.muted = c; if (contrastRatio(c, t.surface) >= 4.5) break; }
  }
}

/* ===== Match colors to the photo ===== */
async function loadPhotoBitmap() {
  if (lastPhotoBlob) { try { return await createImageBitmap(lastPhotoBlob); } catch (e) {} }
  return new Promise((resolve, reject) => {
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img); img.onerror = () => reject(new Error('blocked'));
    img.src = card.avatar + (card.avatar.includes('?') ? '&' : '?') + 'cc=1';
  });
}
async function paletteFromPhoto() {
  if (!card.avatar && !lastPhotoBlob) return toast('Add a photo first', true);
  let bmp; try { bmp = await loadPhotoBitmap(); } catch (e) { return toast('Could not read the photo colors. Upload the photo again in this session and retry.', true); }
  const c = document.createElement('canvas'); c.width = c.height = 56; const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0, 56, 56);
  let d; try { d = g.getImageData(0, 0, 56, 56).data; } catch (e) { return toast('The browser blocked reading this photo. Upload it again and retry.', true); }
  const bins = Array.from({ length: 12 }, () => ({ w: 0, h: 0, s: 0, l: 0 }));
  for (let i = 0; i < d.length; i += 4) {
    const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]); if (s < .25 || l < .15 || l > .9) continue;
    const w = s * (1 - Math.abs(l - .55)), b = bins[Math.min(11, Math.floor(h * 12))]; b.w += w; b.h += h * w; b.s += s * w; b.l += l * w;
  }
  const best = bins.reduce((a, b) => (b.w > a.w ? b : a), bins[0]);
  if (best.w < 1) return toast('This photo has no strong color to pick from', true);
  const h = best.h / best.w, s = Math.min(.95, Math.max(.55, best.s / best.w));
  const accent = hslToHex(h, s, .6), bg = hslToHex(h, Math.min(.55, s), .11), surface = hslToHex(h, .3, .985), dark = hslToHex(h, .35, .12);
  Object.assign(card.theme, { bg, accent, ink: bestInk(accent), text: '#ffffff', surface, sectionText: dark, muted: hslToHex(h, .12, .38), buttonBg: bg, buttonText: '#ffffff', border: hslToHex(h, .2, .9) });
  withTransition(() => { fillForm(); render(); });
  toast('Colors matched to your photo');
}

/* ===== Card strength ===== */
function strengthItems() {
  const wa = digits(card.whatsapp), socials = (card.socials || []).filter((s) => s.url).length;
  return [
    { ok: !!(card.name || '').trim(), tip: 'Add your name', tab: 'profile', field: 'f_name' },
    { ok: !!(card.title || '').trim(), tip: 'Add a title', tab: 'profile', field: 'f_title' },
    { ok: !!card.avatar, tip: 'Add a photo', tab: 'photo' },
    { ok: (card.about || '').trim().length >= 40, tip: 'Write an About', tab: 'profile', field: 'f_about' },
    { ok: !!(card.phone || '').trim(), tip: 'Add a phone number', tab: 'contact', field: 'f_phone' },
    { ok: wa.length > 5, tip: 'Add WhatsApp', tab: 'contact', field: 'f_wa' },
    { ok: !!(card.email || '').trim(), tip: 'Add an email', tab: 'contact', field: 'f_email' },
    { ok: socials >= 2, tip: 'Add two links', tab: 'links' },
    { ok: (card.achievements || '').trim().length > 0, tip: 'Add highlights', tab: 'profile', field: 'f_ach' }
  ];
}
function updateStrength() {
  const box = $('strength'); if (!box) return;
  const items = strengthItems(), done = items.filter((i) => i.ok).length, pct = Math.round(done / items.length * 100);
  $('strengthPct').textContent = pct + '%'; $('strengthFill').style.width = pct + '%';
  const tips = $('strengthTips'); tips.innerHTML = '';
  items.filter((i) => !i.ok).slice(0, 3).forEach((i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = '+ ' + i.tip; b.onclick = () => jumpTo(i.tab, i.field); tips.appendChild(b); });
  box.hidden = pct === 100;
}

/* ===== Click an element on the card to edit it ===== */
function setTab(name) {
  document.querySelectorAll('[data-tab]').forEach((x) => { x.classList.toggle('active', x.dataset.tab === name); x.setAttribute('aria-selected', x.dataset.tab === name); });
  document.querySelectorAll('[data-pane]').forEach((p) => p.classList.toggle('active', p.dataset.pane === name));
  $('pbody').scrollTop = 0; $('pbody').dataset.tab = name;
}
function jumpTo(tab, fieldId) {
  setTab(tab);
  if (fieldId && $(fieldId)) setTimeout(() => { const f = $(fieldId); f.scrollIntoView({ block: 'center', behavior: 'smooth' }); f.focus({ preventScroll: true }); f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash'); }, 80);
}
const EDIT_TARGETS = { name: ['profile', 'f_name'], title: ['profile', 'f_title'], photo: ['photo'], about: ['profile', 'f_about'], highlights: ['profile', 'f_ach'], contact: ['contact', 'f_phone'], links: ['links'] };
$('app').addEventListener('click', (e) => {
  if (!isEditing() || document.body.classList.contains('previewing')) return;
  const hit = e.target.closest('[data-edit]'); if (e.target.closest('a,button')) e.preventDefault();   // links never navigate while editing
  if (!hit) return;
  e.preventDefault(); const t = EDIT_TARGETS[hit.dataset.edit]; if (t) { if (!$('panel').classList.contains('open')) $('panel').classList.add('open'); jumpTo(t[0], t[1]); }
}, true);

/* ===== Visitor preview ===== */
function setPreview(on) {
  if (on === document.body.classList.contains('previewing')) return;
  holdScroll(() => document.body.classList.toggle('previewing', on));
  if (on) document.querySelectorAll('.section').forEach((el) => el.classList.add('in'));
  const reflow = () => { if (typeof layoutPhoto === 'function') layoutPhoto(); }; setTimeout(reflow, 60); setTimeout(reflow, 400);
}
$('previewBtn').onclick = () => setPreview(true);
$('previewBack').onclick = () => setPreview(false);

/* ===== Keyboard shortcuts ===== */
addEventListener('keydown', (e) => {
  if (!isEditing() || document.body.classList.contains('previewing')) return;
  const mod = e.ctrlKey || e.metaKey, tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea';
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveCard(true); }
  else if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); historyJump(e.shiftKey ? 1 : -1); }
  else if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); historyJump(1); }
});
