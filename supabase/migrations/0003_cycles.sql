-- ============================================================
-- IpeXchange MVP — trade cycle state machine
-- Migration 0003 — atomic persistence, acceptance and delivery
-- ============================================================

-- The want that a participant satisfies by receiving; lets completion
-- mark both sides (offer given, want satisfied) as fulfilled.
ALTER TABLE trade_cycle_participants
  ADD COLUMN IF NOT EXISTS want_intent_id UUID REFERENCES intents(id);

-- ── Persist a cycle suggested by find_intent_cycles ──────────
-- Deduplicates by cycle_hash (md5 of the sorted offered-intent ids,
-- rotation-invariant) and inserts cycle + participants atomically.
CREATE OR REPLACE FUNCTION persist_intent_cycle(p_cycle JSONB)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_hash TEXT;
  v_id UUID;
BEGIN
  SELECT md5(string_agg(p->>'gives_intent_id', '|' ORDER BY p->>'gives_intent_id'))
    INTO v_hash
  FROM jsonb_array_elements(p_cycle->'participants') p;

  INSERT INTO trade_cycles (cycle_hash, hops, min_similarity, value_ratio)
  VALUES (v_hash, (p_cycle->>'hops')::INT,
          (p_cycle->>'min_similarity')::FLOAT, (p_cycle->>'value_ratio')::FLOAT)
  ON CONFLICT (cycle_hash) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('created', false);
  END IF;

  INSERT INTO trade_cycle_participants
    (cycle_id, user_id, position, gives_intent_id, receives_intent_id, want_intent_id)
  SELECT v_id, (p->>'user_id')::UUID, (p->>'position')::INT,
         (p->>'gives_intent_id')::UUID, (p->>'receives_intent_id')::UUID,
         (p->>'want_id')::UUID
  FROM jsonb_array_elements(p_cycle->'participants') p;

  RETURN jsonb_build_object('created', true, 'id', v_id);
END;
$$;

-- ── Accept or decline a suggested cycle ──────────────────────
-- Locks the cycle row so concurrent responses serialize. One decline
-- cancels the whole ring; the last acceptance flips it to accepted.
CREATE OR REPLACE FUNCTION respond_to_cycle(p_cycle UUID, p_user UUID, p_accept BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_status TEXT;
  v_pending INT;
BEGIN
  SELECT status INTO v_status FROM trade_cycles WHERE id = p_cycle FOR UPDATE;
  IF v_status IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF v_status NOT IN ('suggested', 'pending_acceptance') THEN
    RETURN jsonb_build_object('error', 'closed', 'status', v_status);
  END IF;

  UPDATE trade_cycle_participants
  SET acceptance = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END
  WHERE cycle_id = p_cycle AND user_id = p_user AND acceptance = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'no_pending_response', 'status', v_status);
  END IF;

  IF NOT p_accept THEN
    UPDATE trade_cycles SET status = 'cancelled' WHERE id = p_cycle;
    RETURN jsonb_build_object('status', 'cancelled');
  END IF;

  SELECT count(*) INTO v_pending FROM trade_cycle_participants
  WHERE cycle_id = p_cycle AND acceptance <> 'accepted';

  UPDATE trade_cycles
  SET status = CASE WHEN v_pending = 0 THEN 'accepted' ELSE 'pending_acceptance' END
  WHERE id = p_cycle;
  RETURN jsonb_build_object(
    'status', CASE WHEN v_pending = 0 THEN 'accepted' ELSE 'pending_acceptance' END);
END;
$$;

-- ── Confirm delivery / receipt on an accepted cycle ──────────
-- When every participant has both delivered and received, the cycle
-- completes and all traded offers + satisfied wants become fulfilled.
CREATE OR REPLACE FUNCTION confirm_cycle_step(p_cycle UUID, p_user UUID, p_step TEXT)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_status TEXT;
  v_open INT;
BEGIN
  IF p_step NOT IN ('delivered', 'received') THEN
    RETURN jsonb_build_object('error', 'invalid_step');
  END IF;

  SELECT status INTO v_status FROM trade_cycles WHERE id = p_cycle FOR UPDATE;
  IF v_status IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF v_status <> 'accepted' THEN
    RETURN jsonb_build_object('error', 'not_accepted', 'status', v_status);
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

  IF v_open > 0 THEN
    RETURN jsonb_build_object('status', 'accepted');
  END IF;

  UPDATE trade_cycles SET status = 'completed' WHERE id = p_cycle;
  UPDATE intents SET status = 'fulfilled'
  WHERE id IN (
    SELECT gives_intent_id FROM trade_cycle_participants WHERE cycle_id = p_cycle
    UNION
    SELECT want_intent_id FROM trade_cycle_participants
    WHERE cycle_id = p_cycle AND want_intent_id IS NOT NULL
  );
  RETURN jsonb_build_object('status', 'completed');
END;
$$;
