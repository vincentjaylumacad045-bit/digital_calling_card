/* js/boot.js */
/* ---------- Boot ---------- */
fetch('/api/card').then((r) => r.json()).then((c) => {
  card = c; card.socials = card.socials || []; render();
  setTimeout(() => {
    $('splash').classList.add('gone');
    document.body.classList.add('ready');
    checkEditLink();
  }, 350);
});
// Secret owner link: https://your-site.vercel.app/#edit
function checkEditLink() {
  if (location.hash === '#edit') { history.replaceState(null, '', location.pathname); password ? openPanel() : askLogin(); }
}
addEventListener('hashchange', () => { if (card) checkEditLink(); });
