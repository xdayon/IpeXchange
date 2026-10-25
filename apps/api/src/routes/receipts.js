import { Hono } from 'hono';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';
import { fromHex, merkleProof, hex } from '../lib/merkle.js';
import { verifySignature } from '../lib/signer.js';
import { explorerUrl } from '../lib/solanaAnchor.js';

const app = new Hono();

app.get('/receipts/:cycleId', rateLimit(60, 'receipts'), async (c) => {
  const db = getDb(c.env);
  const { data: row, error } = await db.from('loop_receipts')
    .select('payload, digest, signature, signer, batch_id, receipt_batches ( id, merkle_root, leaf_count, status, chain, cluster, tx_signature )')
    .eq('cycle_id', c.req.param('cycleId'))
    .maybeSingle();
  if (error && error.code !== '22P02') return c.json({ error: 'Lookup failed' }, 500);
  if (!row) return c.json({ error: 'Not found' }, 404);

  const batch = row.receipt_batches;
  let proof = [];
  if (batch) {
    const { data: leaves } = await db.from('loop_receipts').select('digest').eq('batch_id', batch.id);
    proof = (await merkleProof((leaves ?? []).map((l) => fromHex(l.digest)), fromHex(row.digest))).map(hex);
  }
  return c.json({
    receipt: row.payload,
    digest: row.digest,
    signature: row.signature,
    signer: row.signer,
    verified_signature: row.signature
      ? await verifySignature(row.signer, row.signature, fromHex(row.digest))
      : false,
    batch: batch
      ? { ...batch, explorer_url: batch.tx_signature ? explorerUrl(c.env, batch.tx_signature, batch.cluster) : null }
      : null,
    proof,
  });
});

export default app;
