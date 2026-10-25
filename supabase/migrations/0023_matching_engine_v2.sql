-- ============================================================
-- Migration 0023 - matching engine v2
-- Incremental Interest/Offer edges, explicit acceptance (swipes),
-- trade loops of 2 to 7 people ranked by how likely everyone is to
-- accept, soft suggestions that keep intents available until every
-- member accepts, an admin-triggered clearing round, and read models
-- for the loop radar, the market map and the live activity feed.
-- ============================================================

-- ── Loop shape and lifecycle ─────────────────────────────────
ALTER TABLE trade_cycles DROP CONSTRAINT IF EXISTS trade_cycles_hops_check;
ALTER TABLE trade_cycles ADD CONSTRAINT trade_cycles_hops_check CHECK (hops BETWEEN 2 AND 7);
ALTER TABLE trade_cycles DROP CONSTRAINT IF EXISTS trade_cycles_status_check;
ALTER TABLE trade_cycles ADD CONSTRAINT trade_cycles_status_check CHECK (status IN (
  'suggested', 'pending_acceptance', 'accepted', 'completed', 'cancelled', 'expired', 'superseded'));
ALTER TABLE trade_cycles
  ADD COLUMN IF NOT EXISTS score FLOAT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'match'
    CHECK (source IN ('match', 'clearing'));

CREATE INDEX IF NOT EXISTS idx_cycle_participants_gives ON trade_cycle_participants (gives_intent_id);
CREATE INDEX IF NOT EXISTS idx_cycle_participants_want ON trade_cycle_participants (want_intent_id);
CREATE INDEX IF NOT EXISTS idx_trade_cycles_status ON trade_cycles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_cycles_hash ON trade_cycles (cycle_hash);

-- ── Approximate member area for the map ──────────────────────
-- Two decimals (about 1 km) are enforced by the column type itself.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS geo_lat NUMERIC(4, 2) CHECK (geo_lat BETWEEN -90 AND 90),
  ADD COLUMN IF NOT EXISTS geo_lng NUMERIC(5, 2) CHECK (geo_lng BETWEEN -180 AND 180),
  ADD COLUMN IF NOT EXISTS geo_label TEXT CHECK (char_length(geo_label) <= 60);

-- ── Explicit acceptance: "I would take this Offer" ───────────
-- A surrogate key on purpose: with (user_id, offer_id) as the primary key
-- PostgREST would read this table as a users<->intents junction and every
-- users(...) embed from intents would become ambiguous.
CREATE TABLE IF NOT EXISTS intent_swipes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES intents(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('accept', 'pass')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, offer_id)
);
CREATE INDEX IF NOT EXISTS idx_intent_swipes_offer ON intent_swipes (offer_id);
ALTER TABLE intent_swipes ENABLE ROW LEVEL SECURITY;

-- ── Semantic edges: this Offer can satisfy that Interest ─────
CREATE TABLE IF NOT EXISTS intent_edges (
  want_id UUID NOT NULL REFERENCES intents(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES intents(id) ON DELETE CASCADE,
  similarity FLOAT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (want_id, offer_id)
);
CREATE INDEX IF NOT EXISTS idx_intent_edges_offer ON intent_edges (offer_id);
ALTER TABLE intent_edges ENABLE ROW LEVEL SECURITY;

-- Guards shared by every edge: different owners, the Offer accepts
-- exchanges, compatible kinds, overlapping exchange modes and a required
-- location when the Interest asks for one.
CREATE OR REPLACE FUNCTION intent_pair_compatible(w intents, o intents)
RETURNS BOOLEAN LANGUAGE sql IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT w.direction = 'want' AND o.direction = 'offer'
    AND w.user_id <> o.user_id
    AND o.transaction_mode <> 'buy_now'
    AND (w.kind IS NULL OR o.kind IS NULL OR w.kind = o.kind
         OR (w.kind IN ('service', 'knowledge') AND o.kind IN ('service', 'knowledge')))
    AND (cardinality(w.exchange_modes) = 0 OR cardinality(o.exchange_modes) = 0
         OR w.exchange_modes && o.exchange_modes)
    AND NOT (w.constraints @> '{"location_required": true}'::jsonb
             AND w.location_text IS DISTINCT FROM o.location_text);
$$;

-- Recomputes the edges of one intent. The 0.70 floor comes from real
-- Gemini embeddings: true Interest/Offer pairs scored 0.77-0.88 while
-- look-alikes ("Portuguese classes" vs "Spanish lessons") reached 0.69.
-- Weaker matches are left to explicit swipes. Ordering by similarity (not
-- by the distance operator) keeps this an exact scan, which is cheap at
-- community scale; switch to the HNSW index with iterative scans past
-- ~100k intents.
CREATE OR REPLACE FUNCTION refresh_intent_edges(
  p_intent UUID, p_threshold FLOAT DEFAULT 0.70, p_limit INT DEFAULT 200
) RETURNS INT LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v intents%ROWTYPE;
  v_count INT;
BEGIN
  SELECT * INTO v FROM intents WHERE id = p_intent;
  IF NOT FOUND THEN RETURN 0; END IF;
  DELETE FROM intent_edges WHERE want_id = v.id OR offer_id = v.id;
  IF v.embedding IS NULL OR v.status IN ('archived', 'fulfilled') THEN RETURN 0; END IF;

  IF v.direction = 'want' THEN
    INSERT INTO intent_edges (want_id, offer_id, similarity)
    SELECT v.id, o.id, 1 - (o.embedding <=> v.embedding) AS sim
    FROM intents o
    WHERE o.direction = 'offer' AND o.embedding IS NOT NULL
      AND o.status NOT IN ('archived', 'fulfilled')
      AND intent_pair_compatible(v, o)
      AND 1 - (o.embedding <=> v.embedding) >= p_threshold
    ORDER BY sim DESC
    LIMIT p_limit;
  ELSE
    INSERT INTO intent_edges (want_id, offer_id, similarity)
    SELECT w.id, v.id, 1 - (w.embedding <=> v.embedding) AS sim
    FROM intents w
    WHERE w.direction = 'want' AND w.embedding IS NOT NULL
      AND w.status NOT IN ('archived', 'fulfilled')
      AND intent_pair_compatible(w, v)
      AND 1 - (w.embedding <=> v.embedding) >= p_threshold
    ORDER BY sim DESC
    LIMIT p_limit;
  END IF;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION sync_intent_edges() RETURNS trigger LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT'
    OR NEW.embedding IS DISTINCT FROM OLD.embedding
    OR NEW.kind IS DISTINCT FROM OLD.kind
    OR NEW.exchange_modes IS DISTINCT FROM OLD.exchange_modes
    OR NEW.constraints IS DISTINCT FROM OLD.constraints
    OR NEW.location_text IS DISTINCT FROM OLD.location_text
    OR NEW.transaction_mode IS DISTINCT FROM OLD.transaction_mode
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR (NEW.status IN ('archived', 'fulfilled')) <> (OLD.status IN ('archived', 'fulfilled'))
  THEN
    PERFORM refresh_intent_edges(NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_intents_edges ON intents;
CREATE TRIGGER trg_intents_edges AFTER INSERT OR UPDATE ON intents
  FOR EACH ROW EXECUTE FUNCTION sync_intent_edges();

-- Every Interest discovers all of its Offers, so a pass over Interests
-- builds the full edge set for existing data.
SELECT refresh_intent_edges(id) FROM intents
WHERE direction = 'want' AND embedding IS NOT NULL AND status NOT IN ('archived', 'fulfilled');

-- ── Loop arcs ────────────────────────────────────────────────
-- An arc giver -> receiver means the receiver would take one of the
-- giver's live Offers. prob estimates the chance the receiver accepts:
-- 0.97 for an explicit swipe, 0.50-0.95 from semantic similarity. Each
-- pair keeps its best Offer; each giver keeps its p_fanout best arcs.
CREATE OR REPLACE FUNCTION loop_arcs(p_fanout INT DEFAULT 12)
RETURNS TABLE (giver UUID, receiver UUID, offer_id UUID, want_id UUID,
               prob FLOAT, explicit BOOLEAN, price NUMERIC)
LANGUAGE sql STABLE
SET search_path = public, pg_temp
AS $$
  WITH live AS (
    SELECT id, user_id, direction, transaction_mode, price_fiat FROM intents
    WHERE status = 'active' AND (expires_at IS NULL OR expires_at > now())
  ), semantic AS (
    SELECT DISTINCT ON (o.id, w.user_id)
           o.user_id AS giver, w.user_id AS receiver, o.id AS offer_id, w.id AS want_id,
           LEAST(0.95, GREATEST(0.5, 0.5 + (e.similarity - 0.70) * 2.5)) AS prob,
           o.price_fiat AS price
    FROM intent_edges e
    JOIN live w ON w.id = e.want_id
    JOIN live o ON o.id = e.offer_id
    WHERE w.user_id <> o.user_id
      AND NOT EXISTS (
      SELECT 1 FROM intent_swipes s
      WHERE s.user_id = w.user_id AND s.offer_id = o.id AND s.decision = 'pass'
    )
    ORDER BY o.id, w.user_id, e.similarity DESC
  ), explicit AS (
    SELECT o.user_id AS giver, s.user_id AS receiver, o.id AS offer_id, o.price_fiat AS price
    FROM intent_swipes s
    JOIN live o ON o.id = s.offer_id AND o.direction = 'offer' AND o.transaction_mode <> 'buy_now'
    WHERE s.decision = 'accept' AND s.user_id <> o.user_id
  ), merged AS (
    SELECT COALESCE(x.giver, m.giver) AS giver, COALESCE(x.receiver, m.receiver) AS receiver,
           COALESCE(x.offer_id, m.offer_id) AS offer_id, m.want_id,
           CASE WHEN x.offer_id IS NOT NULL THEN 0.97 ELSE m.prob END AS prob,
           x.offer_id IS NOT NULL AS explicit,
           COALESCE(x.price, m.price) AS price
    FROM explicit x
    FULL JOIN semantic m ON m.offer_id = x.offer_id AND m.receiver = x.receiver
  ), per_pair AS (
    SELECT DISTINCT ON (giver, receiver) * FROM merged
    ORDER BY giver, receiver, prob DESC, offer_id
  ), ranked AS (
    SELECT p.*, row_number() OVER (PARTITION BY p.giver ORDER BY p.prob DESC, p.receiver) AS rank
    FROM per_pair p
  )
  SELECT giver, receiver, offer_id, want_id, prob, explicit, price
  FROM ranked WHERE rank <= p_fanout;
$$;

-- Snapshot the arcs once per transaction so a clearing round searches
-- from many members without recomputing them.
CREATE OR REPLACE FUNCTION prepare_loop_arcs(p_fanout INT DEFAULT 12)
RETURNS INT LANGUAGE plpgsql
SET search_path = public, pg_temp
SET jit = off
AS $$
DECLARE
  v_count INT;
BEGIN
  DROP TABLE IF EXISTS pg_temp.loop_arc_snapshot;
  CREATE TEMP TABLE loop_arc_snapshot ON COMMIT DROP AS SELECT * FROM loop_arcs(p_fanout);
  CREATE INDEX ON loop_arc_snapshot (giver);
  CREATE INDEX ON loop_arc_snapshot (receiver);
  ANALYZE loop_arc_snapshot;
  SELECT count(*) INTO v_count FROM loop_arc_snapshot;
  RETURN v_count;
END;
$$;

-- Loop search through p_user over the arc snapshot, one hop per level.
-- A backward pass first finds who can still get back to p_user in the
-- hops left, so the walk never expands dead ends. Every expansion that
-- closes a loop is kept; the open frontier keeps only its p_beam best
-- partial paths, which bounds the work on dense markets. Loops are ranked
-- by score = product of arc probabilities, which naturally penalises long
-- loops built on weak edges. The value guard keeps every priced Offer
-- within p_min_ratio of the most expensive one; unknown prices pass.
-- p_canonical (clearing rounds) only walks members whose id is greater
-- than p_user, so each loop is found once, from its smallest member.
CREATE OR REPLACE FUNCTION collect_loops_from(
  p_user UUID, p_max_hops INT, p_min_score FLOAT, p_min_ratio FLOAT,
  p_beam INT DEFAULT 400, p_canonical BOOLEAN DEFAULT false
) RETURNS INT LANGUAGE plpgsql
SET search_path = public, pg_temp
SET jit = off
AS $$
DECLARE
  v_level INT;
  v_found INT;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS loop_reach (u UUID PRIMARY KEY, d INT NOT NULL) ON COMMIT DROP;
  CREATE TEMP TABLE IF NOT EXISTS loop_frontier (
    path UUID[], offers UUID[], wants UUID[], probs FLOAT[], explicit BOOLEAN[],
    last_user UUID, depth INT, score FLOAT, pmin NUMERIC, pmax NUMERIC
  ) ON COMMIT DROP;
  CREATE TEMP TABLE IF NOT EXISTS loop_next (LIKE loop_frontier) ON COMMIT DROP;
  CREATE TEMP TABLE IF NOT EXISTS loop_found (LIKE loop_frontier) ON COMMIT DROP;
  -- TRUNCATE, not DELETE: autovacuum never cleans temp tables, so dead
  -- rows would pile up across the many calls of a clearing round.
  TRUNCATE loop_reach, loop_frontier, loop_next, loop_found;

  INSERT INTO loop_reach (u, d)
  WITH RECURSIVE back(u, d) AS (
    SELECT DISTINCT a.giver, 1 FROM loop_arc_snapshot a
    WHERE a.receiver = p_user AND (NOT p_canonical OR a.giver > p_user)
    UNION
    SELECT a.giver, b.d + 1
    FROM back b JOIN loop_arc_snapshot a ON a.receiver = b.u
    WHERE b.d < p_max_hops - 1 AND a.giver <> p_user
      AND (NOT p_canonical OR a.giver > p_user)
  )
  SELECT u, min(d) FROM back GROUP BY u;

  INSERT INTO loop_frontier
  SELECT ARRAY[p_user, a.receiver], ARRAY[a.offer_id], ARRAY[a.want_id], ARRAY[a.prob],
         ARRAY[a.explicit], a.receiver, 1, a.prob, a.price, a.price
  FROM loop_arc_snapshot a
  JOIN loop_reach r ON r.u = a.receiver AND r.d <= p_max_hops - 1
  WHERE a.giver = p_user AND a.prob >= p_min_score
  ORDER BY a.prob DESC
  LIMIT p_beam;

  FOR v_level IN 1 .. p_max_hops - 1 LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM loop_frontier);
    TRUNCATE loop_next;
    INSERT INTO loop_next
    SELECT w.path || a.receiver, w.offers || a.offer_id, w.wants || a.want_id,
           w.probs || a.prob, w.explicit || a.explicit, a.receiver, w.depth + 1,
           w.score * a.prob, LEAST(w.pmin, a.price), GREATEST(w.pmax, a.price)
    FROM loop_frontier w
    JOIN loop_arc_snapshot a ON a.giver = w.last_user
    LEFT JOIN loop_reach r ON r.u = a.receiver
    WHERE w.score * a.prob >= p_min_score
      AND (a.receiver = p_user
           OR (r.d <= p_max_hops - w.depth - 1 AND a.receiver <> ALL (w.path)))
      AND (LEAST(w.pmin, a.price) IS NULL OR GREATEST(w.pmax, a.price) = 0
           OR LEAST(w.pmin, a.price) / GREATEST(w.pmax, a.price) >= p_min_ratio);
    INSERT INTO loop_found SELECT * FROM loop_next WHERE last_user = p_user;
    TRUNCATE loop_frontier;
    INSERT INTO loop_frontier
    SELECT * FROM loop_next WHERE last_user <> p_user
    ORDER BY score DESC
    LIMIT p_beam;
  END LOOP;

  SELECT count(*) INTO v_found FROM loop_found;
  RETURN v_found;
END;
$$;

-- JSON shape persisted by persist_intent_cycle: participant i gives
-- offers[i] and receives the Offer of the previous member in the loop.
CREATE OR REPLACE FUNCTION loop_to_json(
  p_path UUID[], p_offers UUID[], p_wants UUID[], p_probs FLOAT[], p_explicit BOOLEAN[],
  p_depth INT, p_score FLOAT, p_pmin NUMERIC, p_pmax NUMERIC
) RETURNS JSONB LANGUAGE sql STABLE
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'hops', p_depth,
    'score', round(p_score::numeric, 4),
    'min_similarity', (SELECT round(min(x)::numeric, 4) FROM unnest(p_probs) x),
    'value_ratio', CASE WHEN p_pmin IS NULL OR p_pmax = 0 THEN NULL
                        ELSE round(p_pmin / p_pmax, 4) END,
    'participants', (
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', p_path[i], 'position', i,
        'gives_intent_id', p_offers[i], 'gives_title', g.title,
        'receives_intent_id', p_offers[pp.p], 'receives_title', r.title,
        'want_id', p_wants[pp.p], 'want_title', w.title,
        'similarity', round(p_probs[pp.p]::numeric, 4), 'explicit', p_explicit[pp.p]
      ) ORDER BY i)
      FROM generate_series(1, p_depth) i
      CROSS JOIN LATERAL (SELECT CASE WHEN i = 1 THEN p_depth ELSE i - 1 END AS p) pp
      JOIN intents g ON g.id = p_offers[i]
      JOIN intents r ON r.id = p_offers[pp.p]
      LEFT JOIN intents w ON w.id = p_wants[pp.p]
    ));
$$;

CREATE OR REPLACE FUNCTION search_loops_from(
  p_user UUID, p_max_hops INT, p_min_score FLOAT, p_min_ratio FLOAT, p_limit INT,
  p_beam INT DEFAULT 400
) RETURNS JSONB LANGUAGE plpgsql
SET search_path = public, pg_temp
SET jit = off
AS $$
DECLARE
  v_result JSONB;
BEGIN
  PERFORM collect_loops_from(p_user, p_max_hops, p_min_score, p_min_ratio, p_beam, false);
  SELECT COALESCE(jsonb_agg(
           loop_to_json(l.path, l.offers, l.wants, l.probs, l.explicit, l.depth, l.score, l.pmin, l.pmax)
           ORDER BY l.score DESC, l.depth), '[]'::jsonb)
    INTO v_result
  FROM (SELECT * FROM loop_found ORDER BY score DESC, depth, offers LIMIT p_limit) l;
  RETURN v_result;
END;
$$;

-- Public entry point used after publishing, swiping or releasing intents.
DROP FUNCTION IF EXISTS find_intent_cycles(UUID, FLOAT, FLOAT, INT);
DROP FUNCTION IF EXISTS find_intent_cycles_kind_guard(UUID, FLOAT, FLOAT, INT);
DROP FUNCTION IF EXISTS find_intent_cycles_untyped(UUID, FLOAT, FLOAT, INT);

CREATE OR REPLACE FUNCTION find_intent_cycles(
  p_user_id UUID,
  max_results INT DEFAULT 10,
  p_max_hops INT DEFAULT 6,
  p_min_score FLOAT DEFAULT 0.04,
  min_value_ratio FLOAT DEFAULT 0.75
) RETURNS JSONB LANGUAGE plpgsql
SET search_path = public, pg_temp
SET jit = off
AS $$
BEGIN
  PERFORM prepare_loop_arcs();
  RETURN search_loops_from(
    p_user_id, LEAST(GREATEST(p_max_hops, 2), 7), p_min_score, min_value_ratio,
    LEAST(GREATEST(max_results, 1), 50));
END;
$$;

-- ── Soft suggestions ─────────────────────────────────────────
-- A suggestion no longer reserves anything: intents stay in the market
-- and may appear in up to three open suggestions until one loop is fully
-- accepted. Clearing rounds bypass that cap because they pick disjoint loops.
DROP FUNCTION IF EXISTS persist_intent_cycle(JSONB);

CREATE OR REPLACE FUNCTION persist_intent_cycle(p_cycle JSONB, p_source TEXT DEFAULT 'match')
RETURNS JSONB LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hash TEXT;
  v_id UUID;
  v_offers UUID[];
  v_wants UUID[];
  v_all UUID[];
BEGIN
  IF p_source NOT IN ('match', 'clearing') THEN
    RAISE EXCEPTION 'invalid loop source %', p_source;
  END IF;
  SELECT md5(string_agg(p->>'gives_intent_id', '|' ORDER BY p->>'gives_intent_id')),
         array_agg((p->>'gives_intent_id')::UUID),
         COALESCE(array_agg((p->>'want_id')::UUID) FILTER (WHERE p->>'want_id' IS NOT NULL), '{}')
    INTO v_hash, v_offers, v_wants
  FROM jsonb_array_elements(p_cycle->'participants') p;
  v_all := v_offers || v_wants;

  IF (SELECT count(*) FROM intents WHERE id = ANY(v_all) AND status = 'active')
      <> cardinality(v_all) THEN
    RETURN jsonb_build_object('created', false, 'reason', 'intent_unavailable');
  END IF;
  IF EXISTS (
    SELECT 1 FROM trade_cycles
    WHERE cycle_hash = v_hash AND status = 'cancelled' AND updated_at > now() - interval '14 days'
  ) THEN
    RETURN jsonb_build_object('created', false, 'reason', 'recently_declined');
  END IF;
  IF p_source = 'match' AND EXISTS (
    SELECT 1 FROM trade_cycle_participants tp
    JOIN trade_cycles c ON c.id = tp.cycle_id
    WHERE c.status IN ('suggested', 'pending_acceptance') AND tp.gives_intent_id = ANY(v_offers)
    GROUP BY tp.gives_intent_id HAVING count(*) >= 3
  ) THEN
    RETURN jsonb_build_object('created', false, 'reason', 'offer_busy');
  END IF;

  INSERT INTO trade_cycles (cycle_hash, hops, min_similarity, value_ratio, score, source)
  VALUES (v_hash, (p_cycle->>'hops')::INT, (p_cycle->>'min_similarity')::FLOAT,
          (p_cycle->>'value_ratio')::FLOAT, (p_cycle->>'score')::FLOAT, p_source)
  ON CONFLICT (cycle_hash) WHERE status IN ('suggested', 'pending_acceptance', 'accepted')
  DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NULL THEN RETURN jsonb_build_object('created', false, 'reason', 'duplicate'); END IF;

  INSERT INTO trade_cycle_participants
    (cycle_id, user_id, position, gives_intent_id, receives_intent_id, want_intent_id)
  SELECT v_id, (p->>'user_id')::UUID, (p->>'position')::INT,
         (p->>'gives_intent_id')::UUID, (p->>'receives_intent_id')::UUID,
         (p->>'want_id')::UUID
  FROM jsonb_array_elements(p_cycle->'participants') p;
  RETURN jsonb_build_object('created', true, 'id', v_id);
END;
$$;

-- Accepting the last pending seat claims the loop's intents. Continuous
-- (recurring) intents are never reserved, so a service can serve several
-- loops. Other open suggestions that needed a claimed intent become
-- superseded; rows locked by a concurrent response are skipped and will
-- fail their own claim instead, which avoids deadlocks.
CREATE OR REPLACE FUNCTION respond_to_cycle(p_cycle UUID, p_user UUID, p_accept BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status TEXT;
  v_receives UUID;
  v_pending INT;
  v_intents UUID[];
  v_reserve UUID[];
  v_reserved INT;
  v_superseded UUID[];
BEGIN
  SELECT status INTO v_status FROM trade_cycles WHERE id = p_cycle FOR UPDATE;
  IF v_status IS NULL THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  IF v_status NOT IN ('suggested', 'pending_acceptance') THEN
    RETURN jsonb_build_object('error', 'closed', 'status', v_status);
  END IF;

  UPDATE trade_cycle_participants
  SET acceptance = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END
  WHERE cycle_id = p_cycle AND user_id = p_user AND acceptance = 'pending'
  RETURNING receives_intent_id INTO v_receives;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'no_pending_response', 'status', v_status);
  END IF;

  IF NOT p_accept THEN
    UPDATE trade_cycles SET status = 'cancelled' WHERE id = p_cycle;
    -- Do not suggest the same Offer to this member again unless they
    -- explicitly accept it later.
    INSERT INTO intent_swipes (user_id, offer_id, decision)
    VALUES (p_user, v_receives, 'pass')
    ON CONFLICT (user_id, offer_id) DO UPDATE SET decision = 'pass', created_at = now();
    RETURN jsonb_build_object('status', 'cancelled');
  END IF;

  SELECT array_agg(DISTINCT x ORDER BY x) INTO v_intents FROM (
    SELECT gives_intent_id AS x FROM trade_cycle_participants WHERE cycle_id = p_cycle
    UNION
    SELECT want_intent_id FROM trade_cycle_participants
    WHERE cycle_id = p_cycle AND want_intent_id IS NOT NULL
  ) ids;
  -- Tell members early when another loop already claimed one of the items.
  IF EXISTS (
    SELECT 1 FROM intents i
    WHERE i.id = ANY(v_intents)
      AND (i.status IN ('archived', 'fulfilled')
           OR EXISTS (SELECT 1 FROM intent_reservations r
                      WHERE r.intent_id = i.id AND r.cycle_id IS NOT NULL))
  ) THEN
    UPDATE trade_cycles SET status = 'superseded' WHERE id = p_cycle;
    RETURN jsonb_build_object('status', 'superseded', 'reason', 'intent_unavailable');
  END IF;

  SELECT count(*) INTO v_pending FROM trade_cycle_participants
  WHERE cycle_id = p_cycle AND acceptance <> 'accepted';
  IF v_pending > 0 THEN
    UPDATE trade_cycles SET status = 'pending_acceptance' WHERE id = p_cycle;
    RETURN jsonb_build_object('status', 'pending_acceptance');
  END IF;

  -- NO KEY UPDATE serializes claims against each other and against
  -- prepare_payment without blocking foreign-key checks from inserts.
  PERFORM 1 FROM intents WHERE id = ANY(v_intents) ORDER BY id FOR NO KEY UPDATE;
  IF (SELECT count(*) FROM intents WHERE id = ANY(v_intents) AND status = 'active')
      <> cardinality(v_intents) THEN
    UPDATE trade_cycles SET status = 'superseded' WHERE id = p_cycle;
    RETURN jsonb_build_object('status', 'superseded', 'reason', 'intent_unavailable');
  END IF;

  SELECT COALESCE(array_agg(id), '{}') INTO v_reserve
  FROM intents WHERE id = ANY(v_intents) AND NOT is_continuous;
  INSERT INTO intent_reservations (intent_id, cycle_id)
  SELECT unnest(v_reserve), p_cycle ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_reserved = ROW_COUNT;
  IF v_reserved <> cardinality(v_reserve) THEN
    DELETE FROM intent_reservations WHERE cycle_id = p_cycle;
    UPDATE trade_cycles SET status = 'superseded' WHERE id = p_cycle;
    RETURN jsonb_build_object('status', 'superseded', 'reason', 'intent_unavailable');
  END IF;
  UPDATE intents SET status = 'in_cycle' WHERE id = ANY(v_reserve);
  UPDATE trade_cycles SET status = 'accepted' WHERE id = p_cycle;

  WITH stale AS (
    SELECT c.id FROM trade_cycles c
    WHERE c.id <> p_cycle AND c.status IN ('suggested', 'pending_acceptance')
      AND EXISTS (
        SELECT 1 FROM trade_cycle_participants tp
        WHERE tp.cycle_id = c.id
          AND (tp.gives_intent_id = ANY(v_reserve) OR tp.want_intent_id = ANY(v_reserve))
      )
    FOR UPDATE SKIP LOCKED
  ), closed AS (
    UPDATE trade_cycles c SET status = 'superseded'
    FROM stale WHERE c.id = stale.id
    RETURNING c.id
  )
  SELECT COALESCE(array_agg(id), '{}') INTO v_superseded FROM closed;

  RETURN jsonb_build_object('status', 'accepted', 'superseded', to_jsonb(v_superseded));
END;
$$;

CREATE OR REPLACE FUNCTION confirm_cycle_step(p_cycle UUID, p_user UUID, p_step TEXT)
RETURNS JSONB LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status TEXT;
  v_open INT;
BEGIN
  IF p_step NOT IN ('delivered', 'received') THEN
    RETURN jsonb_build_object('error', 'invalid_step');
  END IF;
  SELECT status INTO v_status FROM trade_cycles WHERE id = p_cycle FOR UPDATE;
  IF v_status IS NULL THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  IF v_status <> 'accepted' THEN
    RETURN jsonb_build_object('error', 'not_accepted', 'status', v_status);
  END IF;
  -- Every one-off intent of the loop must still be held by this loop.
  IF EXISTS (
    SELECT 1 FROM trade_cycle_participants tp
    JOIN intents i ON i.id IN (tp.gives_intent_id, tp.want_intent_id)
    WHERE tp.cycle_id = p_cycle AND NOT i.is_continuous
      AND NOT EXISTS (
        SELECT 1 FROM intent_reservations r WHERE r.intent_id = i.id AND r.cycle_id = p_cycle
      )
  ) THEN
    RETURN jsonb_build_object('error', 'reservation_lost');
  END IF;

  IF p_step = 'delivered' THEN
    UPDATE trade_cycle_participants SET delivered_at = now()
    WHERE cycle_id = p_cycle AND user_id = p_user AND delivered_at IS NULL;
  ELSE
    UPDATE trade_cycle_participants SET received_at = now()
    WHERE cycle_id = p_cycle AND user_id = p_user AND received_at IS NULL;
  END IF;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'already_confirmed', 'status', v_status);
  END IF;

  SELECT count(*) INTO v_open FROM trade_cycle_participants
  WHERE cycle_id = p_cycle AND (delivered_at IS NULL OR received_at IS NULL);
  IF v_open > 0 THEN RETURN jsonb_build_object('status', 'accepted'); END IF;

  UPDATE trade_cycles SET status = 'completed' WHERE id = p_cycle;
  UPDATE intents SET status = 'fulfilled'
  WHERE id IN (SELECT intent_id FROM intent_reservations WHERE cycle_id = p_cycle);
  DELETE FROM intent_reservations WHERE cycle_id = p_cycle;
  RETURN jsonb_build_object('status', 'completed');
END;
$$;

-- Open suggestions whose intents were archived or fulfilled elsewhere
-- (for example by a direct purchase) can never complete.
CREATE OR REPLACE FUNCTION prune_unavailable_loops() RETURNS INT LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE trade_cycles c SET status = 'superseded'
  WHERE c.status IN ('suggested', 'pending_acceptance')
    AND EXISTS (
      SELECT 1 FROM trade_cycle_participants tp
      JOIN intents i ON i.id IN (tp.gives_intent_id, tp.want_intent_id)
      WHERE tp.cycle_id = c.id
        AND (i.status IN ('archived', 'fulfilled')
             OR EXISTS (SELECT 1 FROM intent_reservations r
                        WHERE r.intent_id = i.id AND r.cycle_id IS NOT NULL AND r.cycle_id <> c.id))
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION expire_stale_cycles(
  p_max_age INTERVAL DEFAULT interval '7 days'
) RETURNS INT LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_expired INT;
BEGIN
  IF p_max_age < interval '1 hour' THEN
    RAISE EXCEPTION 'cycle expiry must be at least one hour';
  END IF;
  PERFORM prune_unavailable_loops();

  WITH stale AS (
    SELECT id FROM trade_cycles
    WHERE status IN ('suggested', 'pending_acceptance')
      AND updated_at <= now() - p_max_age
    FOR UPDATE SKIP LOCKED
  ), expired AS (
    UPDATE trade_cycles cycle SET status = 'expired'
    FROM stale WHERE cycle.id = stale.id
    RETURNING cycle.id
  )
  SELECT count(*) INTO v_expired FROM expired;

  -- An accepted loop where nobody delivered anything for 30 days is
  -- abandoned: release its items so their owners can trade again.
  WITH abandoned AS (
    SELECT c.id FROM trade_cycles c
    WHERE c.status = 'accepted' AND c.updated_at <= now() - interval '30 days'
      AND NOT EXISTS (SELECT 1 FROM trade_cycle_participants tp
                      WHERE tp.cycle_id = c.id AND tp.delivered_at IS NOT NULL)
    FOR UPDATE SKIP LOCKED
  ), closed AS (
    UPDATE trade_cycles c SET status = 'expired' FROM abandoned WHERE c.id = abandoned.id
    RETURNING c.id
  ), released AS (
    DELETE FROM intent_reservations r USING closed WHERE r.cycle_id = closed.id
    RETURNING r.intent_id
  )
  UPDATE intents SET status = 'active'
  WHERE id IN (SELECT intent_id FROM released) AND status = 'in_cycle';
  RETURN v_expired;
END;
$$;

-- ── Legacy data ──────────────────────────────────────────────
-- Open suggestions created by the old engine are re-checked against the
-- new rules: weak edges (old similarity floor was 0.58), Buy now only
-- Offers and incompatible pairs can never be accepted now.
UPDATE trade_cycles c SET status = 'superseded'
WHERE c.status IN ('suggested', 'pending_acceptance')
  AND (c.min_similarity < 0.70
       OR EXISTS (SELECT 1 FROM trade_cycle_participants tp
                  JOIN intents o ON o.id = tp.gives_intent_id
                  WHERE tp.cycle_id = c.id AND o.transaction_mode = 'buy_now')
       OR EXISTS (SELECT 1 FROM trade_cycle_participants tp
                  JOIN intents w ON w.id = tp.want_intent_id
                  JOIN intents o ON o.id = tp.receives_intent_id
                  WHERE tp.cycle_id = c.id AND NOT intent_pair_compatible(w, o)));

-- Suggestions no longer hold intents, and closed loops never should.
-- Completed loops that leaked a reservation finish the one-off intent.
WITH released AS (
  DELETE FROM intent_reservations r USING trade_cycles c
  WHERE r.cycle_id = c.id AND c.status = 'completed'
  RETURNING r.intent_id
)
UPDATE intents SET status = CASE WHEN is_continuous THEN 'active' ELSE 'fulfilled' END
WHERE id IN (SELECT intent_id FROM released) AND status = 'in_cycle';

WITH released AS (
  DELETE FROM intent_reservations r USING trade_cycles c
  WHERE r.cycle_id = c.id AND c.status NOT IN ('accepted', 'completed')
  RETURNING r.intent_id
)
UPDATE intents SET status = 'active'
WHERE id IN (SELECT intent_id FROM released) AND status = 'in_cycle';

-- Continuous intents stay available while in accepted loops.
WITH released AS (
  DELETE FROM intent_reservations r USING intents i
  WHERE r.intent_id = i.id AND r.cycle_id IS NOT NULL AND i.is_continuous
  RETURNING r.intent_id
)
UPDATE intents SET status = 'active'
WHERE id IN (SELECT intent_id FROM released) AND status = 'in_cycle';

-- An in_cycle intent without any reservation is invisible to everyone.
UPDATE intents i SET status = 'active'
WHERE i.status = 'in_cycle'
  AND NOT EXISTS (SELECT 1 FROM intent_reservations r WHERE r.intent_id = i.id);

-- ── Clearing round ───────────────────────────────────────────
-- Searches loops from every member who both gives and receives (each
-- loop once, from its smallest member), then
-- greedily packs disjoint loops by expected satisfied members
-- (hops x score). Dry runs only report; otherwise loops are persisted
-- as suggestions with source 'clearing'.
CREATE OR REPLACE FUNCTION run_clearing_round(
  p_max_hops INT DEFAULT 6,
  p_min_score FLOAT DEFAULT 0.04,
  p_dry_run BOOLEAN DEFAULT true,
  p_max_loops INT DEFAULT 50
) RETURNS JSONB LANGUAGE plpgsql
SET search_path = public, pg_temp
SET jit = off
AS $$
DECLARE
  v_hops INT := LEAST(GREATEST(p_max_hops, 2), 7);
  v_user UUID;
  v_row RECORD;
  v_cycle JSONB;
  v_used UUID[] := '{}';
  v_selected JSONB[] := '{}';
  v_persisted JSONB;
  v_created INT := 0;
BEGIN
  PERFORM prepare_loop_arcs();
  CREATE TEMP TABLE IF NOT EXISTS loop_candidates (
    hash TEXT PRIMARY KEY, hops INT, score FLOAT, ids UUID[],
    path UUID[], offers UUID[], wants UUID[], probs FLOAT[], explicit BOOLEAN[],
    pmin NUMERIC, pmax NUMERIC
  ) ON COMMIT DROP;
  DELETE FROM loop_candidates;

  FOR v_user IN
    SELECT DISTINCT giver FROM loop_arc_snapshot
    WHERE giver IN (SELECT receiver FROM loop_arc_snapshot)
  LOOP
    PERFORM collect_loops_from(v_user, v_hops, p_min_score, 0.75, 200, true);
    INSERT INTO loop_candidates
    SELECT md5(array_to_string(ARRAY(SELECT x::text FROM unnest(f.offers) x ORDER BY 1), '|')),
           f.depth, f.score, f.offers || array_remove(f.wants, NULL),
           f.path, f.offers, f.wants, f.probs, f.explicit, f.pmin, f.pmax
    FROM (SELECT * FROM loop_found ORDER BY score DESC, depth LIMIT 30) f
    ON CONFLICT (hash) DO NOTHING;
  END LOOP;

  FOR v_row IN
    SELECT * FROM loop_candidates ORDER BY hops * score DESC, score DESC, hash
  LOOP
    EXIT WHEN cardinality(v_selected) >= p_max_loops;
    CONTINUE WHEN v_row.ids && v_used;
    v_used := v_used || v_row.ids;
    v_cycle := loop_to_json(v_row.path, v_row.offers, v_row.wants, v_row.probs, v_row.explicit,
                            v_row.hops, v_row.score, v_row.pmin, v_row.pmax);
    IF NOT p_dry_run THEN
      BEGIN
        v_persisted := persist_intent_cycle(v_cycle, 'clearing');
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'clearing loop not saved: %', SQLERRM;
        v_persisted := NULL;
      END;
      IF (v_persisted->>'created')::BOOLEAN THEN
        v_created := v_created + 1;
        v_cycle := v_cycle || jsonb_build_object('cycle_id', v_persisted->>'id');
      END IF;
    END IF;
    v_selected := v_selected || v_cycle;
  END LOOP;

  RETURN jsonb_build_object(
    'candidates', (SELECT count(*) FROM loop_candidates),
    'selected', to_jsonb(v_selected),
    'created', v_created);
END;
$$;

-- ── Swipe deck ───────────────────────────────────────────────
-- Offers the member has not decided on yet, best first: Offers that
-- match one of their Interests and whose owner wants one of their
-- Offers (a direct swap), then either signal, then the newest.
CREATE OR REPLACE FUNCTION swipe_deck(p_user UUID, p_limit INT DEFAULT 20)
RETURNS TABLE (id UUID, reason TEXT, score FLOAT, want_title TEXT, offer_title TEXT)
LANGUAGE sql STABLE
SET search_path = public, pg_temp
AS $$
  WITH my_wants AS (
    SELECT i.id, i.title FROM intents i
    WHERE i.user_id = p_user AND i.direction = 'want' AND i.status = 'active'
  ), my_offers AS (
    SELECT i.id, i.title FROM intents i
    WHERE i.user_id = p_user AND i.direction = 'offer' AND i.status = 'active'
  ), candidates AS (
    SELECT o.id, o.user_id, o.created_at FROM intents o
    WHERE o.direction = 'offer' AND o.status = 'active' AND o.user_id <> p_user
      AND o.transaction_mode <> 'buy_now'
      AND (o.expires_at IS NULL OR o.expires_at > now())
      AND NOT EXISTS (SELECT 1 FROM intent_swipes s WHERE s.user_id = p_user AND s.offer_id = o.id)
  ), interest_match AS (
    SELECT DISTINCT ON (e.offer_id) e.offer_id, e.similarity, w.title AS want_title
    FROM intent_edges e JOIN my_wants w ON w.id = e.want_id
    ORDER BY e.offer_id, e.similarity DESC
  ), reciprocal AS (
    SELECT DISTINCT ON (ow.user_id) ow.user_id AS owner_id, mo.title AS offer_title
    FROM intent_edges e
    JOIN my_offers mo ON mo.id = e.offer_id
    JOIN intents ow ON ow.id = e.want_id AND ow.status = 'active'
    ORDER BY ow.user_id, e.similarity DESC
  )
  SELECT c.id,
         CASE WHEN im.offer_id IS NOT NULL THEN 'matches_interest'
              WHEN rc.owner_id IS NOT NULL THEN 'wants_your_offer'
              ELSE 'new' END,
         LEAST(1.0, COALESCE(im.similarity, 0)
                    + CASE WHEN rc.owner_id IS NOT NULL THEN 0.25 ELSE 0 END)::FLOAT,
         im.want_title, rc.offer_title
  FROM candidates c
  LEFT JOIN interest_match im ON im.offer_id = c.id
  LEFT JOIN reciprocal rc ON rc.owner_id = c.user_id
  ORDER BY (im.offer_id IS NOT NULL AND rc.owner_id IS NOT NULL) DESC,
           LEAST(1.0, COALESCE(im.similarity, 0)
                      + CASE WHEN rc.owner_id IS NOT NULL THEN 0.25 ELSE 0 END) DESC,
           c.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;

-- ── Loop radar ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION loop_radar(p_user UUID) RETURNS JSONB LANGUAGE plpgsql
SET search_path = public, pg_temp
SET jit = off
AS $$
DECLARE
  v_result JSONB;
BEGIN
  PERFORM prepare_loop_arcs(24);
  WITH open_loops AS (
    SELECT c.id, c.hops, c.status, c.score,
           (SELECT array_agg(tp2.user_id ORDER BY tp2.position)
            FROM trade_cycle_participants tp2 WHERE tp2.cycle_id = c.id) AS members
    FROM trade_cycles c
    WHERE c.status IN ('suggested', 'pending_acceptance', 'accepted')
      AND EXISTS (SELECT 1 FROM trade_cycle_participants tp
                  WHERE tp.cycle_id = c.id AND tp.user_id = p_user)
  ), shown_loops AS (
    SELECT * FROM open_loops ORDER BY score DESC NULLS LAST LIMIT 6
  ), visible AS (
    -- Arcs into the viewer are their own Interests or swipes. Arcs out of
    -- the viewer are shown only when backed by a public Interest: another
    -- member's swipe stays private until a loop forms.
    SELECT a.* FROM loop_arc_snapshot a
    WHERE a.receiver = p_user OR (a.giver = p_user AND a.want_id IS NOT NULL)
  ), direct AS (
    SELECT d.u FROM (
      SELECT receiver AS u, prob FROM visible WHERE giver = p_user
      UNION ALL
      SELECT giver, prob FROM visible WHERE receiver = p_user
    ) d GROUP BY d.u ORDER BY max(d.prob) DESC LIMIT 16
  ), node_ids AS (
    SELECT p_user AS id, 0 AS ring
    UNION ALL SELECT u, 1 FROM direct
    UNION ALL SELECT m, 2 FROM shown_loops, unnest(members) m
  ), nodes AS (
    SELECT id, min(ring) AS ring FROM node_ids GROUP BY id ORDER BY min(ring) LIMIT 25
  ), links AS (
    SELECT v.* FROM visible v
    WHERE v.giver IN (SELECT id FROM nodes) AND v.receiver IN (SELECT id FROM nodes)
    ORDER BY v.prob DESC LIMIT 40
  )
  SELECT jsonb_build_object(
    'nodes', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', n.id, 'label', COALESCE(u.display_name, 'Member'), 'avatar_url', u.avatar_url,
                'role', CASE WHEN n.id = p_user THEN 'me' ELSE 'partner' END, 'ring', n.ring)
              ORDER BY n.ring), '[]') FROM nodes n JOIN users u ON u.id = n.id),
    'links', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'source', l.giver, 'target', l.receiver, 'offer_id', l.offer_id,
                'offer_title', i.title, 'score', round(l.prob::numeric, 3),
                'explicit', l.explicit AND l.receiver = p_user)),
              '[]') FROM links l JOIN intents i ON i.id = l.offer_id),
    'loops', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', s.id, 'hops', s.hops, 'status', s.status, 'score', s.score,
                'members', to_jsonb(s.members))), '[]') FROM shown_loops s),
    'stats', jsonb_build_object(
      'interests', (SELECT count(*) FROM intents
                    WHERE user_id = p_user AND direction = 'want' AND status = 'active'),
      'offers', (SELECT count(*) FROM intents
                 WHERE user_id = p_user AND direction = 'offer' AND status = 'active'),
      'incoming', (SELECT count(DISTINCT giver) FROM loop_arc_snapshot WHERE receiver = p_user),
      'outgoing', (SELECT count(DISTINCT receiver) FROM loop_arc_snapshot WHERE giver = p_user),
      'open_loops', (SELECT count(*) FROM open_loops),
      'completed_loops', (SELECT count(*) FROM trade_cycles c
                          JOIN trade_cycle_participants tp ON tp.cycle_id = c.id
                          WHERE tp.user_id = p_user AND c.status = 'completed'))
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- ── Live market activity ─────────────────────────────────────
CREATE OR REPLACE FUNCTION market_activity(p_limit INT DEFAULT 20) RETURNS JSONB
LANGUAGE sql STABLE
SET search_path = public, pg_temp
AS $$
  WITH events AS (
    (SELECT 'intent_published' AS type, created_at AS at, title, kind, direction, NULL::INT AS hops
     FROM intents WHERE status IN ('active', 'in_cycle', 'fulfilled')
     ORDER BY created_at DESC LIMIT p_limit)
    UNION ALL
    (SELECT 'loop_formed', created_at, NULL, NULL, NULL, hops
     FROM trade_cycles ORDER BY created_at DESC LIMIT p_limit)
    UNION ALL
    (SELECT 'loop_completed', updated_at, NULL, NULL, NULL, hops
     FROM trade_cycles WHERE status = 'completed' ORDER BY updated_at DESC LIMIT p_limit)
    UNION ALL
    (SELECT 'purchase_completed', p.confirmed_at, i.title, i.kind, NULL, NULL
     FROM payments p JOIN intents i ON i.id = p.intent_id
     WHERE p.status = 'confirmed' ORDER BY p.confirmed_at DESC LIMIT p_limit)
  ), recent AS (
    SELECT * FROM events ORDER BY at DESC LIMIT LEAST(GREATEST(p_limit, 1), 50)
  )
  SELECT jsonb_build_object(
    'events', COALESCE((SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                'type', type, 'at', at, 'title', title, 'kind', kind,
                'direction', direction, 'hops', hops)) ORDER BY at DESC) FROM recent), '[]'),
    'stats', jsonb_build_object(
      'members', (SELECT count(*) FROM users),
      'active_intents', (SELECT count(*) FROM intents WHERE status = 'active'),
      'open_loops', (SELECT count(*) FROM trade_cycles
                     WHERE status IN ('suggested', 'pending_acceptance', 'accepted')),
      'completed_loops', (SELECT count(*) FROM trade_cycles WHERE status = 'completed')));
$$;

-- ── Market map ───────────────────────────────────────────────
-- Points sit at the owner's area, already rounded to about 1 km, plus an
-- offset of up to ~400 m per intent so points do not stack. The offset is
-- keyed by a secret salt passed by the Worker, so it cannot be undone to
-- recover the exact rounded cell. The rounded area itself is public.
CREATE OR REPLACE FUNCTION market_map(p_limit INT DEFAULT 500, p_salt TEXT DEFAULT '') RETURNS JSONB
LANGUAGE sql STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', p.id, 'direction', p.direction, 'kind', p.kind, 'title', p.title,
    'price_fiat', p.price_fiat,
    'lat', round((p.geo_lat
      + ((('x' || substr(md5(p_salt || p.id::text), 1, 4))::bit(16)::int / 65535.0) - 0.5) * 0.008)::numeric, 4),
    'lng', round((p.geo_lng
      + ((('x' || substr(md5(p_salt || p.id::text), 5, 4))::bit(16)::int / 65535.0) - 0.5) * 0.008)::numeric, 4)
  )), '[]')
  FROM (
    SELECT i.id, i.direction, i.kind, i.title, i.price_fiat, u.geo_lat, u.geo_lng
    FROM intents i JOIN users u ON u.id = i.user_id
    WHERE i.status = 'active' AND u.geo_lat IS NOT NULL AND u.geo_lng IS NOT NULL
    ORDER BY i.created_at DESC
    LIMIT LEAST(GREATEST(p_limit, 1), 1000)
  ) p;
$$;

-- ── Account merge keeps swipes and the shared area ───────────
CREATE OR REPLACE FUNCTION link_telegram_account(
  p_user UUID, p_tg_id BIGINT, p_tg_username TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target users%ROWTYPE;
  v_other users%ROWTYPE;
  v_referrer UUID;
  v_merged BOOLEAN := false;
BEGIN
  SELECT * INTO v_target FROM users WHERE id = p_user FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
  END IF;

  -- A valid Mini App session must not silently replace a Telegram identity
  -- that was already linked to this Privy account.
  IF v_target.telegram_id IS NOT NULL AND v_target.telegram_id <> p_tg_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'target_already_linked');
  END IF;

  SELECT * INTO v_other FROM users
    WHERE telegram_id = p_tg_id AND id <> p_user FOR UPDATE;

  IF FOUND THEN
    IF v_other.privy_did IS NOT NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'owned_by_other_account');
    END IF;

    UPDATE intents SET user_id = p_user WHERE user_id = v_other.id;
    UPDATE intent_drafts SET user_id = p_user WHERE user_id = v_other.id;

    DELETE FROM interest_marks m
      WHERE m.user_id = v_other.id
        AND EXISTS (
          SELECT 1 FROM interest_marks k
          WHERE k.user_id = p_user AND k.intent_id = m.intent_id
        );
    UPDATE interest_marks SET user_id = p_user WHERE user_id = v_other.id;

    DELETE FROM intent_swipes s
      WHERE s.user_id = v_other.id
        AND EXISTS (
          SELECT 1 FROM intent_swipes k
          WHERE k.user_id = p_user AND k.offer_id = s.offer_id
        );
    UPDATE intent_swipes SET user_id = p_user WHERE user_id = v_other.id;

    UPDATE trade_cycle_participants SET user_id = p_user WHERE user_id = v_other.id;
    UPDATE notifications SET user_id = p_user WHERE user_id = v_other.id;

    INSERT INTO ai_usage (user_id, day, action, count)
      SELECT p_user, day, action, count FROM ai_usage WHERE user_id = v_other.id
      ON CONFLICT (user_id, day, action)
      DO UPDATE SET count = ai_usage.count + EXCLUDED.count;
    DELETE FROM ai_usage WHERE user_id = v_other.id;

    UPDATE payments SET buyer_user_id = p_user WHERE buyer_user_id = v_other.id;
    UPDATE payments SET seller_user_id = p_user WHERE seller_user_id = v_other.id;
    UPDATE nexum_sessions SET user_id = p_user WHERE user_id = v_other.id;
    UPDATE nexum_events SET user_id = p_user WHERE user_id = v_other.id;

    -- Preserve referral attribution without creating a self-reference after
    -- the two accounts become one.
    v_referrer := v_target.referred_by;
    IF v_referrer = v_other.id THEN
      v_referrer := NULL;
    END IF;
    IF v_referrer IS NULL
      AND v_other.referred_by IS NOT NULL
      AND v_other.referred_by <> p_user
      AND v_other.referred_by <> v_other.id THEN
      v_referrer := v_other.referred_by;
    END IF;
    UPDATE users SET referred_by = p_user
      WHERE referred_by = v_other.id AND id NOT IN (p_user, v_other.id);

    UPDATE users AS target SET
      display_name = COALESCE(target.display_name, v_other.display_name),
      avatar_url = COALESCE(target.avatar_url, v_other.avatar_url),
      bio = COALESCE(target.bio, v_other.bio),
      settings = v_other.settings || target.settings,
      nexum_memory_enabled = target.nexum_memory_enabled OR v_other.nexum_memory_enabled,
      nexum_memory = v_other.nexum_memory || target.nexum_memory,
      geo_lat = CASE WHEN target.geo_lat IS NULL THEN v_other.geo_lat ELSE target.geo_lat END,
      geo_lng = CASE WHEN target.geo_lat IS NULL THEN v_other.geo_lng ELSE target.geo_lng END,
      geo_label = CASE WHEN target.geo_lat IS NULL THEN v_other.geo_label ELSE target.geo_label END,
      referred_by = v_referrer
      WHERE target.id = p_user;

    DELETE FROM users WHERE id = v_other.id;
    v_merged := true;
  END IF;

  UPDATE users SET
    telegram_id = p_tg_id,
    telegram_username = p_tg_username,
    telegram_dm_ok = true
    WHERE id = p_user;

  RETURN jsonb_build_object('ok', true, 'merged', v_merged);
END;
$$;

-- ── Matching entry point for the Worker ──────────────────────
-- One round trip per trigger (publish, edit, swipe, decline, supersede):
-- expires stale state, snapshots the arcs once, and saves up to p_max_new
-- loops through each member. Keeps the Worker within its subrequest budget.
CREATE OR REPLACE FUNCTION match_and_persist(p_users UUID[], p_max_new INT DEFAULT 3)
RETURNS JSONB LANGUAGE plpgsql
SET search_path = public, pg_temp
SET jit = off
AS $$
DECLARE
  v_user UUID;
  v_cycle JSONB;
  v_result JSONB;
  v_new INT;
  v_created JSONB[] := '{}';
BEGIN
  PERFORM expire_payment_reservations();
  PERFORM expire_stale_cycles();
  PERFORM prepare_loop_arcs();
  FOR v_user IN
    SELECT DISTINCT u FROM unnest(p_users) u WHERE u IS NOT NULL LIMIT 10
  LOOP
    v_new := 0;
    FOR v_cycle IN
      SELECT value FROM jsonb_array_elements(search_loops_from(v_user, 6, 0.04, 0.75, 10))
    LOOP
      EXIT WHEN v_new >= p_max_new;
      BEGIN
        v_result := persist_intent_cycle(v_cycle, 'match');
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'loop not saved: %', SQLERRM;
        CONTINUE;
      END;
      IF (v_result->>'created')::BOOLEAN THEN
        v_new := v_new + 1;
        v_created := v_created || (v_cycle || jsonb_build_object('id', v_result->>'id'));
      END IF;
    END LOOP;
  END LOOP;
  RETURN to_jsonb(v_created);
END;
$$;

-- Support exit for a loop that cannot finish: releases its reservations
-- and returns the members so the Worker can tell them and re-match.
CREATE OR REPLACE FUNCTION cancel_loop(p_cycle UUID) RETURNS JSONB LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status TEXT;
  v_members UUID[];
BEGIN
  SELECT status INTO v_status FROM trade_cycles WHERE id = p_cycle FOR UPDATE;
  IF v_status IS NULL THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  IF v_status NOT IN ('suggested', 'pending_acceptance', 'accepted') THEN
    RETURN jsonb_build_object('error', 'closed', 'status', v_status);
  END IF;
  UPDATE trade_cycles SET status = 'cancelled' WHERE id = p_cycle;
  WITH released AS (
    DELETE FROM intent_reservations WHERE cycle_id = p_cycle RETURNING intent_id
  )
  UPDATE intents SET status = 'active'
  WHERE id IN (SELECT intent_id FROM released) AND status = 'in_cycle';
  SELECT array_agg(user_id ORDER BY position) INTO v_members
  FROM trade_cycle_participants WHERE cycle_id = p_cycle;
  RETURN jsonb_build_object('status', 'cancelled', 'members', to_jsonb(v_members));
END;
$$;

-- Two matching intents published at the same moment cannot see each
-- other's uncommitted row, so their edge is missed. The keepalive cron
-- repairs edges of recently created or edited intents.
CREATE OR REPLACE FUNCTION refresh_recent_edges(p_since INTERVAL DEFAULT interval '7 hours')
RETURNS INT LANGUAGE sql
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(sum(refresh_intent_edges(id)), 0)::INT FROM intents
  WHERE (created_at > now() - p_since OR updated_at > now() - p_since)
    AND embedding IS NOT NULL AND status NOT IN ('archived', 'fulfilled');
$$;

-- ── Privileges ───────────────────────────────────────────────
-- Only the Worker (service_role) calls these. Supabase grants EXECUTE on
-- new functions to anon by default; RLS already blocks data access, but
-- anon should not be able to burn CPU or create temp tables either.
DO $$
DECLARE
  f RECORD;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY (ARRAY[
      'intent_pair_compatible', 'refresh_intent_edges', 'sync_intent_edges', 'loop_arcs',
      'prepare_loop_arcs', 'collect_loops_from', 'loop_to_json', 'search_loops_from',
      'find_intent_cycles', 'persist_intent_cycle', 'respond_to_cycle', 'confirm_cycle_step',
      'prune_unavailable_loops', 'expire_stale_cycles', 'run_clearing_round', 'swipe_deck',
      'loop_radar', 'market_activity', 'market_map', 'link_telegram_account',
      'match_and_persist', 'cancel_loop', 'refresh_recent_edges'])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', f.sig);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', f.sig);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
    END IF;
  END LOOP;
END;
$$;

-- Loop search keeps per-transaction temp tables; make sure the Worker's
-- role may create them (PostgreSQL grants TEMP to PUBLIC by default).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role')
     AND NOT has_database_privilege('service_role', current_database(), 'TEMP') THEN
    EXECUTE format('GRANT TEMPORARY ON DATABASE %I TO service_role', current_database());
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE WARNING 'Could not grant TEMP to service_role: loop search needs it';
END;
$$;
