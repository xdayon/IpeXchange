import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';

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

export default app;
