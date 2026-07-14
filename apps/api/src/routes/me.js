import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';
import { createLinkToken } from '../lib/linktoken.js';
import { syncPrivyEmail, walletBelongsToUser } from '../lib/privy.js';
import { isAllowlistedAdmin } from '../lib/admin.js';
import { notify } from '../lib/notify.js';
import { countCompletedTrades, fetchRecentTrades } from '../lib/trades.js';

const app = new Hono();

// Only these keys are accepted from the client; everything else is dropped.
const SETTING_KEYS = new Set([
  'notify_interest',
  'notify_cycles',
  'notify_payments',
  'haptics',
  'default_tab',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const serialize = (u) => ({
  id: u.id,
  display_name: u.display_name,
  avatar_url: u.avatar_url,
  bio: u.bio,
  wallet: u.wallet,
  email: u.email,
  telegram_username: u.telegram_username,
  telegram_linked: u.telegram_id != null,
  telegram_dm_ok: u.telegram_dm_ok,
  settings: u.settings ?? {},
  is_admin: u.is_admin === true,
  referred_by: u.referred_by ?? null,
  created_at: u.created_at,
});

app.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  const verifiedEmail = await syncPrivyEmail(c.env, getDb(c.env), user);
  // Bootstrap: allowlisted accounts get the admin flag on first login so
  // the dashboard entry actually shows up for them.
  if (!user.is_admin && isAllowlistedAdmin(c.env, user, verifiedEmail)) {
    user.is_admin = true;
    c.executionCtx.waitUntil(
      getDb(c.env).from('users').update({ is_admin: true }).eq('id', user.id).then(() => {}),
    );
  }
  return c.json(serialize(user));
});

app.patch('/me', requireAuth, rateLimit(20, 'me-patch'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const patch = {};

  if (body.display_name !== undefined) {
    const name = String(body.display_name).trim();
    if (name.length < 2 || name.length > 40) {
      return c.json({ error: 'Display name must be 2 to 40 characters' }, 400);
    }
    patch.display_name = name;
  }
  if (body.bio !== undefined) {
    const bio = String(body.bio).trim().slice(0, 280);
    patch.bio = bio || null;
  }
  if (body.avatar_url !== undefined) {
    const url = String(body.avatar_url);
    // Avatars must come from our own upload proxy, never arbitrary URLs.
    if (url && !url.startsWith(`${c.env.SUPABASE_URL}/storage/`)) {
      return c.json({ error: 'Invalid avatar URL' }, 400);
    }
    patch.avatar_url = url || null;
  }
  if (Object.keys(patch).length === 0) return c.json({ error: 'Nothing to update' }, 400);

  const { data, error } = await getDb(c.env)
    .from('users')
    .update(patch)
    .eq('id', user.id)
    .select()
    .single();
  if (error) return c.json({ error: 'Could not update the profile' }, 500);
  return c.json(serialize(data));
});

app.put('/me/settings', requireAuth, rateLimit(30, 'me-settings'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const incoming = {};
  for (const [key, value] of Object.entries(body)) {
    if (!SETTING_KEYS.has(key)) continue;
    if (key === 'default_tab') {
      if (!['home', 'discover'].includes(value)) continue;
      incoming[key] = value;
    } else if (typeof value === 'boolean') {
      incoming[key] = value;
    }
  }
  const settings = { ...(user.settings ?? {}), ...incoming };
  const { error } = await getDb(c.env).from('users').update({ settings }).eq('id', user.id);
  if (error) return c.json({ error: 'Could not save settings' }, 500);
  return c.json({ ok: true, settings });
});

app.post('/me/referral', requireAuth, rateLimit(10, 'referral'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const ref = String(body.ref ?? '').trim();
  if (!UUID_RE.test(ref)) return c.json({ error: 'Invalid referral code' }, 400);
  if (ref === user.id) return c.json({ error: 'You cannot refer yourself' }, 400);
  if (user.referred_by) return c.json({ ok: false, reason: 'already_set' });

  const db = getDb(c.env);
  const { data: referrer } = await db.from('users').select('id').eq('id', ref).maybeSingle();
  if (!referrer) return c.json({ error: 'Referral user not found' }, 400);

  const { data: updated, error } = await db
    .from('users')
    .update({ referred_by: ref })
    .eq('id', user.id)
    .is('referred_by', null)
    .select('id')
    .maybeSingle();
  if (error) return c.json({ error: 'Could not claim referral' }, 500);
  if (!updated) return c.json({ ok: false, reason: 'already_set' });

  const displayName = user.display_name || 'A new citizen';
  c.executionCtx.waitUntil(
    notify(c.env, {
      userId: ref,
      type: 'referral_joined',
      payload: { display_name: user.display_name ?? null },
      text: `${displayName} joined IpeXchange with your invite link.`,
    }),
  );
  return c.json({ ok: true });
});

app.get('/me/stats', requireAuth, async (c) => {
  const user = c.get('user');
  const db = getDb(c.env);
  const count = (table, filter) => {
    let q = db.from(table).select('id', { count: 'exact', head: true });
    for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
    return q.then((r) => r.count ?? 0);
  };
  const [activeIntents, fulfilled, interestsReceived, paymentsReceived, referrals, completedTrades] = await Promise.all([
    count('intents', { user_id: user.id, status: 'active' }),
    count('intents', { user_id: user.id, status: 'fulfilled' }),
    db
      .from('interest_marks')
      .select('id, intents!inner(user_id)', { count: 'exact', head: true })
      .eq('intents.user_id', user.id)
      .then((r) => r.count ?? 0),
    count('payments', { seller_user_id: user.id, status: 'confirmed' }),
    count('users', { referred_by: user.id }),
    countCompletedTrades(c.env, user.id),
  ]);
  return c.json({
    active_intents: activeIntents,
    fulfilled_intents: fulfilled,
    interests_received: interestsReceived,
    payments_received: paymentsReceived,
    referrals,
    completed_trades: completedTrades,
  });
});

app.get('/me/trades', requireAuth, async (c) => {
  const user = c.get('user');
  const trades = await fetchRecentTrades(c.env, user.id);
  return c.json({ trades });
});

app.post('/me/telegram-link-token', requireAuth, rateLimit(10, 'tg-link'), async (c) => {
  const user = c.get('user');
  if (user.telegram_id) return c.json({ error: 'Telegram already linked' }, 409);
  const token = await createLinkToken(c.env, user.id);
  const bot = c.env.TELEGRAM_BOT_USERNAME || 'ipexchange_bot';
  return c.json({ token, url: `https://t.me/${bot}?start=${token}` });
});

// Payout address for P2P payments. The address must be verified against
// the caller's linked Privy wallets before it can be saved, so a hijacked
// session cannot silently redirect payouts elsewhere. Verification is
// mandatory: if it cannot run, the request is rejected rather than trusted.
app.post('/me/wallet', requireAuth, rateLimit(10, 'wallet'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const address = String(body.address ?? '').toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(address)) return c.json({ error: 'Invalid wallet address' }, 400);
  if (user.wallet === address) return c.json({ ok: true, wallet: address });
  if (!user.privy_did) {
    return c.json({ error: 'Link a login account before setting a payout wallet' }, 403);
  }

  const owned = await walletBelongsToUser(c.env, user.privy_did, address);
  if (owned === null) {
    return c.json({ error: 'Wallet verification is unavailable right now. Try again shortly.' }, 503);
  }
  if (owned === false) {
    return c.json({ error: 'This wallet is not linked to your login account' }, 403);
  }
  await getDb(c.env).from('users').update({ wallet: address }).eq('id', user.id);
  return c.json({ ok: true, wallet: address });
});

// Called by the Mini App after Telegram.WebApp.requestWriteAccess succeeds.
app.post('/me/dm-ok', requireAuth, async (c) => {
  const user = c.get('user');
  if (!user.telegram_id) return c.json({ error: 'No Telegram identity on this account' }, 400);
  await getDb(c.env).from('users').update({ telegram_dm_ok: true }).eq('id', user.id);
  return c.json({ ok: true });
});

export default app;
