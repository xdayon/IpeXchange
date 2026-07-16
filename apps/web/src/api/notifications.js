import { apiFetch } from './index.js';

export function fetchNotifications({ limit = 20, cursor = null } = {}) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);
  return apiFetch(`/me/notifications?${query}`);
}

export function fetchUnreadNotificationCount() {
  return apiFetch('/me/notifications/unread-count');
}

export function markNotificationsRead(ids) {
  return apiFetch('/me/notifications/read', {
    method: 'POST',
    body: JSON.stringify(ids === 'all' ? { all: true } : { ids }),
  });
}
