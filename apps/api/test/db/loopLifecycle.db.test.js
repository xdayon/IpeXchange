// Suggestion, acceptance, delivery and clearing rounds for trade loops,
// against a real database. Every test rolls back.
import { afterAll, describe, expect, it } from 'vitest';
import { connect, dbUrl, findLoops, inRollback, intent, ring, user } from './loopFixtures.js';

async function persist(tx, loop, source = 'match') {
  const [{ result }] = await tx`SELECT persist_intent_cycle(${loop}::jsonb, ${source}) AS result`;
  return result;
}

async function respond(tx, cycleId, userId, accept) {
  const [{ result }] = await tx`SELECT respond_to_cycle(${cycleId}, ${userId}, ${accept}) AS result`;
  return result;
}

async function statuses(tx, ids) {
  const rows = await tx`SELECT id, status FROM intents WHERE id = ANY(${ids}::uuid[])`;
  return Object.fromEntries(rows.map((row) => [row.id, row.status]));
}

describe.skipIf(!dbUrl)('trade loop lifecycle', () => {
  const sql = dbUrl ? connect() : null;
  afterAll(() => sql?.end());

  it('keeps suggested intents available and claims them on the last acceptance', () => inRollback(sql, async (tx) => {
    const { members, offers } = await ring(tx, 3, 200);
    const [loop] = await findLoops(tx, members[0]);
    const created = await persist(tx, loop);
    expect(created.created).toBe(true);
    expect(Object.values(await statuses(tx, offers))).toEqual(['active', 'active', 'active']);
    expect(await persist(tx, loop)).toMatchObject({ created: false, reason: 'duplicate' });

    expect(await respond(tx, created.id, members[0], true)).toEqual({ status: 'pending_acceptance' });
    expect(await respond(tx, created.id, members[1], true)).toEqual({ status: 'pending_acceptance' });
    expect(await respond(tx, created.id, members[2], true)).toMatchObject({ status: 'accepted' });
    expect(Object.values(await statuses(tx, offers))).toEqual(['in_cycle', 'in_cycle', 'in_cycle']);
  }));

  it('supersedes competing suggestions and leaves continuous Offers free', () => inRollback(sql, async (tx) => {
    const a = await user(tx, 'a');
    const b = await user(tx, 'b');
    const c = await user(tx, 'c');
    const lessons = await intent(tx, a, 'offer', 300, { kind: 'service', continuous: true });
    await intent(tx, a, 'want', 301);
    const bike = await intent(tx, b, 'offer', 301);
    await intent(tx, b, 'want', 300, { kind: 'service' });
    await intent(tx, c, 'want', 301);
    const surfboard = await intent(tx, c, 'offer', 302);
    await intent(tx, a, 'want', 302);

    // Two loops compete for the bike: a <-> b, and a -> b -> c -> a.
    const loops = await findLoops(tx, a);
    expect(loops.map((loop) => loop.hops)).toEqual([2, 3]);
    expect(loops[1].participants.map((p) => p.gives_intent_id)).toContain(surfboard);
    const direct = await persist(tx, loops[0]);
    const triangle = await persist(tx, loops[1]);
    expect(triangle.created).toBe(true);

    await respond(tx, direct.id, a, true);
    const result = await respond(tx, direct.id, b, true);
    expect(result).toEqual({ status: 'accepted', superseded: [triangle.id] });
    const [{ status }] = await tx`SELECT status FROM trade_cycles WHERE id = ${triangle.id}`;
    expect(status).toBe('superseded');
    expect(await statuses(tx, [lessons, bike])).toEqual({ [lessons]: 'active', [bike]: 'in_cycle' });
  }));

  it('cancels on decline and remembers the declined Offer', () => inRollback(sql, async (tx) => {
    const { members, offers } = await ring(tx, 2, 400);
    const [loop] = await findLoops(tx, members[0]);
    const created = await persist(tx, loop);
    expect(await respond(tx, created.id, members[1], false)).toEqual({ status: 'cancelled' });
    const [swipe] = await tx`SELECT decision FROM intent_swipes
                             WHERE user_id = ${members[1]} AND offer_id = ${offers[0]}`;
    expect(swipe.decision).toBe('pass');
    expect(await findLoops(tx, members[0])).toEqual([]);
  }));

  it('fulfils one-off intents when every member delivered and received', () => inRollback(sql, async (tx) => {
    const { members, offers } = await ring(tx, 2, 500);
    const [loop] = await findLoops(tx, members[0]);
    const { id } = await persist(tx, loop);
    for (const member of members) await respond(tx, id, member, true);
    for (const member of members) {
      for (const step of ['delivered', 'received']) {
        await tx`SELECT confirm_cycle_step(${id}, ${member}, ${step})`;
      }
    }
    const [{ status }] = await tx`SELECT status FROM trade_cycles WHERE id = ${id}`;
    expect(status).toBe('completed');
    expect(Object.values(await statuses(tx, offers))).toEqual(['fulfilled', 'fulfilled']);
  }));

  it('packs disjoint loops in a clearing round', () => inRollback(sql, async (tx) => {
    await ring(tx, 2, 600);
    await ring(tx, 4, 610);
    const [{ preview }] = await tx`SELECT run_clearing_round(6, 0.04, true) AS preview`;
    const ours = preview.selected.filter((loop) => loop.participants[0].gives_title.match(/topic 6[01]\d/));
    expect(ours.map((loop) => loop.hops).sort()).toEqual([2, 4]);
    expect(preview.created).toBe(0);
    const [{ round }] = await tx`SELECT run_clearing_round(6, 0.04, false) AS round`;
    expect(round.created).toBeGreaterThanOrEqual(2);
    const sources = await tx`SELECT DISTINCT source FROM trade_cycles WHERE source = 'clearing'`;
    expect(sources).toHaveLength(1);
  }));

  it('deals reciprocal Offers first in the swipe deck', () => inRollback(sql, async (tx) => {
    const me = await user(tx, 'me');
    const swapper = await user(tx, 'swapper');
    const stranger = await user(tx, 'stranger');
    await intent(tx, me, 'want', 700);
    await intent(tx, me, 'offer', 701);
    const strangerOffer = await intent(tx, stranger, 'offer', 702);
    const swapOffer = await intent(tx, swapper, 'offer', 700);
    await intent(tx, swapper, 'want', 701);
    const deck = await tx`SELECT * FROM swipe_deck(${me}, 50)`;
    const ids = deck.map((card) => card.id);
    expect(ids.indexOf(swapOffer)).toBeLessThan(ids.indexOf(strangerOffer));
    expect(deck[ids.indexOf(swapOffer)].reason).toBe('matches_interest');
  }));

  it('rounds member areas and keeps map points near them', () => inRollback(sql, async (tx) => {
    const me = await user(tx, 'mapped');
    await tx`UPDATE users SET geo_lat = -27.43871, geo_lng = -48.49912 WHERE id = ${me}`;
    const [area] = await tx`SELECT geo_lat::float AS lat, geo_lng::float AS lng FROM users WHERE id = ${me}`;
    expect(area).toEqual({ lat: -27.44, lng: -48.5 });
    const offer = await intent(tx, me, 'offer', 760);
    const [{ points }] = await tx`SELECT market_map(1000) AS points`;
    const point = points.find((p) => p.id === offer);
    expect(Math.abs(point.lat - area.lat)).toBeLessThanOrEqual(0.004);
    expect(Math.abs(point.lng - area.lng)).toBeLessThanOrEqual(0.004);
  }));
});
