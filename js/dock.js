/* js/dock.js */
/* ---------- Dock actions: save contact, share, QR ---------- */
const vEsc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
/* Lines over 75 bytes are folded (continued on the next line after a space), so long notes import cleanly */
function vFold(line) {
  const enc = new TextEncoder(); if (enc.encode(line).length <= 75) return line;
  const out = []; let cur = '', n = 0;
  for (const ch of line) { const w = enc.encode(ch).length, max = out.length ? 74 : 75; if (n + w > max) { out.push(cur); cur = ''; n = 0; } cur += ch; n += w; }
  out.push(cur); return out.map((l, i) => (i ? ' ' : '') + l).join('\r\n');
}
function buildVcf() {
  const parts = (card.name || '').trim().split(/\s+/), last = parts.length > 1 ? parts.pop() : '', first = parts.join(' ');
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + vEsc(card.name || 'Contact'), 'N:' + vEsc(last) + ';' + vEsc(first) + ';;;'];
  if (card.title) lines.push('TITLE:' + vEsc(card.title));
  if (card.phone) lines.push('TEL;TYPE=CELL,VOICE:' + card.phone);
  if (digits(card.whatsapp) && card.whatsapp !== card.phone) lines.push('TEL;TYPE=WORK:' + card.whatsapp);
  if (card.email) lines.push('EMAIL;TYPE=INTERNET:' + card.email);
  if (card.website) lines.push('URL:' + (/^https?:\/\//.test(card.website) ? card.website : 'https://' + card.website));
  if (card.location) lines.push('ADR;TYPE=WORK:;;' + vEsc(card.location) + ';;;;');
  (card.socials || []).filter((s) => s.url).forEach((s) => lines.push('X-SOCIALPROFILE;TYPE=' + (s.label || 'link').replace(/[^\w-]/g, '') + ':' + s.url));
  if (card.about) lines.push('NOTE:' + vEsc(card.about));
  lines.push('END:VCARD');
  return lines.map(vFold).join('\r\n');
}
/* Small square copy of the profile photo, embedded in the contact file so it shows up in the phone's address book */
async function vcardPhoto() {
  if (!card.avatar) return '';
  try {
    const blob = await (await fetch(card.avatar, { mode: 'cors' })).blob(), bmp = await createImageBitmap(blob);
    const size = 320, c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
    const side = Math.min(bmp.width, bmp.height * 1.0), sx = (bmp.width - side) / 2, sy = Math.max(0, (bmp.height - side) * .12);
    g.drawImage(bmp, sx, sy, side, side, 0, 0, size, size);
    const b64 = c.toDataURL('image/jpeg', .85).split(',')[1], head = 'PHOTO;ENCODING=b;TYPE=JPEG:';
    const full = head + b64, out = []; for (let i = 0; i < full.length; i += 74) out.push((i ? ' ' : '') + full.slice(i, i + 74));   // vCard line folding
    return out.join('\r\n');
  } catch (e) { return ''; }       // photo is optional: if the browser blocks reading it, the contact is still saved
}
$('addContact').onclick = async () => {
  let vcf = buildVcf(); const photo = await vcardPhoto();
  if (photo) vcf = vcf.replace('END:VCARD', photo + '\r\nEND:VCARD');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([vcf], { type: 'text/vcard;charset=utf-8' }));
  a.download = (card.name || 'contact').replace(/\s+/g, '_') + '.vcf';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Contact file downloaded');
};
const cardUrl = () => location.origin + location.pathname.replace(/index\.html$/, '');
$('shareBtn').onclick = async () => {
  const data = { title: card.name, text: card.title, url: cardUrl() };
  if (navigator.share) { try { await navigator.share(data); } catch (e) {} }
  else { try { await navigator.clipboard.writeText(data.url); toast('Link copied'); } catch (e) { toast('Copy failed', true); } }
};

/* ---------- QR studio: made on this device, so it works offline and never sends your link to a third party ----------
   The design (dot style, corners, color, logo) is part of the saved card (card.qr) and can only be changed in the editor's QR tab.
   Visitors see the finished code and can copy, share or save it, but have no style controls. */
const QR_COLORS = { ink: '#111827', black: '#000000' };
const QR_DEFAULTS = { shape: 'soft', eye: 'auto', color: 'theme', custom: '#111827', logo: 'photo', logoShape: 'rounded', logoSize: 21, logoBack: 'white', logoUrl: '' };
const QR_EYES = { auto: null, rounded: [1.2, .6], ring: [2.2, 1.3], round: [3.4, 1.6], square: [0, 0] };
const QR_ENUMS = { shape: ['soft', 'dots', 'pixel', 'classic'], eye: Object.keys(QR_EYES), color: ['theme', 'ink', 'black', 'custom'], logo: ['photo', 'logo', 'initials', 'none'], logoShape: ['rounded', 'circle'], logoBack: ['white', 'none'] };
let qrMode = 'link';

function qrHex(c) {
  let h = String(c || '').trim().replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null; const n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255];
}
function qrLum(c) { const rgb = qrHex(c); if (!rgb) return 1; const f = rgb.map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * f[0] + .7152 * f[1] + .0722 * f[2]; }
function qrMix(a, b, t) { const x = qrHex(a) || [11, 20, 55], y = qrHex(b) || x; return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

/* The saved design, with every value checked so a bad or old card can never break the code */
function qrCfg() {
  const q = Object.assign({}, QR_DEFAULTS, (card && card.qr) || {});
  Object.keys(QR_ENUMS).forEach((k) => { if (!QR_ENUMS[k].includes(q[k])) q[k] = QR_DEFAULTS[k]; });
  q.logoSize = Math.max(12, Math.min(q.logoShape === 'circle' ? 40 : 30, Number(q.logoSize) || QR_DEFAULTS.logoSize));
  q.logoUrl = /^https?:\/\/[^\s"'()<>\\]{4,500}$/i.test(String(q.logoUrl || '')) ? q.logoUrl : '';   /* plain web addresses only: nothing that could break out of the CSS url() */
  if (q.logo === 'logo' && !q.logoUrl) q.logo = card && card.avatar ? 'photo' : 'initials';
  return q;
}
/* "Card color" uses the first of your theme colors that is dark enough to scan reliably on a white tile; a custom color must be dark too */
function qrDefaultDark() { const t = (card && card.theme) || {}; return [t.bg, t.ink, t.buttonBg, t.sectionText].find((c) => qrHex(c) && qrLum(c) < .2) || QR_COLORS.ink; }
function qrFg(q) {
  q = q || qrCfg();
  if (q.color === 'custom') return qrHex(q.custom) && qrLum(q.custom) < .25 ? q.custom : QR_COLORS.ink;
  return q.color === 'theme' ? qrDefaultDark() : QR_COLORS[q.color];
}
/* Contact mode: the QR holds a small contact file, so the phone offers "Add contact" with no website visit. Kept short so the code stays easy to scan. */
function qrContactText() {
  const parts = (card.name || '').trim().split(/\s+/), last = parts.length > 1 ? parts.pop() : '', first = parts.join(' ');
  const clean = (s) => String(s || '').replace(/[\r\n]+/g, ' ').replace(/([\\;,])/g, '\\$1').trim();
  const url = card.website ? (/^https?:\/\//i.test(card.website) ? card.website : 'https://' + card.website) : '';
  const fields = [['FN:', clean(card.name)], ['N:', clean(last) + ';' + clean(first) + ';;;'], ['TITLE:', clean(card.title)], ['TEL:', (card.phone || '').trim()], ['EMAIL:', (card.email || '').trim()], ['URL:', url]];
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'], enc = new TextEncoder();
  fields.forEach(([k, v], i) => { if (!v || v === ';;;' && !last && !first) return; const next = lines.concat(k + v, 'END:VCARD').join('\n'); if (i < 2 || enc.encode(next).length <= 300) lines.push(k + v); });
  lines.push('END:VCARD'); return lines.join('\n');
}
function qrBuild(mode) {
  const q = qrCfg(), contact = (mode || qrMode) === 'contact', text = contact ? qrContactText() : cardUrl();
  const level = contact ? 'M' : 'H', logo = q.logo === 'none' ? 0 : (contact ? Math.min(q.logoSize, 13) : q.logoSize) / 100, qr = QR.encode(text, level);
  return { qr, logo, fg: qrFg(q), text, contact, q };
}
const qrSvgOpts = (b) => ({ style: b.q.shape, fg: b.fg, eye: b.fg, eyeR: QR_EYES[b.q.eye] || undefined, margin: 2, logo: b.logo, logoShape: b.q.logoShape === 'circle' ? 'circle' : 'square', bg: null });
const qrLogoSrc = (q) => (q.logo === 'logo' ? q.logoUrl : q.logo === 'photo' ? card.avatar : '');
function qrLogoFill(el, q) {
  const src = q ? qrLogoSrc(q) : card.avatar;
  el.style.backgroundImage = src ? `url("${String(src).replace(/"/g, '%22')}")` : ''; el.textContent = src ? '' : initialsOf(card.name);
}
/* Draws the code and its logo into any pair of elements: the share sheet and the editor's live preview both use this */
function qrPaint(codeEl, logoEl, b) {
  codeEl.innerHTML = QR.toSvg(b.qr, qrSvgOpts(b));
  logoEl.hidden = !b.logo; if (!b.logo) return;
  const box = QR.logoBox(b.qr, b.logo), total = b.qr.size + 4;
  logoEl.style.width = logoEl.style.height = `calc((100% - 16px) * ${(box.n / total).toFixed(4)})`;   /* the tile has 8px of padding, and the code sits inside it */
  logoEl.dataset.shape = b.q.logoShape; logoEl.dataset.back = b.q.logoBack; logoEl.dataset.kind = b.q.logo; qrLogoFill(logoEl, b.q);
}
function qrRender() {
  const b = qrBuild(); qrPaint($('qrCode'), $('qrLogo'), b);
  $('qrName').textContent = card.name || ''; $('qrRole').textContent = card.title || ''; qrLogoFill($('qrAv'));
  const first = (card.name || '').trim().split(/\s+/)[0] || 'this person';
  $('qrHint').textContent = b.contact ? 'Scan to add ' + first + ' straight to your contacts.' : 'Scan with your phone camera to open this card.';
  document.querySelectorAll('#qrTabs button').forEach((t) => t.setAttribute('aria-selected', t.dataset.mode === qrMode));
  $('qrCopy').lastChild.textContent = 'Copy link'; $('qrShare').hidden = !navigator.share;
  $('qrEdit').hidden = !document.body.classList.contains('owner');
}

/* Branded picture for printing or sending: photo, name and the code on one sheet */
async function qrImageBlob() {
  await (document.fonts && document.fonts.ready).catch(() => {});
  const b = qrBuild(), q = b.q, W = 1080, H = 1350, t = card.theme || {}, bg = qrHex(t.bg) ? t.bg : '#0b1437', accent = qrHex(t.accent) ? t.accent : '#c6f432', txt = qrHex(t.text) ? t.text : '#ffffff';
  const family = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, W, H); grad.addColorStop(0, bg); grad.addColorStop(1, qrMix(bg, accent, .28)); g.fillStyle = grad; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * .85, H * .08, 0, W * .85, H * .08, 620); glow.addColorStop(0, accent + '55'); glow.addColorStop(1, accent + '00'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
  const load = async (u) => { if (!u) return null; try { return await createImageBitmap(await (await fetch(u, { mode: 'cors' })).blob()); } catch (e) { return null; } };
  const bmp = await load(card.avatar), lbmp = q.logo === 'logo' ? await load(q.logoUrl) : bmp;
  const rrect = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const face = (cx, cy, size, round, src) => {
    g.save(); round ? (g.beginPath(), g.arc(cx, cy, size / 2, 0, Math.PI * 2)) : rrect(cx - size / 2, cy - size / 2, size, size, size * .22); g.clip();
    if (src) { const s = Math.min(src.width, src.height), sx = (src.width - s) / 2, sy = Math.max(0, (src.height - s) * .12); g.drawImage(src, sx, sy, s, s, cx - size / 2, cy - size / 2, size, size); }
    else { g.fillStyle = qrMix(bg, accent, .35); g.fillRect(cx - size / 2, cy - size / 2, size, size); g.fillStyle = txt; g.font = `700 ${size * .38}px ${family}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(initialsOf(card.name), cx, cy + size * .02); }
    g.restore();
  };
  face(190, 190, 150, true, bmp); g.lineWidth = 6; g.strokeStyle = accent; g.beginPath(); g.arc(190, 190, 78, 0, Math.PI * 2); g.stroke();
  g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = txt;
  let size = 68; g.font = `700 ${size}px ${family}`; while (g.measureText(card.name || '').width > 700 && size > 36) { size -= 4; g.font = `700 ${size}px ${family}`; }
  g.fillText(card.name || '', 300, 190); g.globalAlpha = .75; g.font = `500 34px ${family}`; g.fillText((card.title || '').slice(0, 44), 300, 244); g.globalAlpha = 1;
  const tx = 120, ty = 340, ts = 840, pad = 34; g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 60; g.shadowOffsetY = 24; rrect(tx, ty, ts, ts, 56); g.fillStyle = '#fff'; g.fill(); g.restore();
  const qs = ts - pad * 2, unit = qs / (b.qr.size + 4), svg = QR.toSvg(b.qr, qrSvgOpts(b)).replace('<svg ', `<svg width="${qs}" height="${qs}" `);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), img = new Image();
  await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; }); g.drawImage(img, tx + pad, ty + pad, qs, qs); URL.revokeObjectURL(url);
  if (b.logo) {
    const lb = QR.logoBox(b.qr, b.logo), ls = lb.n * unit, lx = tx + pad + (b.qr.size / 2 + 2) * unit, ly = ty + ts / 2, circ = q.logoShape === 'circle';
    const outline = (sz) => (circ ? (g.beginPath(), g.arc(lx, ly, sz / 2, 0, Math.PI * 2)) : rrect(lx - sz / 2, ly - sz / 2, sz, sz, sz * .26));
    if (q.logoBack === 'white') { g.fillStyle = '#fff'; outline(ls); g.fill(); }
    if (q.logo === 'logo' && lbmp) {   // an uploaded logo keeps its own shape: fitted inside the badge, never cropped
      const k = circ ? .96 : .8, fit = Math.min(ls * k / lbmp.width, ls * k / lbmp.height);
      g.save(); outline(ls); g.clip(); g.drawImage(lbmp, lx - lbmp.width * fit / 2, ly - lbmp.height * fit / 2, lbmp.width * fit, lbmp.height * fit); g.restore();
    } else face(lx, ly, ls * (circ ? .92 : .82), circ, q.logo === 'initials' ? null : bmp);
  }
  g.textAlign = 'center'; g.fillStyle = txt; g.font = `600 44px ${family}`; g.fillText(b.contact ? 'Scan to save my contact' : 'Scan to open my card', W / 2, 1245);
  if (!b.contact) { g.globalAlpha = .7; g.font = `500 32px ${family}`; g.fillText(cardUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''), W / 2, 1296); g.globalAlpha = 1; }
  return await new Promise((ok) => c.toBlob(ok, 'image/png'));
}
const qrFileName = () => (card.name || 'card').trim().replace(/\s+/g, '_').replace(/[^\w\-]/g, '') + (qrMode === 'contact' ? '-contact-qr.png' : '-qr.png');

let qrReturn = null;
function qrOpen() {
  qrMode = 'link'; try { qrRender(); } catch (e) { toast('Could not make the QR code', true); return; }
  qrReturn = document.activeElement; $('qrModal').classList.add('show'); setTimeout(() => $('qrClose').focus({ preventScroll: true }), 60);
}
function qrClose() { if (!$('qrModal').classList.contains('show')) return; $('qrModal').classList.remove('show'); if (qrReturn && qrReturn.focus) qrReturn.focus({ preventScroll: true }); }
$('qrBtn').onclick = qrOpen;
$('qrClose').onclick = qrClose;
$('qrModal').onclick = (e) => { if (e.target.id === 'qrModal') qrClose(); };
$('qrTabs').onclick = (e) => { const t = e.target.closest('button[data-mode]'); if (!t) return; qrMode = t.dataset.mode; qrRender(); const tile = document.querySelector('#qrModal .qr-tile'); tile.classList.remove('swap'); void tile.offsetWidth; tile.classList.add('swap'); };
/* Owner only: jump from the sheet straight to the QR design tab in the editor */
$('qrEdit').onclick = () => { qrClose(); if (!password) { askLogin(); return; } if (!document.body.classList.contains('editing')) openPanel(); setTab('qr'); const tb = $('tabs'), t = tb.querySelector('[data-tab="qr"]'); if (t) tb.scrollLeft = t.offsetLeft - (tb.clientWidth - t.offsetWidth) / 2; };
$('qrCopy').onclick = async () => { try { await navigator.clipboard.writeText(cardUrl()); toast('Link copied'); } catch (e) { toast('Copy failed', true); } };
$('qrDl').onclick = async () => {
  try {
    const blob = await qrImageBlob(), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = qrFileName();
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Image saved');
  } catch (e) { toast('Could not save the image', true); }
};
$('qrShare').onclick = async () => {
  try {
    const blob = await qrImageBlob(), file = new File([blob], qrFileName(), { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: card.name || 'My card', text: card.name ? card.name + ' · ' + (card.title || '') : '', url: cardUrl() });
    else await navigator.share({ title: card.name || 'My card', url: cardUrl() });
  } catch (e) { if (e && e.name !== 'AbortError') toast('Could not share', true); }
};
/* Escape closes; Tab stays inside the sheet while it is open */
addEventListener('keydown', (e) => {
  if (!$('qrModal').classList.contains('show')) return;
  if (e.key === 'Escape') { qrClose(); return; }
  if (e.key !== 'Tab') return;
  const f = [...$('qrModal').querySelectorAll('button:not([hidden])')].filter((x) => x.offsetParent !== null); if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
