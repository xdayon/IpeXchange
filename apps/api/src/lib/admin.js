// Admins are flagged in the DB. The ADMIN_EMAILS / ADMIN_TELEGRAM_IDS
// secrets bootstrap the first admins: an allowlisted account is promoted
// the first time it authenticates and stays flagged from then on.
// Email matching only accepts the address verified server-side for the
// current request. The persisted profile email is never an authority signal.
// Telegram usernames are deliberately not supported here: they are mutable
// and reclaimable, so allowlisting by username could hand admin access to
// whoever later grabs a former admin's handle.
export function isAllowlistedAdmin(env, user, verifiedEmail) {
  const emails = (env.ADMIN_EMAILS ?? '').toLowerCase().split(',').map((s) => s.trim());
  const tgIds = (env.ADMIN_TELEGRAM_IDS ?? '').split(',').map((s) => s.trim());
  return Boolean(
    (verifiedEmail && emails.includes(verifiedEmail.toLowerCase())) ||
    (user.telegram_id && tgIds.includes(String(user.telegram_id)))
  );
}
