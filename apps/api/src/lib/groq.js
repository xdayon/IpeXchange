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

const EXTRACT_PROMPT = `You extract marketplace intents from a member of the Ipe City network. The input is either free-form text or an interview transcript where lines starting with "Nexum:" are the interviewer and lines starting with "Member:" are the member. Extract intents ONLY from what the member said, using Nexum's questions as context to resolve short answers ("yes, around $200"). Reply ONLY with a JSON object: {"drafts": [...]}.

Each draft: {"direction": "want"|"offer", "kind": "good"|"digital"|"service"|"knowledge", "title": string (max 80 chars), "description": string, "category": string|null, "price_fiat": number|null, "missing_fields": string[]}.

Rules:
- Extract EVERY distinct interest (direction "want": something they are looking for) and offer (direction "offer": something they bring - goods, digital products, services, work, consulting, knowledge) as a separate draft. Never merge unrelated things.
- Output in English regardless of the input language.
- title: short, specific and market-ready ("MacBook Pro 14 M3, 2024" rather than "laptop").
- description: 2-4 complete sentences in the member's first-person voice, including every concrete detail they gave (condition, scope, format, experience, availability). Never invent details.
- category: one or two lowercase words ("electronics", "web development", "language classes"); null when unclear.
- NEVER invent a price. Only set price_fiat when the member stated a value (converted to USD); otherwise null and add "price_fiat" to missing_fields.
- missing_fields: list what would make the listing stronger, e.g. "price_fiat", "condition", "timeframe", "location".
- Skip anything the member says is already listed on the market.
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

// Streaming variant: returns the upstream SSE Response, or null when unavailable.
export async function chatStream(env, messages, { temperature = 0.7, maxTokens = 500 } = {}) {
  if (!env.GROQ_API_KEY) return null;
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.GROQ_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: CHAT_MODEL, messages, temperature, max_tokens: maxTokens, stream: true }),
    });
    if (!res.ok) {
      console.error('Groq stream failed:', res.status, await res.text());
      return null;
    }
    return res;
  } catch (err) {
    console.error('Groq stream error:', err);
    return null;
  }
}

// Yields content deltas from a Groq SSE response.
export async function* readDeltas(upstream) {
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) return;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // keepalive or partial frame
      }
    }
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
