import { describe, expect, it } from 'vitest';
import { paymentVerificationRequest } from '../src/lib/paymentVerification.js';

const hash = `0x${'a'.repeat(64)}`;
const otherHash = `0x${'b'.repeat(64)}`;

describe('payment verification request', () => {
  it('allows a failed payment to recheck only its attached transaction', () => {
    expect(paymentVerificationRequest({ status: 'failed', tx_hash: hash }, hash)).toEqual({
      attachHash: false,
      recovering: true,
      txHash: hash,
    });
    expect(paymentVerificationRequest({ status: 'failed', tx_hash: hash }, otherHash)).toEqual({
      error: 'different_hash',
    });
  });

  it('does not recover failed quotes that never submitted a transaction', () => {
    expect(paymentVerificationRequest({ status: 'failed', tx_hash: null }, hash)).toEqual({
      error: 'not_recoverable',
    });
  });

  it('keeps first-time attachment limited to submitted payments', () => {
    expect(paymentVerificationRequest({ status: 'submitted', tx_hash: null }, hash)).toEqual({
      attachHash: true,
      recovering: false,
      txHash: hash,
    });
    expect(paymentVerificationRequest({ status: 'quoted', tx_hash: null }, hash)).toEqual({
      error: 'not_submitted',
    });
  });

  it('returns confirmed payments without accepting another hash', () => {
    expect(paymentVerificationRequest({ status: 'confirmed', tx_hash: hash }, otherHash)).toEqual({
      alreadyConfirmed: true,
    });
  });
});
