import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';
import { embed } from '../lib/gemini.js';
import { findCycles, matchAndNotify } from '../lib/matching.js';
import {
  intentEmbeddingText, normalizeCopilotDrafts,
} from '../lib/copilotDrafts.js';

const app = new Hono();
const PUBLISH_EMBED_LIMIT = 40;

const releaseClaim = (db, draftId, userId) => db.rpc('release_copilot_draft_publish', {
  p_draft: draftId, p_user: userId,
});

app.put('/:id', requireAuth, rateLimit(20, 'copilot-draft-save'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => null);
  const drafts = normalizeCopilotDrafts(body?.drafts);
  if (!drafts?.length) return c.json({ error: 'At least one valid draft is required' }, 400);

  const db = getDb(c.env);
  const { data: existing } = await db.from('intent_drafts')
    .select('id, user_id, status').eq('id', c.req.param('id')).maybeSingle();
  if (!existing || existing.user_id !== user.id) return c.json({ error: 'Not found' }, 404);
  if (existing.status !== 'draft') return c.json({ error: 'Draft already resolved' }, 409);

  const { data, error } = await db.from('intent_drafts')
    .update({ drafts }).eq('id', existing.id).eq('user_id', user.id).eq('status', 'draft')
    .select('id, drafts, status').maybeSingle();
  if (error) {
    console.error('Draft save failed:', error);
    return c.json({ error: 'Could not save drafts' }, 500);
  }
  if (!data) return c.json({ error: 'Draft is being published' }, 409);
  return c.json(data);
});

app.post('/:id/publish', requireAuth, rateLimit(10, 'copilot-publish'), async (c) => {
  const user = c.get('user');
  const draftId = c.req.param('id');
  const db = getDb(c.env);
  const { data: claim, error: claimError } = await db.rpc('claim_copilot_draft_publish', {
    p_draft: draftId, p_user: user.id, p_limit: PUBLISH_EMBED_LIMIT,
  });
  if (claimError) {
    console.error('Draft publish claim failed:', claimError);
    return c.json({ error: 'Could not publish intents' }, 500);
  }
  if (claim?.state === 'not_found') return c.json({ error: 'Not found' }, 404);
  if (claim?.state === 'quota') {
    return c.json({ error: 'Daily AI limit reached. Come back tomorrow.' }, 429);
  }
  if (claim?.state === 'invalid') return c.json({ error: 'No valid drafts to publish' }, 400);
  if (claim?.state !== 'claimed') return c.json({ error: 'Draft already resolved' }, 409);

  const persisted = normalizeCopilotDrafts(claim.drafts);
  if (!persisted?.length || persisted.length !== claim.drafts.length) {
    await releaseClaim(db, draftId, user.id);
    return c.json({ error: 'No valid drafts to publish' }, 400);
  }

  let rows;
  try {
    rows = await Promise.all(persisted.map(async (draft) => ({
      ...draft,
      embedding: await embed(c.env, intentEmbeddingText(draft)),
    })));
  } catch (error) {
    console.error('Draft embedding failed:', error);
    await releaseClaim(db, draftId, user.id);
    return c.json({ error: 'Could not publish intents' }, 502);
  }
  const { data: published, error: publishError } = await db.rpc('finalize_copilot_draft_publish', {
    p_draft: draftId, p_user: user.id, p_rows: rows,
  });
  if (publishError || published?.state !== 'published') {
    if (publishError) console.error('Draft publish failed:', publishError);
    await releaseClaim(db, draftId, user.id);
    return c.json({ error: 'Could not publish intents' }, 500);
  }

  const intents = published.intents ?? [];
  await db.from('nexum_events').insert({
    user_id: user.id, session_id: claim.session_id,
    event: 'published', properties: { intent_count: intents.length },
  });
  if (claim.session_id) await db.from('nexum_sessions')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', claim.session_id).eq('user_id', user.id);
  if (user.nexum_memory_enabled) {
    const preference = rows.reduce((memory, intent) => ({
      ...memory,
      ...(intent.location_text ? { location_text: intent.location_text } : {}),
      ...(intent.format ? { format: intent.format } : {}),
      ...(intent.exchange_modes?.length ? { exchange_modes: intent.exchange_modes } : {}),
      ...(intent.delivery_modes?.length ? { delivery_modes: intent.delivery_modes } : {}),
    }), {});
    await db.from('users').update({ nexum_memory: preference }).eq('id', user.id);
  }

  const cycles = await findCycles(c.env, user.id);
  c.executionCtx.waitUntil(matchAndNotify(c.env, user.id, cycles));
  const best = cycles[0] ?? null;
  return c.json({
    intents,
    network_preview: {
      cycle_count: cycles.length,
      best_hops: best?.hops ?? null,
      best_similarity: best?.min_similarity ?? null,
    },
  }, 201);
});

export default app;
