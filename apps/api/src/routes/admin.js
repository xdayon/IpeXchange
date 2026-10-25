import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';
import { isAllowlistedAdmin } from '../lib/admin.js';
import { syncPrivyEmail } from '../lib/privy.js';
import { notifyNewLoops } from '../lib/matching.js';

const app = new Hono();

async function requireAdmin(c, next) {
  const user = c.get('user');
  if (!user.is_admin) {
    const db = getDb(c.env);
    const verifiedEmail = await syncPrivyEmail(c.env, db, user);
    if (!isAllowlistedAdmin(c.env, user, verifiedEmail)) {
      return c.json({ error: 'Not found' }, 404);
    }
    const { error } = await db.from('users').update({ is_admin: true }).eq('id', user.id);
    if (error) return c.json({ error: 'Could not grant admin access' }, 500);
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

app.get('/admin/nexum-funnel', async (c) => {
  const { data, error } = await getDb(c.env).rpc('nexum_funnel');
  if (error) return c.json({ error: 'Could not load Nexum funnel' }, 500);
  return c.json(data);
});

// Clearing round for live events: packs disjoint trade loops across the
// whole market. Preview with dry_run, then publish them as suggestions.
app.post('/admin/clearing', rateLimit(10, 'admin-clearing'), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const maxHops = Math.min(Math.max(Number(body.max_hops) || 6, 2), 7);
  const dryRun = body.dry_run !== false;
  const db = getDb(c.env);
  const { data: round, error } = await db.rpc('run_clearing_round', {
    p_max_hops: maxHops, p_dry_run: dryRun,
  });
  if (error) {
    console.error('run_clearing_round failed:', error);
    return c.json({ error: 'Clearing round failed' }, 500);
  }

  const loops = round.selected ?? [];
  const userIds = [...new Set(loops.flatMap((loop) => loop.participants.map((p) => p.user_id)))];
  const { data: users } = userIds.length
    ? await db.from('users').select('id, display_name').in('id', userIds)
    : { data: [] };
  const names = new Map((users ?? []).map((u) => [u.id, u.display_name || 'Member']));
  const selected = loops.map((loop) => ({
    cycle_id: loop.cycle_id ?? null,
    hops: loop.hops,
    score: loop.score,
    participants: loop.participants.map((p) => ({
      user_id: p.user_id,
      display_name: names.get(p.user_id) ?? 'Member',
      position: p.position,
      gives_intent_id: p.gives_intent_id,
      gives_title: p.gives_title,
      receives_intent_id: p.receives_intent_id,
      receives_title: p.receives_title,
    })),
  }));

  const published = loops.filter((loop) => loop.cycle_id).map((loop) => ({ ...loop, id: loop.cycle_id }));
  if (published.length) c.executionCtx.waitUntil(notifyNewLoops(c.env, published));
  return c.json({ candidates: round.candidates, created: round.created, selected });
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
