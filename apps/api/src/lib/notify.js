import { getDb } from './supabase.js';
import { sendMessage } from './telegram.js';

// Users can mute notification groups from Settings; unset means on.
const SETTING_BY_PREFIX = [
  ['payment', 'notify_payments'],
  ['cycle', 'notify_cycles'],
  ['interest', 'notify_interest'],
];

function mutedByUser(user, type) {
  const key = SETTING_BY_PREFIX.find(([prefix]) => type.startsWith(prefix))?.[1];
  return key ? user.settings?.[key] === false : false;
}

// Persists notifications in one insert and best-effort delivers each as a
// Telegram DM when the recipient has a linked chat that allows messages.
// Batching keeps a whole trade loop (up to 7 members) within the Workers
// subrequest budget: 3 database calls plus one call per DM.
export async function notifyMany(env, items) {
  if (!items.length) return;
  const db = getDb(env);
  // Ids are generated here so each DM can be matched to its row.
  const withIds = items.map((item) => ({ ...item, id: crypto.randomUUID() }));
  const { error } = await db
    .from('notifications')
    .insert(withIds.map(({ id, userId, type, payload }) => ({ id, user_id: userId, type, payload })));
  if (error) {
    console.error('Notification insert failed:', error);
    return;
  }

  const withText = withIds.filter((item) => item.text);
  if (!withText.length) return;
  const { data: users } = await db
    .from('users')
    .select('id, telegram_id, telegram_dm_ok, settings')
    .in('id', [...new Set(withText.map((i) => i.userId))]);
  const byId = new Map((users ?? []).map((u) => [u.id, u]));

  // Plain text: user-provided content must not break Telegram entity parsing.
  const sent = await Promise.all(withText.map(async (item) => {
    const user = byId.get(item.userId);
    if (!user?.telegram_id || !user.telegram_dm_ok || mutedByUser(user, item.type)) return null;
    return (await sendMessage(env, user.telegram_id, item.text)) ? item.id : null;
  }));
  const sentIds = sent.filter(Boolean);
  if (sentIds.length) await db.from('notifications').update({ telegram_sent: true }).in('id', sentIds);
}

export async function notify(env, item) {
  await notifyMany(env, [item]);
}
