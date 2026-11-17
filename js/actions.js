/* js/actions.js */
$('saveBtn').onclick = async () => {
  toast('Saving…');
  try {
    const r = await fetch('/api/card', { method: 'POST', headers: { 'x-admin-password': password, 'content-type': 'application/json' }, body: JSON.stringify(card) });
    const j = await r.json();
    if (r.ok) toast('Saved! Your live card is updated ✓'); else toast('Error: ' + (j.error || 'could not save'), true);
  } catch (e) { toast('No connection. Try again.', true); }
};

/* Open / close the editor sheet */
function openPanel() {
  fillForm();
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  $('panel').classList.add('open'); document.body.classList.add('editing'); scrollTo(0, 0);
}
function closePanel() {
  $('panel').classList.remove('open', 'full'); document.body.classList.remove('editing', 'sheet-full');
}
function toggleFull() {
  const full = $('panel').classList.toggle('full'); document.body.classList.toggle('sheet-full', full);
}
$('closePanel').onclick = closePanel;
$('expand').onclick = toggleFull;
$('handle').onclick = toggleFull;
$('lockBtn').onclick = () => {
  localStorage.removeItem('owner'); sessionStorage.removeItem('adminpw'); password = '';
  closePanel(); applyOwner(); toast('Editor locked on this device');
};

function askLogin() { $('login').classList.add('show'); setTimeout(() => $('pw').focus(), 300); }
$('editBtn').onclick = () => (password ? openPanel() : askLogin());
$('loginCancel').onclick = () => $('login').classList.remove('show');
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
