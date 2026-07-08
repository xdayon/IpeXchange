// All HTTP calls go through apiFetch. Components never fetch directly.
// Auth is attached here: a Privy access-token provider registered by useAuth,
// plus Telegram initData when running inside the Mini App.

let BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
if (BASE.startsWith('http') && !BASE.endsWith('/api')) BASE += '/api';

export const API_URL = BASE;

let getAccessToken = null;

export function registerTokenProvider(fn) {
  getAccessToken = fn;
}

async function authHeaders() {
  const headers = {};
  const initData = window?.Telegram?.WebApp?.initData;
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (getAccessToken) {
    try {
      const token = await getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // expired session: fall through as anonymous / Telegram-only
    }
  }
  return headers;
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(await authHeaders()), ...options.headers };
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const err = new Error(body?.error || `API ${res.status}: ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// POST that streams a plain-text body; onChunk receives the accumulated text.
// Resolves with the full text once the stream ends.
export async function apiStream(path, body, onChunk) {
  const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' };
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const err = new Error(data?.error || `API ${res.status}: ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onChunk?.(full);
  }
  return full;
}
