/* js/state.js */
/* ---------- State ---------- */
let card = null;
let password = sessionStorage.getItem('adminpw') || '';
const $ = (id) => document.getElementById(id);
const THEMES = {
  lime: { bg:'#0b1437', accent:'#c6f432', ink:'#0b1437', text:'#ffffff', surface:'#ffffff', sectionText:'#171717', muted:'#687080', buttonBg:'#0b1437', buttonText:'#ffffff', border:'#e5e7eb' },
  sky: { bg:'#0a1a2f', accent:'#38bdf8', ink:'#06223a', text:'#ffffff', surface:'#ffffff', sectionText:'#17202c', muted:'#64748b', buttonBg:'#0a1a2f', buttonText:'#ffffff', border:'#dbe5ee' },
  rose: { bg:'#2a0a1a', accent:'#fb7185', ink:'#2a0a1a', text:'#ffffff', surface:'#fff8fa', sectionText:'#32131f', muted:'#876b75', buttonBg:'#2a0a1a', buttonText:'#ffffff', border:'#f1dce3' },
  gold: { bg:'#1c1405', accent:'#fbbf24', ink:'#1c1405', text:'#ffffff', surface:'#fffdf7', sectionText:'#211a0d', muted:'#786b52', buttonBg:'#1c1405', buttonText:'#ffffff', border:'#eee5d2' },
  ocean: { bg:'#071e2d', accent:'#22d3ee', ink:'#062333', text:'#f0fdff', surface:'#f5fcfd', sectionText:'#102b35', muted:'#607982', buttonBg:'#062333', buttonText:'#ffffff', border:'#d9e9ec' },
  violet: { bg:'#1b1235', accent:'#a78bfa', ink:'#211044', text:'#ffffff', surface:'#fbf9ff', sectionText:'#211735', muted:'#766d86', buttonBg:'#211044', buttonText:'#ffffff', border:'#e8e1f3' },
  coral: { bg:'#2b1114', accent:'#fb8b72', ink:'#35110e', text:'#fff7f3', surface:'#fffaf8', sectionText:'#321b18', muted:'#8b716c', buttonBg:'#35110e', buttonText:'#ffffff', border:'#f0dfda' },
  mint: { bg:'#092a25', accent:'#6ee7b7', ink:'#07352b', text:'#f0fdf4', surface:'#f7fdf9', sectionText:'#153329', muted:'#698078', buttonBg:'#07352b', buttonText:'#ffffff', border:'#dcece4' },
  monochrome: { bg:'#080808', accent:'#ffffff', ink:'#080808', text:'#ffffff', surface:'#ffffff', sectionText:'#111111', muted:'#666666', buttonBg:'#080808', buttonText:'#ffffff', border:'#e6e6e6' },
  paper: { bg:'#f4f4f2', accent:'#111111', ink:'#111111', text:'#ffffff', surface:'#ffffff', sectionText:'#171717', muted:'#707070', buttonBg:'#111111', buttonText:'#ffffff', border:'#e7e7e4' },
  midnight: { bg:'#050505', accent:'#ffffff', ink:'#ffffff', text:'#ffffff', surface:'#111111', sectionText:'#f5f5f5', muted:'#b0b0b0', buttonBg:'#ffffff', buttonText:'#111111', border:'#303030' },
  royal: { bg:'#101747', accent:'#f0abfc', ink:'#20103f', text:'#ffffff', surface:'#fbf9ff', sectionText:'#211735', muted:'#766d86', buttonBg:'#20103f', buttonText:'#ffffff', border:'#e8e1f3' },
  orange: { bg:'#2a1708', accent:'#fb923c', ink:'#301707', text:'#fff7ed', surface:'#fffaf5', sectionText:'#321f12', muted:'#897565', buttonBg:'#301707', buttonText:'#ffffff', border:'#f0e1d2' },
  ice: { bg:'#10243b', accent:'#bfdbfe', ink:'#10243b', text:'#f8fafc', surface:'#f8fbff', sectionText:'#14263b', muted:'#6b7d91', buttonBg:'#10243b', buttonText:'#ffffff', border:'#dce6f0' }
};

/* Owner mode: edit button shows only on devices where the owner logged in, or via yoursite.com/#edit */
const isOwner = () => localStorage.getItem('owner') === '1';
const applyOwner = () => document.body.classList.toggle('owner', isOwner());
applyOwner();

function toast(msg, bad) {
  const t = $('toast'); t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2800);
}
