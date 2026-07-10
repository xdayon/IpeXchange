import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('API smoke tests', () => {
  it('serves the health endpoint', async () => {
    const response = await app.request('/api/health');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, service: 'ipexchange-api' });
  });

  it('returns JSON for an unknown API route', async () => {
    const response = await app.request('/api/does-not-exist');
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Not found' });
  });
});
