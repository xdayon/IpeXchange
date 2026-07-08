const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const EMBED_MODEL = 'gemini-embedding-001';
const CHAT_MODEL = 'gemini-flash-latest';

// Vectors truncated below 3072 dims are not unit-normalized by the API.
function normalize(values) {
  if (!values) return null;
  const norm = Math.sqrt(values.reduce((s, v) => s + v * v, 0));
  return norm ? values.map((v) => v / norm) : null;
}

// Returns a 768-dim vector, or null on failure (embeddings are best-effort:
// an intent without embedding still publishes, it just skips semantic match).
export async function embed(env, text) {
  if (!env.GEMINI_API_KEY || !text) return null;
  try {
    const res = await fetch(`${BASE}/models/${EMBED_MODEL}:embedContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: String(text).slice(0, 8000) }] },
        outputDimensionality: 768,
      }),
    });
    if (!res.ok) {
      console.error('Gemini embed failed:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return normalize(data?.embedding?.values);
  } catch (err) {
    console.error('Gemini embed error:', err);
    return null;
  }
}

const DRAFT_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      direction: { type: 'STRING', enum: ['want', 'offer'] },
      kind: { type: 'STRING', enum: ['good', 'digital', 'service', 'knowledge'] },
      title: { type: 'STRING' },
      description: { type: 'STRING' },
      category: { type: 'STRING', nullable: true },
      price_fiat: { type: 'NUMBER', nullable: true },
      missing_fields: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['direction', 'kind', 'title', 'description', 'missing_fields'],
  },
};

const EXTRACTION_PROMPT = `You extract marketplace intents from a member of the Ipe City network. The input is either free-form text or an interview transcript where lines starting with "Nexum:" are the interviewer and lines starting with "Member:" are the member. Extract intents ONLY from what the member said, using Nexum's questions as context to resolve short answers.

Rules:
- Extract EVERY distinct interest (direction "want": something they are looking for) and offer (direction "offer": something they bring - goods, digital products, services, work, consulting, knowledge) as a separate draft.
- Output must be in English regardless of the input language.
- Write a short, specific, market-ready title (max 80 chars) and a description of 2-4 complete sentences in the member's first-person voice with every concrete detail they gave. Never invent details.
- category: one or two lowercase words ("electronics", "web development"); null when unclear.
- NEVER invent a price. Only set price_fiat when the text states a value (convert to USD if another currency is given); otherwise use null and add "price_fiat" to missing_fields.
- List in missing_fields anything that would make the listing stronger (e.g. "price_fiat", "condition", "timeframe", "location").
- If the text contains no extractable intent, return an empty array.`;

// Returns an array of intent drafts, or null on failure.
export async function extractDrafts(env, rawText) {
  if (!env.GEMINI_API_KEY || !rawText) return null;
  try {
    const res = await fetch(`${BASE}/models/${CHAT_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: EXTRACTION_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: String(rawText).slice(0, 12000) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: DRAFT_SCHEMA,
          temperature: 0.2,
        },
      }),
    });
    if (!res.ok) {
      console.error('Gemini extract failed:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const drafts = text ? JSON.parse(text) : null;
    return Array.isArray(drafts) ? drafts : null;
  } catch (err) {
    console.error('Gemini extract error:', err);
    return null;
  }
}
