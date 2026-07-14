import { describe, expect, it } from 'vitest';
import { isQuoteExpired, pollPaymentVerification } from './paymentFlow.js';

describe('payment quote expiry', () => {
  const now = Date.parse('2026-07-14T12:00:00.000Z');

  it('allows a quote that is still valid', () => {
    expect(isQuoteExpired({ quote_expires_at: '2026-07-14T12:00:00.001Z' }, now)).toBe(false);
  });

  it('blocks a quote at or after its expiry before a transaction can be sent', () => {
    expect(isQuoteExpired({ quote_expires_at: '2026-07-14T12:00:00.000Z' }, now)).toBe(true);
    expect(isQuoteExpired({ quote_expires_at: '2026-07-14T11:59:59.999Z' }, now)).toBe(true);
  });

  it('can reserve a safety buffer for the wallet confirmation step', () => {
    const quote = { quote_expires_at: '2026-07-14T12:00:29.999Z' };
    expect(isQuoteExpired(quote, now, 30_000)).toBe(true);
    expect(isQuoteExpired(quote, now, 20_000)).toBe(false);
  });

  it('fails closed when expiry information is missing or invalid', () => {
    expect(isQuoteExpired(null, now)).toBe(true);
    expect(isQuoteExpired({}, now)).toBe(true);
    expect(isQuoteExpired({ quote_expires_at: 'not-a-date' }, now)).toBe(true);
  });
});

describe('payment verification polling', () => {
  it('retries a transient verification error with the same submitted transaction', async () => {
    const calls = [];
    const waits = [];
    const verify = async (paymentId, txHash) => {
      calls.push([paymentId, txHash]);
      if (calls.length === 1) throw Object.assign(new Error('Worker unavailable'), { status: 503 });
      return { status: 'confirmed' };
    };

    const result = await pollPaymentVerification({
      paymentId: 'payment-1',
      txHash: `0x${'a'.repeat(64)}`,
      verify,
      wait: async (ms) => waits.push(ms),
      isAlive: () => true,
      maxPolls: 3,
      pollMs: 25,
    });

    expect(result).toEqual({ status: 'confirmed' });
    expect(calls).toEqual([
      ['payment-1', `0x${'a'.repeat(64)}`],
      ['payment-1', `0x${'a'.repeat(64)}`],
    ]);
    expect(waits).toEqual([25]);
  });
});
