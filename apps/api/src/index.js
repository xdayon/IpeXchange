import { createApp } from './app.js';
import me from './routes/me.js';
import intents from './routes/intents.js';
import market from './routes/market.js';
import interest from './routes/interest.js';
import uploads from './routes/uploads.js';
import copilot from './routes/copilot.js';
import telegram from './routes/telegram.js';
import cycles from './routes/cycles.js';
import payments from './routes/payments.js';
import admin from './routes/admin.js';
import share from './routes/share.js';
import notifications from './routes/notifications.js';
import { keepAlive } from './lib/keepalive.js';

const app = createApp();

app.route('/api', market);
app.route('/api', me);
app.route('/api', intents);
app.route('/api', interest);
app.route('/api', uploads);
app.route('/api', copilot);
app.route('/api', telegram);
app.route('/api', cycles);
app.route('/api', payments);
app.route('/api', admin);
app.route('/api', notifications);
app.route('/', share);

export default {
  fetch: app.fetch,
  // Cron trigger from wrangler.jsonc: keeps the Supabase Free project active.
  scheduled: (_controller, env, ctx) => ctx.waitUntil(keepAlive(env)),
};
