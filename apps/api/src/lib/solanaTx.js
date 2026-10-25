import { base58Decode, compactU16 } from './base58.js';
import { signBytes } from './signer.js';

export const MEMO_PROGRAM = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

export const memoText = (rootHex, leafCount) => `ipexchange:loops:v1:${rootHex}:${leafCount}`;

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}

// Legacy-format message: header [1 signer, 0 readonly signed, 1 readonly
// unsigned], keys [fee payer, Memo program], blockhash, one instruction.
export function buildMemoMessage(signer, blockhash, text) {
  const data = new TextEncoder().encode(text);
  return concat(
    Uint8Array.of(1, 0, 1),
    compactU16(2), signer.publicKey, base58Decode(MEMO_PROGRAM),
    base58Decode(blockhash),
    compactU16(1),
    Uint8Array.of(1), compactU16(0), compactU16(data.length), data,
  );
}

export async function buildMemoTransaction(signer, blockhash, text) {
  const message = buildMemoMessage(signer, blockhash, text);
  const signature = await signBytes(signer, message);
  return { bytes: concat(compactU16(1), signature, message), signature };
}
