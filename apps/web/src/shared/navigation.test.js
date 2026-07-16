import { describe, expect, it } from 'vitest';
import { routeFromLocation, routeToUrl } from './navigation.js';

const id = '123e4567-e89b-42d3-a456-426614174000';

describe('app navigation URLs', () => {
  it('hydrates share links and keeps them refreshable', () => {
    const route = routeFromLocation('', `/l/${id}`);
    expect(route).toEqual({ page: 'intent-detail', data: { intent: { id } } });
    expect(routeToUrl(route)).toBe(`/l/${id}`);
  });

  it('canonicalizes valid intent query links and rejects path injection', () => {
    expect(routeToUrl(routeFromLocation(`?intent=${id}`, '/'))).toBe(`/l/${id}`);
    expect(routeFromLocation('?intent=..%2Fme%2Fdm-ok%3F', '/').page).toBe('home');
  });

  it('round trips root, create and cycle pages', () => {
    expect(routeFromLocation('?view=discover', '/').page).toBe('discover');
    expect(routeFromLocation('?view=create&direction=offer', '/'))
      .toEqual({ page: 'create', data: { direction: 'offer' } });
    expect(routeToUrl({ page: 'cycle-detail', data: { cycleId: id } })).toBe(`/?cycle=${id}`);
  });

  it('falls home for unknown pages and invalid identifiers', () => {
    expect(routeFromLocation('?view=unknown', '/').page).toBe('home');
    expect(routeFromLocation('?cycle=invalid', '/').page).toBe('home');
  });
});
