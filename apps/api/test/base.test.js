import { describe, expect, it } from 'vitest';
import {
  TOKENS,
  paymentSatisfied,
  unitsToDecimalString,
  usdToUnits,
} from '../src/lib/base.js';

const recipient = '0x1111111111111111111111111111111111111111';
const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function tokenReceipt(overrides = {}) {
  return {
    status: '0x1',
    logs: [{
      address: TOKENS.usdc.address,
      topics: [transferTopic, `0x${'0'.repeat(64)}`, `0x${'0'.repeat(24)}${recipient.slice(2)}`],
      data: '0x0f4240',
      ...overrides,
    }],
  };
}

describe('token amount conversion', () => {
  it('converts USD quotes into native token units', () => {
    expect(usdToUnits(1, 1, 6)).toBe(1_000_000n);
    expect(usdToUnits(10, 2_000, 18)).toBe(5_000_000_000_000_000n);
  });

  it('formats integer units without floating point loss', () => {
    expect(unitsToDecimalString('1000000', 6)).toBe('1');
    expect(unitsToDecimalString('1234500', 6)).toBe('1.2345');
  });
});

describe('paymentSatisfied', () => {
  it('accepts a successful native transfer to the quoted recipient', () => {
    const tx = { to: recipient.toUpperCase(), value: '0x2386f26fc10000' };
    expect(paymentSatisfied({
      tx, receipt: { status: '0x1' }, token: 'eth', toWallet: recipient, amountUnits: '10000000000000000',
    })).toBe(true);
  });

  it('rejects failed, underpaid, and misdirected native transfers', () => {
    const base = { tx: { to: recipient, value: '0x64' }, token: 'eth', toWallet: recipient, amountUnits: '100' };
    expect(paymentSatisfied({ ...base, receipt: { status: '0x0' } })).toBe(false);
    expect(paymentSatisfied({ ...base, tx: { to: recipient, value: '0x63' }, receipt: { status: '0x1' } })).toBe(false);
    expect(paymentSatisfied({ ...base, tx: { to: `0x${'2'.repeat(40)}`, value: '0x64' }, receipt: { status: '0x1' } })).toBe(false);
  });

  it('accepts the quoted ERC-20 transfer event', () => {
    expect(paymentSatisfied({
      tx: {}, receipt: tokenReceipt(), token: 'usdc', toWallet: recipient, amountUnits: '1000000',
    })).toBe(true);
  });

  it('rejects ERC-20 events with the wrong contract, recipient, amount, or status', () => {
    const check = (receipt) => paymentSatisfied({
      tx: {}, receipt, token: 'usdc', toWallet: recipient, amountUnits: '1000000',
    });
    expect(check(tokenReceipt({ address: `0x${'2'.repeat(40)}` }))).toBe(false);
    expect(check(tokenReceipt({ topics: [transferTopic, `0x${'0'.repeat(64)}`, `0x${'0'.repeat(64)}`] }))).toBe(false);
    expect(check(tokenReceipt({ data: '0x0f423f' }))).toBe(false);
    expect(check({ ...tokenReceipt(), status: '0x0' })).toBe(false);
  });
});
