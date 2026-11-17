/* js/upload.js */
/* Photo upload: works with gallery and camera, any phone */
async function loadBitmap(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch (e) {
    return new Promise((resolve, reject) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This image type is not supported. Try a JPG or PNG.')); };
      img.src = url;
    });
  }
}
/* High-quality resize: step down by halves + high-quality smoothing, so photos are never soft */
function sharpen(g, w, h, a) {
  try {
    const im = g.getImageData(0, 0, w, h), d = im.data, o = new Uint8ClampedArray(d), c = 1 + 4 * a;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let k = 0; k < 3; k++) {
        const v = o[i + k] * c - a * (o[i - 4 + k] + o[i + 4 + k] + o[i - w * 4 + k] + o[i + w * 4 + k]);
        d[i + k] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
    g.putImageData(im, 0, 0);
  } catch (e) { /* canvas too large for this device: skip sharpening */ }
}
async function shrink(file, max, quality) {
  const img = await loadBitmap(file);
  const w = img.width || img.naturalWidth, h = img.height || img.naturalHeight, long = Math.max(w, h);
  const MIN = 1600;                                       // small photos are enlarged smoothly to this size
  const k = long > max ? max / long : long < MIN ? Math.min(MIN / long, 4) : 1;
  const tw = Math.max(1, Math.round(w * k)), th = Math.max(1, Math.round(h * k));
  const mk = (cw, ch) => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; return [c, x]; };
  let src = img, cw = w, ch = h;
  if (k < 1) while (cw / 2 >= tw && ch / 2 >= th) { const [c, x] = mk(Math.round(cw / 2), Math.round(ch / 2)); x.drawImage(src, 0, 0, c.width, c.height); src = c; cw = c.width; ch = c.height; }
  if (k > 1) while (cw * 1.5 < tw) { const [c, x] = mk(Math.round(cw * 1.5), Math.round(ch * 1.5)); x.drawImage(src, 0, 0, c.width, c.height); src = c; cw = c.width; ch = c.height; }
  const [c, g] = mk(tw, th);
  g.fillStyle = '#fff'; g.fillRect(0, 0, tw, th);          // PNGs with transparency: no black background
  g.drawImage(src, 0, 0, tw, th);
  sharpen(g, tw, th, k > 1 ? 0.6 : 0.35);                  // enlarged photos get a stronger sharpen
  return new Promise((res, rej) => c.toBlob((bl) => { if (!bl) return rej(new Error('Could not read the image')); bl.srcW = w; bl.srcH = h; res(bl); }, 'image/jpeg', quality));
}
let pendingAutoFit = false;
async function handleFile(file) {
  if (!file) return;
  try {
    toast('Uploading photo…');
    let blob = await shrink(file, 2560, 0.95);
    if (blob.size > 3.8 * 1024 * 1024) blob = await shrink(file, 2000, 0.88);   // stay under host upload limit
    if (Math.max(blob.srcW, blob.srcH) < 700 && !confirm(`This photo is small (${blob.srcW}×${blob.srcH}px), so it will look blurry.\n\nFor a sharp card, pick the original, bigger photo.\n\nUse this one anyway?`)) { toast('Cancelled — pick a bigger photo', true); return; }
    const r = await fetch('/api/upload', { method: 'POST', headers: { 'x-admin-password': password, 'content-type': 'image/jpeg' }, body: blob });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Upload failed');
    card.avatar = j.url; card.photoSrcW = blob.srcW; card.photoSrcH = blob.srcH;
    card.photoZoom = 100; card.photoX = 50; card.photoY = 0; pendingAutoFit = true;
    syncPhotoControls(); render();
    toast('Photo ready ✓ Adjust it, then press Save');
  } catch (e) { toast(e.message || 'Upload failed', true); }
}
$('pickBtn').onclick = () => $('avatarFile').click();
$('camBtn').onclick = () => $('camFile').click();
$('avatarFile').onchange = (e) => { handleFile(e.target.files[0]); e.target.value = ''; };
$('camFile').onchange = (e) => { handleFile(e.target.files[0]); e.target.value = ''; };
