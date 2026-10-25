import { apiFetch } from './index.js';

export async function fetchAdminMetrics() {
  return apiFetch('/admin/metrics');
}

export async function fetchAdminUsers(offset = 0, limit = 50) {
  return apiFetch(`/admin/users?offset=${offset}&limit=${limit}`);
}

export async function runClearing({ maxHops, dryRun }) {
  return apiFetch('/admin/clearing', {
    method: 'POST',
    body: JSON.stringify({ max_hops: maxHops, dry_run: dryRun }),
  });
}
