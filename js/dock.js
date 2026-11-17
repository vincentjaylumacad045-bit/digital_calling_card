/* js/dock.js */
/* ---------- Dock actions ---------- */
$('addContact').onclick = () => {
  const vcf = ['BEGIN:VCARD','VERSION:3.0','FN:'+card.name,'TITLE:'+card.title,'TEL;TYPE=CELL:'+card.phone,
    'EMAIL:'+card.email,'URL:'+card.website,'ADR;TYPE=WORK:;;'+(card.location||'')+';;;;','NOTE:'+(card.about||'').replace(/\n/g,' '),'END:VCARD'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([vcf], { type: 'text/vcard' }));
  a.download = (card.name || 'contact').replace(/\s+/g, '_') + '.vcf'; a.click();
  toast('Contact file downloaded ✓');
};
$('shareBtn').onclick = async () => {
  const data = { title: card.name, text: card.title, url: location.origin + location.pathname };
  if (navigator.share) { try { await navigator.share(data); } catch (e) {} }
  else { try { await navigator.clipboard.writeText(data.url); toast('Link copied ✓'); } catch (e) { toast('Copy failed', true); } }
};
$('qrBtn').onclick = () => {
  $('qrImg').src = 'https://api.qrserver.com/v1/create-qr-code/?size=460x460&margin=8&data=' + encodeURIComponent(location.origin + location.pathname);
  $('qrModal').classList.add('show');
};
$('qrClose').onclick = () => $('qrModal').classList.remove('show');
$('qrModal').onclick = (e) => { if (e.target.id === 'qrModal') $('qrModal').classList.remove('show'); };
