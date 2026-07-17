import { chat } from './groq.js';
import { buildNexumPrompt } from './nexum.js';
import { deriveInterviewState, signalIntent } from './nexumState.js';
import { sanitizePills } from './nexumPills.js';
import { embed } from './gemini.js';
import { intentEmbeddingText } from './copilotDrafts.js';
import { getDb } from './supabase.js';
import { TAXONOMY_PROMPT } from './intentTaxonomy.js';

export const NEXUM_PROMPT_VERSION = 'nexum-adaptive-v4';

function compact(value) {
  if (Array.isArray(value)) return value.map(compact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([, item]) => item != null && item !== ''
      && (!Array.isArray(item) || item.length) && item !== false)
    .map(([key, item]) => [key, compact(item)]));
}

function parseObject(raw) {
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function extractionPrompt({ live, previous, memory }) {
  return `You maintain the verified structured state of a marketplace interview. Extract facts from the member, using Nexum's question only to resolve short answers. Return JSON only: {"language":string,"side_status":{"want":"unknown|provided|declined","offer":"unknown|provided|declined"},"intents":[]}.
Each intent is a COMPLETE current snapshot with: interview_key, direction, kind, title, description, category, concept_id, price_fiat, condition, brand, duration, format, access, level, is_continuous, location_text, location_radius_km, timeframe, quantity, currency, value_flexibility, exchange_modes, delivery_modes, confidence, missing_fields. Assign and preserve a stable interview_key such as "want-1"; corrections update that key.
direction="want|offer"; kind="good|digital|service|knowledge". condition="new|used|refurbished"; format="in_person|online|hybrid"; access="one_time|lifetime"; level="beginner|intermediate|advanced"; value_flexibility="fixed|flexible|unknown". Use null or [] when unknown. Canonical concepts: ${TAXONOMY_PROMPT}.
Extract only member-stated facts, never examples or guesses. Output every accumulated intent, preserving previous facts unless corrected. Structured text is English. Mark a side declined only after an explicit refusal. Existing live intents must not be duplicated: ${JSON.stringify(compact(live))}. Preferences must be confirmed before use: ${JSON.stringify(compact(memory))}. Previous state: ${JSON.stringify(compact(previous))}.`;
}

function conversationLanguage(messages, modelLanguage, previousLanguage) {
  const memberText = messages.filter((message) => message.role === 'user')
    .map((message) => message.content.toLowerCase()).join(' ');
  const pt = memberText.match(/\b(quero|procuro|preciso|tenho|ofere[cç]o|gostaria|para|nada|agora|pode|n[aã]o|troca)\b/g)?.length ?? 0;
  if (pt >= 2 || /[ãõçáéíóúâêô]/.test(memberText)) return 'pt-BR';
  return String(modelLanguage ?? previousLanguage ?? 'en').slice(0, 20);
}

function recoveryQuestion(state, language) {
  const pt = String(language).startsWith('pt');
  const subject = state.intents.at(-1)?.title;
  if (!state.intents.length) {
    return pt ? 'O que você gostaria de encontrar ou oferecer no mercado agora?'
      : 'What would you like to find or offer in the market right now?';
  }
  if (state.side_status.want === 'unknown') {
    return pt ? `Além de ${subject}, o que seria valioso encontrar por aqui?`
      : `Besides ${subject}, what would be valuable for you to find here?`;
  }
  if (state.side_status.offer === 'unknown') {
    return pt ? `Pensando em ${subject}, que habilidade, serviço ou item você poderia oferecer ao mercado?`
      : `Thinking about ${subject}, what skill, service, or item could you offer the market?`;
  }
  return pt ? `Qual detalhe sobre ${subject} mais ajudaria alguém a saber se combina com o que precisa?`
    : `What detail about ${subject} would best help someone know whether it fits their needs?`;
}

export function finalizeNexumTurn(output, context) {
  const turnCount = Number(context.turnCount) || 1;
  const language = conversationLanguage(context.messages, output.language, context.previous.language);
  const state = deriveInterviewState(output, context.previous, { turnCount });
  state.focus_field = String(output.focus_field ?? '').trim().slice(0, 40) || null;
  state.signal_announced = context.previous.signal_announced === true
    || (output.used_market_signal === true && context.signal?.candidate_count > 0);

  let reply = String(output.reply ?? '').trim().slice(0, 800);
  const asksQuestion = reply.includes('?');
  if (state.ready && asksQuestion) {
    state.ready = false;
    state.can_reveal = false;
  }
  if (!reply) reply = recoveryQuestion(state, language);
  else if (!state.ready && !asksQuestion) reply = `${reply} ${recoveryQuestion(state, language)}`;
  if (state.ready && !/revis|review/i.test(reply)) {
    reply += language.startsWith('pt')
      ? ' Você já pode revisar tudo antes de publicar.'
      : ' You can now review everything before publishing.';
  }

  return {
    reply,
    language,
    pills: state.ready ? [] : sanitizePills(output.suggested_pills, reply),
    state,
  };
}

export async function runNexumTurn(env, context) {
  const raw = await chat(env, [
    { role: 'system', content: buildNexumPrompt({
      name: context.name, intents: compact(context.live), previous: compact(context.previous),
      memory: compact(context.memory), signal: context.signal,
    }) },
    ...context.messages.slice(-12),
  ], { temperature: 0.5, maxTokens: 450, json: true });
  const extractedRaw = await chat(env, [
    { role: 'system', content: extractionPrompt(context) },
    ...context.messages.slice(-4),
  ], { temperature: 0.1, maxTokens: 1500, json: true });
  if (!raw && !extractedRaw) return null;
  const conversation = parseObject(raw);
  const extracted = parseObject(extractedRaw);
  return finalizeNexumTurn({ ...extracted, ...conversation }, context);
}

export async function refreshMarketSignal(env, userId, sessionId, state, oldSignature) {
  const intent = signalIntent(state);
  if (!intent) return;
  const signature = JSON.stringify([intent.direction, intent.kind, intent.title, intent.description]);
  if (signature === oldSignature) return;
  const vector = await embed(env, intentEmbeddingText(intent));
  if (!vector) return;
  const db = getDb(env);
  const { data, error } = await db.rpc('nexum_market_signal', {
    query_embedding: vector, p_user: userId,
    p_direction: intent.direction, p_kind: intent.kind,
  });
  if (!error) await db.from('nexum_sessions').update({
    market_signal: data, signal_signature: signature, updated_at: new Date().toISOString(),
  }).eq('id', sessionId).eq('user_id', userId);
}
