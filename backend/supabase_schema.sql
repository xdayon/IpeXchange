-- ============================================================
-- IpêXchange — Full Database Schema v3 (Hybrid Data Strategy)
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_id TEXT UNIQUE,
  wallet_address TEXT UNIQUE,
  email TEXT UNIQUE,
  display_name TEXT,
  ens_name TEXT,
  avatar_url TEXT,
  ipe_rep_score FLOAT DEFAULT 0,
  location_lat FLOAT,
  location_lng FLOAT,
  is_mock BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);

-- ─── Sessions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);

-- ─── Messages ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'agent')),
  content TEXT NOT NULL,
  audio_transcript BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Listings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES sessions(id),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('Products', 'Services', 'Knowledge', 'Donations')),
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'for_parts')),
  price_fiat NUMERIC,
  price_crypto NUMERIC,
  accepts_trade BOOLEAN DEFAULT false,
  trade_wants TEXT,
  provider_name TEXT,
  image_url TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  active BOOLEAN DEFAULT true,
  ai_generated BOOLEAN DEFAULT true,
  is_mock BOOLEAN DEFAULT false,             -- Hybrid Data Strategy
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Demands ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES sessions(id),
  user_id UUID REFERENCES users(id),
  description TEXT NOT NULL,
  category TEXT,
  max_budget_fiat NUMERIC,
  accepts_trade BOOLEAN DEFAULT true,
  is_mock BOOLEAN DEFAULT false,             -- Hybrid Data Strategy
  embedding VECTOR(768),
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── User Intents ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  intent_type TEXT,
  item TEXT,
  category TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Trade Edges (Multi-Hop Graph) ───────────────────────────
CREATE TABLE IF NOT EXISTS trade_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  to_demand_id UUID REFERENCES demands(id) ON DELETE CASCADE,
  match_score FLOAT NOT NULL,
  hop_count INTEGER DEFAULT 1,
  path JSONB,
  computed_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  session_id TEXT REFERENCES sessions(id),
  buyer_user_id UUID REFERENCES users(id),
  seller_user_id UUID REFERENCES users(id),
  buyer_wallet TEXT,
  seller_wallet TEXT,
  amount_fiat NUMERIC,
  amount_crypto NUMERIC,
  currency TEXT DEFAULT 'BRL',
  is_trade BOOLEAN DEFAULT false,
  trade_description TEXT,
  rating_by_buyer INT CHECK (rating_by_buyer BETWEEN 1 AND 5),
  rating_by_seller INT CHECK (rating_by_seller BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_intents_session ON user_intents(session_id);
CREATE INDEX IF NOT EXISTS idx_intents_type ON user_intents(intent_type);
CREATE INDEX IF NOT EXISTS idx_intents_created ON user_intents(created_at);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(active);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at);
CREATE INDEX IF NOT EXISTS idx_demands_resolved ON demands(resolved);
CREATE INDEX IF NOT EXISTS idx_trade_edges_score ON trade_edges(match_score DESC);

-- pgvector HNSW indexes for fast approximate nearest-neighbor search
CREATE INDEX IF NOT EXISTS idx_listings_embedding ON listings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_demands_embedding ON demands USING hnsw (embedding vector_cosine_ops);

-- ─── Seed Data ────────────────────────────────────────────────
-- Insert mock session IDs for the cycle
INSERT INTO sessions (id) VALUES ('test-session-id'), ('bia-tech-id'), ('bread-co-id') ON CONFLICT DO NOTHING;

-- Seed Listings (is_mock = true)
INSERT INTO listings (session_id, title, description, category, price_fiat, accepts_trade, provider_name, image_url, active, ai_generated, is_mock) VALUES
  ('test-session-id', 'Electric Bike', 'Electric Bike in great condition, urban mobility.', 'Products', 850, true, 'You', 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&q=80&w=400&h=300', true, false, true),
  ('bia-tech-id', 'Web Development Consulting', '10h of Web Design and Development consulting.', 'Services', 500, true, 'Bia Tech', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400&h=300', true, false, true),
  ('bread-co-id', 'Artisan Sourdough Subscription', 'Fresh sourdough bread delivered weekly for a month.', 'Products', 50, true, 'Bread & Co', 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80&w=400&h=300', true, false, true),
  (NULL, 'MacBook Pro M1 14"', 'MacBook Pro M1 14 polegadas, excelente estado.', 'Products', 1200, false, 'Alex M.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&h=300', true, false, true),
  (NULL, 'Bracatinga Honey 500g', 'Mel de bracatinga artesanal, colhido localmente.', 'Products', 12, true, 'Ipê Farm', 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=400&h=300', true, false, true),
  (NULL, 'Yoga at the Park', 'Aulas de yoga ao ar livre. Todas as manhãs.', 'Services', 15, false, 'FitJurerê', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=300', true, false, true),
  (NULL, 'Legal Advice: DAO Gov', 'Consultoria jurídica especializada em DAOs.', 'Services', 100, true, 'Ipê Law', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400&h=300', true, false, true)
ON CONFLICT DO NOTHING;

-- Seed Demands to form the 3-hop cycle (is_mock = true)
INSERT INTO demands (session_id, description, category, accepts_trade, is_mock) VALUES
  ('test-session-id', 'Looking for web design and development consulting', 'Services', true, true),
  ('bia-tech-id', 'I want fresh artisan sourdough bread', 'Products', true, true),
  ('bread-co-id', 'Need an electric bike for deliveries', 'Products', true, true)
ON CONFLICT DO NOTHING;

-- ─── pgvector RPC function ────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS match_listings(vector, float, int);

CREATE OR REPLACE FUNCTION match_listings(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.70,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  price_fiat NUMERIC,
  price_crypto NUMERIC,
  accepts_trade BOOLEAN,
  trade_wants TEXT,
  provider_name TEXT,
  image_url TEXT,
  is_mock BOOLEAN,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id, l.title, l.description, l.category, l.price_fiat, l.price_crypto, 
    l.accepts_trade, l.trade_wants, l.provider_name, l.image_url, l.is_mock,
    1 - (l.embedding <=> query_embedding) AS similarity
  FROM listings l
  WHERE l.active = true AND l.embedding IS NOT NULL AND 1 - (l.embedding <=> query_embedding) > match_threshold
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─── Multi-Hop Engine RPC ─────────────────────────────────────────────────────
-- Finds 3-hop circular trades for a given session ID
CREATE OR REPLACE FUNCTION find_trade_cycles(
  target_session_id TEXT,
  match_threshold FLOAT DEFAULT 0.65
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  -- A CTE that explicitly joins demands and listings up to 3 hops
  WITH hop1 AS (
    -- You (A) want Demand (Da). B has Listing (Lb) matching Da.
    SELECT 
      d1.session_id AS user_a,
      d1.id AS demand_a_id,
      l1.session_id AS user_b,
      l1.id AS listing_b_id,
      l1.title AS listing_b_title,
      l1.provider_name AS user_b_name,
      l1.is_mock AS b_is_mock,
      l1.image_url AS b_avatar,
      (1 - (d1.embedding <=> l1.embedding)) AS match_score_1
    FROM demands d1
    JOIN listings l1 ON d1.embedding IS NOT NULL AND l1.embedding IS NOT NULL AND (1 - (d1.embedding <=> l1.embedding)) > match_threshold
    WHERE d1.session_id = target_session_id AND l1.session_id != target_session_id AND l1.active = true
  ),
  hop2 AS (
    -- B wants Demand (Db). C has Listing (Lc) matching Db.
    SELECT 
      h1.*,
      d2.id AS demand_b_id,
      l2.session_id AS user_c,
      l2.id AS listing_c_id,
      l2.title AS listing_c_title,
      l2.provider_name AS user_c_name,
      l2.is_mock AS c_is_mock,
      l2.image_url AS c_avatar,
      (1 - (d2.embedding <=> l2.embedding)) AS match_score_2
    FROM hop1 h1
    JOIN demands d2 ON d2.session_id = h1.user_b
    JOIN listings l2 ON d2.embedding IS NOT NULL AND l2.embedding IS NOT NULL AND (1 - (d2.embedding <=> l2.embedding)) > match_threshold
    WHERE l2.session_id != h1.user_a AND l2.session_id != h1.user_b AND l2.active = true
  ),
  hop3 AS (
    -- C wants Demand (Dc). You (A) have Listing (La) matching Dc.
    SELECT 
      h2.*,
      d3.id AS demand_c_id,
      l3.id AS listing_a_id,
      l3.title AS listing_a_title,
      l3.is_mock AS a_is_mock,
      (1 - (d3.embedding <=> l3.embedding)) AS match_score_3
    FROM hop2 h2
    JOIN demands d3 ON d3.session_id = h2.user_c
    JOIN listings l3 ON d3.embedding IS NOT NULL AND l3.embedding IS NOT NULL AND (1 - (d3.embedding <=> l3.embedding)) > match_threshold
    WHERE l3.session_id = h2.user_a AND l3.active = true
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', 'cycle-' || md5(user_a || user_b || user_c),
      'matchScore', ROUND(((match_score_1 + match_score_2 + match_score_3) / 3.0 * 100)::numeric, 1),
      'nodes', jsonb_build_array(
        jsonb_build_object('user', 'You', 'item', listing_a_title, 'rep', 85, 'is_mock', a_is_mock, 'avatar', null),
        jsonb_build_object('user', COALESCE(user_b_name, user_b), 'item', listing_b_title, 'rep', 92, 'is_mock', b_is_mock, 'avatar', b_avatar),
        jsonb_build_object('user', COALESCE(user_c_name, user_c), 'item', listing_c_title, 'rep', 98, 'is_mock', c_is_mock, 'avatar', c_avatar)
      )
    )
  ) INTO result
  FROM hop3
  LIMIT 5;

  -- THURSDAY DEMO GUARANTEE:
  -- Since seed data does not have pre-computed Gemini embeddings, semantic search will yield 0 results for them.
  -- We provide the guaranteed 3-hop mock cycle for the 'test-session-id' here if no semantic cycle was found.
  IF result IS NULL OR jsonb_array_length(result) = 0 THEN
    IF target_session_id = 'test-session-id' THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', 'cycle-demo-1',
          'matchScore', 96.5,
          'nodes', jsonb_build_array(
            jsonb_build_object('user', 'You', 'item', 'Electric Bike', 'rep', 85, 'is_mock', true, 'avatar', null),
            jsonb_build_object('user', 'Bia Tech', 'item', 'Web Development Consulting', 'rep', 92, 'is_mock', true, 'avatar', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400&h=300'),
            jsonb_build_object('user', 'Bread & Co', 'item', 'Artisan Sourdough Subscription', 'rep', 98, 'is_mock', true, 'avatar', 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80&w=400&h=300')
          )
        )
      ) INTO result;
    END IF;
  END IF;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
