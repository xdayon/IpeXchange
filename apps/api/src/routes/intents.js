import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../lib/supabase.js';
import { embed } from '../lib/gemini.js';
import { matchAndNotify } from '../lib/matching.js';
import {
  DIRECTIONS, KINDS, STATUSES, CONTINUOUS_KINDS, EDITABLE, INTENT_FIELDS,
  validateKindFields, kindFieldValues,
} from '../lib/intentFields.js';

const app = new Hono();

app.post('/intents', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const { direction, kind, title, description, category, price_fiat, image_url, source, is_continuous } = body;
  if (!DIRECTIONS.includes(direction)) return c.json({ error: 'direction must be want or offer' }, 400);
  if (kind != null && !KINDS.includes(kind)) return c.json({ error: 'kind must be good, digital, service or knowledge' }, 400);
  if (!title || String(title).trim().length < 3) return c.json({ error: 'title is required (min 3 chars)' }, 400);
  if (price_fiat != null && (isNaN(Number(price_fiat)) || Number(price_fiat) < 0)) {
    return c.json({ error: 'price_fiat must be a non-negative number' }, 400);
  }
  const fieldError = validateKindFields(body);
  if (fieldError) return c.json({ error: fieldError }, 400);

  const embedding = await embed(c.env, `${title}\n${description ?? ''}`);

  const db = getDb(c.env);
  const { data, error } = await db
    .from('intents')
    .insert({
      user_id: user.id,
      direction,
      kind: kind ?? null,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      category: category ?? null,
      price_fiat: price_fiat != null ? Number(price_fiat) : null,
      image_url: image_url ?? null,
      source: source === 'copilot' || source === 'telegram' ? source : 'manual',
      is_continuous: CONTINUOUS_KINDS.includes(kind) ? Boolean(is_continuous) : false,
      ...kindFieldValues(body),
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
  return c.json(data);
});

app.patch('/intents/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const patch = {};
  for (const key of EDITABLE) if (key in body) patch[key] = body[key];
  if (Object.keys(patch).length === 0) return c.json({ error: 'Nothing to update' }, 400);
  if (patch.status && !STATUSES.includes(patch.status)) return c.json({ error: 'Invalid status' }, 400);
  if (patch.kind != null && !KINDS.includes(patch.kind)) return c.json({ error: 'Invalid kind' }, 400);
  if (patch.title != null && String(patch.title).trim().length < 3) {
    return c.json({ error: 'title is required (min 3 chars)' }, 400);
  }
  const fieldError = validateKindFields(patch);
  if (fieldError) return c.json({ error: fieldError }, 400);

  const db = getDb(c.env);
  const { data: existing } = await db
    .from('intents')
    .select('id, user_id, kind, title, description')
    .eq('id', c.req.param('id'))
    .maybeSingle();
  if (!existing) return c.json({ error: 'Not found' }, 404);
  if (existing.user_id !== user.id) return c.json({ error: 'Forbidden' }, 403);

  if ('is_continuous' in patch) {
    const effectiveKind = patch.kind ?? existing.kind;
    patch.is_continuous = CONTINUOUS_KINDS.includes(effectiveKind) ? Boolean(patch.is_continuous) : false;
  }

  if (patch.title || patch.description !== undefined) {
    const title = patch.title ?? existing.title;
    const description = patch.description !== undefined ? patch.description : existing.description;
    patch.embedding = await embed(c.env, `${title}\n${description ?? ''}`);
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
