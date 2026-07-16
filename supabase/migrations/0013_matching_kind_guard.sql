-- Keep semantically similar but incompatible kinds out of trade cycles.
-- The wrapper preserves the existing discovery algorithm for legacy rows
-- where kind is null, then validates each want/offer edge in its result.
ALTER FUNCTION find_intent_cycles(UUID, FLOAT, FLOAT, INT)
  RENAME TO find_intent_cycles_untyped;

CREATE OR REPLACE FUNCTION find_intent_cycles(
  p_user_id UUID,
  match_threshold FLOAT DEFAULT 0.58,
  min_value_ratio FLOAT DEFAULT 0.75,
  max_results INT DEFAULT 10
) RETURNS JSONB LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(candidate.cycle ORDER BY candidate.ordinal), '[]'::jsonb)
  FROM jsonb_array_elements(
    find_intent_cycles_untyped(
      p_user_id, match_threshold, min_value_ratio, max_results
    )
  ) WITH ORDINALITY AS candidate(cycle, ordinal)
  WHERE NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(candidate.cycle->'participants') AS participant(data)
    JOIN intents wanted
      ON wanted.id = (participant.data->>'want_id')::UUID
    JOIN intents offered
      ON offered.id = (participant.data->>'receives_intent_id')::UUID
    WHERE wanted.kind IS NOT NULL
      AND offered.kind IS NOT NULL
      AND wanted.kind <> offered.kind
      AND NOT (
        wanted.kind IN ('service', 'knowledge')
        AND offered.kind IN ('service', 'knowledge')
      )
  );
$$;

CREATE INDEX IF NOT EXISTS idx_intents_matching_pool
  ON intents (direction, kind)
  WHERE status = 'active' AND embedding IS NOT NULL;
