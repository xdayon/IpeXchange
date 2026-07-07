import { apiFetch } from './index.js';

export async function fetchMarket({ direction, kind, q, limit, offset } = {}) {
  const p = new URLSearchParams();
  if (direction) p.set('direction', direction);
  if (kind) p.set('kind', kind);
  if (q) p.set('q', q);
  if (limit) p.set('limit', limit);
  if (offset) p.set('offset', offset);
  const qs = p.toString() ? `?${p}` : '';
  return apiFetch(`/market${qs}`);
}

export async function fetchIntent(id) {
  return apiFetch(`/intents/${id}`);
}

export async function createIntent(payload) {
  return apiFetch('/intents', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateIntent(id, patch) {
  return apiFetch(`/intents/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function fetchMyIntents(direction) {
  const qs = direction ? `?direction=${direction}` : '';
  return apiFetch(`/me/intents${qs}`).then((d) => d.intents ?? []);
}

export async function markInterest(intentId, message) {
  return apiFetch(`/intents/${intentId}/interest`, {
    method: 'POST',
    body: JSON.stringify({ message: message ?? null }),
  });
}

export async function fetchMyInterests() {
  return apiFetch('/me/interests');
}

export async function uploadImage(file) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch('/uploads', { method: 'POST', body: form });
}
