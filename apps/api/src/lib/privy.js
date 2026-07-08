// Server-side Privy lookup: proves a wallet address is actually linked
// to the caller's Privy account before it becomes their payout address.
// Returns true/false when verifiable, null when verification is not
// possible (no app secret configured or Privy unreachable).
export async function walletBelongsToUser(env, privyDid, address) {
  if (!env.PRIVY_APP_SECRET || !privyDid) return null;
  try {
    const res = await fetch(`https://auth.privy.io/api/v1/users/${privyDid}`, {
      headers: {
        Authorization: `Basic ${btoa(`${env.PRIVY_APP_ID}:${env.PRIVY_APP_SECRET}`)}`,
        'privy-app-id': env.PRIVY_APP_ID,
      },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return (user?.linked_accounts ?? []).some(
      (a) => a.type === 'wallet' && a.address?.toLowerCase() === address,
    );
  } catch {
    return null;
  }
}
