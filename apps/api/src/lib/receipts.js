import { getDb } from './supabase.js';
import { fromHex, hex } from './merkle.js';
import { base58Encode } from './base58.js';
import { loadSigner, signBytes } from './signer.js';

const enc = new TextEncoder();

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function sha256Hex(text) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text))));
}

// Pseudonymous member id: stable per user, unlinkable without the secret.
async function memberPseudonym(env, userId) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(env.LINK_TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`receipt:${userId}`))));
}

export async function buildPayload(env, cycle, participants) {
  const seats = [...participants].sort((a, b) => a.position - b.position);
  return {
    v: 1,
    app: 'ipexchange',
    loop: cycle.id,
    hops: cycle.hops,
    completed_at: new Date(cycle.updated_at).toISOString(),
    members: await Promise.all(seats.map((s) => memberPseudonym(env, s.user_id))),
    offers: await Promise.all(seats.map((s) => sha256Hex(s.gives_intent_id))),
    score: cycle.score,
  };
}

export const digestOf = (payload) => sha256Hex(canonicalJson(payload));

// Idempotent: a loop gets at most one receipt.
export async function createReceipt(env, cycleId) {
  const db = getDb(env);
  const { data: cycle } = await db
    .from('trade_cycles')
    .select('id, hops, status, score, updated_at, trade_cycle_participants ( user_id, position, gives_intent_id )')
    .eq('id', cycleId)
    .maybeSingle();
  if (cycle?.status !== 'completed') return null;
  const payload = await buildPayload(env, cycle, cycle.trade_cycle_participants);
  const digest = await digestOf(payload);
  const row = { cycle_id: cycle.id, payload, digest };
  const signer = await loadSigner(env);
  if (signer) {
    row.signer = signer.address;
    row.signature = base58Encode(await signBytes(signer, fromHex(digest)));
  }
  const { error } = await db.from('loop_receipts')
    .upsert(row, { onConflict: 'cycle_id', ignoreDuplicates: true });
  if (error) console.error('Receipt insert failed:', error.message);
  return digest;
}

export async function safeCreateReceipt(env, cycleId) {
  try {
    return await createReceipt(env, cycleId);
  } catch (err) {
    console.error('Receipt creation failed:', err.message);
    return null;
  }
}
