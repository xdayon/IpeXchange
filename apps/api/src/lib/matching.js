import { getDb } from './supabase.js';
import { notifyMany } from './notify.js';

export function loopLabel(hops) {
  return hops === 2 ? 'direct swap' : `${hops}-person trade loop`;
}

// Loops through this user without saving them (used for previews), after
// lazily expiring stale payment reservations and suggestions.
export async function findCycles(env, userId) {
  const db = getDb(env);
  const [{ error: paymentExpiryError }, { error: cycleExpiryError }] = await Promise.all([
    db.rpc('expire_payment_reservations'),
    db.rpc('expire_stale_cycles'),
  ]);
  if (paymentExpiryError) console.error('Payment reservation cleanup failed:', paymentExpiryError);
  if (cycleExpiryError) console.error('Cycle expiry failed:', cycleExpiryError);
  const { data: cycles, error } = await db.rpc('find_intent_cycles', { p_user_id: userId });
  if (error) {
    console.error('find_intent_cycles failed:', error);
    return [];
  }
  return cycles ?? [];
}

// Finds and saves new loops through these members in one database round
// trip (match_and_persist, at most 3 new loops per member) and returns them.
export async function persistNewLoops(env, userIds) {
  const ids = [...new Set([userIds].flat().filter(Boolean))];
  if (!ids.length) return [];
  const { data, error } = await getDb(env).rpc('match_and_persist', { p_users: ids });
  if (error) {
    console.error('match_and_persist failed:', error);
    return [];
  }
  return data ?? [];
}

export async function notifyNewLoops(env, loops) {
  await notifyMany(env, loops.flatMap((loop) =>
    loop.participants.map((p) => ({
      userId: p.user_id,
      type: 'cycle_suggested',
      payload: { cycle_id: loop.id, hops: loop.hops },
      text:
        `Nexum found a ${loopLabel(loop.hops)} for you: ` +
        `you give "${p.gives_title}" and receive "${p.receives_title}".` +
        '\n\nOpen IpeXchange to review and accept it.',
    })),
  ));
}

// Runs after an intent is published or edited, after a swipe, and after a
// loop is declined or superseded (usually via ctx.waitUntil).
export async function matchAndNotify(env, userIds) {
  const created = await persistNewLoops(env, userIds);
  await notifyNewLoops(env, created);
  return created;
}

// Fan a cycle status change out to its participants.
export async function notifyCycle(env, cycleId, participants, type, text, exceptUserId = null) {
  await notifyMany(env, participants
    .filter((p) => p.user_id !== exceptUserId)
    .map((p) => ({ userId: p.user_id, type, payload: { cycle_id: cycleId }, text })));
}
