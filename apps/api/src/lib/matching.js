import { getDb } from './supabase.js';
import { notify } from './notify.js';

// Cap new suggestions per run so one publish never floods DMs.
const MAX_NEW_CYCLES = 3;

const ORDINAL = { 2: '2-way', 3: '3-way' };

// Runs after an intent is published (via ctx.waitUntil): asks Postgres
// for rings through this user, persists unseen ones (dedup by
// cycle_hash inside persist_intent_cycle) and notifies every member.
export async function matchAndNotify(env, userId) {
  const db = getDb(env);
  const { data: cycles, error } = await db.rpc('find_intent_cycles', { p_user_id: userId });
  if (error) {
    console.error('find_intent_cycles failed:', error);
    return;
  }

  let created = 0;
  for (const cycle of cycles ?? []) {
    if (created >= MAX_NEW_CYCLES) break;
    const { data: result, error: persistError } = await db.rpc('persist_intent_cycle', {
      p_cycle: cycle,
    });
    if (persistError) {
      console.error('persist_intent_cycle failed:', persistError);
      continue;
    }
    if (!result?.created) continue;
    created += 1;

    await Promise.all(
      cycle.participants.map((p) =>
        notify(env, {
          userId: p.user_id,
          type: 'cycle_suggested',
          payload: { cycle_id: result.id, hops: cycle.hops },
          text:
            `Nexum found a ${ORDINAL[cycle.hops] ?? cycle.hops + '-way'} trade for you: ` +
            `you give "${p.gives_title}" and receive "${p.receives_title}".` +
            '\n\nOpen IpeXchange to review and accept it.',
        }),
      ),
    );
  }
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
