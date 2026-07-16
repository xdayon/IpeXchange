-- Daily product limits follow the marketplace's local calendar day.
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user UUID, p_action TEXT, p_limit INT
) RETURNS BOOLEAN LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO ai_usage (user_id, day, action, count)
  VALUES (p_user, (now() AT TIME ZONE 'America/Sao_Paulo')::date, p_action, 1)
  ON CONFLICT (user_id, day, action)
  DO UPDATE SET count = ai_usage.count + 1
  RETURNING count <= p_limit;
$$;
