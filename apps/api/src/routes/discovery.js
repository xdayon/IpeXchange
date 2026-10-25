import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';

const app = new Hono();

// Public pulse of the market: recent events and headline counts.
app.get('/activity', rateLimit(60, 'activity'), async (c) => {
  const { data, error } = await getDb(c.env).rpc('market_activity', { p_limit: 20 });
  if (error) {
    console.error('market_activity failed:', error);
    return c.json({ error: 'Activity unavailable' }, 500);
  }
  return c.json(data);
});

let jitterSalt = null;

// Keyed offsets keep map points from stacking without being reversible.
// Derived from an existing secret so the raw secret never reaches SQL.
async function mapSalt(env) {
  if (jitterSalt) return jitterSalt;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(env.LINK_TOKEN_SECRET ?? 'ipexchange-map'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('map-jitter'));
  jitterSalt = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return jitterSalt;
}

// Public map points: intents of members who shared an approximate area.
app.get('/map', rateLimit(30, 'map'), async (c) => {
  const { data, error } = await getDb(c.env).rpc('market_map', {
    p_limit: 500, p_salt: await mapSalt(c.env),
  });
  if (error) {
    console.error('market_map failed:', error);
    return c.json({ error: 'Map unavailable' }, 500);
  }
  return c.json({ points: data ?? [] });
});

// Rounds to two decimals (about 1 km); the column type enforces it too.
export function roundArea(lat, lng) {
  const numeric = (v) => (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '')) && Number.isFinite(Number(v));
  if (!numeric(lat) || !numeric(lng)) return null;
  [lat, lng] = [Number(lat), Number(lng)];
  const valid = Number.isFinite(lat) && Number.isFinite(lng)
    && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  return valid ? { lat: Math.round(lat * 100) / 100, lng: Math.round(lng * 100) / 100 } : null;
}

app.put('/me/location', requireAuth, rateLimit(10, 'location'), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const area = roundArea(body?.lat, body?.lng);
  if (!area) return c.json({ error: 'lat and lng must be valid coordinates' }, 400);
  const label = body.label ? String(body.label).trim().slice(0, 60) || null : null;

  const { error } = await getDb(c.env)
    .from('users')
    .update({ geo_lat: area.lat, geo_lng: area.lng, geo_label: label })
    .eq('id', c.get('user').id);
  if (error) return c.json({ error: 'Could not save your area' }, 500);
  return c.json({ ok: true, ...area, label });
});

app.delete('/me/location', requireAuth, rateLimit(10, 'location'), async (c) => {
  const { error } = await getDb(c.env)
    .from('users')
    .update({ geo_lat: null, geo_lng: null, geo_label: null })
    .eq('id', c.get('user').id);
  if (error) return c.json({ error: 'Could not clear your area' }, 500);
  return c.json({ ok: true });
});

export default app;
