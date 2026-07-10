import { describe, expect, it } from 'vitest';
import { validateInitData } from '../src/lib/telegram.js';

const encoder = new TextEncoder();
const botToken = '123456:test-bot-token';

async function hmac(keyBytes, message) {
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

async function signedInitData(fields) {
  const params = new URLSearchParams(fields);
  const check = [...params.entries()].map(([key, value]) => `${key}=${value}`).sort().join('\n');
  const secret = await hmac(encoder.encode('WebAppData'), botToken);
  const signature = [...await hmac(secret, check)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  params.set('hash', signature);
  return params.toString();
}

describe('Telegram Mini App authentication', () => {
  it('accepts authentic, recent initData', async () => {
    const data = await signedInitData({
      auth_date: String(Math.floor(Date.now() / 1_000)),
      query_id: 'query-1',
      start_param: 'welcome',
      user: JSON.stringify({ id: 123, first_name: 'Ipe' }),
    });
    await expect(validateInitData(data, botToken)).resolves.toEqual({
      user: { id: 123, first_name: 'Ipe' }, startParam: 'welcome',
    });
  });

  it('rejects tampering and the wrong bot token', async () => {
    const data = await signedInitData({
      auth_date: String(Math.floor(Date.now() / 1_000)), user: JSON.stringify({ id: 123 }),
    });
    await expect(validateInitData(`${data}&extra=changed`, botToken)).resolves.toBeNull();
    await expect(validateInitData(data, 'wrong-token')).resolves.toBeNull();
  });

  it('rejects stale, malformed, and userless payloads', async () => {
    const stale = await signedInitData({ auth_date: '1', user: JSON.stringify({ id: 123 }) });
    const malformed = await signedInitData({
      auth_date: String(Math.floor(Date.now() / 1_000)), user: '{bad-json',
    });
    const userless = await signedInitData({
      auth_date: String(Math.floor(Date.now() / 1_000)), user: JSON.stringify({ first_name: 'Ipe' }),
    });
    await expect(validateInitData(stale, botToken)).resolves.toBeNull();
    await expect(validateInitData(malformed, botToken)).resolves.toBeNull();
    await expect(validateInitData(userless, botToken)).resolves.toBeNull();
  });
});
