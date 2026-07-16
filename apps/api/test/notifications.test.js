import { describe, expect, it } from 'vitest';
import {
  notificationCursor, notificationLimit, readRequest,
} from '../src/routes/notifications.js';

const first = '123e4567-e89b-42d3-a456-426614174000';
const second = '223e4567-e89b-42d3-a456-426614174000';

describe('notification request bounds', () => {
  it('defaults and clamps page size', () => {
    expect(notificationLimit(undefined)).toBe(20);
    expect(notificationLimit('0')).toBe(1);
    expect(notificationLimit('12')).toBe(12);
    expect(notificationLimit('500')).toBe(50);
    expect(notificationLimit('bad')).toBe(20);
  });

  it('validates and normalizes keyset cursors', () => {
    expect(notificationCursor(`2026-07-14T12:00:00+00:00|${first}`)).toEqual({
      createdAt: '2026-07-14T12:00:00.000Z', id: first,
    });
    expect(notificationCursor('bad')).toBeNull();
    expect(notificationCursor(`not-a-date|${first}`)).toBeNull();
    expect(notificationCursor('2026-07-14T12:00:00Z|not-a-uuid')).toBeNull();
  });

  it('accepts only bounded mark-read requests', () => {
    expect(readRequest({ all: true })).toEqual({ all: true, ids: [] });
    expect(readRequest({ ids: [first, second, first.toUpperCase()] })).toEqual({
      all: false, ids: [first, second],
    });
    expect(readRequest({ all: true, ids: [first] })).toBeNull();
    expect(readRequest({ ids: [] })).toBeNull();
    expect(readRequest({ ids: Array(51).fill(first) })).toBeNull();
    expect(readRequest({ ids: ['not-a-uuid'] })).toBeNull();
  });
});
