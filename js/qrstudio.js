/* js/qrstudio.js — the editor's QR tab. Only the owner can reach it (it lives inside the Design Studio),
   and the design is saved inside the card as card.qr, so visitors always see the finished code. */

/* The look from the reference image: a dot grid, thick rounded corner frames and a big round logo badge */
const QR_REFERENCE = { shape: 'pixel', eye: 'ring', color: 'black', logoShape: 'circle', logoSize: 34, logoBack: 'white' };

function qrSet(patch) {
  card.qr = Object.assign({}, card.qr || {}, patch);
  renderQrEditor(); if (typeof touchHistory === 'function') touchHistory();
  if ($('qrModal').classList.contains('show')) qrRender();
}

/* Share of the code the logo covers: the code can lose roughly 15% and still scan, so we warn well before that */
function qrCoverage(q) { const f = q.logoSize / 100; return Math.round((q.logoShape === 'circle' ? Math.PI / 4 : 1) * f * f * 100); }

function renderQrEditor() {
  if (!$('qrPvCode')) return;
  const q = qrCfg(), raw = card.qr || {};
  document.querySelectorAll('#panel [data-qrkey]').forEach((box) => {
    const key = box.dataset.qrkey;
    box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', b.dataset.v === q[key]));
  });
  $('qrCustomRow').hidden = q.color !== 'custom';
  $('qrCustom').value = qrHex(raw.custom) ? raw.custom : QR_COLORS.ink;
  const max = q.logoShape === 'circle' ? 40 : 30; $('qrSize').max = max; $('qrSize').value = q.logoSize; $('qrSizeV').textContent = q.logoSize + '%';
  const cov = qrCoverage(q), big = cov >= 10;
  $('qrSafe').textContent = q.logo === 'none' ? 'No logo: the code is at its most scannable.' : big ? `This logo hides about ${cov}% of the code. That is large, so test it with a phone camera before printing.` : `This logo hides about ${cov}% of the code, which scans reliably.`;
  const lightCustom = q.color === 'custom' && !(qrHex(raw.custom) && qrLum(raw.custom) < .25);
  if (lightCustom) $('qrSafe').textContent = 'That custom color is too light to scan reliably, so ink is being used instead. Pick a darker color. ' + $('qrSafe').textContent;
  $('qrSafe').classList.toggle('warn', lightCustom || (big && q.logo !== 'none'));
  $('qrLogoRow').hidden = q.logo !== 'logo' && !raw.logoUrl;
  $('qrThumb').style.backgroundImage = raw.logoUrl ? `url("${String(raw.logoUrl).replace(/"/g, '%22')}")` : '';
  $('qrLogoClear').disabled = !raw.logoUrl;
  $('qrLogoPick').lastChild.textContent = raw.logoUrl ? 'Replace logo' : 'Upload logo';
  ['logoShape', 'logoBack', 'logoSize'].forEach((k) => { const box = document.querySelector(`[data-qrkey="${k}"]`); if (box) box.style.opacity = q.logo === 'none' ? .45 : 1; });
  $('qrSize').disabled = q.logo === 'none';
  const b = qrBuild('link'); qrPaint($('qrPvCode'), $('qrPvLogo'), b);
  $('qrPvInfo').textContent = 'Live preview · this is what visitors see';
}

/* Choice buttons: one handler for every row */
document.querySelectorAll('#panel [data-qrkey]').forEach((box) => {
  box.onclick = (e) => {
    const t = e.target.closest('button[data-v]'); if (!t) return;
    const key = box.dataset.qrkey, patch = { [key]: t.dataset.v };
    if (key === 'logo' && t.dataset.v === 'logo' && !(card.qr && card.qr.logoUrl)) { setTimeout(() => $('qrLogoFile').click(), 0); }   // choosing "Logo" with none uploaded opens the picker
    if (key === 'color' && t.dataset.v === 'custom' && !qrHex(card.qr && card.qr.custom)) patch.custom = QR_COLORS.ink;
    qrSet(patch);
  };
});
$('qrCustom').oninput = () => { card.qr = Object.assign({}, card.qr || {}, { custom: $('qrCustom').value }); renderQrEditor(); if (typeof touchHistory === 'function') touchHistory(); };
$('qrSize').oninput = () => qrSet({ logoSize: Number($('qrSize').value) });
$('qrPreset').onclick = () => {
  const has = !!(card.qr && card.qr.logoUrl);
  qrSet(Object.assign({}, QR_REFERENCE, { logo: has ? 'logo' : (card.avatar ? 'photo' : 'initials') }));
  toast(has ? 'Reference style applied' : 'Reference style applied. Upload your logo to put it in the middle.');
};
$('qrReset').onclick = () => { if (!card.qr) return; delete card.qr; renderQrEditor(); if (typeof touchHistory === 'function') touchHistory(); toast('QR design reset. Press Save to publish.'); };

/* Logo upload: PNG stays PNG so a transparent background is kept */
async function qrLogoUpload(file) {
  if (!file) return;
  try {
    toast('Uploading logo…');
    const img = await loadBitmap(file), w = img.width || img.naturalWidth, h = img.height || img.naturalHeight, k = Math.min(1, 800 / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise((ok, no) => c.toBlob((x) => (x ? ok(x) : no(new Error('Could not read the image'))), 'image/png'));
    if (blob.size > 4 * 1024 * 1024) throw new Error('Logo is too large. Try a smaller image.');
    const r = await fetch('/api/upload', { method: 'POST', headers: { 'x-admin-password': password, 'content-type': 'image/png' }, body: blob });
    const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Upload failed');
    qrSet({ logoUrl: j.url, logo: 'logo' }); toast('Logo ready ✓ Press Save to publish');
  } catch (e) { toast(e.message || 'Upload failed', true); }
}
$('qrLogoPick').onclick = () => $('qrLogoFile').click();
$('qrLogoFile').onchange = (e) => { qrLogoUpload(e.target.files[0]); e.target.value = ''; };
$('qrLogoClear').onclick = () => { const next = { logoUrl: '' }; if (card.qr && card.qr.logo === 'logo') next.logo = card.avatar ? 'photo' : 'initials'; qrSet(next); };

/* Test scan: uses the phone's or browser's own barcode reader when it has one; otherwise asks for a real camera test */
$('qrTest').onclick = async () => {
  if (!('BarcodeDetector' in window)) { toast('This browser cannot test scans. Point your phone camera at the preview.', true); return; }
  try {
    const blob = await qrImageBlob(), bmp = await createImageBitmap(blob), found = await new BarcodeDetector({ formats: ['qr_code'] }).detect(bmp);
    const want = cardUrl();
    if (found.length && found[0].rawValue === want) toast('Scan test passed ✓');
    else if (found.length) toast('The code scanned, but it did not match your card link', true);
    else toast('Could not read the code. Make the logo smaller or the color darker.', true);
  } catch (e) { toast('Scan test could not run on this device', true); }
};
