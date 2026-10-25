import { base58Decode, base58Encode } from './base58.js';

const b64url = (bytes) => btoa(String.fromCharCode(...bytes))
  .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

// Accepts a Solana keypair as base58 of the 64-byte secret key, or as the
// Solana CLI JSON array of 64 numbers.
export function parseSecretKey(text) {
  const raw = String(text ?? '').trim();
  const bytes = raw.startsWith('[') ? Uint8Array.from(JSON.parse(raw)) : base58Decode(raw);
  if (bytes.length !== 64) throw new Error('Solana secret key must be 64 bytes');
  return bytes;
}

let cached = null;

// Returns { privateKey, publicKey (bytes), address (base58) } or null when
// SOLANA_ANCHOR_SECRET is not configured.
export async function loadSigner(env) {
  const secret = env.SOLANA_ANCHOR_SECRET;
  if (!secret) return null;
  if (cached?.secret === secret) return cached.signer;
  const bytes = parseSecretKey(secret);
  const publicKey = bytes.slice(32);
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'OKP', crv: 'Ed25519', d: b64url(bytes.slice(0, 32)), x: b64url(publicKey) },
    { name: 'Ed25519' },
    false,
    ['sign'],
  );
  const signer = { privateKey, publicKey, address: base58Encode(publicKey) };
  cached = { secret, signer };
  return signer;
}

export async function signBytes(signer, bytes) {
  return new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, signer.privateKey, bytes));
}

export async function verifySignature(address, signature, bytes) {
  try {
    const key = await crypto.subtle.importKey(
      'raw', base58Decode(address), { name: 'Ed25519' }, false, ['verify'],
    );
    return await crypto.subtle.verify({ name: 'Ed25519' }, key, base58Decode(signature), bytes);
  } catch {
    return false;
  }
}
