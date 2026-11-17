/* js/render.js */
/* ---------- Render ---------- */
function render() {
  const t = card.theme, r = document.documentElement.style;
  $('app').classList.remove('layout-classic','layout-centered','layout-minimal','layout-editorial');
  $('app').classList.add('layout-' + (['classic','centered','minimal','editorial'].includes(card.layout) ? card.layout : 'centered'));
  r.setProperty('--bg', t.bg); r.setProperty('--accent', t.accent);
  r.setProperty('--ink', t.ink); r.setProperty('--text', t.text); r.setProperty('--font', t.font);
  document.querySelector('meta[name=theme-color]').content = t.bg;

  const parts = (card.name || '').trim().split(/\s+/);
  const first = parts.shift() || '';
  $('name').innerHTML = '';
  [first, parts.join(' ')].filter(Boolean).forEach((p, i) => {
    const ln = document.createElement('span'); ln.className = 'ln';
    const s = document.createElement('span'); s.textContent = p; s.style.setProperty('--d', 150 + i * 150);
    ln.appendChild(s); $('name').appendChild(ln);
  });
  $('title').textContent = card.title; $('title').style.display = card.title ? '' : 'none';
  $('about').textContent = card.about;

  renderPhoto();
  $('thumb').style.backgroundImage = card.avatar ? `url(${card.avatar})` : '';
  $('initials').textContent = card.avatar ? '' : (card.name || '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  document.title = (card.name || 'Contact') + ' — Digital Card';

  const digits = (s) => (s || '').replace(/[^\d]/g, '');
  const act = (id, val, href) => { const el = $(id); el.classList.toggle('hide', !val); el.href = href; };
  const tel = (card.phone || '').replace(/\s/g, '');
  act('aPhone', card.phone, 'tel:' + tel);
  act('aEmail', card.email, 'mailto:' + card.email);
  act('aSms', card.phone, 'sms:' + tel);
  act('aWa', card.whatsapp, 'https://wa.me/' + digits(card.whatsapp));

  const rows = [];
  if (card.phone) rows.push(['phone', 'Phone', card.phone, 'tel:' + tel]);
  if (card.email) rows.push(['mail', 'Email', card.email, 'mailto:' + card.email]);
  if (card.website) rows.push(['globe', 'Website', card.website.replace(/^https?:\/\//, ''), /^https?:\/\//.test(card.website) ? card.website : 'https://' + card.website]);
  if (card.location) rows.push(['pin', 'Location', card.location, 'https://www.google.com/maps/search/' + encodeURIComponent(card.location)]);
  $('contactWrap').style.display = rows.length ? '' : 'none';
  $('rows').innerHTML = '';
  rows.forEach(([ic, lab, val, href]) => {
    const a = document.createElement('a'); a.className = 'row-link'; a.href = href;
    if (!href.startsWith('tel:') && !href.startsWith('mailto:')) { a.target = '_blank'; a.rel = 'noopener'; }
    const ico = document.createElement('span'); ico.className = 'ico'; ico.innerHTML = svg(ic);
    const txt = document.createElement('span');
    const sm = document.createElement('small'); sm.textContent = lab;
    txt.appendChild(sm); txt.appendChild(document.createTextNode(val));
    a.appendChild(ico); a.appendChild(txt); $('rows').appendChild(a);
  });

  const links = (card.socials || []).filter((s) => s.url);
  $('linkWrap').style.display = links.length ? '' : 'none';
  $('socials').innerHTML = '';
  links.forEach((s) => {
    const a = document.createElement('a'); a.className = 'soc'; a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.title = s.label || '';
    a.innerHTML = svg(socialIcon(s)); $('socials').appendChild(a);
  });
  observe();
}

/* ---------- Scroll reveal + parallax ---------- */
let io;
function observe() {
  if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
}
addEventListener('scroll', () => document.documentElement.style.setProperty('--py', Math.round(Math.min(scrollY * .25, 80)) + 'px'), { passive: true });
$('hero').addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const b = $('hero').getBoundingClientRect();
  const x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
  const s = $('photoIn').style; s.setProperty('--tx', Math.round(x * -14) + 'px'); s.setProperty('--ty', Math.round(y * -10) + 'px');
});
