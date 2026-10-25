import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';
import { safeCreateReceipt } from '../lib/receipts.js';
import { loopLabel, matchAndNotify, notifyCycle } from '../lib/matching.js';
import { notifyMany } from '../lib/notify.js';

const app = new Hono();

const PARTICIPANT_FIELDS = `
  id, user_id, position, acceptance, delivered_at, received_at,
  users ( id, display_name, avatar_url, telegram_username ),
  gives:intents!trade_cycle_participants_gives_intent_id_fkey ( id, title, price_fiat, image_url, is_continuous ),
  receives:intents!trade_cycle_participants_receives_intent_id_fkey ( id, title, price_fiat, image_url, is_continuous )
`;

async function loadCycle(db, id) {
  const { data, error } = await db
    .from('trade_cycles')
    .select(`id, hops, status, score, source, min_similarity, value_ratio, created_at, updated_at,
             trade_cycle_participants ( ${PARTICIPANT_FIELDS} )`)
    .eq('id', id)
    .maybeSingle();
  if (error) console.error('Cycle lookup failed:', error);
  if (!data) return null;
  data.participants = (data.trade_cycle_participants ?? []).sort((a, b) => a.position - b.position);
  delete data.trade_cycle_participants;
  return data;
}

async function expireCycles(db) {
  const { error } = await db.rpc('expire_stale_cycles');
  if (error) console.error('Cycle expiry failed:', error);
}

app.get('/me/cycles', requireAuth, async (c) => {
  const user = c.get('user');
  const db = getDb(c.env);
  await expireCycles(db);

  const { data: mine, error } = await db
    .from('trade_cycle_participants')
    .select('cycle_id')
    .eq('user_id', user.id);
  if (error) return c.json({ error: 'Lookup failed' }, 500);
  const ids = [...new Set((mine ?? []).map((r) => r.cycle_id))];
  if (!ids.length) return c.json({ cycles: [] });

  const { data, error: cyclesError } = await db
    .from('trade_cycles')
    .select(`id, hops, status, score, source, min_similarity, value_ratio, created_at, updated_at,
             trade_cycle_participants ( ${PARTICIPANT_FIELDS} )`)
    .in('id', ids)
    .order('created_at', { ascending: false });
  if (cyclesError) return c.json({ error: 'Lookup failed' }, 500);

  const cycles = (data ?? []).map((cycle) => {
    cycle.participants = (cycle.trade_cycle_participants ?? []).sort((a, b) => a.position - b.position);
    delete cycle.trade_cycle_participants;
    return cycle;
  });
  return c.json({ cycles });
});

app.get('/cycles/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const db = getDb(c.env);
  await expireCycles(db);
  const cycle = await loadCycle(db, c.req.param('id'));
  if (!cycle) return c.json({ error: 'Not found' }, 404);
  if (!cycle.participants.some((p) => p.user_id === user.id)) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  return c.json(cycle);
});

app.post('/cycles/:id/respond', requireAuth, rateLimit(30, 'cycle-act'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => null);
  if (typeof body?.accept !== 'boolean') return c.json({ error: 'accept must be a boolean' }, 400);

  const db = getDb(c.env);
  await expireCycles(db);
  const { data: result, error } = await db.rpc('respond_to_cycle', {
    p_cycle: c.req.param('id'),
    p_user: user.id,
    p_accept: body.accept,
  });
  if (error) return c.json({ error: 'Could not record response' }, 500);
  if (result?.error === 'not_found') return c.json({ error: 'Not found' }, 404);
  if (result?.error) return c.json({ error: 'Cycle no longer open', detail: result }, 409);

  const cycle = await loadCycle(db, c.req.param('id'));
  const who = user.display_name || 'A participant';
  const others = cycle.participants.map((p) => p.user_id).filter((id) => id !== user.id);
  if (result.status === 'cancelled') {
    c.executionCtx.waitUntil(Promise.all([
      notifyCycle(c.env, cycle.id, cycle.participants, 'cycle_cancelled',
        `${who} declined the ${loopLabel(cycle.hops)}, so it was cancelled. Nexum keeps looking for new matches.`,
        user.id),
      matchAndNotify(c.env, others),
    ]));
  } else if (result.status === 'superseded') {
    c.executionCtx.waitUntil(notifyCycle(c.env, cycle.id, cycle.participants, 'cycle_superseded',
      'One of the items in this trade loop is no longer available, so the loop was closed. Nexum keeps looking for new matches.'));
  } else if (result.status === 'accepted') {
    c.executionCtx.waitUntil(Promise.all([
      notifyCycle(c.env, cycle.id, cycle.participants, 'cycle_accepted',
        `Everyone accepted the ${loopLabel(cycle.hops)}. Time to deliver: open IpeXchange to coordinate and confirm each step.`),
      closeSupersededLoops(c.env, db, result.superseded ?? []),
    ]));
  }
  return c.json(cycle);
});

// Loops that lost an item to the accepted one: tell their members and look
// for new loops through them.
async function closeSupersededLoops(env, db, cycleIds) {
  if (!cycleIds.length) return;
  const { data: seats } = await db
    .from('trade_cycle_participants')
    .select('cycle_id, user_id')
    .in('cycle_id', cycleIds);
  await notifyMany(env, (seats ?? []).map((seat) => ({
    userId: seat.user_id,
    type: 'cycle_superseded',
    payload: { cycle_id: seat.cycle_id },
    text: 'Someone completed another trade loop with one of these items, so this loop was closed. Nexum keeps looking for new matches.',
  })));
  await matchAndNotify(env, (seats ?? []).map((seat) => seat.user_id));
}

app.post('/cycles/:id/confirm', requireAuth, rateLimit(30, 'cycle-act'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => null);
  if (!['delivered', 'received'].includes(body?.step)) {
    return c.json({ error: 'step must be delivered or received' }, 400);
  }

  const db = getDb(c.env);
  const { data: result, error } = await db.rpc('confirm_cycle_step', {
    p_cycle: c.req.param('id'),
    p_user: user.id,
    p_step: body.step,
  });
  if (error) return c.json({ error: 'Could not record confirmation' }, 500);
  if (result?.error === 'not_found') return c.json({ error: 'Not found' }, 404);
  if (result?.error) return c.json({ error: 'Confirmation not allowed', detail: result }, 409);

  const cycle = await loadCycle(db, c.req.param('id'));
  if (result.status === 'completed') {
    c.executionCtx.waitUntil(Promise.all([
      notifyCycle(c.env, cycle.id, cycle.participants, 'cycle_completed',
        `${loopLabel(cycle.hops)[0].toUpperCase()}${loopLabel(cycle.hops).slice(1)} completed. Everyone delivered and received. Well traded!`),
      safeCreateReceipt(c.env, cycle.id),
    ]));
  }
  return c.json(cycle);
});

export default app;
