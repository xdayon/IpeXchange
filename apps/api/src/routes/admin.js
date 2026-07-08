import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';
import { isAllowlistedAdmin } from '../lib/admin.js';

const app = new Hono();

async function requireAdmin(c, next) {
  const user = c.get('user');
  if (!user.is_admin) {
    if (!isAllowlistedAdmin(c.env, user)) return c.json({ error: 'Not found' }, 404);
    await getDb(c.env).from('users').update({ is_admin: true }).eq('id', user.id);
  }
  await next();
}

app.use('/admin/*', requireAuth, requireAdmin, rateLimit(60, 'admin'));

app.get('/admin/metrics', async (c) => {
  const { data, error } = await getDb(c.env).rpc('admin_metrics');
  if (error) {
    console.error('admin_metrics failed:', error);
    return c.json({ error: 'Could not load metrics' }, 500);
  }
  return c.json(data);
});

app.get('/admin/users', async (c) => {
  const limit = Math.min(Number(c.req.query('limit')) || 50, 100);
  const offset = Math.max(Number(c.req.query('offset')) || 0, 0);
  const { data, count, error } = await getDb(c.env)
    .from('users')
    .select(
      'id, display_name, email, telegram_username, wallet, is_admin, created_at, last_seen',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return c.json({ error: 'Could not load users' }, 500);
  return c.json({
    total: count ?? 0,
    users: (data ?? []).map((u) => ({ ...u, has_wallet: u.wallet != null, wallet: undefined })),
  });
});

export default app;
