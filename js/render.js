/* js/render.js */
/* ---------- Render: turns the card data into the page ---------- */
const digits = (s) => (s || '').replace(/[^\d]/g, '');
const initialsOf = (name) => (name || '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const SERIF_NAME_FONTS = /Playfair|Cormorant|Baskerville|Georgia|Instrument/i;

function renderName() {
  const el = $('name'), text = (card.name || '').trim();
  el.className = 'name name-layout-' + (['natural', 'single', 'two', 'stacked'].includes(card.nameLayout) ? card.nameLayout : 'natural');
  el.setAttribute('data-edit', 'name');
  { const pre = (card.intro === undefined ? 'It\u2019s' : card.intro).trim(); el.dataset.pre = pre ? pre + ' ' : ''; el.dataset.post = pre ? '.' : ''; }
  el.textContent = ''; let ci = 0; const perChar = ['letters', 'typewriter', 'wave', 'flip'].includes(card.nameAnim);
  text.split(/\s+/).filter(Boolean).forEach((word, i, all) => {
    const w = document.createElement('span'), inner = document.createElement('span');
    w.className = 'w'; inner.style.setProperty('--i', i); w.style.setProperty('--i', i);
    if (perChar) [...word].forEach((ch) => { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; c.style.setProperty('--ci', ci++); inner.appendChild(c); });
    else inner.textContent = word;
    w.appendChild(inner); el.appendChild(w);
    if (i < all.length - 1) el.appendChild(document.createTextNode(' '));
  });
}

function renderQuick() {
  const tel = (card.phone || '').replace(/\s/g, '');
  const sources = {
    call: card.phone && ['phone', 'Call', 'tel:' + tel],
    whatsapp: digits(card.whatsapp) && ['whatsapp', 'WhatsApp', 'https://wa.me/' + digits(card.whatsapp)],
    email: card.email && ['mail', 'Email', 'mailto:' + card.email],
    map: card.location && ['pin', 'Directions', 'https://www.google.com/maps/search/' + encodeURIComponent(card.location)],
    web: card.website && ['globe', 'Website', /^https?:\/\//.test(card.website) ? card.website : 'https://' + card.website]
  };
  const enabled = Array.isArray(card.quick) ? card.quick : DEFAULT_QUICK;
  const items = enabled.map((k) => QUICK_DEFS.find((d) => d.key === k)).filter((d) => d && sources[d.key]).map((d) => ({ d, src: sources[d.key] }));
  const q = $('quick'); q.innerHTML = ''; q.style.setProperty('--n', Math.max(1, Math.min(items.length, 4)));
  items.forEach(({ d, src }, i) => {
    const a = document.createElement('a'); a.className = 'qa'; a.href = src[2]; a.style.setProperty('--i', i); a.setAttribute('data-edit', 'contact'); a.dataset.key = d.key;
    if (!/^(tel|mailto):/.test(src[2])) { a.target = '_blank'; a.rel = 'noopener'; }
    a.innerHTML = `<span class="qi">${svg(src[0])}</span><span class="ql"></span>`;
    a.querySelector('.ql').textContent = d.label;
    q.appendChild(a);
  });
}

function renderContactRows() {
  const tel = (card.phone || '').replace(/\s/g, '');
  const web = card.website ? (/^https?:\/\//.test(card.website) ? card.website : 'https://' + card.website) : '';
  const rows = [];
  if (card.phone) rows.push(['phone', 'Phone', card.phone, 'tel:' + tel]);
  if (digits(card.whatsapp)) rows.push(['whatsapp', 'WhatsApp', card.whatsapp, 'https://wa.me/' + digits(card.whatsapp)]);
  if (card.email) rows.push(['mail', 'Email', card.email, 'mailto:' + card.email]);
  if (card.website) rows.push(['globe', 'Website', card.website.replace(/^https?:\/\//, '').replace(/\/$/, ''), web]);
  if (card.location) rows.push(['pin', 'Location', card.location, 'https://www.google.com/maps/search/' + encodeURIComponent(card.location)]);
  const box = $('rows'); box.innerHTML = '';
  { const ord = Array.isArray(card.contactOrder) ? card.contactOrder : [], rk = (r) => { const i = ord.indexOf(r[0]); return i < 0 ? 99 : i; }; rows.sort((a, b) => rk(a) - rk(b)); }
  rows.forEach(([ic, lab, val, href]) => {
    const wrap = document.createElement('div'); wrap.className = 'row-wrap'; wrap.dataset.key = ic;
    const a = document.createElement('a'); a.className = 'row-link'; a.href = href;
    if (!/^(tel|mailto):/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
    const ico = document.createElement('span'); ico.className = 'ico'; ico.innerHTML = svg(ic);
    const txt = document.createElement('span'); txt.className = 'txt';
    const sm = document.createElement('small'); sm.textContent = lab;
    const v = document.createElement('span'); v.className = 'val'; v.textContent = val;
    txt.append(sm, v); a.append(ico, txt);
    const cp = document.createElement('button'); cp.type = 'button'; cp.className = 'copy'; cp.setAttribute('aria-label', 'Copy ' + lab.toLowerCase()); cp.innerHTML = svg('copy');
    cp.onclick = async () => {
      try { await navigator.clipboard.writeText(val); } catch (e) { return toast('Copy failed', true); }
      cp.classList.add('done'); cp.innerHTML = svg('check'); toast(lab + ' copied');
      setTimeout(() => { cp.classList.remove('done'); cp.innerHTML = svg('copy'); }, 1500);
    };
    wrap.append(a, cp); box.appendChild(wrap);
  });
  return rows.length;
}

function renderExtras() {
  const cta = card.cta || {}, a = $('cta'), url = (cta.url || '').trim(), label = (cta.label || '').trim();
  a.hidden = !(url && label);
  if (!a.hidden) {
    a.href = /^(https?:|mailto:|tel:)/i.test(url) ? url : 'https://' + url; a.target = /^(mailto:|tel:)/i.test(url) ? '' : '_blank'; a.rel = 'noopener';
    a.innerHTML = ''; const sp = document.createElement('span'); sp.textContent = label; a.append(sp); const ic = document.createElement('span'); ic.className = 'cta-ic'; ic.innerHTML = svg('arrow'); a.append(ic);
  }
  const list = (card.services || []).filter((x) => (x.title || '').trim()), box = $('services'); box.innerHTML = '';
  list.forEach((x) => {
    const d = document.createElement('div'); d.className = 'svc';
    const top = document.createElement('div'); top.className = 'svc-top';
    const b = document.createElement('b'); b.textContent = x.title; top.append(b);
    if ((x.price || '').trim()) { const pr = document.createElement('span'); pr.className = 'price'; pr.textContent = x.price; top.append(pr); }
    d.append(top);
    if ((x.desc || '').trim()) { const p = document.createElement('p'); p.textContent = x.desc; d.append(p); }
    box.append(d);
  });
  const q = card.quote || {}; $('quoteText').textContent = (q.text || '').trim(); $('quoteBy').textContent = (q.by || '').trim();
  return { services: list.length > 0, quote: !!(q.text || '').trim() };
}


/* ---------- Contrast guard: whatever colors a theme or the owner picks, text and icons stay readable ---------- */
const hexRgb = (h) => { const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((h || '').trim()); if (!m) return null; let x = m[1]; if (x.length === 3) x = x.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(x.substr(i, 2), 16)); };
const relLum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
const ratio = (a, b) => { const A = hexRgb(a), B = hexRgb(b); if (!A || !B) return 21; const l1 = relLum(A), l2 = relLum(B); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };
const mixHex = (a, b, k) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const accentOn = (acc, bg) => { if (!hexRgb(acc) || !hexRgb(bg) || ratio(acc, bg) >= 3) return acc; const to = relLum(hexRgb(bg)) > .4 ? '#000000' : '#ffffff'; for (let k = .1; k <= 1; k += .1) { const c = mixHex(acc, to, k); if (ratio(c, bg) >= 3) return c; } return to; };
const readable = (fg, bg, min, dark = '#111111', light = '#ffffff') => (ratio(fg, bg) >= min ? fg : (ratio(dark, bg) >= ratio(light, bg) ? dark : light));

/* ---------- Top bar, greeting, hero social icons, numbers, skills ---------- */
const TOPBAR_LAYOUTS = ['portfolio'];
function topbarOn() { const m = card.topbar; return m === 'on' || (m !== 'off' && TOPBAR_LAYOUTS.includes(normLayout(card.layout))); }
function talkHref() {
  const c = card.cta || {}, url = (c.url || '').trim();
  if (url) return /^(https?:|mailto:|tel:)/i.test(url) ? url : 'https://' + url;
  if (card.email) return 'mailto:' + card.email;
  if (card.phone) return 'tel:' + card.phone.replace(/\s/g, '');
  if (digits(card.whatsapp)) return 'https://wa.me/' + digits(card.whatsapp);
  return '#contactWrap';
}
function renderTopbar() {
  const parts = (card.name || '').trim().split(/\s+/).filter(Boolean), tn = $('tbName'); tn.textContent = '';
  if (parts.length) { const a = document.createElement('span'); a.textContent = parts[0]; tn.append(a); if (parts.length > 1) { const b = document.createElement('span'); b.className = 'dim'; b.textContent = ' ' + parts.slice(1).join(' '); tn.append(b); } }
  $('tbLabel').textContent = (card.talkLabel === undefined ? 'Let’s Talk' : card.talkLabel).trim() || 'Let’s Talk';
  const a = $('tbBtn'), h = talkHref(); a.href = h; a.target = /^https?:/.test(h) ? '_blank' : ''; a.rel = 'noopener';
  const g = $('greet'), gt = (card.greeting === undefined ? '\u{1F44B} Hey there,' : card.greeting).trim(); g.textContent = gt; g.hidden = !gt;
}
function renderHeroSocials(links) {
  const box = $('heroSoc'); box.innerHTML = '';
  links.slice(0, 6).forEach((s, i) => {
    const a = document.createElement('a'); a.href = /^https?:\/\//i.test(s.url) ? s.url : 'https://' + s.url; a.target = '_blank'; a.rel = 'noopener'; a.style.setProperty('--i', i);
    a.setAttribute('aria-label', s.label || 'Link'); a.innerHTML = svg(socialIcon(s)); box.appendChild(a);
  });
}
const calmNow = () => matchMedia('(prefers-reduced-motion: reduce)').matches || card.motion === 'off' || (typeof isEditing === 'function' && isEditing());
function renderStats() {
  const list = (card.stats || []).filter((x) => (x.value || '').toString().trim()), box = $('stats'); box.innerHTML = '';
  list.slice(0, 6).forEach((x, i) => {
    const d = document.createElement('div'); d.className = 'stat'; d.style.setProperty('--d', i * 80 + 'ms');
    const m = String(x.value).trim().match(/^([^\d-]*)(-?[\d.,]*\d)(.*)$/), v = document.createElement('b'); v.className = 'stat-v';
    if (m) { v.dataset.pre = m[1]; v.dataset.to = m[2].replace(/,/g, ''); v.dataset.post = m[3]; v.textContent = calmNow() ? m[1] + m[2] + m[3] : m[1] + '0' + m[3]; } else v.textContent = x.value;
    const l = document.createElement('span'); l.textContent = x.label || ''; d.append(v, l); box.append(d);
  });
  return list.length > 0;
}
function renderSkills() {
  const list = (card.skills || []).filter((x) => (x.name || '').trim()), box = $('skills'); box.innerHTML = '';
  list.slice(0, 12).forEach((x, i) => {
    const lv = clampN(Math.round(+x.level || 0), 0, 100), d = document.createElement('div'); d.className = 'skill'; d.style.setProperty('--d', i * 70 + 'ms'); d.style.setProperty('--lv', lv + '%');
    const top = document.createElement('div'); top.className = 'skill-top'; const n = document.createElement('b'); n.textContent = x.name; const p = document.createElement('span'); p.textContent = lv + '%'; top.append(n, p);
    const bar = document.createElement('div'); bar.className = 'bar'; bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuenow', lv); bar.setAttribute('aria-label', x.name); bar.innerHTML = '<i></i>';
    d.append(top, bar); box.append(d);
  });
  return list.length > 0;
}
/* Count-up for the Numbers section: runs when the section scrolls into view */
function countUp(sec) {
  sec.querySelectorAll('.stat-v[data-to]').forEach((el) => {
    const to = parseFloat(el.dataset.to), dec = (el.dataset.to.split('.')[1] || '').length, pre = el.dataset.pre || '', post = el.dataset.post || '';
    const calm = calmNow();
    const fmt = (n) => pre + (dec ? n.toFixed(dec) : Math.round(n).toString()) + post;
    if (calm) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1300;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

/* Re-rendering rebuilds parts of the card (name, rows, chips...). If the page gets shorter for a moment the browser clamps the
   scroll position and the view jumps to the top. Freeze the card height and restore the scroll position around every render. */
function render() {
  const app = $('app'), y = window.scrollY, ed = typeof isEditing === 'function' && isEditing();
  if (ed && app) app.style.minHeight = app.offsetHeight + 'px';
  try { renderCore(); }
  finally {
    if (ed) {
      if (Date.now() > (window.__focusScrollUntil || 0) && Math.abs(window.scrollY - y) > 1) window.scrollTo({ top: y, behavior: 'instant' });
      requestAnimationFrame(() => { app.style.minHeight = ''; });
    }
  }
}
function renderCore() {
  const t = card.theme || {}, root = document.documentElement.style, app = $('app');
  /* Template classes: remove every previous one first so layouts never stack */
  [...app.classList].forEach((c) => { if (/^(layout|profile|motion)-/.test(c)) app.classList.remove(c); });
  app.classList.add('layout-' + normLayout(card.layout));
  const shape = PROFILE_STYLES.includes(card.profileStyle) ? card.profileStyle : 'full';
  app.classList.add('profile-' + shape); if (shape !== 'full') app.classList.add('profile-flow');
  app.classList.add('motion-' + (['cinematic', 'subtle', 'off'].includes(card.motion) ? card.motion : 'cinematic'));
  [...app.classList].forEach((c) => { if (/^(anim|titleanim|reveal)-/.test(c)) app.classList.remove(c); });
  app.classList.add('anim-' + (['fade','blur','letters','typewriter','wave','flip','shimmer','none'].includes(card.nameAnim) ? card.nameAnim : 'rise'));
  app.classList.add('titleanim-' + (['type','wipe','slide','blur','none'].includes(card.titleAnim) ? card.titleAnim : 'fade'));
  { const ra = card.revealAnim === undefined ? 'up' : card.revealAnim; if (['up','slide','zoom','blur'].includes(ra)) app.classList.add('reveal-' + ra); }
  $('title').style.setProperty('--tl', Math.max(1, (card.title || '').length));
  app.classList.toggle('title-in-about', card.titlePlacement === 'about');
  app.classList.toggle('has-topbar', topbarOn()); document.body.classList.toggle('has-topbar', topbarOn());

  /* Theme tokens */
  const set = (k, v) => root.setProperty(k, v), unset = (k) => root.removeProperty(k);
  const T = { ...THEME_FALLBACK, ...t };
  const gBg = T.bg, gAccent = T.accent, gSurface = T.surface;
  set('--accent-s', accentOn(gAccent, gSurface)); set('--accent-b', accentOn(gAccent, gBg));
  set('--bg', gBg); set('--accent', gAccent); set('--ink', readable(T.ink, gAccent, 3)); set('--text', readable(T.text, gBg, 3));
  set('--font', T.font); set('--surface', gSurface); set('--section-text', readable(T.sectionText, gSurface, 4.5));
  set('--muted', readable(T.muted, gSurface, 3, '#4b5563', '#c3c8d2')); set('--button-bg', T.buttonBg); set('--button-text', readable(T.buttonText, T.buttonBg, 3));
  set('--border-color', t.border || THEME_FALLBACK.border);
  set('--card-radius', (card.roundness ?? 14) + 'px'); set('--section-space', (card.sectionSpace ?? 26) + 'px');
  set('--name-x', (card.nameX || 0) + 'px'); set('--name-y', (card.nameY || 0) + 'px');
  set('--title-size', (card.titleSize || 16) + 'px');

  /* Name typography: only values the owner changed are set; everything else comes from the layout */
  typeof card.nameSize === 'number' ? set('--name-size', card.nameSize + 'px') : unset('--name-size');
  typeof card.nameLine === 'number' ? set('--name-line', card.nameLine) : unset('--name-line');
  typeof card.nameLetter === 'number' ? set('--name-letter', card.nameLetter + 'px') : unset('--name-letter');
  if (card.nameFont && card.nameFont !== 'inherit') { set('--name-font', card.nameFont); set('--name-weight', SERIF_NAME_FONTS.test(card.nameFont) ? 500 : 700); }
  else { unset('--name-font'); unset('--name-weight'); }
  if (['left', 'center', 'right'].includes(card.nameAlign)) { set('--name-align', card.nameAlign); set('--role-j', { left:'flex-start', center:'center', right:'flex-end' }[card.nameAlign]); }
  else { unset('--name-align'); unset('--role-j'); }
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = t.bg || THEME_FALLBACK.bg;

  /* Identity */
  renderName();
  const titleInAbout = card.titlePlacement === 'about';
  $('title').textContent = titleInAbout ? '' : (card.title || '');
  $('aboutTitle').textContent = titleInAbout ? (card.title || '') : '';
  $('about').textContent = card.about || '';
  $('initials').textContent = card.avatar ? '' : initialsOf(card.name);
  document.title = (card.name || 'Contact') + (card.title ? ' · ' + card.title : '');
  const desc = document.querySelector('meta[name=description]'); if (desc) desc.content = [card.name, card.title, card.location].filter(Boolean).join(' · ');

  { const st = (card.status || '').trim(); $('status').hidden = !st; $('statusText').textContent = st; }
  renderPhoto();
  $('thumb').style.backgroundImage = card.avatar ? `url(${card.avatar})` : '';
  $('miniName').textContent = card.name || '';
  $('miniAv').style.backgroundImage = card.avatar ? `url(${card.avatar})` : ''; $('miniAv').textContent = card.avatar ? '' : initialsOf(card.name);

  renderQuick();
  const contactCount = renderContactRows();

  const chips = (card.achievements || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 12);
  $('chips').innerHTML = '';
  chips.forEach((c) => { const li = document.createElement('li'); li.className = 'chip'; li.style.setProperty('--d', chips.indexOf(c) * 60 + 'ms'); li.textContent = c; $('chips').appendChild(li); });

  const links = (card.socials || []).filter((s) => s.url);
  $('socials').innerHTML = '';
  links.forEach((s) => {
    const a = document.createElement('a'); a.className = 'soc'; a.target = '_blank'; a.rel = 'noopener';
    a.href = /^https?:\/\//i.test(s.url) ? s.url : 'https://' + s.url;
    let host = '', handle = '';
    try { const u = new URL(a.href); host = u.hostname.replace(/^www\./, ''); handle = (host + u.pathname).replace(/\/$/, ''); } catch (e) { handle = s.url; }
    const ico = document.createElement('span'); ico.className = 'ico'; ico.innerHTML = svg(socialIcon(s));
    const txt = document.createElement('span'); txt.className = 'txt';
    const b = document.createElement('b'); b.textContent = s.label || host || 'Link';
    const sm = document.createElement('small'); sm.textContent = handle;
    txt.append(b, sm);
    const go = document.createElement('span'); go.className = 'go'; go.innerHTML = svg('chevron');
    a.append(ico, txt, go); $('socials').appendChild(a);
  });

  renderTopbar(); renderHeroSocials(links);
  /* Sections: owner-controlled order and visibility, hidden when empty */
  const ex = renderExtras(), hasStats = renderStats(), hasSkills = renderSkills();
  const has = { stats: hasStats, skills: hasSkills, services: ex.services, quote: ex.quote, about: !!((card.about || '').trim() || (titleInAbout && card.title)), highlights: chips.length > 0, contact: contactCount > 0, hours: renderHours(), links: links.length > 0 };
  getSections().forEach((s, idx) => {
    const el = document.querySelector(`[data-sec="${s.key}"]`); if (!el) return;
    el.style.order = idx; el.hidden = !(s.visible && has[s.key]);
  });
  observe(); if (typeof updateSecButtons === 'function') updateSecButtons(); if (typeof decorateItems === 'function') decorateItems();
  if (typeof touchHistory === 'function') touchHistory();
}

/* ---------- Section underline reveal (structural, once per section) ---------- */
let io;
function observe() {
  /* Sections animate in when they enter the screen and out when they leave, so it works every time you scroll up or down */
  if (!io) io = new IntersectionObserver((es) => es.forEach((e) => {
    const keep = document.body.classList.contains('editing');                       // while editing, every section stays visible
    const was = e.target.classList.contains('in');
    e.target.classList.toggle('in', keep || e.isIntersecting);
    if (e.isIntersecting && !was && e.target.dataset.sec === 'stats') countUp(e.target);
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.section').forEach((el) => { if (!el.__obs) { el.__obs = true; io.observe(el); } });
}

/* ---------- Business hours + "Open now" badge (uses the visitor's own clock) ---------- */
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function parseHourLines(text) {
  const out = [];
  String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
    const m = line.match(/^(.*?)(?:\s*[:|]\s*|\s+)(closed|\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:-|–|to)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?.*)$/i);
    const dayPart = (m ? m[1] : line).toLowerCase(), timePart = m ? m[2] : '', days = new Set();
    if (/daily|every ?day|7 ?days/.test(dayPart)) DAY_KEYS.forEach((_, i) => days.add(i));
    else {
      const r = dayPart.match(/\b(sun|mon|tue|wed|thu|fri|sat)\w*\s*(?:-|–|to|through|thru)\s*(sun|mon|tue|wed|thu|fri|sat)/);
      if (r) { let a = DAY_KEYS.indexOf(r[1]), b = DAY_KEYS.indexOf(r[2]); for (let n = 0; n < 7; n++) { days.add(a); if (a === b) break; a = (a + 1) % 7; } }
      else (dayPart.match(/\b(sun|mon|tue|wed|thu|fri|sat)/g) || []).forEach((d) => days.add(DAY_KEYS.indexOf(d)));
    }
    let range = null;
    const t = timePart.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (t) {
      let h1 = +t[1], h2 = +t[4], m1 = +(t[2] || 0), m2 = +(t[5] || 0), p1 = (t[3] || '').toLowerCase(), p2 = (t[6] || '').toLowerCase();
      if (!p1 && p2) p1 = (h1 <= h2 || h1 === 12) && p2 === 'pm' && h1 !== 12 ? 'pm' : (h1 > h2 ? 'am' : p2);
      const to24 = (h, p) => (p === 'pm' ? (h % 12) + 12 : p === 'am' ? h % 12 : h);
      range = [to24(h1, p1) * 60 + m1, to24(h2, p2) * 60 + m2];
    }
    out.push({ line, days: [...days].sort(), range, closed: /closed/i.test(timePart) });
  });
  return out;
}
function updateOpenBadge() {
  const badge = $('openBadge'), rows = [...document.querySelectorAll('#hoursList li')]; if (!badge) return;
  const info = parseHourLines(card && card.hours), now = new Date(), d = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
  const usable = info.filter((x) => x.days.length && (x.range || x.closed));
  if (!usable.length) { badge.textContent = ''; return; }
  let open = false;
  usable.forEach((x) => {
    if (!x.range) return; const [a, b] = x.range;
    if (x.days.includes(d) && (b > a ? mins >= a && mins < b : mins >= a)) open = true;                       // same day, or overnight start
    if (b <= a && x.days.includes((d + 6) % 7) && mins < b) open = true;                                    // overnight tail from yesterday
  });
  badge.textContent = open ? 'Open now' : 'Closed now'; badge.className = 'open-badge ' + (open ? 'on' : 'off');
  rows.forEach((li) => li.classList.toggle('today', li.dataset.days.split(',').includes(String(d))));
}
function renderHours() {
  const box = $('hoursList'); box.innerHTML = '';
  const info = parseHourLines(card.hours);
  info.forEach((x) => {
    const li = document.createElement('li'); li.dataset.days = x.days.join(',');
    const m = x.line.match(/^(.*?)(?:\s*[:|]\s*|\s+)(closed|\d.*)$/i), a = document.createElement('span'), b = document.createElement('span');
    a.textContent = m ? m[1].trim() : x.line; b.textContent = m ? m[2].trim() : ''; li.append(a, b); box.append(li);
  });
  updateOpenBadge();
  return info.length > 0;
}
setInterval(() => { if (card) updateOpenBadge(); }, 60000);
