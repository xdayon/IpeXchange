-- ============================================================
-- IpeXchange MVP — intent model, consolidated schema
-- Migration 0001 — fresh start on the MVP-dedicated project.
-- Drops the superseded listing-era tables (data was disposable;
-- the demo runs on a separate Supabase project).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ── Drop superseded schema ───────────────────────────────────
DROP FUNCTION IF EXISTS find_trade_cycles(text);
DROP FUNCTION IF EXISTS find_trade_cycles(text, float, int);
DROP FUNCTION IF EXISTS match_listings(vector, float, int);
DROP FUNCTION IF EXISTS match_store_products(vector, float, int);
DROP TABLE IF EXISTS trade_edges CASCADE;
DROP TABLE IF EXISTS user_intents CASCADE;
DROP TABLE IF EXISTS demands CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS store_products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_did TEXT UNIQUE,
  wallet TEXT,
  email TEXT,
  telegram_id BIGINT UNIQUE,
  telegram_username TEXT,
  telegram_dm_ok BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Intents (wants and offers) ───────────────────────────────
CREATE TABLE intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('want', 'offer')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price_fiat NUMERIC CHECK (price_fiat >= 0),
  image_url TEXT,
  embedding VECTOR(768),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'in_cycle', 'fulfilled', 'archived')),
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'copilot', 'telegram')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intents_embedding ON intents
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_intents_feed ON intents (direction, status, created_at DESC);
CREATE INDEX idx_intents_user ON intents (user_id);

-- ── Copilot drafts ───────────────────────────────────────────
CREATE TABLE intent_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  drafts JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'discarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Interest marks ───────────────────────────────────────────
CREATE TABLE interest_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES intents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (intent_id, user_id)
);

CREATE INDEX idx_interest_marks_user ON interest_marks (user_id);

-- ── Trade cycles (multi-hop, off-chain) ──────────────────────
CREATE TABLE trade_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_hash TEXT NOT NULL UNIQUE,
  hops INT NOT NULL CHECK (hops IN (2, 3)),
  status TEXT NOT NULL DEFAULT 'suggested'
    CHECK (status IN ('suggested', 'pending_acceptance', 'accepted',
                      'completed', 'cancelled', 'expired')),
  min_similarity FLOAT,
  value_ratio FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trade_cycle_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES trade_cycles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INT NOT NULL,
  gives_intent_id UUID NOT NULL REFERENCES intents(id),
  receives_intent_id UUID NOT NULL REFERENCES intents(id),
  acceptance TEXT NOT NULL DEFAULT 'pending'
    CHECK (acceptance IN ('pending', 'accepted', 'declined')),
  delivered_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  UNIQUE (cycle_id, user_id)
);

CREATE INDEX idx_cycle_participants_user ON trade_cycle_participants (user_id);

-- ── Notifications ────────────────────────────────────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  telegram_sent BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);

-- ── AI usage limits ──────────────────────────────────────────
CREATE TABLE ai_usage (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT current_date,
  action TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day, action)
);

-- ── updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_intents_updated BEFORE UPDATE ON intents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cycles_updated BEFORE UPDATE ON trade_cycles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS: deny all client access; the Worker uses the secret key ──
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_cycle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- ── Storage bucket for intent images ─────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listing-images', 'listing-images', true, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;
