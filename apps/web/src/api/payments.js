import { apiFetch } from './index.js';

export async function createPayment(intentId, token = 'eth') {
  return apiFetch('/payments', {
    method: 'POST',
    body: JSON.stringify({ intent_id: intentId, token }),
  });
}

export async function verifyPayment(paymentId, txHash) {
  return apiFetch(`/payments/${paymentId}/verify`, {
    method: 'POST',
    body: JSON.stringify({ tx_hash: txHash }),
  });
}

export async function fetchMyPayments() {
  return apiFetch('/payments/mine');
}

export async function getPayment(paymentId) {
  return apiFetch(`/payments/${paymentId}`);
}
