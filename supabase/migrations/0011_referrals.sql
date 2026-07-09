-- ============================================================
-- Fase 14 — referral attribution between users.
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
