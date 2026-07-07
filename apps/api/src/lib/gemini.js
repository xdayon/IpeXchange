const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const EMBED_MODEL = 'text-embedding-004';

// Returns a 768-dim vector, or null on failure (embeddings are best-effort:
// an intent without embedding still publishes, it just skips semantic match).
export async function embed(env, text) {
  if (!env.GEMINI_API_KEY || !text) return null;
  try {
    const res = await fetch(`${BASE}/models/${EMBED_MODEL}:embedContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text: String(text).slice(0, 8000) }] } }),
    });
    if (!res.ok) {
      console.error('Gemini embed failed:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.embedding?.values ?? null;
  } catch (err) {
    console.error('Gemini embed error:', err);
    return null;
  }
}
