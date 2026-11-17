/* js/photo.js */
/* ---------- Photo framing: exact, in %, so the image is always drawn at its real size (sharp) ---------- */
const heroPx = () => (Math.min(document.documentElement.clientWidth, 430) + 24) * Math.min(window.devicePixelRatio || 1, 2);
/* Largest size (max 100% = whole photo) at which this photo still looks sharp on this screen */
function sharpZoom() {
  const g = photoGeom(); if (!g) return 100;
  const base = Math.min(1, (g.iw / g.ih) / g.ba), z = (card.photoSrcW || g.iw) / (base * heroPx());
  return Math.max(30, Math.min(100, Math.floor(z * 100)));
}
function photoGeom() {
  const img = $('photoImg'), box = $('photoIn');
  const iw = img.naturalWidth, ih = img.naturalHeight, W = box.offsetWidth, H = box.offsetHeight;
  if (!iw || !ih || !W || !H) return null;
  const z = (card.photoZoom || 100) / 100, ia = iw / ih, ba = W / H;
  return { iw, ih, ba, fill: Math.max(ia / ba, ba / ia), wr: z * Math.min(1, ia / ba), hr: z * Math.min(1, ba / ia) };
}
function layoutPhoto() {
  if (!card) return;
  const g = photoGeom(); if (!g) return;
  const px = card.photoX ?? 50, py = card.photoY || 0;
  [$('photoImg'), $('pvImg')].forEach((im) => {
    im.style.width = g.wr * 100 + '%'; im.style.height = g.hr * 100 + '%';
    im.style.left = (1 - g.wr) * px + '%'; im.style.top = (1 - g.hr) * py + '%';
  });
  $('pv').style.aspectRatio = g.ba;
  const sw = card.photoSrcW || g.iw, sh = card.photoSrcH || g.ih;
  const ratio = sw / (g.wr * heroPx());
  const q = $('pvQ'); q.className = 'pv-hint ' + (ratio >= 1 ? 'good' : ratio >= .7 ? '' : 'warn');
  q.textContent = ratio >= 1 ? `✓ Sharp (${sw}×${sh}px)`
    : ratio >= .7 ? `Slightly soft at this zoom (${sw}×${sh}px) — zoom out a little`
    : `Low resolution (${sw}×${sh}px) — zoom out or upload a larger photo`;
}
function renderPhoto() {
  const img = $('photoImg'), pv = $('pvImg');
  const bright = (card.photoBright ?? 100) / 100, contrast = (card.photoContrast ?? 100) / 100;
  document.documentElement.style.setProperty('--fade', card.photoFade ?? 25);
  document.documentElement.style.setProperty('--filt', (bright === 1 && contrast === 1) ? 'none' : `brightness(${bright}) contrast(${contrast})`);
  if (card.avatar) { if (img.getAttribute('src') !== card.avatar) { img.src = card.avatar; pv.src = card.avatar; } }
  else { img.removeAttribute('src'); pv.removeAttribute('src'); }
  img.hidden = pv.hidden = !card.avatar; $('pvWrap').hidden = !card.avatar;
  layoutPhoto();
}
$('photoImg').addEventListener('load', () => { if (pendingAutoFit) { pendingAutoFit = false; card.photoZoom = sharpZoom(); syncPhotoControls(); } layoutPhoto(); });
new ResizeObserver(layoutPhoto).observe($('photoIn'));
