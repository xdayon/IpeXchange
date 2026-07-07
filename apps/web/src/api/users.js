// ── Users API ────────────────────────────────────────────────────
import { apiFetch } from './index.js';

export async function upsertUser({ walletAddress, email, privyId, displayName }) {
  return apiFetch('/users/upsert', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, email, privyId, displayName }),
  }).catch(() => null);
}

export async function fetchUserProfile(walletAddress) {
  if (!walletAddress) return null;
  return apiFetch(`/users/${walletAddress}/profile`).then(d => d.profile || null).catch(() => null);
}

export async function recordTransaction(payload) {
  return apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).catch(() => null);
}
