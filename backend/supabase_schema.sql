-- Copy and paste this into the Supabase SQL Editor

-- 1. Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);

-- 2. Create messages table for chat history
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'agent')),
  content TEXT NOT NULL,
  audio_transcript BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create user_intents table for AI-extracted demands
CREATE TABLE user_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  intent_type TEXT,  -- 'buy', 'sell', 'trade', 'learn', 'invest', 'donate'
  item TEXT,         -- e.g., 'macbook', 'honey'
  category TEXT,     -- e.g., 'Products', 'Services'
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Optional: Create indexes for performance
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_intents_session ON user_intents(session_id);
CREATE INDEX idx_intents_type ON user_intents(intent_type);
CREATE INDEX idx_intents_created_at ON user_intents(created_at);
