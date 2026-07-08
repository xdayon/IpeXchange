import { apiFetch } from './index.js';

export async function fetchAdminMetrics() {
  return apiFetch('/admin/metrics');
}

export async function fetchAdminUsers(offset = 0, limit = 50) {
  return apiFetch(`/admin/users?offset=${offset}&limit=${limit}`);
}
