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

async function upsertUser(env, { privyDid, tgUser }) {
  const db = getDb(env);

  if (privyDid) {
    let { data: user } = await db.from('users').select('*').eq('privy_did', privyDid).maybeSingle();
    if (!user) {
      const insert = { privy_did: privyDid };
      if (tgUser) {
        insert.telegram_id = tgUser.id;
        insert.telegram_username = tgUser.username ?? null;
        insert.display_name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null;
      }
      const { data, error } = await db.from('users').insert(insert).select().single();
      if (error) throw error;
      user = data;
    } else if (tgUser && !user.telegram_id) {
      const { data } = await db
        .from('users')
        .update({ telegram_id: tgUser.id, telegram_username: tgUser.username ?? null })
        .eq('id', user.id)
        .select()
        .single();
      user = data ?? user;
    }
    return user;
  }

  if (tgUser) {
    const { data: user } = await db.from('users').select('*').eq('telegram_id', tgUser.id).maybeSingle();
    if (user) return user;
    const { data, error } = await db
      .from('users')
      .insert({
        telegram_id: tgUser.id,
        telegram_username: tgUser.username ?? null,
        display_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null,
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
  return upsertUser(env, { privyDid, tgUser: tg?.user ?? null });
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
