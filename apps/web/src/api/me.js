import { apiFetch } from './index.js';

export async function fetchMe() {
  return apiFetch('/me');
}

export async function requestTelegramLink() {
  return apiFetch('/me/telegram-link-token', { method: 'POST' });
}

export async function confirmDmOk() {
  return apiFetch('/me/dm-ok', { method: 'POST' });
}
