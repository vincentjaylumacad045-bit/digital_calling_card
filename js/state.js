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
  ice: { bg:'#10243b', accent:'#bfdbfe', ink:'#10243b', text:'#f8fafc', surface:'#f8fbff', sectionText:'#14263b', muted:'#6b7d91', buttonBg:'#10243b', buttonText:'#ffffff', border:'#dce6f0' },
  cobalt: { bg:'#e8edff', accent:'#2f4bff', ink:'#ffffff', text:'#0d1440', surface:'#ffffff', sectionText:'#0d1440', muted:'#55608f', buttonBg:'#2f4bff', buttonText:'#ffffff', border:'#dde3ff' },
  blush: { bg:'#fde9ec', accent:'#e11d48', ink:'#ffffff', text:'#3b0d1f', surface:'#fffafb', sectionText:'#3b0d1f', muted:'#8a5566', buttonBg:'#3b0d1f', buttonText:'#ffffff', border:'#f6d6dc' },
  slate: { bg:'#e6e9ee', accent:'#111827', ink:'#ffffff', text:'#111827', surface:'#ffffff', sectionText:'#111827', muted:'#5b6472', buttonBg:'#111827', buttonText:'#ffffff', border:'#dfe3e9' }
};
const THEME_NAMES = { lime:'Lime', sky:'Sky', rose:'Rose', gold:'Gold', ocean:'Ocean', violet:'Violet', coral:'Coral', mint:'Mint', monochrome:'Mono', paper:'Paper', midnight:'Midnight', royal:'Royal', orange:'Orange', ice:'Ice', cobalt:'Cobalt', blush:'Blush', slate:'Slate' };
const THEME_FALLBACK = { bg:'#0b1437', accent:'#c6f432', ink:'#0b1437', text:'#ffffff', font:"'Schibsted Grotesk', system-ui, sans-serif", surface:'#ffffff', sectionText:'#171717', muted:'#687080', buttonBg:'#0b1437', buttonText:'#ffffff', border:'#e5e7eb' };

/* ---------- Layouts ---------- */
const LAYOUTS = [
  { id:'tap', name:'Studio', hint:'Photo header with the content sheet sliding over it. The default.' },
  { id:'cards', name:'Cards', hint:'Dark page with each section in its own floating card.' },
  { id:'editorial', name:'Editorial', hint:'Large serif name, hairlines, and label-and-value rows.' },
  { id:'minimal', name:'Minimal', hint:'One continuous page with no boxes. Calm and quiet.' },
  { id:'poster', name:'Poster', hint:'Loud type on your accent color with an angled photo edge.' },
  { id:'compact', name:'Compact', hint:'Small portrait beside your name. Contact details come first.' }
];
/* Layout names saved by older versions map onto the new set so existing cards keep working */
const LEGACY_LAYOUTS = { classic:'cards', centered:'cards', split:'editorial', stacked:'cards', signature:'editorial', frame:'cards', banner:'tap', 'portrait-focus':'tap' };
const normLayout = (l) => (LAYOUTS.some((x) => x.id === l) ? l : (LEGACY_LAYOUTS[l] || 'tap'));
const PROFILE_STYLES = ['full', 'circle', 'portrait', 'square', 'side'];

/* ---------- Sections and quick actions ---------- */
const SECTION_DEFS = [
  { key:'about', label:'About' }, { key:'highlights', label:'Highlights' }, { key:'contact', label:'Contact' }, { key:'links', label:'Links' }
];
function getSections() {
  const saved = Array.isArray(card.sections) ? card.sections : [], out = [];
  saved.forEach((s) => { if (SECTION_DEFS.some((d) => d.key === s.key) && !out.some((o) => o.key === s.key)) out.push({ key:s.key, visible:s.visible !== false }); });
  SECTION_DEFS.forEach((d) => { if (!out.some((o) => o.key === d.key)) out.push({ key:d.key, visible:true }); });
  return out;
}
const QUICK_DEFS = [
  { key:'call', label:'Call', icon:'phone' }, { key:'whatsapp', label:'WhatsApp', icon:'whatsapp' }, { key:'email', label:'Email', icon:'mail' },
  { key:'map', label:'Directions', icon:'pin' }, { key:'web', label:'Website', icon:'globe' }
];
const DEFAULT_QUICK = ['call', 'whatsapp', 'email', 'map'];

/* Font pairings: [label, name font, body font] */
const PAIRS = [
  { id:'editorial', label:'Editorial', name:"'Instrument Serif', Georgia, serif", body:"'Schibsted Grotesk', system-ui, sans-serif" },
  { id:'modern', label:'Modern', name:"'Bricolage Grotesque', sans-serif", body:"'Schibsted Grotesk', system-ui, sans-serif" },
  { id:'classic', label:'Classic', name:"'Playfair Display', serif", body:"'DM Sans', sans-serif" },
  { id:'luxe', label:'Luxe', name:"'Cormorant Garamond', serif", body:"'Manrope', sans-serif" },
  { id:'tech', label:'Technical', name:"'Space Grotesk', sans-serif", body:"'Space Grotesk', sans-serif" },
  { id:'friendly', label:'Friendly', name:"'Poppins', sans-serif", body:"'Poppins', system-ui, sans-serif" }
];

/* Used when the API cannot be reached (for example when previewing the files locally) */
const FALLBACK_CARD = {
  name:'Kevin Smith', title:'Sr. Marketing Manager', about:'I lead marketing at D. Agency, helping local brands tell their story and grow.',
  achievements:'Creative direction\nBrand strategy\nEnglish · Filipino', phone:'+63 900 000 0000', email:'you@example.com', whatsapp:'+63 900 000 0000',
  website:'https://example.com', location:'Davao, Philippines', socials:[{ label:'Facebook', url:'https://facebook.com/' }, { label:'Instagram', url:'https://instagram.com/' }],
  avatar:'', layout:'tap', profileStyle:'full', theme:{ ...THEME_FALLBACK }
};

/* Owner mode: edit button shows only on devices where the owner logged in, or via yoursite.com/#edit */
const isOwner = () => localStorage.getItem('owner') === '1';
const applyOwner = () => document.body.classList.toggle('owner', isOwner());
applyOwner();

function toast(msg, bad) {
  const t = $('toast'); t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2800);
}
