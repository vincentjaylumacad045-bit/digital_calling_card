/* js/editor.js */
/* ---------- Editor (owner only) ---------- */
function syncPhotoControls() {
  $('zoom').value = card.photoZoom || 100;
  $('posx').value = card.photoX ?? 50;
  $('posy').value = card.photoY || 0;
  $('bright').value = card.photoBright ?? 100;
  $('contrast').value = card.photoContrast ?? 100;
  $('fade').value = card.photoFade ?? 25;
  $('zoomV').textContent = $('zoom').value + '%'; $('posxV').textContent = $('posx').value + '%'; $('posyV').textContent = $('posy').value + '%';
  $('brightV').textContent = $('bright').value + '%'; $('contrastV').textContent = $('contrast').value + '%'; $('fadeV').textContent = $('fade').value + '%';
}
function fillForm() {
  document.querySelectorAll('[data-f]').forEach((i) => (i.value = card[i.dataset.f] || ''));
  document.querySelectorAll('[data-t]').forEach((i) => (i.value = card.theme[i.dataset.t]));
  syncPhotoControls();
  $('layoutSelect').value = card.layout || 'centered';
  renderSocialEditor();
}
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function renderSocialEditor() {
  const box = $('socialEditor'); box.innerHTML = '';
  card.socials.forEach((s, idx) => {
    const row = document.createElement('div'); row.className = 'social-row';
    row.innerHTML = `<input type="text" placeholder="Name" value="${esc(s.label)}" style="max-width:34%"><input type="text" inputmode="url" autocapitalize="off" placeholder="https://..." value="${esc(s.url)}"><button class="ghost">✕</button>`;
    const [l, u, x] = row.children;
    l.oninput = () => { s.label = l.value; render(); };
    u.oninput = () => { s.url = u.value; render(); };
    x.onclick = () => { card.socials.splice(idx, 1); renderSocialEditor(); render(); };
    box.appendChild(row);
  });
}
document.querySelectorAll('[data-f]').forEach((i) => i.addEventListener('input', () => { card[i.dataset.f] = i.value; render(); }));
document.querySelectorAll('[data-t]').forEach((i) => i.addEventListener('input', () => { card.theme[i.dataset.t] = i.value; render(); }));
$('layoutSelect').addEventListener('change', () => { card.layout = $('layoutSelect').value; render(); });
document.querySelectorAll('[data-theme]').forEach((b) => b.onclick = () => { Object.assign(card.theme, THEMES[b.dataset.theme]); fillForm(); render(); });
$('addSocial').onclick = () => { card.socials.push({ label: '', url: '' }); renderSocialEditor(); };
$('clearImg').onclick = () => { card.avatar = ''; render(); toast('Photo removed — press Save to publish'); };
[['zoom','photoZoom'],['posx','photoX'],['posy','photoY'],['bright','photoBright'],['contrast','photoContrast'],['fade','photoFade']].forEach(([id, key]) => {
  $(id).oninput = (e) => { card[key] = +e.target.value; syncPhotoControls(); renderPhoto(); };
});
$('sharpImg').onclick = () => { card.photoZoom = sharpZoom(); card.photoX = 50; card.photoY = 0; syncPhotoControls(); renderPhoto(); };
$('fillImg').onclick = () => { const g = photoGeom(); if (!g) return; card.photoZoom = Math.min(400, Math.ceil(g.fill * 100)); card.photoX = 50; card.photoY = 0; syncPhotoControls(); renderPhoto(); };
$('resetImg').onclick = () => { card.photoZoom = 100; card.photoX = 50; card.photoY = 0; card.photoBright = 100; card.photoContrast = 100; card.photoFade = 25; syncPhotoControls(); renderPhoto(); };
(function () {
  const pv = $('pv'), ptrs = new Map(); let pinch = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const apply = () => { syncPhotoControls(); renderPhoto(); };
  pv.addEventListener('pointerdown', (e) => { pv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); pinch = 0; });
  pv.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const g = photoGeom(); if (!g) return;
    const r = pv.getBoundingClientRect();
    if (ptrs.size === 1) {
      const fx = (e.clientX - p.x) / r.width, fy = (e.clientY - p.y) / r.height;
      if (Math.abs(1 - g.wr) > .001) card.photoX = clamp((card.photoX ?? 50) + fx * 100 / (1 - g.wr), 0, 100);
      if (Math.abs(1 - g.hr) > .001) card.photoY = clamp((card.photoY || 0) + fy * 100 / (1 - g.hr), 0, 100);
    }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) card.photoZoom = clamp(Math.round((card.photoZoom || 100) * d / pinch), 30, 400);
      pinch = d;
    }
    apply();
  });
  ['pointerup', 'pointercancel'].forEach((t) => pv.addEventListener(t, (e) => { ptrs.delete(e.pointerId); pinch = 0; }));
  pv.addEventListener('wheel', (e) => { e.preventDefault(); card.photoZoom = clamp(Math.round((card.photoZoom || 100) - e.deltaY * .2), 30, 400); apply(); }, { passive: false });
})();
$('photoBox').addEventListener('animationend', (e) => e.currentTarget.classList.add('done'));

/* Tabs */
document.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => {
  document.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('active', x === b));
  document.querySelectorAll('[data-pane]').forEach((p) => p.classList.toggle('active', p.dataset.pane === b.dataset.tab));
  document.querySelector('.pbody').scrollTop = 0;
});
