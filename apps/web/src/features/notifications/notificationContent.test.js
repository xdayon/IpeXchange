import { describe, expect, it } from 'vitest';
import { notificationContent } from './notificationContent.js';

describe('notification presentation', () => {
  it('links interest notifications to their intent', () => {
    expect(notificationContent({
      type: 'interest_received',
      payload: {
        intent_id: 'intent-1', intent_title: 'Bike repair',
        from_display_name: 'Ana', message: 'Can we talk tomorrow?',
      },
    })).toEqual({
      kind: 'interest', title: 'New interest in Bike repair', body: 'Can we talk tomorrow?',
      destination: ['intent-detail', { intent: { id: 'intent-1' } }],
    });
  });

  it('formats payments without inventing a missing fiat amount', () => {
    expect(notificationContent({
      type: 'payment_received', payload: { amount: '12.5', token: 'usdc' },
    })).toMatchObject({
      kind: 'payment', title: 'Payment received', body: '12.5 USDC was confirmed on Base.',
    });
  });

  it('links every cycle update with a cycle id to cycle detail', () => {
    for (const type of ['cycle_suggested', 'cycle_accepted', 'cycle_cancelled', 'cycle_completed']) {
      expect(notificationContent({ type, payload: { cycle_id: 'cycle-1' } }).destination)
        .toEqual(['cycle-detail', { cycleId: 'cycle-1' }]);
    }
  });

  it('uses safe generic copy for unknown notification types', () => {
    expect(notificationContent({ type: 'future_type', payload: { secret: 'ignored' } })).toEqual({
      kind: 'general', title: 'IpeXchange update',
      body: 'You have a new marketplace update.', destination: null,
    });
  });
});
