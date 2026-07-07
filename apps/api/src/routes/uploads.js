import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../lib/supabase.js';

const app = new Hono();

const BUCKET = 'listing-images';
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

app.post('/uploads', requireAuth, async (c) => {
  const user = c.get('user');
  const form = await c.req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') return c.json({ error: 'file field is required (multipart/form-data)' }, 400);

  const ext = TYPES[file.type];
  if (!ext) return c.json({ error: 'Only jpeg, png, webp or gif images are accepted' }, 415);
  if (file.size > MAX_BYTES) return c.json({ error: 'Image must be 5MB or smaller' }, 413);

  const db = getDb(c.env);
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(path, await file.arrayBuffer(), {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.error('Upload failed:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return c.json({ url: data.publicUrl, path }, 201);
});

export default app;
