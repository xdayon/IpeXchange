import { Hono } from 'hono';
import { ImageResponse } from 'workers-og';
import { getDb } from '../lib/supabase.js';
import { buildOgCardHtml } from '../lib/ogcard.js';
import { fetchPublicIntent, injectShareMetaTags } from '../lib/share.js';
import { SPA_SECURITY_HEADERS } from '../middleware/security.js';

const app = new Hono();

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function buildDescription(intent) {
  const priceLabel = formatUsd(intent.price_fiat);
  const prefix = priceLabel ? `${priceLabel} · ` : '';
  const body = String(intent.description ?? '').trim();
  const budget = Math.max(150 - prefix.length, 0);
  const truncated = body.length > budget ? `${body.slice(0, Math.max(budget - 1, 0)).trimEnd()}…` : body;
  return `${prefix}${truncated}`;
}

async function fetchAsset(c, path) {
  const res = await c.env.ASSETS.fetch(new URL(path, c.req.url));
  return res.arrayBuffer();
}

// Chunked to stay under the argument-count limit of String.fromCharCode.
function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(bin);
}

app.get('/l/:id', async (c) => {
  const db = getDb(c.env);
  const intent = await fetchPublicIntent(db, c.req.param('id'));
  if (!intent) return c.redirect('/', 302);

  const shellRes = await c.env.ASSETS.fetch(new URL('/', c.req.url));
  const shell = await shellRes.text();

  const origin = new URL(c.req.url).origin;
  const title = esc(intent.title);
  const description = esc(buildDescription(intent));
  const imageUrl = `${origin}/og/${intent.id}.png`;
  const pageUrl = `${origin}/l/${intent.id}`;

  const metaTags = `
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${esc(imageUrl)}" />
    <meta property="og:url" content="${esc(pageUrl)}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${esc(imageUrl)}" />
  </head>`;

  // Drop the shell's generic og/twitter tags: crawlers honor the first occurrence.
  const html = injectShareMetaTags(shell, metaTags);
  return c.body(html, 200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'public, max-age=300',
    ...SPA_SECURITY_HEADERS,
  });
});

app.get('/og/:file', async (c) => {
  const id = c.req.param('file').replace(/\.png$/, '');
  const db = getDb(c.env);
  const intent = await fetchPublicIntent(db, id);
  if (!intent) return c.notFound();

  const cache = caches.default;
  const cacheKey = new Request(c.req.url);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const [regular, bold, logoBuf] = await Promise.all([
    fetchAsset(c, '/fonts/Inter-Regular.ttf'),
    fetchAsset(c, '/fonts/Inter-Bold.ttf'),
    fetchAsset(c, '/logo.png'),
  ]);
  const logoDataUri = `data:image/png;base64,${toBase64(logoBuf)}`;

  const html = buildOgCardHtml(intent, { logoDataUri });
  const image = new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: regular, weight: 400, style: 'normal' },
      { name: 'Inter', data: bold, weight: 800, style: 'normal' },
    ],
  });

  const response = new Response(image.body, {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' },
  });
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

export default app;
