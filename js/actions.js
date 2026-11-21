/* js/actions.js */
/* ---------- Save, open/close, lock, sign-in ---------- */
let savedSnapshot = '';
function currentSnapshot() { return JSON.stringify(card); }
function markSaved() { savedSnapshot = currentSnapshot(); }
function hasUnsavedChanges() { return !!savedSnapshot && currentSnapshot() !== savedSnapshot; }
async function saveCard(showToast = true) {
  if (showToast) toast('Saving…');
  try {
    const r = await fetch('/api/card', { method: 'POST', headers: { 'x-admin-password': password, 'content-type': 'application/json' }, body: JSON.stringify(card) });
    const j = await r.json();
    if (!r.ok) { toast('Error: ' + (j.error || 'could not save'), true); return false; }
    markSaved(); clearDraft(); updateStatus(); if (showToast) toast('Saved. Your live card is updated.'); return true;
  } catch (e) { if (showToast) toast('No connection. Try again.', true); return false; }
}
$('saveBtn').onclick = () => saveCard(true);
/* Keep the card where the visitor was looking when the editor opens or closes (phones zoom the card out while editing) */
function holdScroll(change) {
  const probe = document.elementFromPoint(innerWidth / 2, 110), anchor = probe && probe.closest('.section,.quick,.hero,.foot');
  const before = anchor ? anchor.getBoundingClientRect().top : 0, ratio = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  change(); void document.body.offsetHeight;
  const html = document.documentElement, prev = html.style.scrollBehavior; html.style.scrollBehavior = 'auto';
  if (anchor) scrollBy(0, anchor.getBoundingClientRect().top - before);
  else scrollTo(0, ratio * Math.max(0, html.scrollHeight - innerHeight));
  html.style.scrollBehavior = prev;
}
function openPanel() {
  card.theme = { ...THEME_FALLBACK, ...(card.theme || {}) };
  markSaved(); fillForm();
  document.querySelectorAll('.section').forEach((el) => el.classList.add('in'));
  document.documentElement.classList.add('editing-mode');
  holdScroll(() => { document.body.classList.add('editing'); document.body.classList.remove('scrolled'); $('panel').classList.add('open'); });
  historyReset(); updateStatus(); checkDraft();
  setTimeout(() => { if (typeof layoutPhoto === 'function') layoutPhoto(); }, 80);
}
function closePanel() {
  if (hasUnsavedChanges()) {
    if (!confirm('You have unsaved changes. Save before exiting the editor?')) return;
    saveCard(true).then((ok) => { if (ok) finishClose(); }); return;
  }
  finishClose();
}
function finishClose() { if (typeof setArrange === 'function') document.body.classList.remove('arrange'); document.documentElement.classList.remove('editing-mode'); setPreview(false); holdScroll(() => { $('panel').classList.remove('open', 'full'); document.body.classList.remove('editing', 'sheet-full', 'sheet-min'); }); }
function setSheet(mode) { document.body.classList.toggle('sheet-full', mode === 'full'); document.body.classList.toggle('sheet-min', mode === 'min'); $('panel').classList.toggle('full', mode === 'full'); }
const sheetMode = () => (document.body.classList.contains('sheet-full') ? 'full' : document.body.classList.contains('sheet-min') ? 'min' : 'mid');
function toggleFull() { setSheet(sheetMode() === 'full' ? 'mid' : 'full'); }
function cycleSheet() { setSheet({ mid: 'full', full: 'min', min: 'mid' }[sheetMode()]); }
$('closePanel').onclick = closePanel;
$('expand').onclick = toggleFull;
$('handle').onclick = cycleSheet;
async function lockEditor() {
  if (hasUnsavedChanges()) {
    if (!confirm('Save your changes and lock the editor?')) return;
    const ok = await saveCard(true); if (!ok) return;
  }
  try { localStorage.removeItem('owner'); sessionStorage.removeItem('adminpw'); } catch (e) {} password = '';
  finishClose(); applyOwner(); toast('Changes saved. Editor locked.');
}
$('lockBtn').onclick = lockEditor;
$('lockBtnTop').onclick = lockEditor;
addEventListener('beforeunload', (e) => { if ($('panel').classList.contains('open') && hasUnsavedChanges()) { e.preventDefault(); e.returnValue = ''; } });
function askLogin() { $('login').classList.add('show'); setTimeout(() => $('pw').focus(), 300); }
$('editBtn').onclick = () => (password ? openPanel() : askLogin());
$('loginCancel').onclick = () => $('login').classList.remove('show');
$('togglePw').onclick = () => { const f = $('pw'), show = f.type === 'password'; f.type = show ? 'text' : 'password'; $('togglePw').textContent = show ? 'Hide' : 'Show'; $('togglePw').setAttribute('aria-label', show ? 'Hide password' : 'Show password'); };
$('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = $('pw').value;
  try {
    const r = await fetch('/api/card?verify=1', { method: 'POST', headers: { 'x-admin-password': pw, 'content-type': 'application/json' }, body: '{}' });
    if (!r.ok) return toast('Wrong password', true);
  } catch (err) { return toast('No connection. Try again.', true); }
  password = pw; try { sessionStorage.setItem('adminpw', pw); localStorage.setItem('owner', '1'); } catch (e) {} applyOwner();
  $('login').classList.remove('show'); $('pw').value = ''; openPanel();
});
