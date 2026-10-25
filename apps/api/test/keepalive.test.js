import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { pingUrls } from '../src/lib/keepalive.js';

// Port 9 (discard) refuses connections, so the database is unreachable.
const DOWN_ENV = { SUPABASE_URL: 'http://127.0.0.1:9', SUPABASE_SECRET_KEY: 'unused' };

describe('keepalive', () => {
  it('reports an unreachable database as 503', async () => {
    const response = await createApp().request('/api/health/db', {}, DOWN_ENV);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ ok: false, database: { ok: false } });
  });

  it('skips extra pings when KEEPALIVE_URLS is unset', async () => {
    await expect(pingUrls({})).resolves.toEqual([]);
  });
});
