-- ============================================================
-- IpêXchange — Full Database Schema v2
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  ipe_rep_score FLOAT DEFAULT 0,
  wallet_address TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
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
CREATE INDEX IF NOT EXISTS idx_listings_embedding ON listings
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_demands_embedding ON demands
  USING hnsw (embedding vector_cosine_ops);

-- ─── Seed Data ────────────────────────────────────────────────
-- Migrated from hardcoded LISTINGS in server.js
-- NOTE: embeddings will be generated by the backend worker on first run
INSERT INTO listings (title, description, category, price_fiat, accepts_trade, provider_name, image_url, active, ai_generated) VALUES
  ('MacBook Pro M1 14"', 'MacBook Pro M1 14 polegadas, excelente estado.', 'Products', 1200, false, 'Alex M.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Website Development', 'Desenvolvimento web completo, desde landing pages até sistemas complexos.', 'Services', 500, true, 'Bia Tech', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Bracatinga Honey 500g', 'Mel de bracatinga artesanal, colhido localmente em Florianópolis.', 'Products', 12, true, 'Ipê Farm', 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Oggi E-Bike', 'E-Bike Oggi, pouco uso, ótima para mobilidade urbana em Jurerê.', 'Products', 850, false, 'Marina G.', 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Yoga at the Park', 'Aulas de yoga ao ar livre em Jurerê Internacional. Todas as manhãs.', 'Services', 15, false, 'FitJurerê', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Artisan Coffee Beans', 'Grãos de café especial torrado artesanalmente em pequenos lotes.', 'Products', 9, true, 'CoffeeLab', 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Smart Home Setup', 'Instalação e configuração completa de automação residencial.', 'Services', 50, true, 'AI Haus', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Legal Advice: DAO Gov', 'Consultoria jurídica especializada em governança de DAOs e Web3.', 'Services', 100, true, 'Ipê Law', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Projector Rental', 'Aluguel de projetor Full HD para eventos e apresentações.', 'Products', 30, false, 'CineRent', 'https://images.unsplash.com/photo-1489844097929-c8d5b91c456e?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Artisan Sourdough', 'Pão sourdough artesanal assado na manhã, ingredientes locais.', 'Products', 5, true, 'Bread & Co', 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Cello Lessons', 'Aulas de violoncelo para todos os níveis, iniciante ao avançado.', 'Knowledge', 15, true, 'Music & Co', 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Beehive Construction', 'Construção de colmeias artesanais. Aceita troca ou USDC.', 'Knowledge', null, true, 'João, Ipê Farm', 'https://images.unsplash.com/photo-1552528172-e1bc14eb581e?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Woodworking Workshop', 'Oficina de marcenaria para iniciantes. Aprenda a criar seus próprios móveis.', 'Knowledge', 15, false, 'WoodCraft', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400&h=300', true, false),
  ('Climate Data Analysis', 'Análise de dados climáticos para agricultura e sustentabilidade.', 'Services', 30, true, 'Jurerê Climate', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=400&h=300', true, false)
ON CONFLICT DO NOTHING;

-- ─── pgvector RPC function ────────────────────────────────────────────────────
-- Required by searchListingsBySimilarity() in supabase.js
-- This function must exist in Supabase (Database > Functions) or run via SQL Editor
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
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.description,
    l.category,
    l.price_fiat,
    l.price_crypto,
    l.accepts_trade,
    l.trade_wants,
    l.provider_name,
    l.image_url,
    1 - (l.embedding <=> query_embedding) AS similarity
  FROM listings l
  WHERE
    l.active = true
    AND l.embedding IS NOT NULL
    AND 1 - (l.embedding <=> query_embedding) > match_threshold
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
