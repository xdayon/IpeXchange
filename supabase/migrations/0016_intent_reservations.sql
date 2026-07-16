-- Atomic ownership for intents committed to a trade cycle or checkout.
CREATE TABLE intent_reservations (
  intent_id UUID PRIMARY KEY REFERENCES intents(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES trade_cycles(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(cycle_id, payment_id) = 1),
  CHECK ((payment_id IS NULL) = (expires_at IS NULL))
);

CREATE UNIQUE INDEX intent_reservations_cycle_intent
  ON intent_reservations(cycle_id, intent_id) WHERE cycle_id IS NOT NULL;
CREATE UNIQUE INDEX intent_reservations_payment
  ON intent_reservations(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX intent_reservations_expiry
  ON intent_reservations(expires_at) WHERE payment_id IS NOT NULL;
ALTER TABLE intent_reservations ENABLE ROW LEVEL SECURITY;

-- Cancelled and completed cycles no longer block a valid future suggestion.
ALTER TABLE trade_cycles DROP CONSTRAINT IF EXISTS trade_cycles_cycle_hash_key;
CREATE UNIQUE INDEX trade_cycles_open_cycle_hash
  ON trade_cycles(cycle_hash)
  WHERE status IN ('suggested', 'pending_acceptance', 'accepted');

CREATE OR REPLACE FUNCTION expire_payment_reservations()
RETURNS INT LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_released INT;
BEGIN
  WITH released AS (
    DELETE FROM intent_reservations r
    USING payments p
    WHERE r.payment_id = p.id
      AND r.expires_at < now()
      AND p.status = 'submitted'
      AND p.tx_hash IS NULL
    RETURNING r.intent_id, r.payment_id
  ), failed AS (
    UPDATE payments p SET status = 'failed'
    FROM released r WHERE p.id = r.payment_id
    RETURNING r.intent_id
  ), activated AS (
    UPDATE intents i SET status = 'active'
    WHERE i.id IN (SELECT intent_id FROM failed)
      AND i.status = 'in_cycle'
    RETURNING i.id
  )
  SELECT count(*) INTO v_released FROM released;
  RETURN v_released;
END;
$$;

CREATE OR REPLACE FUNCTION prepare_payment(p_payment UUID, p_buyer UUID)
RETURNS JSONB LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_intent intents%ROWTYPE;
BEGIN
  PERFORM expire_payment_reservations();
  SELECT * INTO v_payment FROM payments WHERE id = p_payment FOR UPDATE;
  IF NOT FOUND OR v_payment.buyer_user_id <> p_buyer THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF v_payment.status <> 'quoted' OR v_payment.tx_hash IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'not_preparable', 'status', v_payment.status);
  END IF;
  IF v_payment.quote_expires_at <= now() THEN
    UPDATE payments SET status = 'failed' WHERE id = p_payment;
    RETURN jsonb_build_object('error', 'quote_expired');
  END IF;

  SELECT * INTO v_intent FROM intents WHERE id = v_payment.intent_id FOR UPDATE;
  IF v_intent.status <> 'active' THEN
    RETURN jsonb_build_object('error', 'intent_unavailable');
  END IF;

  INSERT INTO intent_reservations (intent_id, payment_id, expires_at)
  VALUES (v_intent.id, v_payment.id, v_payment.quote_expires_at + interval '2 minutes')
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'intent_unavailable');
  END IF;

  UPDATE intents SET status = 'in_cycle' WHERE id = v_intent.id;
  UPDATE payments SET status = 'submitted' WHERE id = v_payment.id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION cancel_prepared_payment(p_payment UUID, p_buyer UUID)
RETURNS JSONB LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_payment payments%ROWTYPE;
BEGIN
  SELECT * INTO v_payment FROM payments WHERE id = p_payment FOR UPDATE;
  IF NOT FOUND OR v_payment.buyer_user_id <> p_buyer THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF v_payment.status <> 'submitted' OR v_payment.tx_hash IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'not_cancellable', 'status', v_payment.status);
  END IF;

  DELETE FROM intent_reservations WHERE payment_id = p_payment;
  UPDATE payments SET status = 'failed' WHERE id = p_payment;
  UPDATE intents SET status = 'active'
  WHERE id = v_payment.intent_id AND status = 'in_cycle'
    AND NOT EXISTS (
      SELECT 1 FROM intent_reservations WHERE intent_id = v_payment.intent_id
    );
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION settle_payment(
  p_payment UUID, p_valid BOOLEAN, p_from_wallet TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_intent intents%ROWTYPE;
  v_result payments%ROWTYPE;
BEGIN
  SELECT * INTO v_payment FROM payments WHERE id = p_payment FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  IF v_payment.status = 'confirmed' THEN
    RETURN to_jsonb(v_payment) || jsonb_build_object('already_settled', true);
  END IF;
  IF v_payment.status <> 'submitted' THEN
    RETURN jsonb_build_object('error', 'not_submitted', 'status', v_payment.status);
  END IF;

  SELECT * INTO v_intent FROM intents WHERE id = v_payment.intent_id FOR UPDATE;
  IF NOT EXISTS (
    SELECT 1 FROM intent_reservations
    WHERE intent_id = v_payment.intent_id AND payment_id = p_payment
  ) THEN
    RETURN jsonb_build_object('error', 'reservation_lost');
  END IF;

  IF p_valid THEN
    UPDATE payments SET status = 'confirmed', from_wallet = lower(p_from_wallet), confirmed_at = now()
    WHERE id = p_payment RETURNING * INTO v_result;
    UPDATE intents SET status = CASE WHEN is_continuous THEN 'active' ELSE 'fulfilled' END
    WHERE id = v_intent.id;
  ELSE
    UPDATE payments SET status = 'failed' WHERE id = p_payment RETURNING * INTO v_result;
    UPDATE intents SET status = 'active' WHERE id = v_intent.id AND status = 'in_cycle';
  END IF;
  DELETE FROM intent_reservations WHERE payment_id = p_payment;
  RETURN to_jsonb(v_result) || jsonb_build_object('already_settled', false);
END;
$$;

CREATE OR REPLACE FUNCTION persist_intent_cycle(p_cycle JSONB)
RETURNS JSONB LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_hash TEXT;
  v_id UUID;
  v_intents UUID[];
  v_reserved INT;
BEGIN
  SELECT md5(string_agg(p->>'gives_intent_id', '|' ORDER BY p->>'gives_intent_id'))
    INTO v_hash FROM jsonb_array_elements(p_cycle->'participants') p;
  SELECT array_agg(DISTINCT intent_id ORDER BY intent_id) INTO v_intents
  FROM jsonb_array_elements(p_cycle->'participants') p
  CROSS JOIN LATERAL unnest(ARRAY[
    (p->>'gives_intent_id')::UUID,
    (p->>'want_id')::UUID
  ]) intent_id;

  PERFORM id FROM intents WHERE id = ANY(v_intents) ORDER BY id FOR UPDATE;
  IF (SELECT count(*) FROM intents WHERE id = ANY(v_intents) AND status = 'active')
      <> cardinality(v_intents) THEN
    RETURN jsonb_build_object('created', false, 'reason', 'intent_unavailable');
  END IF;

  INSERT INTO trade_cycles (cycle_hash, hops, min_similarity, value_ratio)
  VALUES (v_hash, (p_cycle->>'hops')::INT,
          (p_cycle->>'min_similarity')::FLOAT, (p_cycle->>'value_ratio')::FLOAT)
  ON CONFLICT (cycle_hash) WHERE status IN ('suggested', 'pending_acceptance', 'accepted')
  DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NULL THEN RETURN jsonb_build_object('created', false); END IF;

  INSERT INTO intent_reservations (intent_id, cycle_id)
  SELECT unnest(v_intents), v_id ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_reserved = ROW_COUNT;
  IF v_reserved <> cardinality(v_intents) THEN
    DELETE FROM trade_cycles WHERE id = v_id;
    RETURN jsonb_build_object('created', false, 'reason', 'intent_unavailable');
  END IF;

  INSERT INTO trade_cycle_participants
    (cycle_id, user_id, position, gives_intent_id, receives_intent_id, want_intent_id)
  SELECT v_id, (p->>'user_id')::UUID, (p->>'position')::INT,
         (p->>'gives_intent_id')::UUID, (p->>'receives_intent_id')::UUID,
         (p->>'want_id')::UUID
  FROM jsonb_array_elements(p_cycle->'participants') p;
  UPDATE intents SET status = 'in_cycle' WHERE id = ANY(v_intents);
  RETURN jsonb_build_object('created', true, 'id', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION respond_to_cycle(p_cycle UUID, p_user UUID, p_accept BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_pending INT;
BEGIN
  SELECT status INTO v_status FROM trade_cycles WHERE id = p_cycle FOR UPDATE;
  IF v_status IS NULL THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
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
    WITH released AS (
      DELETE FROM intent_reservations WHERE cycle_id = p_cycle RETURNING intent_id
    )
    UPDATE intents SET status = 'active'
    WHERE id IN (SELECT intent_id FROM released) AND status = 'in_cycle';
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

CREATE OR REPLACE FUNCTION confirm_cycle_step(p_cycle UUID, p_user UUID, p_step TEXT)
RETURNS JSONB LANGUAGE plpgsql
SET search_path = public
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
  IF NOT EXISTS (SELECT 1 FROM intent_reservations WHERE cycle_id = p_cycle) THEN
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
  UPDATE intents i
  SET status = CASE WHEN i.is_continuous THEN 'active' ELSE 'fulfilled' END
  WHERE i.id IN (SELECT intent_id FROM intent_reservations WHERE cycle_id = p_cycle);
  DELETE FROM intent_reservations WHERE cycle_id = p_cycle;
  RETURN jsonb_build_object('status', 'completed');
END;
$$;

-- The old status was unused. Rebuild reservations for live records, preferring
-- submitted on-chain payments because money may already have moved.
UPDATE intents SET status = 'active' WHERE status = 'in_cycle';
UPDATE intents i SET status = 'fulfilled'
WHERE i.is_continuous = false AND i.status = 'active'
  AND EXISTS (
    SELECT 1 FROM payments p WHERE p.intent_id = i.id AND p.status = 'confirmed'
  );
INSERT INTO intent_reservations (intent_id, payment_id, expires_at)
SELECT DISTINCT ON (p.intent_id) p.intent_id, p.id, p.quote_expires_at + interval '2 minutes'
FROM payments p
JOIN intents i ON i.id = p.intent_id AND i.status = 'active'
WHERE p.status = 'submitted'
ORDER BY p.intent_id, (p.tx_hash IS NOT NULL) DESC, p.created_at;
UPDATE intents i SET status = 'in_cycle'
WHERE EXISTS (SELECT 1 FROM intent_reservations r WHERE r.intent_id = i.id);

DO $$
DECLARE
  v_cycle RECORD;
  v_ids UUID[];
BEGIN
  FOR v_cycle IN
    SELECT id FROM trade_cycles
    WHERE status IN ('accepted', 'pending_acceptance', 'suggested')
    ORDER BY CASE status WHEN 'accepted' THEN 0 WHEN 'pending_acceptance' THEN 1 ELSE 2 END,
             created_at
  LOOP
    SELECT array_agg(DISTINCT intent_id ORDER BY intent_id) INTO v_ids
    FROM (
      SELECT gives_intent_id AS intent_id FROM trade_cycle_participants WHERE cycle_id = v_cycle.id
      UNION
      SELECT want_intent_id FROM trade_cycle_participants
      WHERE cycle_id = v_cycle.id AND want_intent_id IS NOT NULL
    ) ids;
    IF v_ids IS NULL
      OR EXISTS (SELECT 1 FROM intent_reservations WHERE intent_id = ANY(v_ids))
      OR EXISTS (SELECT 1 FROM intents WHERE id = ANY(v_ids) AND status <> 'active')
      OR (SELECT count(*) FROM intents WHERE id = ANY(v_ids)) <> cardinality(v_ids)
    THEN
      UPDATE trade_cycles SET status = 'cancelled' WHERE id = v_cycle.id;
    ELSE
      INSERT INTO intent_reservations (intent_id, cycle_id)
      SELECT unnest(v_ids), v_cycle.id;
      UPDATE intents SET status = 'in_cycle' WHERE id = ANY(v_ids) AND status = 'active';
    END IF;
  END LOOP;
END;
$$;

-- Unreserved duplicate submissions without an attached hash are safe to close.
UPDATE payments p SET status = 'failed'
WHERE p.status = 'submitted' AND p.tx_hash IS NULL
  AND NOT EXISTS (SELECT 1 FROM intent_reservations r WHERE r.payment_id = p.id);
