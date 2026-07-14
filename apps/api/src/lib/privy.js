async function fetchPrivyUser(env, privyDid) {
  if (!env.PRIVY_APP_ID || !env.PRIVY_APP_SECRET || !privyDid) return null;
  try {
    const res = await fetch(`https://auth.privy.io/api/v1/users/${encodeURIComponent(privyDid)}`, {
      headers: {
        Authorization: `Basic ${btoa(`${env.PRIVY_APP_ID}:${env.PRIVY_APP_SECRET}`)}`,
        'privy-app-id': env.PRIVY_APP_ID,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function validEmail(address) {
  if (typeof address !== 'string' || address.length > 320) return null;
  const email = address.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

// Returns undefined when Privy cannot be consulted, null when the Privy user
// has no verified email, and a normalized address when it does.
export async function getVerifiedPrivyEmail(env, privyDid) {
  const user = await fetchPrivyUser(env, privyDid);
  if (!user) return undefined;

  const verified = (user.linked_accounts ?? [])
    .filter((account) => account.type === 'email' && Number(account.verified_at) > 0)
    .map((account) => ({
      email: validEmail(account.address),
      verifiedAt: Number(account.latest_verified_at ?? account.verified_at),
    }))
    .filter((account) => account.email)
    .sort((a, b) => b.verifiedAt - a.verifiedAt);
  return verified[0]?.email ?? null;
}

export async function syncPrivyEmail(env, db, user) {
  if (!user.privy_did) return undefined;
  const email = await getVerifiedPrivyEmail(env, user.privy_did);
  if (email === undefined) return undefined;
  if ((user.email ?? null) === email) return email;

  const { error } = await db.from('users').update({ email }).eq('id', user.id);
  if (error) throw error;
  user.email = email;
  return email;
}

// Server-side Privy lookup: proves a wallet address is actually linked
// to the caller's Privy account before it becomes their payout address.
// Returns true/false when verifiable, null when verification is not
// possible (no app secret configured or Privy unreachable).
export async function walletBelongsToUser(env, privyDid, address) {
  const user = await fetchPrivyUser(env, privyDid);
  if (!user) return null;
  try {
    return (user.linked_accounts ?? []).some(
      (a) =>
        (a.type === 'wallet' || a.type === 'smart_wallet') &&
        a.address?.toLowerCase() === address,
    );
  } catch {
    return null;
  }
}
