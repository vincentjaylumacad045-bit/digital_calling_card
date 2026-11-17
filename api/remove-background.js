import { timingSafeEqual } from 'node:crypto';

export const config = { api: { bodyParser: false } };
function authorized(req) {
  const pw = process.env.ADMIN_PASSWORD;
  const given = req.headers['x-admin-password'];
  if (!pw || typeof given !== 'string') return false;
  const a = Buffer.from(pw), b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authorized(req)) return res.status(401).json({ error: 'Wrong password' });
  const key = process.env.REMOVEBG_API_KEY;
  if (!key) return res.status(503).json({ error: 'Background removal is not configured yet. Add REMOVEBG_API_KEY in Vercel Environment Variables.' });
  try {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const image = Buffer.concat(chunks);
    if (!image.length || image.length > 10 * 1024 * 1024) return res.status(400).json({ error: 'Upload an image under 10 MB.' });
    const form = new FormData();
    form.append('image_file', new Blob([image], { type: req.headers['content-type'] || 'image/jpeg' }), 'profile-image');
    form.append('size', 'auto');
    form.append('format', 'png');
    const response = await fetch('https://api.remove.bg/v1.0/removebg', { method: 'POST', headers: { 'X-Api-Key': key }, body: form });
    if (!response.ok) { const msg = await response.text(); return res.status(response.status === 402 ? 402 : 502).json({ error: response.status === 402 ? 'Your remove.bg account has no remaining credits.' : `Background removal failed: ${msg.slice(0, 220)}` }); }
    const out = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(out);
  } catch (e) { return res.status(500).json({ error: e.message || 'Background removal failed.' }); }
}
