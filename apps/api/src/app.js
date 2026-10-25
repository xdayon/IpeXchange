import { Hono } from 'hono';
import { apiBodyLimit, apiSecureHeaders, rateLimit } from './middleware/security.js';
import { pingDatabase } from './lib/keepalive.js';

export function createApp() {
  const app = new Hono();

  app.use('/api/*', apiSecureHeaders, apiBodyLimit);
  app.get('/api/health', (c) =>
    c.json({ ok: true, service: 'ipexchange-api', time: new Date().toISOString() }));
  // Deep check for uptime monitors: fails when the database is unreachable.
  app.get('/api/health/db', rateLimit(10, 'health-db'), async (c) => {
    const database = await pingDatabase(c.env);
    return c.json({ ok: database.ok, database }, database.ok ? 200 : 503);
  });

  app.notFound((c) => c.json({ error: 'Not found' }, 404));
  app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({ error: 'Internal error' }, 500);
  });

  return app;
}
