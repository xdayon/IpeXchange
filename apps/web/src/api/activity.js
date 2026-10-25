import { apiFetch } from './index.js';

export async function fetchActivity() {
  return apiFetch('/activity');
}

export async function fetchRadar() {
  return apiFetch('/me/radar');
}
