import { put, list } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';

const DEFAULT_CARD = {
  name: 'Kevin Smith',
  title: 'Sr. Marketing Manager',
  about: 'I am John Doe, working as marketing manager at D. Agency.',
  achievements: 'Creative direction\nBrand strategy\nEnglish · Filipino',
  phone: '+63 900 000 0000',
  email: 'you@example.com',
  whatsapp: '+63 900 000 0000',
  website: 'https://example.com',
  location: 'Davao, Philippines',
  socials: [
    { label: 'Facebook', url: 'https://facebook.com/' },
    { label: 'Instagram', url: 'https://instagram.com/' }
  ],
  avatar: '',
  layout: 'tap',
  profileStyle: 'full',
  theme: {
    bg: '#0b1437',
    accent: '#c6f432',
    ink: '#0b1437',
    text: '#ffffff',
    font: "'Schibsted Grotesk', system-ui, sans-serif",
    surface: '#ffffff', sectionText: '#171717', muted: '#707070',
    buttonBg: '#080808', buttonText: '#ffffff', border: '#e9e9e9'
  }
};

function authorized(req) {
  const pw = process.env.ADMIN_PASSWORD;
  const given = req.headers['x-admin-password'];
  if (!pw || typeof given !== 'string') return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Anyone can VIEW the card
  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: 'card.json' });
      const b = blobs.find((x) => x.pathname === 'card.json');
      if (!b) return res.status(200).json(DEFAULT_CARD);
      const r = await fetch(b.url + '?t=' + Date.now());
      const saved = await r.json();
      return res.status(200).json({
        ...DEFAULT_CARD,
        ...saved,
        theme: { ...DEFAULT_CARD.theme, ...(saved.theme || {}) }
      });
    } catch (e) {
      return res.status(200).json(DEFAULT_CARD);
    }
  }

  // Only the OWNER (with the password) can SAVE
  if (req.method === 'POST') {
    if (!authorized(req)) return res.status(401).json({ error: 'Wrong password' });
    if (req.query.verify) return res.status(200).json({ ok: true });
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'Invalid card data' });
      const serialized = JSON.stringify(data);
      if (serialized.length > 500000) return res.status(413).json({ error: 'Card data is too large' });
      const allowedLayouts = ['tap','cards','editorial','minimal','poster','compact','classic','centered','split','stacked','signature','frame','banner','portrait-focus'];
      const allowedProfiles = ['circle','full','portrait','square','side'];
      if (data.layout && !allowedLayouts.includes(data.layout)) return res.status(400).json({ error: 'Invalid layout' });
      if (data.profileStyle && !allowedProfiles.includes(data.profileStyle)) return res.status(400).json({ error: 'Invalid profile image style' });
      if (data.motion && !['cinematic','subtle','off'].includes(data.motion)) return res.status(400).json({ error: 'Invalid motion setting' });
      if (data.sections && !Array.isArray(data.sections)) return res.status(400).json({ error: 'Invalid sections' });
      if (data.quick && !Array.isArray(data.quick)) return res.status(400).json({ error: 'Invalid quick actions' });
      if (data.theme && (typeof data.theme !== 'object' || Array.isArray(data.theme))) return res.status(400).json({ error: 'Invalid theme settings' });
      await put('card.json', JSON.stringify(data), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 0
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
