import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../lib/supabase.js';
import { embed, extractDrafts } from '../lib/gemini.js';
import { transcribe, extractDraftsGroq } from '../lib/groq.js';
import { findCycles, matchAndNotify } from '../lib/matching.js';
import {
  intentEmbeddingText, normalizeCopilotDraft, normalizeDraftForReview,
} from '../lib/copilotDrafts.js';
import {
  NEXUM_PROMPT_VERSION, runNexumTurn,
} from '../lib/nexumEngine.js';

const app = new Hono();

// Daily per-user limits; each action is gated separately.
const LIMITS = { interview: 60, transcribe: 40, drafts: 10 };

async function allow(c, action) {
  const db = getDb(c.env);
  const { data, error } = await db.rpc('increment_ai_usage', {
    p_user: c.get('user').id,
    p_action: action,
    p_limit: LIMITS[action],
  });
  if (error) {
    console.error('ai_usage gate failed:', error);
    return false;
  }
  return data === true;
}

const quotaError = (c) =>
  c.json({ error: 'Daily AI limit reached. Come back tomorrow.' }, 429);

app.post('/copilot/transcribe', requireAuth, async (c) => {
  const form = await c.req.formData().catch(() => null);
  const file = form?.get('audio');
  if (!file || typeof file === 'string') return c.json({ error: 'audio field is required (multipart/form-data)' }, 400);
  if (file.size > 10 * 1024 * 1024) return c.json({ error: 'Audio must be 10MB or smaller' }, 413);
  if (!(await allow(c, 'transcribe'))) return quotaError(c);

  const text = await transcribe(c.env, file);
  if (!text) return c.json({ error: 'Could not transcribe the audio' }, 502);
  return c.json({ text });
});

app.post('/copilot/interview', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const sessionId = String(body?.session_id ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return c.json({ error: 'Valid session_id is required' }, 400);
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-20) : null;
  if (!messages) return c.json({ error: 'messages array is required' }, 400);
  const clean = messages
    .filter((m) => ['user', 'assistant'].includes(m?.role) && typeof m?.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!(await allow(c, 'interview'))) return quotaError(c);

  const user = c.get('user');
  const db = getDb(c.env);
  let { data: session } = await db.from('nexum_sessions').select('*')
    .eq('id', sessionId).eq('user_id', user.id).maybeSingle();
  if (!session) {
    const created = await db.from('nexum_sessions').insert({
      id: sessionId, user_id: user.id, prompt_version: NEXUM_PROMPT_VERSION,
    }).select().single();
    if (created.error) return c.json({ error: 'Could not start Nexum session' }, 500);
    session = created.data;
  }
  const { data: live } = await db
    .from('intents')
    .select('direction, kind, title, concept_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(20);
  const result = await runNexumTurn(c.env, {
    name: user.display_name, live: live ?? [], messages: clean,
    previous: session.state ?? {}, signal: session.market_signal,
    memory: user.nexum_memory_enabled ? user.nexum_memory : {},
    turnCount: session.turn_count + 1,
  });
  if (!result?.reply) return c.json({ error: 'Nexum is unavailable right now' }, 502);
  await db.from('nexum_sessions').update({
    state: result.state, language: result.language,
    turn_count: session.turn_count + 1, status: result.state.ready ? 'ready' : 'active',
    prompt_version: NEXUM_PROMPT_VERSION, updated_at: new Date().toISOString(),
  }).eq('id', session.id).eq('user_id', user.id);
  c.executionCtx.waitUntil(Promise.all([
    db.from('nexum_events').insert({
      user_id: user.id, session_id: session.id, event: 'turn_completed',
      properties: { turn: session.turn_count + 1, ready: result.state.ready },
    }),
  ]));
  return c.json({ session_id: session.id, ...result });
});

app.post('/copilot/memory', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  if (typeof body?.enabled !== 'boolean') return c.json({ error: 'enabled is required' }, 400);
  const { error } = await getDb(c.env).from('users')
    .update({ nexum_memory_enabled: body.enabled }).eq('id', c.get('user').id);
  if (error) return c.json({ error: 'Could not update memory preference' }, 500);
  return c.json({ enabled: body.enabled });
});

app.post('/copilot/events', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const allowed = ['opened', 'first_answer', 'reveal_clicked', 'draft_edited', 'published', 'abandoned'];
  if (!allowed.includes(body?.event)) return c.json({ error: 'Invalid event' }, 400);
  const sessionId = /^[0-9a-f-]{36}$/i.test(body?.session_id) ? body.session_id : null;
  const db = getDb(c.env);
  if (sessionId) {
    const { data: session } = await db.from('nexum_sessions').select('user_id')
      .eq('id', sessionId).maybeSingle();
    if (session && session.user_id !== c.get('user').id) return c.json({ error: 'Invalid session' }, 403);
    if (!session) await db.from('nexum_sessions').insert({
      id: sessionId, user_id: c.get('user').id, prompt_version: NEXUM_PROMPT_VERSION,
    });
  }
  await db.from('nexum_events').insert({
    user_id: c.get('user').id, session_id: sessionId, event: body.event,
    properties: body?.properties && typeof body.properties === 'object' ? body.properties : {},
  });
  return c.json({ ok: true });
});

app.post('/copilot/drafts', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => null);
  // Preferred input is the full interview transcript; raw_text stays for compat.
  const turns = Array.isArray(body?.messages)
    ? body.messages
        .slice(-40)
        .filter((m) => ['user', 'assistant'].includes(m?.role) && typeof m?.content === 'string')
    : null;
  const rawText = turns?.length
    ? turns.map((m) => `${m.role === 'assistant' ? 'Nexum' : 'Member'}: ${m.content.slice(0, 2000)}`).join('\n')
    : String(body?.raw_text ?? '').trim();
  if (rawText.length < 10) return c.json({ error: 'messages or raw_text is required (min 10 chars)' }, 400);
  const db = getDb(c.env);
  const validSessionId = /^[0-9a-f-]{36}$/i.test(body?.session_id) ? body.session_id : null;
  const { data: session } = validSessionId
    ? await db.from('nexum_sessions').select('state, status')
      .eq('id', validSessionId).eq('user_id', user.id).maybeSingle()
    : { data: null };
  let extracted = session?.status === 'ready' ? session.state?.intents : null;
  if (!Array.isArray(extracted)) {
    if (!(await allow(c, 'drafts'))) return quotaError(c);
    extracted = (await extractDraftsGroq(c.env, rawText)) ?? (await extractDrafts(c.env, rawText));
  }
  if (!extracted) return c.json({ error: 'Could not extract intents from the text' }, 502);
  const drafts = extracted.map(normalizeDraftForReview)
    .filter((draft) => draft.direction && draft.title?.length >= 3)
    .slice(0, 10);

  const { data, error } = await db
    .from('intent_drafts')
    .insert({
      user_id: user.id, raw_text: rawText.slice(0, 12000), drafts,
      session_id: validSessionId,
    })
    .select('id, drafts, status, created_at, session_id')
    .single();
  if (error) {
    console.error('Draft insert failed:', error);
    return c.json({ error: 'Could not save drafts' }, 500);
  }
  if (validSessionId) {
    await db.from('nexum_events').insert({
      user_id: user.id, session_id: body.session_id, event: 'reveal_clicked',
      properties: { draft_count: drafts.length },
    });
  }
  return c.json(data, 201);
});

app.post('/copilot/drafts/:id/publish', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => null);
  const picked = Array.isArray(body?.drafts) ? body.drafts.slice(0, 10) : null;
  if (!picked?.length) return c.json({ error: 'drafts array is required' }, 400);

  const db = getDb(c.env);
  const { data: draft } = await db
    .from('intent_drafts')
    .select('id, user_id, status, session_id')
    .eq('id', c.req.param('id'))
    .maybeSingle();
  if (!draft || draft.user_id !== user.id) return c.json({ error: 'Not found' }, 404);
  if (draft.status !== 'draft') return c.json({ error: 'Draft already resolved' }, 409);

  const rows = [];
  for (const d of picked) {
    const normalized = normalizeCopilotDraft(d);
    if (!normalized.direction || !normalized.title || normalized.title.length < 3) continue;
    rows.push({
      user_id: user.id,
      ...normalized,
      source: 'copilot',
      embedding: await embed(c.env, intentEmbeddingText(normalized)),
    });
  }
  if (!rows.length) return c.json({ error: 'No valid drafts to publish' }, 400);

  const { data: intents, error } = await db
    .from('intents')
    .insert(rows)
    .select('id, direction, kind, title, price_fiat, status');
  if (error) {
    console.error('Draft publish failed:', error);
    return c.json({ error: 'Could not publish intents' }, 500);
  }

  await db.from('intent_drafts').update({ status: 'published' }).eq('id', draft.id);
  await db.from('nexum_events').insert({
    user_id: user.id, session_id: draft.session_id,
    event: 'published', properties: { intent_count: intents.length },
  });
  if (draft.session_id) await db.from('nexum_sessions')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', draft.session_id).eq('user_id', user.id);
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
