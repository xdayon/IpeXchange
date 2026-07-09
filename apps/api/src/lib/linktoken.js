// Short-lived HMAC tokens that carry a user id through the Telegram
// /start deep link, so a web account can claim its Telegram identity.
const enc = new TextEncoder();
const TTL_SECONDS = 15 * 60;

async function sign(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
  // Hex keeps the signature free of the '_' separator used in the token.
  return [...sig].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Telegram start payloads only allow [A-Za-z0-9_-], max 64 chars.
export async function createLinkToken(env, userId) {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const compactId = userId.replaceAll('-', '');
  const payload = `${compactId}_${exp}`;
  const sig = (await sign(env.LINK_TOKEN_SECRET, payload)).slice(0, 24);
  return `${payload}_${sig}`;
}

// Constant-time comparison of two equal-length hex strings, to avoid
// leaking timing information about how much of the signature matched.
function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyLinkToken(env, token) {
  const parts = String(token ?? '').split('_');
  if (parts.length !== 3) return null;
  const [compactId, expStr, sig] = parts;
  if (!/^[0-9a-f]{32}$/.test(compactId)) return null;
  const expected = (await sign(env.LINK_TOKEN_SECRET, `${compactId}_${expStr}`)).slice(0, 24);
  if (!timingSafeEqualHex(sig, expected)) return null;
  if (Number(expStr) < Date.now() / 1000) return null;
  return `${compactId.slice(0, 8)}-${compactId.slice(8, 12)}-${compactId.slice(12, 16)}-${compactId.slice(16, 20)}-${compactId.slice(20)}`;
}
