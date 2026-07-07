import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../lib/supabase.js';
import { embed, extractDrafts } from '../lib/gemini.js';
import { transcribe, chat, extractDraftsGroq } from '../lib/groq.js';
import { NEXUM_SYSTEM_PROMPT } from '../lib/nexum.js';

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
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-20) : null;
  if (!messages) return c.json({ error: 'messages array is required' }, 400);
  const clean = messages
    .filter((m) => ['user', 'assistant'].includes(m?.role) && typeof m?.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!(await allow(c, 'interview'))) return quotaError(c);

  const reply = await chat(c.env, [{ role: 'system', content: NEXUM_SYSTEM_PROMPT }, ...clean]);
  if (!reply) return c.json({ error: 'Nexum is unavailable right now' }, 502);
  return c.json({ reply });
});

app.post('/copilot/drafts', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => null);
  const rawText = String(body?.raw_text ?? '').trim();
  if (rawText.length < 10) return c.json({ error: 'raw_text is required (min 10 chars)' }, 400);
  if (!(await allow(c, 'drafts'))) return quotaError(c);

  // Groq is the fast path; Gemini structured output is the fallback.
  const drafts = (await extractDraftsGroq(c.env, rawText)) ?? (await extractDrafts(c.env, rawText));
  if (!drafts) return c.json({ error: 'Could not extract intents from the text' }, 502);

  const db = getDb(c.env);
  const { data, error } = await db
    .from('intent_drafts')
    .insert({ user_id: user.id, raw_text: rawText.slice(0, 12000), drafts })
    .select('id, drafts, status, created_at')
    .single();
  if (error) {
    console.error('Draft insert failed:', error);
    return c.json({ error: 'Could not save drafts' }, 500);
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
    .select('id, user_id, status')
    .eq('id', c.req.param('id'))
    .maybeSingle();
  if (!draft || draft.user_id !== user.id) return c.json({ error: 'Not found' }, 404);
  if (draft.status !== 'draft') return c.json({ error: 'Draft already resolved' }, 409);

  const rows = [];
  for (const d of picked) {
    if (!['want', 'offer'].includes(d?.direction)) continue;
    const title = String(d.title ?? '').trim();
    if (title.length < 3) continue;
    rows.push({
      user_id: user.id,
      direction: d.direction,
      kind: ['good', 'digital', 'service', 'knowledge'].includes(d.kind) ? d.kind : null,
      title: title.slice(0, 80),
      description: d.description ? String(d.description).trim() : null,
      price_fiat: d.price_fiat != null && !isNaN(Number(d.price_fiat)) ? Number(d.price_fiat) : null,
      source: 'copilot',
      embedding: await embed(c.env, `${title}\n${d.description ?? ''}`),
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
  return c.json({ intents }, 201);
});

export default app;
