import { Hono } from 'hono';
import { getDb } from '../lib/supabase.js';
import { sendMessage } from '../lib/telegram.js';
import { verifyLinkToken } from '../lib/linktoken.js';

const app = new Hono();

const WELCOME =
  'Welcome to IpeXchange, the intent market of Ipe City.\n\n' +
  'Open the app to list what you are looking for and what you offer - ' +
  'Nexum, the trade oracle, crosses everything to find your trades.\n\n' +
  'You will receive a message here whenever someone shows interest in your intents.';

async function handleStart(env, message, param) {
  const db = getDb(env);
  const from = message.from;
  const chatId = message.chat.id;

  if (param) {
    const userId = await verifyLinkToken(env, param);
    if (!userId) {
      await sendMessage(env, chatId, 'This link has expired. Generate a new one from your profile in the app.');
      return;
    }
    const { error } = await db
      .from('users')
      .update({
        telegram_id: from.id,
        telegram_username: from.username ?? null,
        telegram_dm_ok: true,
      })
      .eq('id', userId);
    if (error) {
      // unique(telegram_id): this Telegram already belongs to another account
      await sendMessage(env, chatId, 'This Telegram is already linked to a different IpeXchange account.');
      return;
    }
    await sendMessage(env, chatId, 'Your Telegram is now linked. ' + WELCOME);
    return;
  }

  // Plain /start: make sure DMs are marked deliverable for known users.
  await db
    .from('users')
    .update({ telegram_dm_ok: true })
    .eq('telegram_id', from.id);
  await sendMessage(env, chatId, WELCOME);
}

app.post('/telegram/webhook', async (c) => {
  if (c.req.header('x-telegram-bot-api-secret-token') !== c.env.TELEGRAM_WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const update = await c.req.json().catch(() => null);
  const message = update?.message;
  const text = message?.text?.trim();

  if (text?.startsWith('/start')) {
    const param = text.split(/\s+/)[1] ?? null;
    c.executionCtx.waitUntil(handleStart(c.env, message, param));
  }
  return c.json({ ok: true });
});

export default app;
