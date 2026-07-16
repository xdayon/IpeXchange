import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';

const app = new Hono();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function notificationLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, parsed));
}

export function notificationCursor(value) {
  if (!value) return null;
  const separator = value.lastIndexOf('|');
  if (separator < 1) return null;
  const timestamp = value.slice(0, separator);
  const id = value.slice(separator + 1);
  const time = Date.parse(timestamp);
  if (!Number.isFinite(time) || !UUID_RE.test(id)) return null;
  return { createdAt: new Date(time).toISOString(), id: id.toLowerCase() };
}

export function readRequest(body) {
  if (body?.all === true && body.ids === undefined) return { all: true, ids: [] };
  if (body && Object.hasOwn(body, 'all')) return null;
  if (!Array.isArray(body?.ids) || body.ids.length < 1 || body.ids.length > MAX_LIMIT) return null;
  if (!body.ids.every((id) => typeof id === 'string' && UUID_RE.test(id))) return null;
  return { all: false, ids: [...new Set(body.ids.map((id) => id.toLowerCase()))] };
}

function nextCursor(row) {
  return `${row.created_at}|${row.id}`;
}

app.get('/me/notifications', requireAuth, rateLimit(120, 'notifications-list'), async (c) => {
  const user = c.get('user');
  const limit = notificationLimit(c.req.query('limit'));
  const rawCursor = c.req.query('cursor');
  const cursor = notificationCursor(rawCursor);
  if (rawCursor && !cursor) return c.json({ error: 'Invalid notification cursor' }, 400);

  let query = getDb(c.env)
    .from('notifications')
    .select('id, type, payload, telegram_sent, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);
  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('Notification lookup failed:', error);
    return c.json({ error: 'Could not load notifications' }, 500);
  }
  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const notifications = rows.slice(0, limit);
  return c.json({
    notifications,
    next_cursor: hasMore ? nextCursor(notifications[notifications.length - 1]) : null,
  });
});

app.get('/me/notifications/unread-count', requireAuth, rateLimit(120, 'notifications-count'), async (c) => {
  const { count, error } = await getDb(c.env)
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', c.get('user').id)
    .is('read_at', null);
  if (error) return c.json({ error: 'Could not load notification count' }, 500);
  return c.json({ unread_count: count ?? 0 });
});

app.post('/me/notifications/read', requireAuth, rateLimit(30, 'notifications-read'), async (c) => {
  const request = readRequest(await c.req.json().catch(() => null));
  if (!request) return c.json({ error: 'Provide all: true or up to 50 notification IDs' }, 400);

  const readAt = new Date().toISOString();
  let query = getDb(c.env)
    .from('notifications')
    .update({ read_at: readAt })
    .eq('user_id', c.get('user').id)
    .is('read_at', null);
  if (!request.all) query = query.in('id', request.ids);
  const { data, error } = await query.select('id');
  if (error) return c.json({ error: 'Could not mark notifications as read' }, 500);
  return c.json({ updated: data?.length ?? 0, read_at: readAt });
});

export default app;
