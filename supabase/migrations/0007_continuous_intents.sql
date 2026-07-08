-- ============================================================
-- IpeXchange MVP — continuous intents
-- Migration 0007 — standing offers survive completed trades
-- ============================================================

ALTER TABLE intents
  ADD COLUMN IF NOT EXISTS is_continuous BOOLEAN NOT NULL DEFAULT false;

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

  -- Continuous intents (e.g. a standing service) survive a completed trade.
  UPDATE intents SET status = 'fulfilled'
  WHERE id IN (
    SELECT gives_intent_id FROM trade_cycle_participants WHERE cycle_id = p_cycle
    UNION
    SELECT want_intent_id FROM trade_cycle_participants
    WHERE cycle_id = p_cycle AND want_intent_id IS NOT NULL
  ) AND is_continuous = false;

  RETURN jsonb_build_object('status', 'completed');
END;
$$;
