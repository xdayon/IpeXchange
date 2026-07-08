import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../lib/supabase.js';
import { createLinkToken } from '../lib/linktoken.js';

const app = new Hono();

app.get('/me', requireAuth, (c) => {
  const u = c.get('user');
  return c.json({
    id: u.id,
    display_name: u.display_name,
    avatar_url: u.avatar_url,
    wallet: u.wallet,
    email: u.email,
    telegram_username: u.telegram_username,
    telegram_linked: u.telegram_id != null,
    telegram_dm_ok: u.telegram_dm_ok,
    created_at: u.created_at,
  });
});

app.post('/me/telegram-link-token', requireAuth, async (c) => {
  const user = c.get('user');
  if (user.telegram_id) return c.json({ error: 'Telegram already linked' }, 409);
  const token = await createLinkToken(c.env, user.id);
  const bot = c.env.TELEGRAM_BOT_USERNAME || 'ipexchange_bot';
  return c.json({ token, url: `https://t.me/${bot}?start=${token}` });
});

// Called by the web app when the Privy session exposes a wallet address
// the account does not have yet (payout address for P2P payments).
app.post('/me/wallet', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const address = String(body.address ?? '').toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(address)) return c.json({ error: 'Invalid wallet address' }, 400);
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
