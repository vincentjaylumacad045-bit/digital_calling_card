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
  sunrise: { bg:'#fffbea', accent:'#ffa63d', ink:'#1a1208', text:'#111111', surface:'#ffffff', sectionText:'#111111', muted:'#6b7280', buttonBg:'#111111', buttonText:'#ffffff', border:'#ececec' },
  matrix: { bg:'#04100a', accent:'#34f58a', ink:'#04100a', text:'#d7ffe8', surface:'#07170f', sectionText:'#d7ffe8', muted:'#86b79c', buttonBg:'#34f58a', buttonText:'#04100a', border:'#12402a' },
  cream: { bg:'#fff3cf', accent:'#ffd23f', ink:'#111111', text:'#111111', surface:'#ffffff', sectionText:'#111111', muted:'#4d4d4d', buttonBg:'#111111', buttonText:'#ffffff', border:'#111111' },
  legal: { bg:'#0f1a2e', accent:'#c9a227', ink:'#0f1a2e', text:'#ffffff', surface:'#fbfaf6', sectionText:'#1a2233', muted:'#6a6f7c', buttonBg:'#0f1a2e', buttonText:'#ffffff', border:'#e6e1d3' },
  medical: { bg:'#eaf7f8', accent:'#0e9aa7', ink:'#ffffff', text:'#0b2e33', surface:'#ffffff', sectionText:'#0b2e33', muted:'#58767c', buttonBg:'#0e9aa7', buttonText:'#ffffff', border:'#d8ecee' },
  sunset: { bg:'#2b0f2e', accent:'#ff7a59', ink:'#2b0f2e', text:'#fff4ee', surface:'#fff8f4', sectionText:'#35142f', muted:'#8a6a7a', buttonBg:'#2b0f2e', buttonText:'#ffffff', border:'#f3dfe0' },
  forest: { bg:'#0e2418', accent:'#a3e635', ink:'#0e2418', text:'#f1fbe9', surface:'#f8fcf3', sectionText:'#142a1c', muted:'#667a69', buttonBg:'#0e2418', buttonText:'#ffffff', border:'#dfeadb' },
  berry: { bg:'#2a0b2e', accent:'#f472b6', ink:'#2a0b2e', text:'#ffffff', surface:'#fff9fc', sectionText:'#35133b', muted:'#8a6e92', buttonBg:'#2a0b2e', buttonText:'#ffffff', border:'#f1dcf0' },
  peach: { bg:'#fff1e6', accent:'#ff6b35', ink:'#ffffff', text:'#3a1d0f', surface:'#ffffff', sectionText:'#3a1d0f', muted:'#8d6b57', buttonBg:'#3a1d0f', buttonText:'#ffffff', border:'#f6dcc9' },
  lavender: { bg:'#f1ebff', accent:'#7c3aed', ink:'#ffffff', text:'#241449', surface:'#ffffff', sectionText:'#241449', muted:'#6f6590', buttonBg:'#7c3aed', buttonText:'#ffffff', border:'#e1d6fb' },
  espresso: { bg:'#1e1410', accent:'#d6a374', ink:'#1e1410', text:'#fbf3ea', surface:'#fbf6f0', sectionText:'#2a1c14', muted:'#7d6a5c', buttonBg:'#1e1410', buttonText:'#ffffff', border:'#eadfd2' },
  arctic: { bg:'#eef6fb', accent:'#0284c7', ink:'#ffffff', text:'#0b2a3d', surface:'#ffffff', sectionText:'#0b2a3d', muted:'#587487', buttonBg:'#0284c7', buttonText:'#ffffff', border:'#d6e6f0' },
  crimson: { bg:'#1a0508', accent:'#ef4444', ink:'#ffffff', text:'#ffffff', surface:'#fff8f8', sectionText:'#2a0b0f', muted:'#8a6a6e', buttonBg:'#1a0508', buttonText:'#ffffff', border:'#f2dcdc' },
  sand: { bg:'#efe6d6', accent:'#b4691f', ink:'#ffffff', text:'#2b2116', surface:'#fffaf1', sectionText:'#2b2116', muted:'#7a6a55', buttonBg:'#2b2116', buttonText:'#ffffff', border:'#e6d9c3' },
  aqua: { bg:'#06303a', accent:'#2dd4bf', ink:'#06303a', text:'#ecfeff', surface:'#f3fdfc', sectionText:'#0b3a40', muted:'#5f8286', buttonBg:'#06303a', buttonText:'#ffffff', border:'#d3ecea' },
  grape: { bg:'#2e1065', accent:'#e879f9', ink:'#2e1065', text:'#ffffff', surface:'#fcf7ff', sectionText:'#2e1065', muted:'#7d6a99', buttonBg:'#2e1065', buttonText:'#ffffff', border:'#eadcf7' },
  bubblegum: { bg:'#ffe4f1', accent:'#ec4899', ink:'#ffffff', text:'#4a0d2c', surface:'#ffffff', sectionText:'#4a0d2c', muted:'#955a78', buttonBg:'#ec4899', buttonText:'#ffffff', border:'#f8cfe3' },
  graphite: { bg:'#1f2328', accent:'#f59e0b', ink:'#1f2328', text:'#f3f4f6', surface:'#f6f6f7', sectionText:'#1f2328', muted:'#6b7280', buttonBg:'#1f2328', buttonText:'#ffffff', border:'#e1e3e6' },
  emerald: { bg:'#052e1c', accent:'#10b981', ink:'#052e1c', text:'#ecfdf5', surface:'#f6fdf9', sectionText:'#073b25', muted:'#5f8272', buttonBg:'#052e1c', buttonText:'#ffffff', border:'#d3ebdf' },
  ruby: { bg:'#fff0f0', accent:'#be123c', ink:'#ffffff', text:'#3f0a17', surface:'#ffffff', sectionText:'#3f0a17', muted:'#8d5a63', buttonBg:'#be123c', buttonText:'#ffffff', border:'#f6d5da' },
  denim: { bg:'#16263f', accent:'#7aa7ff', ink:'#10203a', text:'#f4f8ff', surface:'#f6f9ff', sectionText:'#16263f', muted:'#62748f', buttonBg:'#16263f', buttonText:'#ffffff', border:'#d9e2f1' },
  noir: { bg:'#0a0a0a', accent:'#d4af37', ink:'#0a0a0a', text:'#f5f0e1', surface:'#141414', sectionText:'#f5f0e1', muted:'#a89f85', buttonBg:'#d4af37', buttonText:'#0a0a0a', border:'#2a2a2a' },
  slate: { bg:'#e6e9ee', accent:'#111827', ink:'#ffffff', text:'#111827', surface:'#ffffff', sectionText:'#111827', muted:'#5b6472', buttonBg:'#111827', buttonText:'#ffffff', border:'#dfe3e9' }
};
const THEME_NAMES = { lime:'Lime', sky:'Sky', rose:'Rose', gold:'Gold', ocean:'Ocean', violet:'Violet', coral:'Coral', mint:'Mint', monochrome:'Mono', paper:'Paper', midnight:'Midnight', royal:'Royal', orange:'Orange', ice:'Ice', cobalt:'Cobalt', blush:'Blush', slate:'Slate', sunrise:'Sunrise', matrix:'Matrix', cream:'Cream', legal:'Legal', medical:'Medical', sunset:'Sunset', forest:'Forest', berry:'Berry', peach:'Peach', lavender:'Lavender', espresso:'Espresso', arctic:'Arctic', crimson:'Crimson', sand:'Sand', aqua:'Aqua', grape:'Grape', bubblegum:'Bubblegum', graphite:'Graphite', emerald:'Emerald', ruby:'Ruby', denim:'Denim', noir:'Noir' };
const THEME_FALLBACK = { bg:'#0b1437', accent:'#c6f432', ink:'#0b1437', text:'#ffffff', font:"'Schibsted Grotesk', system-ui, sans-serif", surface:'#ffffff', sectionText:'#171717', muted:'#687080', buttonBg:'#0b1437', buttonText:'#ffffff', border:'#e5e7eb' };

/* ---------- Layouts ---------- */
const LAYOUTS = [
  { id:'tap', name:'Studio', hint:'Photo header with the content sheet sliding over it. The default.' },
  { id:'cards', name:'Cards', hint:'Dark page with each section in its own floating card.' },
  { id:'editorial', name:'Editorial', hint:'Large serif name, hairlines, and label-and-value rows.' },
  { id:'minimal', name:'Minimal', hint:'One continuous page with no boxes. Calm and quiet.' },
  { id:'poster', name:'Poster', hint:'Loud type on your accent color with an angled photo edge.' },
  { id:'compact', name:'Compact', hint:'Small portrait beside your name. Contact details come first.' },
  { id:'glass', name:'Glass', hint:'Your photo stays fixed while frosted panels slide over it.' },
  { id:'duo', name:'Duo', hint:'Two-tone header with the portrait sitting on the color break.' },
  { id:'story', name:'Story', hint:'Tall, full-screen photo with your quick actions floating on it.' },
  { id:'bento', name:'Bento', hint:'A big call button beside tidy tiles. Modern and tactile.' },
  { id:'timeline', name:'Timeline', hint:'Sections hang off a vertical rail with accent markers.' },
  { id:'badge', name:'Badge', hint:'Your header becomes an ID badge with a lanyard slot.' },
  { id:'neon', name:'Neon', hint:'Dark and glowing: gradient name and luminous outlines.' },
  { id:'portfolio', name:'Portfolio', hint:'Sticky top bar with Let\u2019s Talk, dotted photo, social icons and a big \u201CHey there\u201D headline.' },
  { id:'aurora', name:'Aurora', hint:'Soft glowing gradient background with a ringed photo and frosted cards.' },
  { id:'brutal', name:'Brutalist', hint:'Thick outlines, hard shadows and loud sticker-style type.' },
  { id:'spotlight', name:'Spotlight', hint:'Centered, pulsing halo around your photo with round action buttons.' },
  { id:'creator', name:'Creator', hint:'Link-in-bio style: round photo and big tappable pill buttons.' },
  { id:'storefront', name:'Storefront', hint:'Shops and restaurants: cover banner, overlapping logo and a bold order button.' },
  { id:'sunset', name:'Sunset', hint:'Warm full-page gradient with a thick white photo ring and frosted cards.' },
  { id:'counsel', name:'Counsel', hint:'Attorneys, advisors and consultants: serif type, gold rules and a framed portrait.' },
  { id:'clinic', name:'Clinic', hint:'Doctors, dentists and therapists: clean and calm with a verified badge and a booking button.' },
  { id:'agent', name:'Agent', hint:'Realtors, agents and sales: a large photo with a floating name card.' },
  { id:'swiss', name:'Swiss', hint:'Numbered editorial sections, hard rules and a large uppercase name.' },
  { id:'luxe', name:'Luxe', hint:'Black and gold with a framed arch portrait. Elegant and premium.' },
  { id:'soft', name:'Soft', hint:'Gentle raised surfaces and pressed fields. Calm and tactile.' },
  { id:'terminal', name:'Terminal', hint:'A code-editor window: monospace type and a blinking cursor.' }
];
/* Layout names saved by older versions map onto the new set so existing cards keep working */
const LEGACY_LAYOUTS = { classic:'cards', centered:'cards', split:'editorial', stacked:'cards', signature:'editorial', frame:'cards', banner:'tap', 'portrait-focus':'tap' };
const normLayout = (l) => (LAYOUTS.some((x) => x.id === l) ? l : (LEGACY_LAYOUTS[l] || 'tap'));
const PROFILE_STYLES = ['full', 'circle', 'portrait', 'square', 'side', 'arch', 'hexagon', 'blob', 'polaroid', 'wide'];

/* ---------- Sections and quick actions ---------- */
const SECTION_DEFS = [
  { key:'about', label:'About' }, { key:'stats', label:'Numbers' }, { key:'video', label:'Video' }, { key:'map', label:'Map' }, { key:'highlights', label:'Highlights' }, { key:'skills', label:'Skills' }, { key:'services', label:'Services' }, { key:'faq', label:'FAQ' }, { key:'quote', label:'Testimonial' }, { key:'hours', label:'Hours' }, { key:'contact', label:'Contact' }, { key:'message', label:'Message form' }, { key:'links', label:'Links' }
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
  { id:'inter', label:'Inter', name:"'Inter', system-ui, sans-serif", body:"'Inter', system-ui, sans-serif" },
  { id:'mono', label:'Mono', name:"'JetBrains Mono', 'Roboto Mono', monospace", body:"'JetBrains Mono', 'Roboto Mono', monospace" },
  { id:'friendly', label:'Friendly', name:"'Poppins', sans-serif", body:"'Poppins', system-ui, sans-serif" }
];

/* Used when the API cannot be reached (for example when previewing the files locally) */
const FALLBACK_CARD = {
  name:'Kevin Smith', title:'Sr. Marketing Manager', about:'I lead marketing at D. Agency, helping local brands tell their story and grow.',
  achievements:'Creative direction\nBrand strategy\nEnglish · Filipino', phone:'+63 900 000 0000', email:'you@example.com', whatsapp:'+63 900 000 0000',
  website:'https://example.com', location:'Davao, Philippines', socials:[{ label:'Facebook', url:'https://facebook.com/' }, { label:'Instagram', url:'https://instagram.com/' }],
  avatar:'', layout:'tap', profileStyle:'full', theme:{ ...THEME_FALLBACK },
  greeting:'\u{1F44B} Hey there,', intro:'It\u2019s', talkLabel:'Let\u2019s Talk',
  stats:[{ value:'8+', label:'Years' }, { value:'120+', label:'Projects' }, { value:'40+', label:'Clients' }],
  video:'', videoCaption:'', banner:'', bannerUrl:'', mapOn:'', verified:'',
  faq:[{ q:'How do I get in touch?', a:'Tap Call, WhatsApp or Email above and I will reply as soon as I can.' }, { q:'Where are you based?', a:'See the Directions button for the exact location.' }],
  skills:[{ name:'Brand strategy', level:92 }, { name:'Social media', level:85 }, { name:'Copywriting', level:78 }]
};

/* Owner mode: edit button shows only on devices where the owner logged in, or via yoursite.com/#edit */
const isOwner = () => localStorage.getItem('owner') === '1';
const applyOwner = () => document.body.classList.toggle('owner', isOwner());
applyOwner();

function toast(msg, bad) {
  const t = $('toast'); t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2800);
}


/* ---------- One-tap templates: layout + photo shape + theme + fonts (your content is never touched) ---------- */
const TEMPLATES = [
  { id:'executive', name:'Executive', layout:'editorial', shape:'full', theme:'slate', pair:'editorial' },
  { id:'creative', name:'Creative', layout:'poster', shape:'full', theme:'lime', pair:'modern' },
  { id:'founder', name:'Founder', layout:'tap', shape:'full', theme:'midnight', pair:'editorial' },
  { id:'realtor', name:'Realtor', layout:'glass', shape:'full', theme:'ocean', pair:'classic' },
  { id:'counsel', name:'Counsel', layout:'editorial', shape:'portrait', theme:'paper', pair:'classic' },
  { id:'wellness', name:'Wellness', layout:'duo', shape:'blob', theme:'mint', pair:'luxe' },
  { id:'studio', name:'Studio Pro', layout:'bento', shape:'arch', theme:'violet', pair:'modern' },
  { id:'local', name:'Local Shop', layout:'story', shape:'full', theme:'orange', pair:'friendly' },
  { id:'tech', name:'Tech', layout:'neon', shape:'hexagon', theme:'ocean', pair:'tech' },
  { id:'consultant', name:'Consultant', layout:'timeline', shape:'circle', theme:'cobalt', pair:'modern' },
  { id:'badge', name:'ID Badge', layout:'badge', shape:'square', theme:'royal', pair:'tech' },
  { id:'mono', name:'Black & White', layout:'minimal', shape:'portrait', theme:'monochrome', pair:'editorial' },
  { id:'classic', name:'Classic Cards', layout:'cards', shape:'circle', theme:'gold', pair:'classic' },
  { id:'compact', name:'Compact Pro', layout:'compact', shape:'circle', theme:'sky', pair:'friendly' },
  { id:'blush', name:'Blush', layout:'duo', shape:'arch', theme:'blush', pair:'luxe' },
  { id:'polaroid', name:'Polaroid', layout:'tap', shape:'polaroid', theme:'coral', pair:'friendly' },
  { id:'portfolio', name:'Portfolio', layout:'portfolio', shape:'circle', theme:'sunrise', pair:'inter' },
  { id:'portfolio2', name:'Portfolio Lime', layout:'portfolio', shape:'circle', theme:'lime', pair:'inter' },
  { id:'aurora', name:'Aurora', layout:'aurora', shape:'circle', theme:'violet', pair:'modern' },
  { id:'aurora2', name:'Northern Lights', layout:'aurora', shape:'blob', theme:'mint', pair:'luxe' },
  { id:'brutal', name:'Brutalist', layout:'brutal', shape:'square', theme:'cream', pair:'modern' },
  { id:'spotlight', name:'Spotlight', layout:'spotlight', shape:'circle', theme:'blush', pair:'friendly' },
  { id:'spotlight2', name:'Spotlight Dark', layout:'spotlight', shape:'circle', theme:'midnight', pair:'modern' },
  { id:'creator', name:'Creator', layout:'creator', shape:'circle', theme:'lavender', pair:'friendly' },
  { id:'creator2', name:'Creator Dark', layout:'creator', shape:'circle', theme:'berry', pair:'modern' },
  { id:'storefront', name:'Storefront', layout:'storefront', shape:'square', theme:'peach', pair:'friendly' },
  { id:'cafe', name:'Cafe', layout:'storefront', shape:'circle', theme:'espresso', pair:'luxe' },
  { id:'sunset', name:'Sunset', layout:'sunset', shape:'circle', theme:'sunset', pair:'modern' },
  { id:'forestcard', name:'Forest', layout:'portfolio', shape:'circle', theme:'forest', pair:'inter' },
  { id:'arcticcard', name:'Arctic', layout:'clinic', shape:'circle', theme:'arctic', pair:'inter' },
  { id:'crimsoncard', name:'Crimson', layout:'aurora', shape:'circle', theme:'crimson', pair:'modern' },
  { id:'attorney', name:'Attorney', layout:'counsel', shape:'portrait', theme:'legal', pair:'classic' },
  { id:'lawfirm', name:'Law Ivory', layout:'counsel', shape:'square', theme:'gold', pair:'luxe' },
  { id:'doctor', name:'Doctor', layout:'clinic', shape:'circle', theme:'medical', pair:'modern' },
  { id:'dentist', name:'Wellness', layout:'clinic', shape:'circle', theme:'mint', pair:'friendly' },
  { id:'realtor', name:'Realtor', layout:'agent', shape:'portrait', theme:'cobalt', pair:'modern' },
  { id:'consultant', name:'Consultant', layout:'agent', shape:'portrait', theme:'slate', pair:'inter' },
  { id:'terminal', name:'Terminal', layout:'terminal', shape:'square', theme:'matrix', pair:'mono' }
];
