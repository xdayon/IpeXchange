-- ============================================================
-- Fase 13 — multi-token checkout (ETH + USDC on Base), richer
-- user profiles (bio, avatar already existed), per-user app
-- settings and the admin flag for the metrics dashboard.
-- ============================================================

-- ── Payments: token-aware quotes ─────────────────────────────
ALTER TABLE payments
  ADD COLUMN token TEXT NOT NULL DEFAULT 'eth' CHECK (token IN ('eth', 'usdc')),
  ADD COLUMN token_usd_price NUMERIC CHECK (token_usd_price > 0);

UPDATE payments SET token_usd_price = eth_usd_price WHERE token_usd_price IS NULL;
ALTER TABLE payments ALTER COLUMN token_usd_price SET NOT NULL;
ALTER TABLE payments ALTER COLUMN eth_usd_price DROP NOT NULL;

CREATE INDEX idx_payments_status ON payments (status, created_at DESC);

-- ── Users: profile fields, settings, admin ───────────────────
ALTER TABLE users
  ADD COLUMN bio TEXT,
  ADD COLUMN settings JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_users_created ON users (created_at DESC);
CREATE INDEX idx_users_last_seen ON users (last_seen DESC);
