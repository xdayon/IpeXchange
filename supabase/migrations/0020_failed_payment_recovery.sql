-- Confirm a previously failed payment only after the Worker has reverified its
-- immutable transaction hash against the original quote and buyer wallet.
CREATE OR REPLACE FUNCTION recover_failed_payment(
  p_payment UUID, p_buyer UUID, p_from_wallet TEXT
) RETURNS JSONB LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_intent intents%ROWTYPE;
  v_result payments%ROWTYPE;
BEGIN
  SELECT * INTO v_payment FROM payments WHERE id = p_payment FOR UPDATE;
  IF NOT FOUND OR v_payment.buyer_user_id <> p_buyer THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF v_payment.status = 'confirmed' THEN
    RETURN to_jsonb(v_payment) || jsonb_build_object('already_settled', true);
  END IF;
  IF v_payment.status <> 'failed' OR v_payment.tx_hash IS NULL
      OR v_payment.from_wallet IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'not_recoverable', 'status', v_payment.status);
  END IF;
  IF p_from_wallet IS NULL OR p_from_wallet !~* '^0x[0-9a-f]{40}$' THEN
    RETURN jsonb_build_object('error', 'invalid_sender');
  END IF;

  SELECT * INTO v_intent FROM intents WHERE id = v_payment.intent_id FOR UPDATE;
  IF NOT FOUND OR v_intent.status <> 'active' THEN
    RETURN jsonb_build_object('error', 'intent_unavailable');
  END IF;

  INSERT INTO intent_reservations (intent_id, payment_id, expires_at)
  VALUES (v_intent.id, v_payment.id, now() + interval '1 minute')
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'intent_unavailable');
  END IF;

  UPDATE payments
  SET status = 'confirmed', from_wallet = lower(p_from_wallet), confirmed_at = now()
  WHERE id = p_payment RETURNING * INTO v_result;
  UPDATE intents
  SET status = CASE WHEN is_continuous THEN 'active' ELSE 'fulfilled' END
  WHERE id = v_intent.id;
  DELETE FROM intent_reservations WHERE payment_id = p_payment;

  RETURN to_jsonb(v_result)
    || jsonb_build_object('already_settled', false, 'recovered', true);
END;
$$;
