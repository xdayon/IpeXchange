// ── API base client ──────────────────────────────────────────────
// Todas as chamadas HTTP passam por aqui. Componentes NUNCA fazem fetch direto.

let BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
if (BASE.startsWith('http') && !BASE.endsWith('/api')) BASE += '/api';

export const API_URL = BASE;

export async function apiFetch(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}
