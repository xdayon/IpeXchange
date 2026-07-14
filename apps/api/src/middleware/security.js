import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';

export const apiSecureHeaders = secureHeaders({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
});

// Same CSP/security headers as apps/web/public/_headers (kept in sync
// manually — see the comment there). Needed here because /l/:id is a
// run_worker_first route in wrangler.jsonc, so it bypasses _headers.
export const SPA_SECURITY_HEADERS = {
  'content-security-policy':
    "default-src 'self'; script-src 'self' https://telegram.org https://challenges.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https://*.supabase.co https://t.me https://*.telegram.org; " +
    "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://web.telegram.org https://*.telegram.org; " +
    "worker-src 'self' blob:; manifest-src 'self'; " +
    'child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org; ' +
    'frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org ' +
    'https://challenges.cloudflare.com https://oauth.telegram.org; ' +
    "connect-src 'self' https://auth.privy.io https://*.rpc.privy.systems wss://relay.walletconnect.com " +
    'wss://relay.walletconnect.org wss://www.walletlink.org https://explorer-api.walletconnect.com ' +
    'https://pulse.walletconnect.org https://api.web3modal.org',
  'x-content-type-options': 'nosniff',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'microphone=(self), camera=(), geolocation=()',
};

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
