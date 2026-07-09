import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';
import { notify } from '../lib/notify.js';

const app = new Hono();

app.post('/intents/:id/interest', requireAuth, rateLimit(15, 'interest'), async (c) => {
  const user = c.get('user');
  const db = getDb(c.env);
  const body = await c.req.json().catch(() => ({}));

  const { data: intent } = await db
    .from('intents')
    .select('id, user_id, title, status')
    .eq('id', c.req.param('id'))
    .maybeSingle();
  if (!intent || intent.status !== 'active') return c.json({ error: 'Not found' }, 404);
  if (intent.user_id === user.id) return c.json({ error: 'Cannot mark interest in your own intent' }, 400);

  const { data: mark, error } = await db
    .from('interest_marks')
    .upsert(
      { intent_id: intent.id, user_id: user.id, message: body.message ?? null },
      { onConflict: 'intent_id,user_id' },
    )
    .select()
    .single();
  if (error) {
    console.error('Interest upsert failed:', error);
    return c.json({ error: 'Could not save interest' }, 500);
  }

  const who = user.display_name || 'Someone';
  const dm =
    `${who} is interested in your intent "${intent.title}".` +
    (body.message ? `\n\nTheir message: ${String(body.message).slice(0, 280)}` : '') +
    '\n\nOpen IpeXchange to follow up.';
  c.executionCtx.waitUntil(
    notify(c.env, {
      userId: intent.user_id,
      type: 'interest_received',
      payload: {
        intent_id: intent.id,
        intent_title: intent.title,
        from_user_id: user.id,
        from_display_name: user.display_name,
        message: body.message ?? null,
      },
      text: dm,
    }),
  );

  return c.json(mark, 201);
});

app.get('/me/interests', requireAuth, async (c) => {
  const user = c.get('user');
  const db = getDb(c.env);

  const [made, received] = await Promise.all([
    db
      .from('interest_marks')
      .select('id, message, created_at, intents ( id, direction, title, price_fiat, image_url, status, user_id )')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    db
      .from('interest_marks')
      .select('id, message, created_at, user_id, intent_id, intents!inner ( id, title, user_id ), users ( id, display_name, avatar_url )')
      .eq('intents.user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (made.error || received.error) {
    console.error('Interests lookup failed:', made.error ?? received.error);
    return c.json({ error: 'Lookup failed' }, 500);
  }
  return c.json({ made: made.data ?? [], received: received.data ?? [] });
});

export default app;
