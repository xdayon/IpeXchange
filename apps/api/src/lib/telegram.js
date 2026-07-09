const enc = new TextEncoder();

async function hmacSha256(keyBytes, message) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time comparison of two equal-length hex strings, to avoid
// leaking timing information about how much of the signature matched.
function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Validates Telegram Mini App initData (HMAC scheme from the official docs).
// Returns the parsed user object plus raw fields, or null if invalid/stale.
export async function validateInitData(initData, botToken, maxAgeSeconds = 21600) {
  if (!initData || !botToken) return null;
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');
    const dataCheckString = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');
    const secretKey = await hmacSha256(enc.encode('WebAppData'), botToken);
    const signature = toHex(await hmacSha256(secretKey, dataCheckString));
    if (!timingSafeEqualHex(signature, hash)) return null;
    const authDate = Number(params.get('auth_date'));
    if (!authDate || Date.now() / 1000 - authDate > maxAgeSeconds) return null;
    const user = JSON.parse(params.get('user') || 'null');
    if (!user?.id) return null;
    return { user, startParam: params.get('start_param') || null };
  } catch {
    return null;
  }
}

export async function sendMessage(env, chatId, text, extra = {}) {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, ...extra }),
  });
  if (!res.ok) console.error('Telegram sendMessage failed:', res.status, await res.text());
  return res.ok;
}
