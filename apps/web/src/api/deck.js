import { apiFetch } from './index.js';

export async function fetchDeck(limit = 20) {
  return apiFetch(`/deck?limit=${limit}`);
}

export async function swipeIntent(id, decision) {
  return apiFetch(`/intents/${id}/swipe`, { method: 'POST', body: JSON.stringify({ decision }) });
}

export async function undoSwipe(id) {
  return apiFetch(`/intents/${id}/swipe`, { method: 'DELETE' });
}
