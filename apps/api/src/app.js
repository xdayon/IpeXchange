import { Hono } from 'hono';
import { apiBodyLimit, apiSecureHeaders } from './middleware/security.js';

export function createApp() {
  const app = new Hono();

  app.use('/api/*', apiSecureHeaders, apiBodyLimit);
  app.get('/api/health', (c) =>
    c.json({ ok: true, service: 'ipexchange-api', time: new Date().toISOString() }));

  app.notFound((c) => c.json({ error: 'Not found' }, 404));
  app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({ error: 'Internal error' }, 500);
  });

  return app;
}
