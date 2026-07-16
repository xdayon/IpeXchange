import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getVerifiedPrivyEmail,
  syncPrivyEmail,
  walletBelongsToUser,
} from '../src/lib/privy.js';

const env = { PRIVY_APP_ID: 'app-id', PRIVY_APP_SECRET: 'secret' };
const did = 'did:privy:buyer';
const address = '0x1111111111111111111111111111111111111111';

afterEach(() => vi.unstubAllGlobals());

describe('walletBelongsToUser', () => {
  it.each(['wallet', 'smart_wallet'])('accepts a linked %s address', async (type) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      linked_accounts: [{ type, address: address.toUpperCase() }],
    }))));

    await expect(walletBelongsToUser(env, did, address)).resolves.toBe(true);
  });

  it('rejects addresses not linked to the Privy user', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      linked_accounts: [{ type: 'wallet', address: `0x${'2'.repeat(40)}` }],
    }))));

    await expect(walletBelongsToUser(env, did, address)).resolves.toBe(false);
  });

  it('fails closed when Privy cannot verify the user', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    await expect(walletBelongsToUser(env, did, address)).resolves.toBeNull();
  });
});

describe('Privy verified email', () => {
  it('returns the latest normalized verified email account', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      linked_accounts: [
        { type: 'email', address: 'old@example.com', verified_at: 10, latest_verified_at: 10 },
        { type: 'email', address: ' Admin@Example.COM ', verified_at: 20, latest_verified_at: 30 },
        { type: 'email', address: 'unverified@example.com', verified_at: 0 },
      ],
    }))));

    await expect(getVerifiedPrivyEmail(env, did)).resolves.toBe('admin@example.com');
  });

  it('distinguishes no email from an unavailable Privy lookup', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      linked_accounts: [{ type: 'wallet', address }],
    }))));
    await expect(getVerifiedPrivyEmail(env, did)).resolves.toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    await expect(getVerifiedPrivyEmail(env, did)).resolves.toBeUndefined();
  });

  it('does not attempt verification without server credentials', async () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);

    await expect(getVerifiedPrivyEmail({ PRIVY_APP_ID: 'app-id' }, did))
      .resolves.toBeUndefined();
    expect(request).not.toHaveBeenCalled();
  });

  it('persists a verified email and clears one removed from Privy', async () => {
    const updates = [];
    const db = {
      from: () => ({
        update: (patch) => ({
          async eq() {
            updates.push(patch);
            return { error: null };
          },
        }),
      }),
    };
    const user = { id: 'user-id', privy_did: did, email: null };
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        linked_accounts: [{ type: 'email', address: 'Admin@example.com', verified_at: 10 }],
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ linked_accounts: [] }))));

    await expect(syncPrivyEmail(env, db, user)).resolves.toBe('admin@example.com');
    await expect(syncPrivyEmail(env, db, user)).resolves.toBeNull();
    expect(updates).toEqual([{ email: 'admin@example.com' }, { email: null }]);
    expect(user.email).toBeNull();
  });
});
