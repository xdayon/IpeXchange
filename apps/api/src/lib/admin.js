// Admins are flagged in the DB. The ADMIN_EMAILS / ADMIN_TELEGRAM_IDS /
// ADMIN_TELEGRAM_USERNAMES secrets bootstrap the first admins: an allowlisted
// account is promoted the first time it authenticates and stays flagged from
// then on.
export function isAllowlistedAdmin(env, user) {
  const emails = (env.ADMIN_EMAILS ?? '').toLowerCase().split(',').map((s) => s.trim());
  const tgIds = (env.ADMIN_TELEGRAM_IDS ?? '').split(',').map((s) => s.trim());
  const tgUsernames = (env.ADMIN_TELEGRAM_USERNAMES ?? '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim().replace(/^@/, ''));
  return (
    (user.email && emails.includes(user.email.toLowerCase())) ||
    (user.telegram_id && tgIds.includes(String(user.telegram_id))) ||
    (user.telegram_username && tgUsernames.includes(user.telegram_username.toLowerCase()))
  );
}
