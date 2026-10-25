import { describe, expect, it } from 'vitest';
import { reasonLabel } from '../src/routes/loops.js';
import { roundArea } from '../src/routes/discovery.js';
import { loopLabel } from '../src/lib/matching.js';

describe('trade loop helpers', () => {
  it('labels deck cards by why they were dealt', () => {
    expect(reasonLabel({ reason: 'matches_interest', want_title: 'Surfboard' }))
      .toBe('Matches your Interest: Surfboard');
    expect(reasonLabel({ reason: 'wants_your_offer', offer_title: 'Guitar lessons' }))
      .toBe('Wants your Offer: Guitar lessons');
    expect(reasonLabel({ reason: 'new' })).toBe('New in the market');
    expect(reasonLabel({ reason: 'matches_interest', want_title: null })).toBe('New in the market');
  });

  it('names loops by size', () => {
    expect(loopLabel(2)).toBe('direct swap');
    expect(loopLabel(5)).toBe('5-person trade loop');
  });

  it('rounds shared areas to about one kilometre and rejects bad input', () => {
    expect(roundArea(-27.43871, -48.49912)).toEqual({ lat: -27.44, lng: -48.5 });
    expect(roundArea(91, 0)).toBeNull();
    expect(roundArea(0, -181)).toBeNull();
    expect(roundArea(Number.NaN, 10)).toBeNull();
  });
});
