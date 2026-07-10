import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLinkToken, verifyLinkToken } from '../src/lib/linktoken.js';

const env = { LINK_TOKEN_SECRET: 'test-secret-that-never-leaves-ci' };
const userId = '12345678-90ab-cdef-1234-567890abcdef';

async function createLegacyToken() {
  const compactId = userId.replaceAll('-', '');
  const expiry = Math.floor(Date.now() / 1_000) + 15 * 60;
  const payload = `${compactId}_${expiry}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(env.LINK_TOKEN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  const signature = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 24);
  return `${payload}_${signature}`;
}

describe('Telegram link tokens', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('round-trips a signed user id', async () => {
    const token = await createLinkToken(env, userId);
    expect(token).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
    await expect(verifyLinkToken(env, token)).resolves.toBe(userId);
  });

  it('rejects tampered and malformed tokens', async () => {
    const token = await createLinkToken(env, userId);
    const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;
    await expect(verifyLinkToken(env, tampered)).resolves.toBeNull();
    await expect(verifyLinkToken(env, 'not-a-token')).resolves.toBeNull();
  });

  it('accepts unexpired tokens created with the previous signature length', async () => {
    const token = await createLegacyToken();
    expect(token).toHaveLength(68);
    await expect(verifyLinkToken(env, token)).resolves.toBe(userId);
  });

  it('rejects expired tokens', async () => {
    const token = await createLinkToken(env, userId);
    vi.advanceTimersByTime(16 * 60 * 1_000);
    await expect(verifyLinkToken(env, token)).resolves.toBeNull();
  });
});
