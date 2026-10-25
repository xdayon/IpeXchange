-- Verifiable trade loop receipts: one pseudonymous, signed receipt per
-- completed loop, anchored in batches as a Merkle root on Solana.
CREATE TABLE receipt_batches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  merkle_root TEXT NOT NULL,
  leaf_count INT NOT NULL CHECK (leaf_count > 0),
  chain TEXT NOT NULL DEFAULT 'solana',
  cluster TEXT,
  tx_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'anchored', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  anchored_at TIMESTAMPTZ
);

CREATE TABLE loop_receipts (
  cycle_id UUID PRIMARY KEY REFERENCES trade_cycles(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  digest TEXT NOT NULL,
  signature TEXT,
  signer TEXT,
  batch_id BIGINT REFERENCES receipt_batches(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX loop_receipts_unbatched_idx ON loop_receipts (created_at) WHERE batch_id IS NULL;
CREATE INDEX loop_receipts_batch_idx ON loop_receipts (batch_id);
CREATE INDEX receipt_batches_open_idx ON receipt_batches (status) WHERE status <> 'anchored';

ALTER TABLE receipt_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_receipts ENABLE ROW LEVEL SECURITY;
