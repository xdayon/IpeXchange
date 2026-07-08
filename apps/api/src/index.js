import { Hono } from 'hono';
import me from './routes/me.js';
import intents from './routes/intents.js';
import market from './routes/market.js';
import interest from './routes/interest.js';
import uploads from './routes/uploads.js';
import copilot from './routes/copilot.js';
import telegram from './routes/telegram.js';
import cycles from './routes/cycles.js';
import payments from './routes/payments.js';

const app = new Hono();

app.get('/api/health', (c) =>
  c.json({ ok: true, service: 'ipexchange-api', time: new Date().toISOString() }),
);

app.route('/api', market);
app.route('/api', me);
app.route('/api', intents);
app.route('/api', interest);
app.route('/api', uploads);
app.route('/api', copilot);
app.route('/api', telegram);
app.route('/api', cycles);
app.route('/api', payments);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal error' }, 500);
});

export default app;
