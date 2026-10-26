import { apiFetch } from './index.js';

export async function fetchMyCycles() {
  return apiFetch('/me/cycles');
}

export async function fetchCycle(id) {
  return apiFetch(`/cycles/${id}`);
}

export async function respondToCycle(id, accept) {
  return apiFetch(`/cycles/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  });
}

export async function confirmCycleStep(id, step) {
  return apiFetch(`/cycles/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ step }),
  });
}

// Public, verifiable receipt of a completed loop (404 when none exists).
export async function fetchLoopReceipt(id) {
  return apiFetch(`/receipts/${id}`);
}
