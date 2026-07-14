-- Atomic, quota-gated publication of persisted Copilot drafts.

ALTER TABLE intent_drafts
  DROP CONSTRAINT IF EXISTS intent_drafts_status_check;

ALTER TABLE intent_drafts
  ADD CONSTRAINT intent_drafts_status_check
  CHECK (status IN ('draft', 'publishing', 'published', 'discarded')),
  ADD COLUMN IF NOT EXISTS publish_ai_cost INT NOT NULL DEFAULT 0 CHECK (publish_ai_cost >= 0),
  ADD COLUMN IF NOT EXISTS publish_started_at TIMESTAMPTZ;

-- Cost-aware overload for actions such as embedding a batch of drafts.
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user UUID, p_action TEXT, p_limit INT, p_cost INT
) RETURNS BOOLEAN LANGUAGE plpgsql
SET search_path = public, pg_temp AS $$
DECLARE
  v_allowed BOOLEAN;
BEGIN
  IF p_cost <= 0 THEN
    RETURN true;
  END IF;

  INSERT INTO ai_usage (user_id, day, action, count)
  SELECT p_user, (now() AT TIME ZONE 'America/Sao_Paulo')::date, p_action, p_cost
  WHERE p_cost <= p_limit
  ON CONFLICT (user_id, day, action) DO UPDATE
    SET count = ai_usage.count + EXCLUDED.count
    WHERE ai_usage.count + EXCLUDED.count <= p_limit
  RETURNING true INTO v_allowed;

  RETURN COALESCE(v_allowed, false);
END;
$$;

CREATE OR REPLACE FUNCTION claim_copilot_draft_publish(
  p_draft UUID, p_user UUID, p_limit INT
) RETURNS JSONB LANGUAGE plpgsql
SET search_path = public, pg_temp AS $$
DECLARE
  v_draft intent_drafts%ROWTYPE;
  v_cost INT;
  v_extra_cost INT;
  v_allowed BOOLEAN;
BEGIN
  SELECT * INTO v_draft FROM intent_drafts
  WHERE id = p_draft AND user_id = p_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('state', 'not_found');
  END IF;
  IF v_draft.status = 'publishing'
     AND v_draft.publish_started_at > now() - interval '5 minutes' THEN
    RETURN jsonb_build_object('state', 'busy');
  END IF;
  IF v_draft.status <> 'draft' AND v_draft.status <> 'publishing' THEN
    RETURN jsonb_build_object('state', 'resolved');
  END IF;

  IF jsonb_typeof(v_draft.drafts) <> 'array' THEN
    RETURN jsonb_build_object('state', 'invalid');
  END IF;
  v_cost := jsonb_array_length(v_draft.drafts);
  IF v_cost < 1 OR v_cost > 10 THEN
    RETURN jsonb_build_object('state', 'invalid');
  END IF;
  v_extra_cost := GREATEST(v_cost - v_draft.publish_ai_cost, 0);

  IF v_extra_cost > 0 THEN
    SELECT increment_ai_usage(p_user, 'copilot_publish', p_limit, v_extra_cost)
    INTO v_allowed;
    IF NOT v_allowed THEN
      RETURN jsonb_build_object('state', 'quota');
    END IF;
  END IF;

  UPDATE intent_drafts SET
    status = 'publishing',
    publish_ai_cost = GREATEST(publish_ai_cost, v_cost),
    publish_started_at = now()
  WHERE id = p_draft;

  RETURN jsonb_build_object(
    'state', 'claimed',
    'drafts', v_draft.drafts,
    'session_id', v_draft.session_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION finalize_copilot_draft_publish(
  p_draft UUID, p_user UUID, p_rows JSONB
) RETURNS JSONB LANGUAGE plpgsql
SET search_path = public, pg_temp AS $$
DECLARE
  v_draft intent_drafts%ROWTYPE;
  v_intents JSONB;
BEGIN
  SELECT * INTO v_draft FROM intent_drafts
  WHERE id = p_draft AND user_id = p_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('state', 'not_found');
  END IF;
  IF v_draft.status <> 'publishing' THEN
    RETURN jsonb_build_object('state', 'not_claimed');
  END IF;
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array'
     OR jsonb_array_length(p_rows) <> jsonb_array_length(v_draft.drafts) THEN
    RETURN jsonb_build_object('state', 'invalid');
  END IF;

  WITH inserted AS (
    INSERT INTO intents (
      user_id, direction, kind, title, description, category, price_fiat,
      embedding, source, is_continuous, condition, brand, duration, format,
      access, level, concept_id, location_text, location_radius_km, timeframe,
      quantity, currency, value_flexibility, exchange_modes, delivery_modes,
      attributes, constraints, field_confidence
    )
    SELECT
      p_user, r.direction, r.kind, r.title, r.description, r.category,
      r.price_fiat, r.embedding, 'copilot', r.is_continuous,
      r.condition, r.brand, r.duration, r.format, r.access, r.level,
      r.concept_id, r.location_text, r.location_radius_km, r.timeframe,
      r.quantity, r.currency, r.value_flexibility,
      COALESCE(r.exchange_modes, '{}'), COALESCE(r.delivery_modes, '{}'),
      COALESCE(r.attributes, '{}'), COALESCE(r.constraints, '{}'),
      COALESCE(r.field_confidence, '{}')
    FROM jsonb_populate_recordset(NULL::intents, p_rows) AS r
    RETURNING id, direction, kind, title, price_fiat, status
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(inserted)), '[]'::jsonb)
  INTO v_intents FROM inserted;

  UPDATE intent_drafts
  SET status = 'published', publish_started_at = NULL
  WHERE id = p_draft;

  RETURN jsonb_build_object('state', 'published', 'intents', v_intents);
END;
$$;

CREATE OR REPLACE FUNCTION release_copilot_draft_publish(
  p_draft UUID, p_user UUID
) RETURNS BOOLEAN LANGUAGE sql
SET search_path = public, pg_temp AS $$
  UPDATE intent_drafts
  SET status = 'draft', publish_started_at = NULL
  WHERE id = p_draft AND user_id = p_user AND status = 'publishing'
  RETURNING true;
$$;
