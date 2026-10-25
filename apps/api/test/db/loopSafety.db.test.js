// Safety properties of the loop engine found in review: declines stick,
// merges never create self-loops, stuck loops can be released, and
// private swipes stay private. Runs against a real database; rolls back.
import { afterAll, describe, expect, it } from 'vitest';
import { connect, dbUrl, findLoops, inRollback, intent, ring, user } from './loopFixtures.js';

const one = async (tx, query) => (await query)[0].result;

describe.skipIf(!dbUrl)('trade loop safety', () => {
  const sql = dbUrl ? connect() : null;
  afterAll(() => sql?.end());

  it('turns an earlier accept into a pass on decline and cools the loop down', () => inRollback(sql, async (tx) => {
    const { members, offers } = await ring(tx, 2, 120);
    await tx`INSERT INTO intent_swipes (user_id, offer_id, decision) VALUES (${members[1]}, ${offers[0]}, 'accept')`;
    const [loop] = await findLoops(tx, members[0]);
    const { id } = await one(tx, tx`SELECT persist_intent_cycle(${loop}::jsonb) AS result`);
    await tx`SELECT respond_to_cycle(${id}, ${members[1]}, false)`;
    const [swipe] = await tx`SELECT decision FROM intent_swipes WHERE user_id = ${members[1]} AND offer_id = ${offers[0]}`;
    expect(swipe.decision).toBe('pass');
    expect(await findLoops(tx, members[0])).toEqual([]);
    // Even if the member accepts again, the same loop waits out the cooldown.
    await tx`UPDATE intent_swipes SET decision = 'accept' WHERE user_id = ${members[1]}`;
    expect(await one(tx, tx`SELECT persist_intent_cycle(${loop}::jsonb) AS result`))
      .toMatchObject({ created: false, reason: 'recently_declined' });
  }));

  it('drops edges between intents that end up with the same owner', () => inRollback(sql, async (tx) => {
    const { members, offers } = await ring(tx, 2, 130);
    await tx`UPDATE intents SET user_id = ${members[0]} WHERE id = ${offers[1]}`;
    const [{ count }] = await tx`SELECT count(*)::int AS count FROM intent_edges WHERE offer_id = ${offers[1]}`;
    expect(count).toBe(0);
    expect(await findLoops(tx, members[0])).toEqual([]);
  }));

  it('matches several members in one call and never saves a loop twice', () => inRollback(sql, async (tx) => {
    const a = await ring(tx, 2, 140);
    const b = await ring(tx, 3, 150);
    const users = [a.members[0], b.members[0]];
    const created = await one(tx, tx`SELECT match_and_persist(${users}::uuid[]) AS result`);
    expect(created.map((loop) => loop.hops).sort()).toEqual([2, 3]);
    expect(created.every((loop) => loop.id)).toBe(true);
    expect(await one(tx, tx`SELECT match_and_persist(${users}::uuid[]) AS result`)).toEqual([]);
  }));

  it('releases an accepted loop through cancel_loop', () => inRollback(sql, async (tx) => {
    const { members, offers } = await ring(tx, 2, 160);
    const [loop] = await findLoops(tx, members[0]);
    const { id } = await one(tx, tx`SELECT persist_intent_cycle(${loop}::jsonb) AS result`);
    for (const member of members) await tx`SELECT respond_to_cycle(${id}, ${member}, true)`;
    const result = await one(tx, tx`SELECT cancel_loop(${id}) AS result`);
    expect(result.status).toBe('cancelled');
    expect(result.members).toEqual(members);
    const rows = await tx`SELECT status FROM intents WHERE id = ANY(${offers}::uuid[])`;
    expect(rows.map((r) => r.status)).toEqual(['active', 'active']);
  }));

  it('closes open loops whose item another loop already holds', () => inRollback(sql, async (tx) => {
    const { members, offers } = await ring(tx, 2, 170);
    const [loop] = await findLoops(tx, members[0]);
    const { id } = await one(tx, tx`SELECT persist_intent_cycle(${loop}::jsonb) AS result`);
    // Another accepted loop holds offers[0] (as a lost SKIP LOCKED race would leave it).
    const [other] = await tx`INSERT INTO trade_cycles (cycle_hash, hops, status) VALUES ('other', 2, 'accepted') RETURNING id`;
    await tx`INSERT INTO intent_reservations (intent_id, cycle_id) VALUES (${offers[0]}, ${other.id})`;
    await tx`UPDATE intents SET status = 'in_cycle' WHERE id = ${offers[0]}`;
    expect(await one(tx, tx`SELECT respond_to_cycle(${id}, ${members[1]}, true) AS result`))
      .toMatchObject({ status: 'superseded' });
  }));

  it('releases accepted loops where nobody delivered for 30 days', () => inRollback(sql, async (tx) => {
    const { members, offers } = await ring(tx, 2, 180);
    const [loop] = await findLoops(tx, members[0]);
    const { id } = await one(tx, tx`SELECT persist_intent_cycle(${loop}::jsonb) AS result`);
    for (const member of members) await tx`SELECT respond_to_cycle(${id}, ${member}, true)`;
    await tx`ALTER TABLE trade_cycles DISABLE TRIGGER trg_cycles_updated`;
    await tx`UPDATE trade_cycles SET updated_at = now() - interval '31 days' WHERE id = ${id}`;
    await tx`SELECT expire_stale_cycles()`;
    const [{ status }] = await tx`SELECT status FROM trade_cycles WHERE id = ${id}`;
    expect(status).toBe('expired');
    const rows = await tx`SELECT status FROM intents WHERE id = ANY(${offers}::uuid[])`;
    expect(rows.map((r) => r.status)).toEqual(['active', 'active']);
  }));

  it('keeps other members private swipes out of the radar', () => inRollback(sql, async (tx) => {
    const me = await user(tx, 'me');
    const fan = await user(tx, 'fan');
    const myOffer = await intent(tx, me, 'offer', 190);
    await tx`INSERT INTO intent_swipes (user_id, offer_id, decision) VALUES (${fan}, ${myOffer}, 'accept')`;
    let radar = await one(tx, tx`SELECT loop_radar(${me}) AS result`);
    expect(radar.nodes.map((n) => n.id)).toEqual([me]);
    expect(radar.stats.outgoing).toBe(1);
    await intent(tx, fan, 'want', 190);
    radar = await one(tx, tx`SELECT loop_radar(${me}) AS result`);
    expect(radar.links).toEqual([expect.objectContaining({ source: me, target: fan, explicit: false })]);
  }));

  it('lets only the Worker role execute engine functions', async () => {
    const [row] = await sql`
      SELECT has_function_privilege('anon', 'match_and_persist(uuid[], integer)', 'EXECUTE') AS anon,
             has_function_privilege('service_role', 'match_and_persist(uuid[], integer)', 'EXECUTE') AS worker`;
    expect(row).toEqual({ anon: false, worker: true });
  });
});
