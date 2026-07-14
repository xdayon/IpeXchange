import { describe, expect, it, vi } from 'vitest';
import { upsertUser } from '../src/middleware/auth.js';

function fakeDb(initialUsers, options = {}) {
  const users = structuredClone(initialUsers);
  const inserts = [];
  const db = {
    from(table) {
      if (table !== 'users') throw new Error(`Unexpected table: ${table}`);
      return {
        select() {
          return {
            eq(column, value) {
              return {
                async maybeSingle() {
                  if (options.selectError) return { data: null, error: options.selectError };
                  return { data: users.find((user) => user[column] === value) ?? null, error: null };
                },
              };
            },
          };
        },
        insert(record) {
          inserts.push(record);
          return {
            select() {
              return {
                async single() {
                  if (options.insert) return options.insert(record, users);
                  const user = { id: `user-${users.length + 1}`, ...record };
                  users.push(user);
                  return { data: user, error: null };
                },
              };
            },
          };
        },
      };
    },
    rpc: vi.fn(async (name, args) => {
      if (options.rpc) return options.rpc(name, args, users);
      return { data: { ok: true, merged: false }, error: null };
    }),
  };
  return { db, inserts, users };
}

const tgUser = { id: 42, username: 'ipe', first_name: 'Ipe', last_name: 'City' };

describe('authentication user linking', () => {
  it('creates the Privy target without telegram_id and merges through the RPC', async () => {
    const shadow = { id: 'shadow', privy_did: null, telegram_id: 42 };
    const { db, inserts } = fakeDb([shadow], {
      rpc: async (_name, args, users) => {
        const target = users.find((user) => user.id === args.p_user);
        target.telegram_id = args.p_tg_id;
        users.splice(users.findIndex((user) => user.id === 'shadow'), 1);
        return { data: { ok: true, merged: true }, error: null };
      },
    });

    const user = await upsertUser(db, { privyDid: 'did:privy:one', tgUser });

    expect(inserts).toEqual([{ privy_did: 'did:privy:one', display_name: 'Ipe City' }]);
    expect(db.rpc).toHaveBeenCalledWith('link_telegram_account', {
      p_user: 'user-2', p_tg_id: 42, p_tg_username: 'ipe',
    });
    expect(user).toMatchObject({ id: 'user-2', privy_did: 'did:privy:one', telegram_id: 42 });
  });

  it('surfaces RPC and account ownership errors instead of ignoring them', async () => {
    const existing = { id: 'target', privy_did: 'did:privy:one', telegram_id: null };
    const unavailable = fakeDb([existing], {
      rpc: async () => ({ data: null, error: new Error('RPC unavailable') }),
    });
    await expect(upsertUser(unavailable.db, {
      privyDid: 'did:privy:one', tgUser,
    })).rejects.toThrow('RPC unavailable');

    const owned = fakeDb([existing], {
      rpc: async () => ({ data: { ok: false, error: 'owned_by_other_account' }, error: null }),
    });
    await expect(upsertUser(owned.db, {
      privyDid: 'did:privy:one', tgUser,
    })).rejects.toThrow('owned_by_other_account');
  });

  it('recovers when a concurrent request creates the same Privy user', async () => {
    const concurrent = { id: 'winner', privy_did: 'did:privy:one', telegram_id: null };
    const { db } = fakeDb([], {
      insert: async (_record, users) => {
        users.push(concurrent);
        return { data: null, error: new Error('duplicate privy_did') };
      },
    });

    await expect(upsertUser(db, {
      privyDid: 'did:privy:one', tgUser: null,
    })).resolves.toEqual(concurrent);
  });

  it('rejects a Mini App identity that differs from the existing Telegram link', async () => {
    const existing = { id: 'target', privy_did: 'did:privy:one', telegram_id: '99' };
    const { db } = fakeDb([existing]);

    await expect(upsertUser(db, {
      privyDid: 'did:privy:one', tgUser,
    })).rejects.toThrow('Telegram identity does not match');
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('does not treat database read failures as a missing user', async () => {
    const { db } = fakeDb([], { selectError: new Error('database unavailable') });
    await expect(upsertUser(db, {
      privyDid: null, tgUser,
    })).rejects.toThrow('database unavailable');
  });
});
