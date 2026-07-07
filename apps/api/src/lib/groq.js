// Groq free tier carries the conversational load (Llama 3.3 70B, 1k req/day)
// and audio transcription (Whisper large v3, 2k req/day), keeping the much
// smaller Gemini quota for embeddings and structured extraction.
const BASE = 'https://api.groq.com/openai/v1';
const CHAT_MODEL = 'llama-3.3-70b-versatile';
const WHISPER_MODEL = 'whisper-large-v3';

export async function transcribe(env, file) {
  if (!env.GROQ_API_KEY) return null;
  try {
    const form = new FormData();
    form.append('file', file, file.name || 'audio.webm');
    form.append('model', WHISPER_MODEL);
    form.append('response_format', 'json');
    const res = await fetch(`${BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.GROQ_API_KEY}` },
      body: form,
    });
    if (!res.ok) {
      console.error('Groq transcribe failed:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.text?.trim() || null;
  } catch (err) {
    console.error('Groq transcribe error:', err);
    return null;
  }
}

const EXTRACT_PROMPT = `You extract marketplace intents from free-form text spoken or written by a member of the Ipe City network. Reply ONLY with a JSON object: {"drafts": [...]}.

Each draft: {"direction": "want"|"offer", "kind": "good"|"digital"|"service"|"knowledge", "title": string (max 80 chars), "description": string, "price_fiat": number|null, "missing_fields": string[]}.

Rules:
- Extract EVERY distinct interest (direction "want": something they are looking for) and offer (direction "offer": something they bring - goods, digital products, services, work, consulting, knowledge) as a separate draft.
- Output in English regardless of the input language.
- NEVER invent a price. Only set price_fiat when the text states a value (converted to USD); otherwise null and add "price_fiat" to missing_fields.
- List in missing_fields anything that would make the intent clearer.
- No extractable intent: return {"drafts": []}.`;

// Fast-path extraction on Groq JSON mode; returns array of drafts or null.
export async function extractDraftsGroq(env, rawText) {
  const out = await chat(
    env,
    [
      { role: 'system', content: EXTRACT_PROMPT },
      { role: 'user', content: String(rawText).slice(0, 12000) },
    ],
    { temperature: 0.2, maxTokens: 1500, json: true },
  );
  if (!out) return null;
  try {
    const drafts = JSON.parse(out)?.drafts;
    return Array.isArray(drafts) ? drafts : null;
  } catch {
    return null;
  }
}

export async function chat(env, messages, { temperature = 0.7, maxTokens = 500, json = false } = {}) {
  if (!env.GROQ_API_KEY) return null;
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.GROQ_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!res.ok) {
      console.error('Groq chat failed:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error('Groq chat error:', err);
    return null;
  }
}
