-- Links a Telegram identity to an authenticated (Privy) account.
-- If a Telegram-only shadow account already owns this telegram_id
-- (created by opening the Mini App before linking on the web), the
-- shadow account is merged: all its data moves to the target account
-- and the shadow row is deleted. Runs atomically.
CREATE OR REPLACE FUNCTION link_telegram_account(
  p_user UUID, p_tg_id BIGINT, p_tg_username TEXT
) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_other users%ROWTYPE;
  v_merged BOOLEAN := false;
BEGIN
  PERFORM 1 FROM users WHERE id = p_user FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
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

    UPDATE users SET
      display_name = COALESCE(display_name, v_other.display_name),
      avatar_url = COALESCE(avatar_url, v_other.avatar_url)
      WHERE id = p_user;

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
