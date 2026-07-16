import { describe, expect, it } from 'vitest';
import { getIntentDeepLinkId, isUuid } from './deepLinks.js';

const id = '123e4567-e89b-42d3-a456-426614174000';

describe('intent deep links', () => {
  it('accepts UUID intent query parameters', () => {
    expect(getIntentDeepLinkId(`?intent=${id}`, '/')).toBe(id);
  });

  it('rejects encoded API path injection in the query parameter', () => {
    expect(getIntentDeepLinkId('?intent=..%2Fme%2Fdm-ok%3F', '/')).toBeNull();
  });

  it('falls back to a valid share path when the query value is invalid', () => {
    expect(getIntentDeepLinkId('?intent=invalid', `/l/${id}`)).toBe(id);
  });

  it('rejects malformed and unsupported UUIDs', () => {
    expect(isUuid('123e4567-e89b-02d3-a456-426614174000')).toBe(false);
    expect(isUuid('../me/dm-ok')).toBe(false);
    expect(isUuid(null)).toBe(false);
  });
});
