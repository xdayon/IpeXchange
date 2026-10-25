import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';
import { findCycles, matchAndNotify, notifyNewLoops, persistLoops } from '../lib/matching.js';

const app = new Hono();

const DECK_FIELDS =
  'id, title, description, kind, category, price_fiat, image_url, transaction_mode, ' +
  'is_continuous, users ( id, display_name, avatar_url )';

export function reasonLabel(row) {
  if (row.reason === 'matches_interest' && row.want_title) {
    return `Matches your Interest: ${row.want_title}`;
  }
  if (row.reason === 'wants_your_offer' && row.offer_title) {
    return `Wants your Offer: ${row.offer_title}`;
  }
  return 'New in the market';
}

// Offers to swipe on, best first (see swipe_deck in migration 0023).
app.get('/deck', requireAuth, rateLimit(60, 'deck'), async (c) => {
  const user = c.get('user');
  const limit = Math.min(Math.max(Number(c.req.query('limit')) || 20, 1), 50);
  const db = getDb(c.env);
  const { data: ranked, error } = await db.rpc('swipe_deck', { p_user: user.id, p_limit: limit });
  if (error) {
    console.error('swipe_deck failed:', error);
    return c.json({ error: 'Deck unavailable' }, 500);
  }
  if (!ranked?.length) return c.json({ cards: [] });

  const { data: rows, error: rowsError } = await db
    .from('intents')
    .select(DECK_FIELDS)
    .in('id', ranked.map((r) => r.id));
  if (rowsError) return c.json({ error: 'Deck unavailable' }, 500);
  const byId = new Map((rows ?? []).map((row) => [row.id, row]));

  const cards = ranked.filter((r) => byId.has(r.id)).map((r) => {
    const { users: owner, ...intent } = byId.get(r.id);
    return {
      ...intent,
      owner: { id: owner?.id ?? null, display_name: owner?.display_name || 'Member', avatar_url: owner?.avatar_url ?? null },
      reason: r.reason,
      reason_label: reasonLabel(r),
      score: Math.round(Number(r.score) * 1000) / 1000,
    };
  });
  return c.json({ cards });
});

async function loadSwipeTarget(db, offerId) {
  const { data } = await db
    .from('intents')
    .select('id, user_id, direction, status, transaction_mode')
    .eq('id', offerId)
    .maybeSingle();
  return data;
}

// "I would take this Offer" (accept) or "not for me" (pass). An accept
// becomes an explicit loop edge, so the matcher runs right away and the
// response can celebrate a loop it closed.
app.post('/intents/:id/swipe', requireAuth, rateLimit(120, 'swipe'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  if (!['accept', 'pass'].includes(body?.decision)) {
    return c.json({ error: 'decision must be accept or pass' }, 400);
  }
  const db = getDb(c.env);
  const offer = await loadSwipeTarget(db, c.req.param('id'));
  if (!offer || offer.direction !== 'offer' || offer.status !== 'active') {
    return c.json({ error: 'Not found' }, 404);
  }
  if (offer.user_id === user.id) return c.json({ error: 'Cannot swipe your own Offer' }, 400);

  const { error } = await db
    .from('intent_swipes')
    .upsert({ user_id: user.id, offer_id: offer.id, decision: body.decision },
      { onConflict: 'user_id,offer_id' });
  if (error) {
    console.error('Swipe upsert failed:', error);
    return c.json({ error: 'Could not save your choice' }, 500);
  }

  let created = [];
  if (body.decision === 'accept' && offer.transaction_mode !== 'buy_now') {
    created = await persistLoops(c.env, await findCycles(c.env, user.id));
    if (created.length) c.executionCtx.waitUntil(notifyNewLoops(c.env, created));
  }
  return c.json({
    ok: true,
    decision: body.decision,
    new_loops: created.map((loop) => ({ id: loop.id, hops: loop.hops, score: loop.score })),
  });
});

app.delete('/intents/:id/swipe', requireAuth, rateLimit(120, 'swipe'), async (c) => {
  const user = c.get('user');
  const { error } = await getDb(c.env)
    .from('intent_swipes')
    .delete()
    .eq('user_id', user.id)
    .eq('offer_id', c.req.param('id'));
  if (error) return c.json({ error: 'Could not undo' }, 500);
  // Undoing a pass may reopen loops through this member.
  c.executionCtx.waitUntil(matchAndNotify(c.env, user.id));
  return c.json({ ok: true });
});

app.get('/me/radar', requireAuth, rateLimit(30, 'radar'), async (c) => {
  const { data, error } = await getDb(c.env).rpc('loop_radar', { p_user: c.get('user').id });
  if (error) {
    console.error('loop_radar failed:', error);
    return c.json({ error: 'Radar unavailable' }, 500);
  }
  return c.json(data);
});

export default app;
