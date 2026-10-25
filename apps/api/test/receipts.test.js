import { describe, expect, it } from 'vitest';
import { base58Decode, base58Encode, compactU16 } from '../src/lib/base58.js';
import { fromHex, hex, merkleProof, merkleRoot, verifyProof } from '../src/lib/merkle.js';
import { buildPayload, canonicalJson, digestOf } from '../src/lib/receipts.js';
import { loadSigner, parseSecretKey, verifySignature } from '../src/lib/signer.js';
import { MEMO_PROGRAM, buildMemoTransaction, memoText } from '../src/lib/solanaTx.js';
import { anchorReceipts } from '../src/lib/solanaAnchor.js';

async function makeKeypair() {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const unb64 = (s) => Uint8Array.from(atob(s.replaceAll('-', '+').replaceAll('_', '/')), (ch) => ch.charCodeAt(0));
  const secret = new Uint8Array(64);
  secret.set(unb64(jwk.d));
  secret.set(unb64(jwk.x), 32);
  return secret;
}

const leaf = async (n) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`leaf${n}`)));

describe('canonical json and digest', () => {
  it('sorts keys recursively and is deterministic', async () => {
    expect(canonicalJson({ b: 1, a: { d: [2, { z: 1, y: 2 }], c: null } }))
      .toBe('{"a":{"c":null,"d":[2,{"y":2,"z":1}]},"b":1}');
    const a = { x: 1, y: { q: 1, p: 2 } };
    const b = { y: { p: 2, q: 1 }, x: 1 };
    expect(await digestOf(a)).toBe(await digestOf(b));
    expect(await digestOf(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('builds a pseudonymous payload in position order', async () => {
    const env = { LINK_TOKEN_SECRET: 'secret' };
    const cycle = { id: 'c1', hops: 2, score: 0.9, updated_at: '2026-01-01T00:00:00Z' };
    const seats = [
      { user_id: 'u2', position: 1, gives_intent_id: 'i2' },
      { user_id: 'u1', position: 0, gives_intent_id: 'i1' },
    ];
    const payload = await buildPayload(env, cycle, seats);
    expect(payload.members).toHaveLength(2);
    expect(JSON.stringify(payload)).not.toContain('u1');
    expect(payload.members[0]).not.toBe(payload.members[1]);
    expect(payload.completed_at).toBe('2026-01-01T00:00:00.000Z');
    expect(await buildPayload(env, cycle, seats.toReversed())).toEqual(payload);
  });
});

describe('base58 and compact-u16', () => {
  it('round trips and decodes the Memo program id to 32 bytes', () => {
    const bytes = Uint8Array.of(0, 0, 1, 2, 255, 128);
    expect(base58Decode(base58Encode(bytes))).toEqual(bytes);
    expect(base58Decode(MEMO_PROGRAM)).toHaveLength(32);
    expect(base58Encode(base58Decode(MEMO_PROGRAM))).toBe(MEMO_PROGRAM);
  });

  it('encodes compact-u16', () => {
    expect([...compactU16(0)]).toEqual([0]);
    expect([...compactU16(127)]).toEqual([127]);
    expect([...compactU16(128)]).toEqual([0x80, 1]);
    expect([...compactU16(16384)]).toEqual([0x80, 0x80, 1]);
  });
});

describe('merkle tree', () => {
  for (const n of [1, 2, 3, 5]) {
    it(`proves every leaf of ${n}`, async () => {
      const leaves = await Promise.all(Array.from({ length: n }, (_, i) => leaf(i)));
      const root = await merkleRoot(leaves);
      expect(await merkleRoot(leaves.toReversed())).toEqual(root);
      for (const l of leaves) {
        expect(await verifyProof(l, await merkleProof(leaves, l), root)).toBe(true);
      }
      expect(await verifyProof(await leaf(99), await merkleProof(leaves, leaves[0]), root)).toBe(false);
    });
  }
});

describe('signer and memo transaction', () => {
  it('parses both secret key formats', async () => {
    const secret = await makeKeypair();
    expect(parseSecretKey(base58Encode(secret))).toEqual(secret);
    expect(parseSecretKey(JSON.stringify([...secret]))).toEqual(secret);
    expect(() => parseSecretKey('abc')).toThrow();
    const a = await loadSigner({ SOLANA_ANCHOR_SECRET: base58Encode(secret) });
    const b = await loadSigner({ SOLANA_ANCHOR_SECRET: JSON.stringify([...secret]) });
    expect(a.address).toBe(b.address);
    expect(await loadSigner({})).toBeNull();
  });

  it('lays out a signed legacy memo transaction', async () => {
    const signer = await loadSigner({ SOLANA_ANCHOR_SECRET: base58Encode(await makeKeypair()) });
    const blockhash = base58Encode(new Uint8Array(32).fill(7));
    const text = memoText(hex(await leaf(1)), 3);
    const { bytes, signature } = await buildMemoTransaction(signer, blockhash, text);

    expect(bytes[0]).toBe(1);
    expect(bytes.slice(1, 65)).toEqual(signature);
    const message = bytes.slice(65);
    expect([...message.slice(0, 4)]).toEqual([1, 0, 1, 2]);
    expect(message.slice(4, 36)).toEqual(signer.publicKey);
    expect(base58Encode(message.slice(36, 68))).toBe(MEMO_PROGRAM);
    expect(base58Encode(message.slice(68, 100))).toBe(blockhash);
    expect([...message.slice(100, 104)]).toEqual([1, 1, 0, text.length]);
    expect(new TextDecoder().decode(message.slice(104))).toBe(text);
    expect(await verifySignature(signer.address, base58Encode(signature), message)).toBe(true);
    expect(fromHex(hex(signature))).toEqual(signature);
  });
});

describe('anchorReceipts', () => {
  it('is a no-op without the secret', async () => {
    await expect(anchorReceipts({})).resolves.toEqual({ skipped: true });
  });
});
