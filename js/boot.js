/* js/boot.js */
/* ---------- Boot ---------- */
function start(c) {
  card = c; card.socials = card.socials || []; card.theme = { ...THEME_FALLBACK, ...(card.theme || {}) };
  render();
  setTimeout(() => {
    $('splash').classList.add('gone');
    document.body.classList.add('ready', 'intro');
    setTimeout(() => document.body.classList.remove('intro'), introMs());   // intro animations run once, then the card is final
    checkEditLink();
  }, 350);
}
fetch('/api/card').then((r) => { if (!r.ok) throw new Error('bad response'); return r.json(); }).then(start)
  .catch(() => start(JSON.parse(JSON.stringify(FALLBACK_CARD))));
// Secret owner link: https://your-site.vercel.app/#edit
function checkEditLink() {
  if (location.hash === '#edit') { history.replaceState(null, '', location.pathname); password ? openPanel() : askLogin(); }
}
addEventListener('hashchange', () => { if (card) checkEditLink(); });
