-- Keep Telegram shadow-account merges compatible with user references added
-- after the original link_telegram_account function.
CREATE OR REPLACE FUNCTION link_telegram_account(
  p_user UUID, p_tg_id BIGINT, p_tg_username TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
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

    UPDATE trade_cycle_participants SET user_id = p_user WHERE user_id = v_other.id;
    UPDATE notifications SET user_id = p_user WHERE user_id = v_other.id;

    INSERT INTO ai_usage (user_id, day, action, count)
      SELECT p_user, day, action, count FROM ai_usage WHERE user_id = v_other.id
      ON CONFLICT (user_id, day, action)
      DO UPDATE SET count = ai_usage.count + EXCLUDED.count;
    DELETE FROM ai_usage WHERE user_id = v_other.id;

    -- These user references were introduced after migration 0005.
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
