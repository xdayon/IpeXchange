-- ============================================================
-- Fase 10 — direct P2P ETH payments on Base (no escrow).
-- A payment starts as a fiat->ETH quote; the buyer sends the
-- transaction from their own wallet and the Worker verifies the
-- receipt against the Base RPC before marking it confirmed.
-- ============================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES intents(id),
  buyer_user_id UUID NOT NULL REFERENCES users(id),
  seller_user_id UUID NOT NULL REFERENCES users(id),
  to_wallet TEXT NOT NULL,
  from_wallet TEXT,
  amount_fiat NUMERIC NOT NULL CHECK (amount_fiat > 0),
  eth_usd_price NUMERIC NOT NULL CHECK (eth_usd_price > 0),
  amount_wei NUMERIC(78, 0) NOT NULL CHECK (amount_wei > 0),
  chain_id INT NOT NULL DEFAULT 8453,
  tx_hash TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'quoted'
    CHECK (status IN ('quoted', 'submitted', 'confirmed', 'failed')),
  quote_expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_buyer ON payments (buyer_user_id, created_at DESC);
CREATE INDEX idx_payments_seller ON payments (seller_user_id, created_at DESC);
CREATE INDEX idx_payments_intent ON payments (intent_id);

CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
