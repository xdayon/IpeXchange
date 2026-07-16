import { getIntentDeepLinkId, isUuid } from './deepLinks.js';

const VIEW_PAGES = new Set([
  'discover', 'cycles', 'profile', 'notifications', 'settings', 'admin', 'create', 'nexum',
]);

export const HOME_ROUTE = Object.freeze({ page: 'home', data: {} });

export function routeFromLocation(search, pathname) {
  const intentId = getIntentDeepLinkId(search, pathname);
  if (intentId) return { page: 'intent-detail', data: { intent: { id: intentId } } };

  const params = new URLSearchParams(search);
  const cycleId = params.get('cycle');
  if (isUuid(cycleId)) return { page: 'cycle-detail', data: { cycleId } };

  const page = params.get('view');
  if (!VIEW_PAGES.has(page)) return HOME_ROUTE;
  const direction = params.get('direction');
  const data = page === 'create' && ['want', 'offer'].includes(direction) ? { direction } : {};
  return { page, data };
}

export function routeToUrl(route) {
  const intentId = route?.data?.intent?.id;
  if (route?.page === 'intent-detail' && isUuid(intentId)) return `/l/${intentId}`;

  const cycleId = route?.data?.cycleId;
  if (route?.page === 'cycle-detail' && isUuid(cycleId)) return `/?cycle=${cycleId}`;
  if (!VIEW_PAGES.has(route?.page)) return '/';

  const params = new URLSearchParams({ view: route.page });
  if (route.page === 'create' && ['want', 'offer'].includes(route.data?.direction)) {
    params.set('direction', route.data.direction);
  }
  return `/?${params}`;
}
