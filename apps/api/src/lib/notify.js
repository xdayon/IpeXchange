import { getDb } from './supabase.js';
import { sendMessage } from './telegram.js';

// Persists a notification and best-effort delivers it as a Telegram DM
// when the recipient has a linked chat that allows messages.
export async function notify(env, { userId, type, payload, text }) {
  const db = getDb(env);
  const { data: row, error } = await db
    .from('notifications')
    .insert({ user_id: userId, type, payload })
    .select('id')
    .single();
  if (error) {
    console.error('Notification insert failed:', error);
    return;
  }

  if (!text) return;
  const { data: user } = await db
    .from('users')
    .select('telegram_id, telegram_dm_ok')
    .eq('id', userId)
    .maybeSingle();
  if (!user?.telegram_id || !user.telegram_dm_ok) return;

  // Plain text: user-provided content must not break Telegram entity parsing.
  const sent = await sendMessage(env, user.telegram_id, text);
  if (sent) await db.from('notifications').update({ telegram_sent: true }).eq('id', row.id);
}
