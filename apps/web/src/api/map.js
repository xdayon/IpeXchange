import { apiFetch } from './index.js';

export async function fetchMapPoints() {
  return apiFetch('/map');
}

export async function saveLocation({ lat, lng, label }) {
  return apiFetch('/me/location', { method: 'PUT', body: JSON.stringify({ lat, lng, label }) });
}

export async function clearLocation() {
  return apiFetch('/me/location', { method: 'DELETE' });
}
