import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';

export const apiSecureHeaders = secureHeaders({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
});

// Uploads cap at 5MB server-side already; 6MB covers multipart overhead
// and stops oversized bodies from ever reaching a handler.
export const apiBodyLimit = bodyLimit({
  maxSize: 6 * 1024 * 1024,
  onError: (c) => c.json({ error: 'Request body too large' }, 413),
});

// Fixed-window limiter, per isolate. Not a global guarantee on Workers,
// but each isolate refuses bursts, which is what abuse looks like.
const WINDOW_MS = 60 * 1000;
const buckets = new Map();

function clientKey(c) {
  return c.get('user')?.id || c.req.header('cf-connecting-ip') || 'anon';
}

export function rateLimit(limit, scope) {
  return async (c, next) => {
    const now = Date.now();
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    }
    const key = `${scope}:${clientKey(c)}`;
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else if (bucket.count >= limit) {
      return c.json({ error: 'Too many requests. Try again in a minute.' }, 429);
    } else {
      bucket.count += 1;
    }
    await next();
  };
}
