import { put } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';

export const config = { api: { bodyParser: false } };

function authorized(req) {
  const pw = process.env.ADMIN_PASSWORD;
  const given = req.headers['x-admin-password'];
  if (!pw || typeof given !== 'string') return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authorized(req)) return res.status(401).json({ error: 'Wrong password' });

  try {
    const type = req.headers['content-type'] || 'image/jpeg';
    if (!type.startsWith('image/')) return res.status(400).json({ error: 'Images only' });
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
    const blob = await put(`images/avatar-${Date.now()}.${ext}`, req, {
      access: 'public',
      addRandomSuffix: true,
      contentType: type
    });
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
