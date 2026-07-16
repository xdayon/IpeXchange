import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';
import { LISTING_IMAGE_BUCKET } from '../lib/listingImages.js';

const app = new Hono();

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

function matchesMagicBytes(type, bytes) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (type === 'image/gif') return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  if (type === 'image/webp') {
    const riff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const webp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    return riff && webp;
  }
  return false;
}

app.post('/uploads', requireAuth, rateLimit(10, 'uploads'), async (c) => {
  const user = c.get('user');
  const form = await c.req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') return c.json({ error: 'file field is required (multipart/form-data)' }, 400);

  const ext = TYPES[file.type];
  if (!ext) return c.json({ error: 'Only jpeg, png, webp or gif images are accepted' }, 415);
  if (file.size > MAX_BYTES) return c.json({ error: 'Image must be 5MB or smaller' }, 413);

  const buffer = await file.arrayBuffer();
  if (!matchesMagicBytes(file.type, new Uint8Array(buffer))) {
    return c.json({ error: 'File content does not match the declared image type' }, 415);
  }

  const db = getDb(c.env);
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(LISTING_IMAGE_BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.error('Upload failed:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }

  const { data } = db.storage.from(LISTING_IMAGE_BUCKET).getPublicUrl(path);
  return c.json({ url: data.publicUrl, path }, 201);
});

export default app;
