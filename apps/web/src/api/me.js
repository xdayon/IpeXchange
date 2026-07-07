import { apiFetch } from './index.js';

export async function fetchMe() {
  return apiFetch('/me');
}
