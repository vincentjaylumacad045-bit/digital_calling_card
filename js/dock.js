/* js/dock.js */
/* ---------- Dock actions: save contact, share, QR ---------- */
const vEsc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
function buildVcf() {
  const parts = (card.name || '').trim().split(/\s+/), last = parts.length > 1 ? parts.pop() : '', first = parts.join(' ');
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + vEsc(card.name), 'N:' + vEsc(last) + ';' + vEsc(first) + ';;;'];
  if (card.title) lines.push('TITLE:' + vEsc(card.title));
  if (card.phone) lines.push('TEL;TYPE=CELL,VOICE:' + card.phone);
  if (digits(card.whatsapp) && card.whatsapp !== card.phone) lines.push('TEL;TYPE=WORK:' + card.whatsapp);
  if (card.email) lines.push('EMAIL;TYPE=INTERNET:' + card.email);
  if (card.website) lines.push('URL:' + (/^https?:\/\//.test(card.website) ? card.website : 'https://' + card.website));
  if (card.location) lines.push('ADR;TYPE=WORK:;;' + vEsc(card.location) + ';;;;');
  (card.socials || []).filter((s) => s.url).forEach((s) => lines.push('X-SOCIALPROFILE;TYPE=' + (s.label || 'link').replace(/[^\w-]/g, '') + ':' + s.url));
  if (card.about) lines.push('NOTE:' + vEsc(card.about));
  lines.push('END:VCARD');
  return lines.join('\r\n');
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
  a.href = URL.createObjectURL(new Blob([vcf], { type: 'text/vcard' }));
  a.download = (card.name || 'contact').replace(/\s+/g, '_') + '.vcf';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Contact file downloaded');
};
const cardUrl = () => location.origin + location.pathname;
$('shareBtn').onclick = async () => {
  const data = { title: card.name, text: card.title, url: cardUrl() };
  if (navigator.share) { try { await navigator.share(data); } catch (e) {} }
  else { try { await navigator.clipboard.writeText(data.url); toast('Link copied'); } catch (e) { toast('Copy failed', true); } }
};
function qrSrc() { return 'https://api.qrserver.com/v1/create-qr-code/?size=520x520&margin=0&ecc=M&data=' + encodeURIComponent(cardUrl()); }
$('qrBtn').onclick = () => {
  $('qrImg').src = qrSrc();
  $('qrName').textContent = card.name || ''; $('qrRole').textContent = card.title || '';
  const av = $('qrAv'); av.style.backgroundImage = card.avatar ? `url(${card.avatar})` : ''; av.textContent = card.avatar ? '' : initialsOf(card.name);
  $('qrModal').classList.add('show');
};
$('qrClose').onclick = () => $('qrModal').classList.remove('show');
$('qrModal').onclick = (e) => { if (e.target.id === 'qrModal') $('qrModal').classList.remove('show'); };
$('qrCopy').onclick = async () => { try { await navigator.clipboard.writeText(cardUrl()); toast('Link copied'); } catch (e) { toast('Copy failed', true); } };
$('qrDl').onclick = async () => {
  try {
    const r = await fetch(qrSrc()), b = await r.blob(), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = (card.name || 'card').replace(/\s+/g, '_') + '-qr.png'; document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { window.open(qrSrc(), '_blank', 'noopener'); }
};
addEventListener('keydown', (e) => { if (e.key === 'Escape') $('qrModal').classList.remove('show'); });
