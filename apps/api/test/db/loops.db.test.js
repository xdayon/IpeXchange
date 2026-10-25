// Matching engine v2 against a real PostgreSQL + pgvector database.
// Runs only when TEST_DATABASE_URL points at a disposable database with
// all migrations applied (see `npm run test:db`); every test rolls back.
import { afterAll, describe, expect, it } from 'vitest';
import { connect, dbUrl, findLoops, inRollback, intent, ring, user } from './loopFixtures.js';

describe.skipIf(!dbUrl)('trade loop discovery', () => {
  const sql = dbUrl ? connect() : null;
  afterAll(() => sql?.end());

  it('finds a direct swap with the right gives and receives', () => inRollback(sql, async (tx) => {
    const { members, offers } = await ring(tx, 2, 10);
    const loops = await findLoops(tx, members[0]);
    expect(loops).toHaveLength(1);
    expect(loops[0].hops).toBe(2);
    const [me, other] = loops[0].participants;
    expect(me).toMatchObject({ user_id: members[0], gives_intent_id: offers[0], receives_intent_id: offers[1] });
    expect(other).toMatchObject({ user_id: members[1], gives_intent_id: offers[1], receives_intent_id: offers[0] });
  }));

  it('finds loops of five people through any member', () => inRollback(sql, async (tx) => {
    const { members } = await ring(tx, 5, 20);
    for (const member of [members[0], members[3]]) {
      const loops = await findLoops(tx, member);
      expect(loops.map((loop) => loop.hops)).toEqual([5]);
    }
  }));

  it('closes a seven-person loop from explicit swipes and respects the hop limit', () => inRollback(sql, async (tx) => {
    const members = [];
    const offers = [];
    for (let i = 0; i < 7; i += 1) {
      members.push(await user(tx, `swiper ${i}`));
      offers.push(await intent(tx, members[i], 'offer', 100 + i));
    }
    for (let i = 0; i < 7; i += 1) {
      await tx`INSERT INTO intent_swipes (user_id, offer_id, decision)
               VALUES (${members[(i + 1) % 7]}, ${offers[i]}, 'accept')`;
    }
    const loops = await findLoops(tx, members[0], 7);
    expect(loops).toHaveLength(1);
    expect(loops[0].hops).toBe(7);
    expect(loops[0].score).toBeGreaterThan(0.8);
    expect(loops[0].participants.every((p) => p.explicit)).toBe(true);
    expect(await findLoops(tx, members[0], 6)).toEqual([]);
  }));

  it('keeps Buy now only Offers out of loops', () => inRollback(sql, async (tx) => {
    const a = await user(tx, 'seller');
    const b = await user(tx, 'trader');
    await intent(tx, a, 'offer', 30, { mode: 'buy_now', price: 50 });
    await intent(tx, a, 'want', 31);
    await intent(tx, b, 'offer', 31);
    await intent(tx, b, 'want', 30);
    expect(await findLoops(tx, a)).toEqual([]);
  }));

  it('rejects incompatible kinds and accepts service for knowledge', () => inRollback(sql, async (tx) => {
    const a = await user(tx, 'a');
    const b = await user(tx, 'b');
    await intent(tx, a, 'offer', 40, { kind: 'service' });
    await intent(tx, a, 'want', 41, { kind: 'good' });
    await intent(tx, b, 'offer', 41, { kind: 'good' });
    await intent(tx, b, 'want', 40, { kind: 'good' });
    expect(await findLoops(tx, a)).toEqual([]);
    await intent(tx, b, 'want', 40, { kind: 'knowledge' });
    expect(await findLoops(tx, a)).toHaveLength(1);
  }));

  it('enforces the value guard only when both prices are known', () => inRollback(sql, async (tx) => {
    const unbalanced = await ring(tx, 2, 50, { price: 100 });
    await tx`UPDATE intents SET price_fiat = 50 WHERE id = ${unbalanced.offers[1]}`;
    expect(await findLoops(tx, unbalanced.members[0])).toEqual([]);
    await tx`UPDATE intents SET price_fiat = NULL WHERE id = ${unbalanced.offers[1]}`;
    expect(await findLoops(tx, unbalanced.members[0])).toHaveLength(1);
  }));

  it('never suggests an Offer the receiver passed on', () => inRollback(sql, async (tx) => {
    const { members, offers } = await ring(tx, 3, 60);
    await tx`INSERT INTO intent_swipes (user_id, offer_id, decision)
             VALUES (${members[1]}, ${offers[0]}, 'pass')`;
    expect(await findLoops(tx, members[0])).toEqual([]);
  }));

  it('ranks a strong direct swap above a weak long loop', () => inRollback(sql, async (tx) => {
    const { members } = await ring(tx, 2, 70);
    const weak = await ring(tx, 4, 80, { blend: [700, 0.75] });
    await intent(tx, members[0], 'want', 83, { blend: [700, 0.75] });
    await intent(tx, weak.members[0], 'want', 70);
    const loops = await findLoops(tx, members[0]);
    expect(loops.map((loop) => loop.hops)).toEqual([2, 5]);
    expect(loops[0].score).toBeGreaterThan(0.8);
    expect(loops[1].score).toBeLessThan(loops[0].score / 2);
  }));

  it('updates edges when an Offer is archived and restored', () => inRollback(sql, async (tx) => {
    const { members, offers } = await ring(tx, 2, 90);
    await tx`UPDATE intents SET status = 'archived' WHERE id = ${offers[1]}`;
    const [{ count }] = await tx`SELECT count(*)::int AS count FROM intent_edges WHERE offer_id = ${offers[1]}`;
    expect(count).toBe(0);
    await tx`UPDATE intents SET status = 'active' WHERE id = ${offers[1]}`;
    expect(await findLoops(tx, members[0])).toHaveLength(1);
  }));
});
