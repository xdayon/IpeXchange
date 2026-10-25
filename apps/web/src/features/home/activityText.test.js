import { describe, expect, it } from 'vitest';
import { describeEvent, tickerEvents, timeAgo } from './activityText.js';

describe('activity ticker text', () => {
  it('describes each event type with Interest/Offer vocabulary', () => {
    expect(describeEvent({ type: 'intent_published', direction: 'want', title: 'Guitar lessons' }))
      .toBe('New Interest: Guitar lessons');
    expect(describeEvent({ type: 'intent_published', direction: 'offer', title: 'Bike' })).toBe('New Offer: Bike');
    expect(describeEvent({ type: 'loop_formed', hops: 2 })).toBe('A direct swap was just found');
    expect(describeEvent({ type: 'loop_completed', hops: 4 })).toBe('A 4-person trade loop was completed');
  });

  it('drops unknown event types', () => {
    expect(tickerEvents([{ type: 'weird' }, { type: 'loop_formed', hops: 3 }])).toHaveLength(1);
  });

  it('formats relative time', () => {
    const now = new Date('2026-01-01T12:00:00Z').getTime();
    expect(timeAgo('2026-01-01T11:59:50Z', now)).toBe('just now');
    expect(timeAgo('2026-01-01T11:30:00Z', now)).toBe('30 min ago');
    expect(timeAgo('2026-01-01T09:00:00Z', now)).toBe('3 h ago');
    expect(timeAgo('2025-12-30T12:00:00Z', now)).toBe('2 d ago');
  });
});
