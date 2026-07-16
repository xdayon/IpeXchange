-- Release unanswered cycle suggestions after seven days so valid rings can be
-- suggested again. Accepted cycles remain open until participants complete
-- them or support resolves them explicitly.
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

  WITH stale AS (
    SELECT id
    FROM trade_cycles
    WHERE status IN ('suggested', 'pending_acceptance')
      AND updated_at <= now() - p_max_age
    FOR UPDATE SKIP LOCKED
  ), expired AS (
    UPDATE trade_cycles cycle
    SET status = 'expired'
    FROM stale
    WHERE cycle.id = stale.id
    RETURNING cycle.id
  ), released AS (
    DELETE FROM intent_reservations reservation
    USING expired
    WHERE reservation.cycle_id = expired.id
    RETURNING reservation.intent_id
  ), activated AS (
    UPDATE intents intent
    SET status = 'active'
    WHERE intent.id IN (SELECT intent_id FROM released)
      AND intent.status = 'in_cycle'
    RETURNING intent.id
  )
  SELECT count(*) INTO v_expired FROM expired;

  RETURN v_expired;
END;
$$;

-- Pin every function left by the migration chain. This prevents an altered
-- caller search_path from shadowing tables, operators, or helper functions.
ALTER FUNCTION set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION match_intents(VECTOR, TEXT, TEXT, TEXT, UUID, FLOAT, INT, INT)
  SET search_path = public, pg_temp;
ALTER FUNCTION find_intent_cycles_untyped(UUID, FLOAT, FLOAT, INT)
  SET search_path = public, pg_temp;
ALTER FUNCTION find_intent_cycles_kind_guard(UUID, FLOAT, FLOAT, INT)
  SET search_path = public, pg_temp;
ALTER FUNCTION find_intent_cycles(UUID, FLOAT, FLOAT, INT)
  SET search_path = public, pg_temp;
ALTER FUNCTION increment_ai_usage(UUID, TEXT, INT)
  SET search_path = public, pg_temp;
ALTER FUNCTION increment_ai_usage(UUID, TEXT, INT, INT)
  SET search_path = public, pg_temp;
ALTER FUNCTION persist_intent_cycle(JSONB) SET search_path = public, pg_temp;
ALTER FUNCTION respond_to_cycle(UUID, UUID, BOOLEAN) SET search_path = public, pg_temp;
ALTER FUNCTION confirm_cycle_step(UUID, UUID, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION link_telegram_account(UUID, BIGINT, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION admin_metrics() SET search_path = public, pg_temp;
ALTER FUNCTION nexum_market_signal(VECTOR, UUID, TEXT, TEXT)
  SET search_path = public, pg_temp;
ALTER FUNCTION nexum_funnel(TIMESTAMPTZ) SET search_path = public, pg_temp;
ALTER FUNCTION expire_payment_reservations() SET search_path = public, pg_temp;
ALTER FUNCTION prepare_payment(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION cancel_prepared_payment(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION settle_payment(UUID, BOOLEAN, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION claim_copilot_draft_publish(UUID, UUID, INT)
  SET search_path = public, pg_temp;
ALTER FUNCTION finalize_copilot_draft_publish(UUID, UUID, JSONB)
  SET search_path = public, pg_temp;
ALTER FUNCTION release_copilot_draft_publish(UUID, UUID)
  SET search_path = public, pg_temp;
ALTER FUNCTION recover_failed_payment(UUID, UUID, TEXT)
  SET search_path = public, pg_temp;
