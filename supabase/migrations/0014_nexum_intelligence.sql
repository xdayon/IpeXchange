-- Structured Nexum sessions, canonical concepts and measurable funnel events.
CREATE TABLE intent_concepts (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('good', 'digital', 'service', 'knowledge')),
  parent_id TEXT REFERENCES intent_concepts(id)
);

INSERT INTO intent_concepts (id, label, kind) VALUES
  ('electronics', 'Electronics', 'good'), ('mobility', 'Mobility', 'good'),
  ('home_goods', 'Home goods', 'good'), ('food', 'Food and produce', 'good'),
  ('software', 'Software', 'digital'), ('digital_media', 'Digital media', 'digital'),
  ('development', 'Software development', 'service'), ('design', 'Design', 'service'),
  ('wellness', 'Health and wellness', 'service'), ('professional', 'Professional services', 'service'),
  ('education', 'Classes and education', 'knowledge'), ('mentoring', 'Mentoring', 'knowledge'),
  ('languages', 'Languages', 'knowledge'), ('other_good', 'Other goods', 'good'),
  ('other_digital', 'Other digital', 'digital'), ('other_service', 'Other services', 'service'),
  ('other_knowledge', 'Other knowledge', 'knowledge')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE intents
  ADD COLUMN IF NOT EXISTS concept_id TEXT REFERENCES intent_concepts(id),
  ADD COLUMN IF NOT EXISTS location_text TEXT,
  ADD COLUMN IF NOT EXISTS location_radius_km NUMERIC CHECK (location_radius_km >= 0),
  ADD COLUMN IF NOT EXISTS timeframe TEXT,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC CHECK (quantity > 0),
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS value_flexibility TEXT
    CHECK (value_flexibility IS NULL OR value_flexibility IN ('fixed', 'flexible', 'unknown')),
  ADD COLUMN IF NOT EXISTS exchange_modes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS delivery_modes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS constraints JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS field_confidence JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nexum_memory_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nexum_memory JSONB NOT NULL DEFAULT '{}';

CREATE TABLE nexum_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ready', 'published', 'abandoned')),
  prompt_version TEXT NOT NULL,
  language TEXT,
  turn_count INT NOT NULL DEFAULT 0,
  state JSONB NOT NULL DEFAULT '{}',
  market_signal JSONB,
  signal_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_nexum_sessions_user ON nexum_sessions(user_id, updated_at DESC);

CREATE TABLE nexum_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES nexum_sessions(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_nexum_events_funnel ON nexum_events(event, created_at DESC);

ALTER TABLE intent_drafts
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES nexum_sessions(id) ON DELETE SET NULL;

ALTER TABLE intent_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexum_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexum_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION nexum_market_signal(
  query_embedding VECTOR(768), p_user UUID, p_direction TEXT, p_kind TEXT
) RETURNS JSONB LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'candidate_count', count(*),
    'best_similarity', round(COALESCE(max(1 - (embedding <=> query_embedding)), 0)::numeric, 4)
  )
  FROM intents
  WHERE user_id <> p_user AND status = 'active' AND embedding IS NOT NULL
    AND direction = CASE WHEN p_direction = 'want' THEN 'offer' ELSE 'want' END
    AND (p_kind IS NULL OR kind IS NULL OR kind = p_kind
      OR (p_kind IN ('service', 'knowledge') AND kind IN ('service', 'knowledge')))
    AND (embedding <=> query_embedding) < 0.45;
$$;

ALTER FUNCTION find_intent_cycles(UUID, FLOAT, FLOAT, INT)
  RENAME TO find_intent_cycles_kind_guard;

CREATE OR REPLACE FUNCTION find_intent_cycles(
  p_user_id UUID, match_threshold FLOAT DEFAULT 0.58,
  min_value_ratio FLOAT DEFAULT 0.75, max_results INT DEFAULT 10
) RETURNS JSONB LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(candidate.cycle ORDER BY candidate.ordinal), '[]'::jsonb)
  FROM jsonb_array_elements(find_intent_cycles_kind_guard(
    p_user_id, match_threshold, min_value_ratio, max_results
  )) WITH ORDINALITY AS candidate(cycle, ordinal)
  WHERE NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(candidate.cycle->'participants') AS participant(data)
    JOIN intents wanted ON wanted.id = (participant.data->>'want_id')::UUID
    JOIN intents offered ON offered.id = (participant.data->>'receives_intent_id')::UUID
    WHERE (wanted.expires_at IS NOT NULL AND wanted.expires_at <= now())
      OR (offered.expires_at IS NOT NULL AND offered.expires_at <= now())
      OR (cardinality(wanted.exchange_modes) > 0
        AND cardinality(offered.exchange_modes) > 0
        AND NOT wanted.exchange_modes && offered.exchange_modes)
      OR wanted.constraints @> '{"location_required": true}'::jsonb
        AND wanted.location_text IS DISTINCT FROM offered.location_text
  );
$$;

CREATE OR REPLACE FUNCTION nexum_funnel(p_since TIMESTAMPTZ DEFAULT now() - interval '30 days')
RETURNS JSONB LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_object_agg(event, total), '{}')
  FROM (SELECT event, count(*) total FROM nexum_events
        WHERE created_at >= p_since GROUP BY event) events;
$$;
