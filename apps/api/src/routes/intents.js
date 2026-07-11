import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';
import { embed } from '../lib/gemini.js';
import { matchAndNotify } from '../lib/matching.js';
import { countCompletedTrades } from '../lib/trades.js';
import { intentEmbeddingText } from '../lib/copilotDrafts.js';
import {
  DIRECTIONS, CONTINUOUS_KINDS, EDITABLE, INTENT_FIELDS,
  KIND_FIELD_KEYS, validateIntentCreate, validateIntentPatch, kindFieldValues,
} from '../lib/intentFields.js';

const app = new Hono();

app.post('/intents', requireAuth, rateLimit(20, 'intent-create'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const { direction, kind, title, description, category, price_fiat, image_url, source, is_continuous } = body;
  const validationError = validateIntentCreate(body, c.env.SUPABASE_URL);
  if (validationError) return c.json({ error: validationError }, 400);

  const trimmedDescription = description ? String(description).trim().slice(0, 4000) : null;
  const normalizedCategory = category != null ? String(category).trim().toLowerCase().slice(0, 40) : null;

  const embedding = await embed(c.env, intentEmbeddingText({ ...body, title, description }));

  const db = getDb(c.env);
  const { data, error } = await db
    .from('intents')
    .insert({
      user_id: user.id,
      direction,
      kind: kind ?? null,
      title: String(title).trim(),
      description: trimmedDescription,
      category: normalizedCategory,
      price_fiat: price_fiat != null ? Number(price_fiat) : null,
      image_url: image_url ?? null,
      source: source === 'copilot' || source === 'telegram' ? source : 'manual',
      is_continuous: CONTINUOUS_KINDS.includes(kind) ? Boolean(is_continuous) : false,
      ...kindFieldValues(body),
      concept_id: body.concept_id ?? null,
      location_text: body.location_text ?? null,
      location_radius_km: body.location_radius_km ?? null,
      timeframe: body.timeframe ?? null,
      quantity: body.quantity ?? null,
      currency: body.currency ?? null,
      value_flexibility: body.value_flexibility ?? null,
      exchange_modes: Array.isArray(body.exchange_modes) ? body.exchange_modes : [],
      delivery_modes: Array.isArray(body.delivery_modes) ? body.delivery_modes : [],
      attributes: body.attributes ?? {}, constraints: body.constraints ?? {},
      field_confidence: body.field_confidence ?? {}, expires_at: body.expires_at ?? null,
      embedding,
    })
    .select(INTENT_FIELDS)
    .single();

  if (error) {
    console.error('Intent insert failed:', error);
    return c.json({ error: 'Could not create intent' }, 500);
  }
  c.executionCtx.waitUntil(matchAndNotify(c.env, user.id));
  return c.json(data, 201);
});

app.get('/intents/:id', async (c) => {
  const db = getDb(c.env);
  const { data, error } = await db
    .from('intents')
    .select(`${INTENT_FIELDS}, users ( id, display_name, avatar_url, telegram_username, wallet )`)
    .eq('id', c.req.param('id'))
    .maybeSingle();

  if (error) return c.json({ error: 'Lookup failed' }, 500);
  if (!data || data.status === 'archived') return c.json({ error: 'Not found' }, 404);
  // The wallet address itself only travels via POST /payments quotes.
  if (data.users) {
    data.users = { ...data.users, wallet: undefined, has_wallet: Boolean(data.users.wallet) };
  }
  data.owner_completed_trades = await countCompletedTrades(c.env, data.user_id);
  return c.json(data);
});

app.patch('/intents/:id', requireAuth, rateLimit(30, 'intent-edit'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const patch = {};
  for (const key of EDITABLE) if (key in body) patch[key] = body[key];
  if (Object.keys(patch).length === 0) return c.json({ error: 'Nothing to update' }, 400);
  const validationError = validateIntentPatch(patch, c.env.SUPABASE_URL);
  if (validationError) return c.json({ error: validationError }, 400);
  if (patch.description != null) patch.description = String(patch.description).trim().slice(0, 4000);
  if (patch.category != null) patch.category = String(patch.category).trim().toLowerCase().slice(0, 40);

  const db = getDb(c.env);
  const { data: existing } = await db
    .from('intents')
    .select(INTENT_FIELDS)
    .eq('id', c.req.param('id'))
    .maybeSingle();
  if (!existing) return c.json({ error: 'Not found' }, 404);
  if (existing.user_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  if ('is_continuous' in patch) {
    const effectiveKind = patch.kind ?? existing.kind;
    patch.is_continuous = CONTINUOUS_KINDS.includes(effectiveKind) ? Boolean(patch.is_continuous) : false;
  }

  const semanticFields = [
    'title', 'description', 'kind', 'category', 'is_continuous', ...KIND_FIELD_KEYS,
  ];
  if (semanticFields.some((field) => field in patch)) {
    const title = patch.title ?? existing.title;
    const description = patch.description !== undefined ? patch.description : existing.description;
    patch.embedding = await embed(c.env, intentEmbeddingText({ ...existing, ...patch, title, description }));
  }
  patch.updated_at = new Date().toISOString();

  const { data, error } = await db
    .from('intents')
    .update(patch)
    .eq('id', existing.id)
    .select(INTENT_FIELDS)
    .single();

  if (error) {
    console.error('Intent update failed:', error);
    return c.json({ error: 'Could not update intent' }, 500);
  }
  return c.json(data);
});

app.get('/me/intents', requireAuth, async (c) => {
  const user = c.get('user');
  const direction = c.req.query('direction');
  const db = getDb(c.env);

  let query = db
    .from('intents')
    .select(INTENT_FIELDS)
    .eq('user_id', user.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });
  if (DIRECTIONS.includes(direction)) query = query.eq('direction', direction);

  const { data, error } = await query;
  if (error) return c.json({ error: 'Lookup failed' }, 500);
  return c.json({ intents: data ?? [] });
});

export default app;
