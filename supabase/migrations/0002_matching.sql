-- ============================================================
-- IpeXchange MVP — matching functions
-- Migration 0002 — semantic search, multi-hop cycles, AI limits
-- ============================================================

-- ── Semantic market search ───────────────────────────────────
CREATE OR REPLACE FUNCTION match_intents(
  query_embedding VECTOR(768),
  p_direction TEXT DEFAULT 'offer',
  match_threshold FLOAT DEFAULT 0.60,
  match_count INT DEFAULT 20
) RETURNS TABLE (
  id UUID, user_id UUID, direction TEXT, title TEXT, description TEXT,
  category TEXT, price_fiat NUMERIC, image_url TEXT, created_at TIMESTAMPTZ,
  similarity FLOAT
) LANGUAGE sql STABLE AS $$
  SELECT i.id, i.user_id, i.direction, i.title, i.description,
         i.category, i.price_fiat, i.image_url, i.created_at,
         1 - (i.embedding <=> query_embedding) AS similarity
  FROM intents i
  WHERE i.direction = p_direction
    AND i.status = 'active'
    AND i.embedding IS NOT NULL
    AND (i.embedding <=> query_embedding) < (1 - match_threshold)
  ORDER BY i.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── Multi-hop cycle discovery (2-hop and 3-hop) ──────────────
-- Finds trade rings that include p_user_id. An edge exists when
-- someone's want is semantically close to someone else's offer.
-- The value guard keeps exchanged offers within min_value_ratio
-- of each other (default 0.75 = max 25% imbalance); unknown
-- prices pass.
CREATE OR REPLACE FUNCTION find_intent_cycles(
  p_user_id UUID,
  match_threshold FLOAT DEFAULT 0.65,
  min_value_ratio FLOAT DEFAULT 0.75,
  max_results INT DEFAULT 10
) RETURNS JSONB LANGUAGE sql STABLE AS $$
WITH edges AS (
  SELECT w.id  AS want_id,  w.user_id AS want_user,  w.title AS want_title,
         o.id  AS offer_id, o.user_id AS offer_user, o.title AS offer_title,
         o.price_fiat AS offer_price,
         1 - (w.embedding <=> o.embedding) AS sim
  FROM intents w
  JOIN intents o
    ON o.direction = 'offer'
   AND o.status = 'active'
   AND o.embedding IS NOT NULL
   AND o.user_id <> w.user_id
   AND (w.embedding <=> o.embedding) < (1 - match_threshold)
  WHERE w.direction = 'want'
    AND w.status = 'active'
    AND w.embedding IS NOT NULL
),
two_hop AS (
  SELECT jsonb_build_object(
    'hops', 2,
    'min_similarity', round(LEAST(e1.sim, e2.sim)::numeric, 4),
    'value_ratio', CASE
      WHEN e1.offer_price IS NULL OR e2.offer_price IS NULL
        OR GREATEST(e1.offer_price, e2.offer_price) = 0 THEN NULL
      ELSE round(LEAST(e1.offer_price, e2.offer_price)
                 / GREATEST(e1.offer_price, e2.offer_price), 4)
    END,
    'participants', jsonb_build_array(
      jsonb_build_object(
        'user_id', e1.want_user, 'position', 1,
        'gives_intent_id', e2.offer_id, 'gives_title', e2.offer_title,
        'receives_intent_id', e1.offer_id, 'receives_title', e1.offer_title,
        'want_id', e1.want_id, 'want_title', e1.want_title,
        'similarity', round(e1.sim::numeric, 4)
      ),
      jsonb_build_object(
        'user_id', e2.want_user, 'position', 2,
        'gives_intent_id', e1.offer_id, 'gives_title', e1.offer_title,
        'receives_intent_id', e2.offer_id, 'receives_title', e2.offer_title,
        'want_id', e2.want_id, 'want_title', e2.want_title,
        'similarity', round(e2.sim::numeric, 4)
      )
    )
  ) AS cycle, LEAST(e1.sim, e2.sim) AS score
  FROM edges e1
  JOIN edges e2
    ON e2.want_user = e1.offer_user
   AND e2.offer_user = e1.want_user
  WHERE e1.want_user = p_user_id
    AND (e1.offer_price IS NULL OR e2.offer_price IS NULL
         OR GREATEST(e1.offer_price, e2.offer_price) = 0
         OR LEAST(e1.offer_price, e2.offer_price)
            / GREATEST(e1.offer_price, e2.offer_price) >= min_value_ratio)
),
three_hop AS (
  SELECT jsonb_build_object(
    'hops', 3,
    'min_similarity', round(LEAST(e1.sim, e2.sim, e3.sim)::numeric, 4),
    'value_ratio', CASE
      WHEN e1.offer_price IS NULL OR e2.offer_price IS NULL OR e3.offer_price IS NULL
        OR GREATEST(e1.offer_price, e2.offer_price, e3.offer_price) = 0 THEN NULL
      ELSE round(LEAST(e1.offer_price, e2.offer_price, e3.offer_price)
                 / GREATEST(e1.offer_price, e2.offer_price, e3.offer_price), 4)
    END,
    'participants', jsonb_build_array(
      jsonb_build_object(
        'user_id', e1.want_user, 'position', 1,
        'gives_intent_id', e3.offer_id, 'gives_title', e3.offer_title,
        'receives_intent_id', e1.offer_id, 'receives_title', e1.offer_title,
        'want_id', e1.want_id, 'want_title', e1.want_title,
        'similarity', round(e1.sim::numeric, 4)
      ),
      jsonb_build_object(
        'user_id', e2.want_user, 'position', 2,
        'gives_intent_id', e1.offer_id, 'gives_title', e1.offer_title,
        'receives_intent_id', e2.offer_id, 'receives_title', e2.offer_title,
        'want_id', e2.want_id, 'want_title', e2.want_title,
        'similarity', round(e2.sim::numeric, 4)
      ),
      jsonb_build_object(
        'user_id', e3.want_user, 'position', 3,
        'gives_intent_id', e2.offer_id, 'gives_title', e2.offer_title,
        'receives_intent_id', e3.offer_id, 'receives_title', e3.offer_title,
        'want_id', e3.want_id, 'want_title', e3.want_title,
        'similarity', round(e3.sim::numeric, 4)
      )
    )
  ) AS cycle, LEAST(e1.sim, e2.sim, e3.sim) AS score
  FROM edges e1
  JOIN edges e2 ON e2.want_user = e1.offer_user
  JOIN edges e3 ON e3.want_user = e2.offer_user
              AND e3.offer_user = e1.want_user
  WHERE e1.want_user = p_user_id
    AND e2.offer_user <> e1.want_user
    AND (e1.offer_price IS NULL OR e2.offer_price IS NULL OR e3.offer_price IS NULL
         OR GREATEST(e1.offer_price, e2.offer_price, e3.offer_price) = 0
         OR LEAST(e1.offer_price, e2.offer_price, e3.offer_price)
            / GREATEST(e1.offer_price, e2.offer_price, e3.offer_price)
            >= min_value_ratio)
),
ranked AS (
  SELECT cycle, score FROM two_hop
  UNION ALL
  SELECT cycle, score FROM three_hop
  ORDER BY score DESC
  LIMIT max_results
)
SELECT COALESCE(jsonb_agg(cycle), '[]'::jsonb) FROM ranked;
$$;

-- ── Atomic daily AI-usage gate ───────────────────────────────
-- Returns true while the user is within p_limit for the day.
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user UUID, p_action TEXT, p_limit INT
) RETURNS BOOLEAN LANGUAGE sql AS $$
  INSERT INTO ai_usage (user_id, day, action, count)
  VALUES (p_user, current_date, p_action, 1)
  ON CONFLICT (user_id, day, action)
  DO UPDATE SET count = ai_usage.count + 1
  RETURNING count <= p_limit;
$$;
