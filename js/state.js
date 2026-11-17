/* js/state.js */
/* ---------- State ---------- */
let card = null;
let password = sessionStorage.getItem('adminpw') || '';
const $ = (id) => document.getElementById(id);
const THEMES = {
  lime: { bg:'#0b1437', accent:'#c6f432', ink:'#0b1437', text:'#ffffff' },
  sky:  { bg:'#0a1a2f', accent:'#38bdf8', ink:'#06223a', text:'#ffffff' },
  rose: { bg:'#2a0a1a', accent:'#fb7185', ink:'#2a0a1a', text:'#ffffff' },
  gold: { bg:'#1c1405', accent:'#fbbf24', ink:'#1c1405', text:'#ffffff' },
  ocean: { bg:'#071e2d', accent:'#22d3ee', ink:'#062333', text:'#f0fdff' },
  violet: { bg:'#1b1235', accent:'#a78bfa', ink:'#211044', text:'#ffffff' },
  coral: { bg:'#2b1114', accent:'#fb8b72', ink:'#35110e', text:'#fff7f3' },
  mint: { bg:'#092a25', accent:'#6ee7b7', ink:'#07352b', text:'#f0fdf4' },
  monochrome: { bg:'#151515', accent:'#e5e7eb', ink:'#111827', text:'#ffffff' },
  royal: { bg:'#101747', accent:'#f0abfc', ink:'#20103f', text:'#ffffff' },
  orange: { bg:'#2a1708', accent:'#fb923c', ink:'#301707', text:'#fff7ed' },
  ice: { bg:'#10243b', accent:'#bfdbfe', ink:'#10243b', text:'#f8fafc' }
};

/* Owner mode: edit button shows only on devices where the owner logged in, or via yoursite.com/#edit */
const isOwner = () => localStorage.getItem('owner') === '1';
const applyOwner = () => document.body.classList.toggle('owner', isOwner());
applyOwner();

function toast(msg, bad) {
  const t = $('toast'); t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2800);
}
