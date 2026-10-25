import { getDb } from './supabase.js';

// Supabase pauses Free projects after a week without activity. A read
// through its REST API counts as activity, so the cron trigger runs this.
export async function pingDatabase(env) {
  const started = Date.now();
  // No retries: a health check must report an outage, not wait it out.
  const { error } = await getDb(env).from('intents').select('id').limit(1).retry(false);
  if (error) console.error('Database ping failed:', error.message ?? error);
  return { ok: !error, ms: Date.now() - started };
}

// Optional extra endpoints (comma-separated KEEPALIVE_URLS), such as the
// legacy demo backend, which hits its own Supabase project on each request.
export async function pingUrls(env) {
  const urls = String(env.KEEPALIVE_URLS ?? '').split(',').map((u) => u.trim()).filter(Boolean);
  return Promise.all(urls.map(async (url) => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
      return { url, status: res.status };
    } catch (err) {
      console.error('Keepalive fetch failed:', url, err.message);
      return { url, status: 0 };
    }
  }));
}

export async function keepAlive(env) {
  const [database, urls] = await Promise.all([pingDatabase(env), pingUrls(env)]);
  console.log('Keepalive:', JSON.stringify({ database, urls }));
  return { database, urls };
}
