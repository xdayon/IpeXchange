import { getDb } from './supabase.js';
import { base58Encode } from './base58.js';
import { fromHex, hex, merkleRoot } from './merkle.js';
import { loadSigner, signBytes } from './signer.js';
import { buildMemoTransaction, memoText } from './solanaTx.js';

const DEFAULT_RPC = 'https://api.devnet.solana.com';
const MAX_BATCH = 256;
const MAX_ATTEMPTS = 5;
// Kept small: every poll is a subrequest, and Workers Free allows 50 per
// invocation (shared with the keepalive cron). Unconfirmed batches are
// re-checked on the next run.
const POLL_MS = 3000;
const POLL_LIMIT_MS = 15_000;
const MAX_BATCHES_PER_RUN = 2;
const STALE_MS = 2 * 60_000;

export const clusterOf = (env) => env.SOLANA_CLUSTER || 'devnet';

export function explorerUrl(env, signature, cluster = clusterOf(env)) {
  const suffix = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${suffix}`;
}

async function rpc(env, method, params) {
  const res = await fetch(env.SOLANA_RPC_URL || DEFAULT_RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(20_000),
  });
  const json = await res.json();
  if (json.error) throw new Error(`${method}: ${json.error.message}`);
  return json.result;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function signatureStatus(env, signature) {
  const result = await rpc(env, 'getSignatureStatuses', [[signature], { searchTransactionHistory: true }]);
  const status = result.value?.[0];
  if (!status) return 'unknown';
  if (status.err) return 'failed';
  return ['confirmed', 'finalized'].includes(status.confirmationStatus) ? 'anchored' : 'submitted';
}

async function pollUntilConfirmed(env, signature) {
  const deadline = Date.now() + POLL_LIMIT_MS;
  let state = 'submitted';
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    state = await signatureStatus(env, signature).catch(() => 'submitted');
    if (state === 'anchored' || state === 'failed') return state;
  }
  return 'submitted';
}

async function markBatch(db, id, fields) {
  const { error } = await db.from('receipt_batches').update(fields).eq('id', id);
  if (error) console.error('Batch update failed:', error.message);
}

// Sends the batch's Merkle root as a Memo transaction, then waits briefly
// for confirmation. A fresh blockhash is fetched on every attempt.
async function submitBatch(env, db, signer, batch) {
  const attempts = batch.attempts + 1;
  try {
    const { value } = await rpc(env, 'getLatestBlockhash', [{ commitment: 'finalized' }]);
    const text = memoText(batch.merkle_root, batch.leaf_count);
    const tx = await buildMemoTransaction(signer, value.blockhash, text);
    const txSignature = base58Encode(tx.signature);
    await markBatch(db, batch.id, {
      status: 'submitted', attempts, tx_signature: txSignature, cluster: clusterOf(env),
    });
    await rpc(env, 'sendTransaction', [
      btoa(String.fromCharCode(...tx.bytes)),
      { encoding: 'base64', preflightCommitment: 'confirmed' },
    ]);
    const state = await pollUntilConfirmed(env, txSignature);
    const fields = { status: state };
    if (state === 'anchored') fields.anchored_at = new Date().toISOString();
    await markBatch(db, batch.id, fields);
    return { id: batch.id, status: state, tx_signature: txSignature };
  } catch (err) {
    console.error('Anchor submit failed:', err.message);
    await markBatch(db, batch.id, { status: 'failed', attempts });
    return { id: batch.id, status: 'failed', error: err.message };
  }
}

// Signs receipts created before the key existed. One select and one
// upsert, so the cron stays within the Workers subrequest budget.
async function signPending(db, signer) {
  const { data } = await db.from('loop_receipts')
    .select('cycle_id, payload, digest').is('signature', null).limit(200);
  if (!data?.length) return;
  const rows = await Promise.all(data.map(async (row) => ({
    ...row,
    signer: signer.address,
    signature: base58Encode(await signBytes(signer, fromHex(row.digest))),
  })));
  const { error } = await db.from('loop_receipts').upsert(rows, { onConflict: 'cycle_id' });
  if (error) console.error('Receipt signing failed:', error.message);
}

async function recheckSubmitted(env, db, batch) {
  const state = await signatureStatus(env, batch.tx_signature).catch(() => 'submitted');
  if (state === 'anchored') {
    await markBatch(db, batch.id, { status: 'anchored', anchored_at: new Date().toISOString() });
    return { id: batch.id, status: 'anchored', tx_signature: batch.tx_signature };
  }
  const stale = Date.now() - new Date(batch.created_at).getTime() > STALE_MS;
  if (state === 'failed' || (state === 'unknown' && stale)) return null;
  return { id: batch.id, status: 'submitted', tx_signature: batch.tx_signature };
}

async function createBatch(env, db) {
  const { data } = await db.from('loop_receipts').select('cycle_id, digest')
    .is('batch_id', null).not('signature', 'is', null)
    .order('created_at').limit(MAX_BATCH);
  if (!data?.length) return null;
  const root = hex(await merkleRoot(data.map((r) => fromHex(r.digest))));
  const { data: batch, error } = await db.from('receipt_batches')
    .insert({ merkle_root: root, leaf_count: new Set(data.map((r) => r.digest)).size, cluster: clusterOf(env) })
    .select().single();
  if (error) throw new Error(`Batch insert failed: ${error.message}`);
  const ids = data.map((r) => r.cycle_id);
  const { data: claimed } = await db.from('loop_receipts').update({ batch_id: batch.id })
    .in('cycle_id', ids).is('batch_id', null).select('cycle_id');
  if (claimed?.length !== ids.length) {
    // Another run took some of these receipts: release ours and give up.
    await db.from('loop_receipts').update({ batch_id: null }).eq('batch_id', batch.id);
    await markBatch(db, batch.id, { status: 'failed', attempts: MAX_ATTEMPTS });
    return null;
  }
  return batch;
}

export async function anchorReceipts(env) {
  const signer = await loadSigner(env);
  if (!signer) return { skipped: true };
  const db = getDb(env);
  await signPending(db, signer);
  const results = [];

  const { data: open } = await db.from('receipt_batches').select('*')
    .in('status', ['submitted', 'failed', 'pending']).lt('attempts', MAX_ATTEMPTS).order('id');
  for (const batch of open ?? []) {
    if (results.length >= MAX_BATCHES_PER_RUN) break;
    const age = Date.now() - new Date(batch.created_at).getTime();
    if (batch.status === 'pending' && age < STALE_MS) continue;
    if (batch.status === 'submitted') {
      const outcome = await recheckSubmitted(env, db, batch);
      if (outcome) { results.push(outcome); continue; }
    }
    results.push(await submitBatch(env, db, signer, batch));
  }

  const fresh = results.length < MAX_BATCHES_PER_RUN ? await createBatch(env, db) : null;
  if (fresh) results.push(await submitBatch(env, db, signer, fresh));
  return { skipped: false, signer: signer.address, batches: results };
}
