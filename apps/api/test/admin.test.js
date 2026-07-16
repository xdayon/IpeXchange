import { describe, expect, it } from 'vitest';
import { isAllowlistedAdmin } from '../src/lib/admin.js';

const env = {
  ADMIN_EMAILS: 'owner@example.com',
  ADMIN_TELEGRAM_IDS: '42',
};

describe('admin allowlist', () => {
  it('requires the email verified for the current Privy request', () => {
    const user = { email: 'owner@example.com', telegram_id: null };

    expect(isAllowlistedAdmin(env, user)).toBe(false);
    expect(isAllowlistedAdmin(env, user, 'other@example.com')).toBe(false);
    expect(isAllowlistedAdmin(env, user, 'OWNER@EXAMPLE.COM')).toBe(true);
  });

  it('continues to support immutable Telegram IDs independently', () => {
    expect(isAllowlistedAdmin(env, { telegram_id: 42 })).toBe(true);
    expect(isAllowlistedAdmin(env, { telegram_id: 7 })).toBe(false);
  });
});
