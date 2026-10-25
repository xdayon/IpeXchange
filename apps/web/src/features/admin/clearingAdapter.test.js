import { describe, expect, it } from 'vitest';
import { clearingSummary, toRingParticipants } from './clearingAdapter.js';

const loop = [
  { user_id: 'u1', display_name: 'Ana', gives_title: 'Bike', receives_title: 'Design' },
  { user_id: 'u2', display_name: 'Leo', gives_title: 'Lessons', receives_title: 'Bike' },
  { user_id: 'u3', display_name: 'Mia', gives_title: 'Design', receives_title: 'Lessons' },
];

describe('clearing adapter', () => {
  it('links each receiver to the participant giving that item', () => {
    const parts = toRingParticipants(loop);
    expect(parts[1].receives.id).toBe(parts[0].gives.id);
    expect(parts[2].receives.id).toBe(parts[1].gives.id);
    expect(parts[0].receives.id).toBe(parts[2].gives.id);
  });

  it('falls back to loop order when titles do not match', () => {
    const parts = toRingParticipants([
      { user_id: 'a', display_name: 'A', gives_title: 'x', receives_title: '?' },
      { user_id: 'b', display_name: 'B', gives_title: 'y', receives_title: '?' },
    ]);
    expect(parts[0].receives.id).toBe('g1');
    expect(parts[1].receives.id).toBe('g0');
  });

  it('summarizes the result', () => {
    expect(clearingSummary({ candidates: 5, created: 2, selected: [{}, {}] })).toEqual({ candidates: 5, created: 2, selected: 2 });
    expect(clearingSummary(null)).toBeNull();
  });
});
