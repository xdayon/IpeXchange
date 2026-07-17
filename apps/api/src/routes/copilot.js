import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../lib/supabase.js';
import { extractDrafts } from '../lib/gemini.js';
import { transcribe, extractDraftsGroq } from '../lib/groq.js';
import { normalizeDraftForReview } from '../lib/copilotDrafts.js';
import {
  NEXUM_PROMPT_VERSION, refreshMarketSignal, runNexumTurn,
} from '../lib/nexumEngine.js';
import copilotPublish from './copilotPublish.js';

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
    if (created.error?.code === '23505') {
      const existing = await db.from('nexum_sessions').select('*')
        .eq('id', sessionId).eq('user_id', user.id).maybeSingle();
      session = existing.data;
    } else if (!created.error) {
      session = created.data;
    }
    if (!session) return c.json({ error: 'Could not start Nexum session' }, 500);
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
    refreshMarketSignal(c.env, user.id, session.id, result.state, session.signal_signature),
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
  if (!(await allow(c, 'drafts'))) return quotaError(c);
  const extracted = (await extractDraftsGroq(c.env, rawText)) ?? (await extractDrafts(c.env, rawText));
  if (!extracted?.length) return c.json({ error: 'Could not extract intents from the interview' }, 502);
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

app.route('/copilot/drafts', copilotPublish);

export default app;
