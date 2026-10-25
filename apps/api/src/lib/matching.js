import { getDb } from './supabase.js';
import { notify } from './notify.js';

// Cap new suggestions per run so one publish never floods DMs.
const MAX_NEW_CYCLES = 3;
// Members re-matched after a loop is declined or superseded.
const MAX_REMATCH_MEMBERS = 7;

export function loopLabel(hops) {
  return hops === 2 ? 'direct swap' : `${hops}-person trade loop`;
}

// Asks Postgres for loops through this user after lazily expiring stale
// payment reservations and suggestions.
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

// Persists unseen loops (dedup and availability checks happen in
// persist_intent_cycle) and returns the ones that were created.
export async function persistLoops(env, cycles, limit = MAX_NEW_CYCLES) {
  const db = getDb(env);
  const created = [];
  for (const cycle of cycles) {
    if (created.length >= limit) break;
    const { data: result, error } = await db.rpc('persist_intent_cycle', { p_cycle: cycle });
    if (error) {
      console.error('persist_intent_cycle failed:', error);
      continue;
    }
    if (result?.created) created.push({ ...cycle, id: result.id });
  }
  return created;
}

export async function notifyNewLoops(env, loops) {
  await Promise.all(loops.flatMap((loop) =>
    loop.participants.map((p) =>
      notify(env, {
        userId: p.user_id,
        type: 'cycle_suggested',
        payload: { cycle_id: loop.id, hops: loop.hops },
        text:
          `Nexum found a ${loopLabel(loop.hops)} for you: ` +
          `you give "${p.gives_title}" and receive "${p.receives_title}".` +
          '\n\nOpen IpeXchange to review and accept it.',
      }),
    ),
  ));
}

// Runs after an intent is published, edited or accepted from the deck
// (via ctx.waitUntil): finds, persists and announces new loops.
export async function matchAndNotify(env, userId, candidates = null) {
  const cycles = candidates ?? await findCycles(env, userId);
  const created = await persistLoops(env, cycles);
  await notifyNewLoops(env, created);
  return created;
}

// After a loop is declined or superseded its other members may still fit
// elsewhere, so look for new loops through each of them.
export async function rematchMembers(env, userIds) {
  const unique = [...new Set(userIds)].slice(0, MAX_REMATCH_MEMBERS);
  for (const userId of unique) await matchAndNotify(env, userId);
}

// Fan a cycle status change out to its participants.
export async function notifyCycle(env, cycleId, participants, type, text, exceptUserId = null) {
  await Promise.all(
    participants
      .filter((p) => p.user_id !== exceptUserId)
      .map((p) =>
        notify(env, { userId: p.user_id, type, payload: { cycle_id: cycleId }, text }),
      ),
  );
}
