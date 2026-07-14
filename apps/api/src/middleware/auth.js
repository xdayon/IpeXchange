import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getDb } from '../lib/supabase.js';
import { validateInitData } from '../lib/telegram.js';

let jwks = null;
let jwksAppId = null;

function getJwks(appId) {
  if (!jwks || jwksAppId !== appId) {
    jwks = createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`));
    jwksAppId = appId;
  }
  return jwks;
}

async function verifyPrivyToken(env, token) {
  if (!env.PRIVY_APP_ID) return null;
  try {
    const { payload } = await jwtVerify(token, getJwks(env.PRIVY_APP_ID), {
      issuer: 'privy.io',
      audience: env.PRIVY_APP_ID,
    });
    return payload.sub || null; // 'did:privy:...'
  } catch {
    return null;
  }
}

async function findUser(db, column, value) {
  const { data, error } = await db.from('users').select('*').eq(column, value).maybeSingle();
  if (error) throw error;
  return data;
}

function telegramName(tgUser) {
  return [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null;
}

async function createPrivyUser(db, privyDid, tgUser) {
  const insert = { privy_did: privyDid };
  if (tgUser) insert.display_name = telegramName(tgUser);

  const { data, error } = await db.from('users').insert(insert).select().single();
  if (!error) return data;

  // Another request may have created the same Privy user after our first read.
  const concurrentUser = await findUser(db, 'privy_did', privyDid);
  if (concurrentUser) return concurrentUser;
  throw error;
}

export async function upsertUser(db, { privyDid, tgUser }) {
  if (privyDid) {
    let user = await findUser(db, 'privy_did', privyDid);
    if (!user) user = await createPrivyUser(db, privyDid, tgUser);

    const sameTelegram = String(user.telegram_id) === String(tgUser?.id);
    if (tgUser && user.telegram_id != null && !sameTelegram) {
      throw new Error('Telegram identity does not match the linked account');
    }
    if (tgUser && (user.telegram_id == null || sameTelegram)) {
      const { data: result, error } = await db.rpc('link_telegram_account', {
        p_user: user.id,
        p_tg_id: tgUser.id,
        p_tg_username: tgUser.username ?? null,
      });
      if (error) throw error;
      if (!result?.ok) throw new Error(`Telegram account link failed: ${result?.error ?? 'unknown'}`);
      user = await findUser(db, 'id', user.id);
      if (!user) throw new Error('Linked user was not found');
    }
    return user;
  }

  if (tgUser) {
    const user = await findUser(db, 'telegram_id', tgUser.id);
    if (user) return user;
    const { data, error } = await db
      .from('users')
      .insert({
        telegram_id: tgUser.id,
        telegram_username: tgUser.username ?? null,
        display_name: telegramName(tgUser),
        telegram_dm_ok: tgUser.allows_write_to_pm === true,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  return null;
}

async function resolveUser(c) {
  const env = c.env;
  const bearer = c.req.header('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  const initData = c.req.header('x-telegram-init-data');

  const privyDid = bearer ? await verifyPrivyToken(env, bearer) : null;
  const tg = initData ? await validateInitData(initData, env.TELEGRAM_BOT_TOKEN) : null;

  if (!privyDid && !tg) return null;
  return upsertUser(getDb(env), { privyDid, tgUser: tg?.user ?? null });
}

// Throttled activity ping: powers the active-user metrics on the admin
// dashboard without a write per request.
const LAST_SEEN_TTL_MS = 15 * 60 * 1000;

function touchLastSeen(c, user) {
  if (Date.now() - new Date(user.last_seen).getTime() < LAST_SEEN_TTL_MS) return;
  const update = getDb(c.env)
    .from('users')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', user.id)
    .then(() => {});
  c.executionCtx?.waitUntil?.(update);
}

export async function requireAuth(c, next) {
  const user = await resolveUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  c.set('user', user);
  touchLastSeen(c, user);
  await next();
}

export async function optionalAuth(c, next) {
  try {
    const user = await resolveUser(c);
    if (user) {
      c.set('user', user);
      touchLastSeen(c, user);
    }
  } catch {
    // anonymous access is fine
  }
  await next();
}
