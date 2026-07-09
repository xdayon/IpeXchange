import { apiFetch } from './index.js';

export async function fetchMe() {
  return apiFetch('/me');
}

export async function updateProfile(patch) {
  return apiFetch('/me', { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function saveSettings(settings) {
  return apiFetch('/me/settings', { method: 'PUT', body: JSON.stringify(settings) });
}

export async function fetchMyStats() {
  return apiFetch('/me/stats');
}

export async function claimReferral(ref) {
  return apiFetch('/me/referral', { method: 'POST', body: JSON.stringify({ ref }) });
}

export async function fetchMyTrades() {
  return apiFetch('/me/trades');
}

export async function requestTelegramLink() {
  return apiFetch('/me/telegram-link-token', { method: 'POST' });
}

export async function confirmDmOk() {
  return apiFetch('/me/dm-ok', { method: 'POST' });
}

export async function saveWallet(address) {
  return apiFetch('/me/wallet', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
}
