import { describe, expect, it } from 'vitest';
import { clearingSummary, toRingParticipants } from './clearingAdapter.js';

const loop = [
  { user_id: 'u2', display_name: 'Leo', position: 2, gives_intent_id: 'iC' },
  { user_id: 'u1', display_name: 'Ana', position: 1, gives_intent_id: 'iA' },
  { user_id: 'u3', display_name: 'Mia', position: 3, gives_intent_id: 'iB' },
];

describe('clearing adapter', () => {
  it('orders by position and receives from the previous participant', () => {
    const parts = toRingParticipants(loop);
    expect(parts.map((p) => p.user_id)).toEqual(['u1', 'u2', 'u3']);
    expect(parts[1].receives.id).toBe(parts[0].gives.id);
    expect(parts[2].receives.id).toBe(parts[1].gives.id);
    expect(parts[0].receives.id).toBe(parts[2].gives.id);
  });

  it('summarizes the result', () => {
    expect(clearingSummary({ candidates: 5, created: 2, selected: [{}, {}] })).toEqual({ candidates: 5, created: 2, selected: 2 });
    expect(clearingSummary(null)).toBeNull();
  });
});
