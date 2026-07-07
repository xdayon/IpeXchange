const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const EMBED_MODEL = 'gemini-embedding-001';

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
