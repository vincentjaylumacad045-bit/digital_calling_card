/* Editor save, dirty-state protection and locking */
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
    markSaved(); if (showToast) toast('Saved! Your live card is updated ✓'); return true;
  } catch (e) { if (showToast) toast('No connection. Try again.', true); return false; }
}
$('saveBtn').onclick = () => saveCard(true);
function openPanel() {
  fillForm(); markSaved();
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  $('panel').classList.add('open'); document.body.classList.add('editing'); scrollTo(0, 0);
}
function closePanel() {
  if (hasUnsavedChanges()) {
    const choice = confirm('You have unsaved changes. Save before exiting the editor?');
    if (!choice) return;
    saveCard(true).then((ok) => { if (ok) finishClose(); }); return;
  }
  finishClose();
}
function finishClose() { $('panel').classList.remove('open', 'full'); document.body.classList.remove('editing', 'sheet-full'); }
function toggleFull() { const full = $('panel').classList.toggle('full'); document.body.classList.toggle('sheet-full', full); }
$('closePanel').onclick = closePanel;
$('expand').onclick = toggleFull;
$('handle').onclick = toggleFull;
async function lockEditor() {
  if (hasUnsavedChanges()) {
    if (!confirm('Save your changes and lock the editor?')) return;
    const ok = await saveCard(true); if (!ok) return;
  }
  localStorage.removeItem('owner'); sessionStorage.removeItem('adminpw'); password = '';
  finishClose(); applyOwner(); toast('Changes saved. Editor locked.');
}
$('lockBtn').onclick = lockEditor;
// Lock action is available from the editor header/footer even when another tab is selected.
if ($('lockBtnTop')) $('lockBtnTop').onclick = lockEditor;
addEventListener('beforeunload', (e) => { if ($('panel')?.classList.contains('open') && hasUnsavedChanges()) { e.preventDefault(); e.returnValue = ''; } });
function askLogin() { $('login').classList.add('show'); setTimeout(() => $('pw').focus(), 300); }
$('editBtn').onclick = () => (password ? openPanel() : askLogin());
$('loginCancel').onclick = () => $('login').classList.remove('show');
$('adminLoginForm').addEventListener('submit', (e) => { e.preventDefault(); $('loginOk').click(); });
if ($('togglePw')) $('togglePw').onclick = () => { const field = $('pw'); const show = field.type === 'password'; field.type = show ? 'text' : 'password'; $('togglePw').textContent = show ? 'Hide' : 'Show'; $('togglePw').setAttribute('aria-label', show ? 'Hide password' : 'Show password'); };
$('pw').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('loginOk').click(); });
$('loginOk').onclick = async () => {
  const pw = $('pw').value;
  try {
    const r = await fetch('/api/card?verify=1', { method: 'POST', headers: { 'x-admin-password': pw, 'content-type': 'application/json' }, body: '{}' });
    if (!r.ok) return toast('Wrong password', true);
  } catch (e) { return toast('No connection. Try again.', true); }
  password = pw; sessionStorage.setItem('adminpw', pw); localStorage.setItem('owner', '1'); applyOwner();
  $('login').classList.remove('show'); $('pw').value = ''; openPanel();
};
