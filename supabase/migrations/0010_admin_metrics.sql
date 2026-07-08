-- ============================================================
-- Fase 13 — admin_metrics(): one round trip aggregates every
-- number the admin dashboard renders. Zero-filled daily (30d)
-- and monthly (12mo) series plus categorical breakdowns.
-- ============================================================

CREATE OR REPLACE FUNCTION admin_metrics() RETURNS jsonb
LANGUAGE sql STABLE AS $$
SELECT jsonb_build_object(
  'totals', jsonb_build_object(
    'users',            (SELECT count(*) FROM users),
    'users_new_30d',    (SELECT count(*) FROM users WHERE created_at > now() - interval '30 days'),
    'users_active_7d',  (SELECT count(*) FROM users WHERE last_seen > now() - interval '7 days'),
    'users_active_30d', (SELECT count(*) FROM users WHERE last_seen > now() - interval '30 days'),
    'users_telegram',   (SELECT count(*) FROM users WHERE telegram_id IS NOT NULL),
    'users_wallet',     (SELECT count(*) FROM users WHERE wallet IS NOT NULL),
    'intents',          (SELECT count(*) FROM intents),
    'intents_active',   (SELECT count(*) FROM intents WHERE status = 'active'),
    'intents_fulfilled',(SELECT count(*) FROM intents WHERE status = 'fulfilled'),
    'interest_marks',   (SELECT count(*) FROM interest_marks),
    'cycles',           (SELECT count(*) FROM trade_cycles),
    'cycles_completed', (SELECT count(*) FROM trade_cycles WHERE status = 'completed'),
    'payments',         (SELECT count(*) FROM payments),
    'payments_confirmed', (SELECT count(*) FROM payments WHERE status = 'confirmed'),
    'volume_fiat_confirmed', COALESCE((SELECT sum(amount_fiat) FROM payments WHERE status = 'confirmed'), 0),
    'notifications',    (SELECT count(*) FROM notifications),
    'notifications_telegram', (SELECT count(*) FROM notifications WHERE telegram_sent),
    'ai_actions_30d',   COALESCE((SELECT sum(count) FROM ai_usage WHERE day > current_date - 30), 0)
  ),
  'daily', (
    SELECT jsonb_agg(jsonb_build_object(
      'day', d.day, 'new_users', COALESCE(u.n, 0), 'new_intents', COALESCE(i.n, 0),
      'interest_marks', COALESCE(m.n, 0), 'payments', COALESCE(p.n, 0)
    ) ORDER BY d.day)
    FROM (SELECT generate_series(current_date - 29, current_date, '1 day')::date AS day) d
    LEFT JOIN (SELECT created_at::date AS day, count(*) n FROM users
               WHERE created_at > current_date - 30 GROUP BY 1) u USING (day)
    LEFT JOIN (SELECT created_at::date AS day, count(*) n FROM intents
               WHERE created_at > current_date - 30 GROUP BY 1) i USING (day)
    LEFT JOIN (SELECT created_at::date AS day, count(*) n FROM interest_marks
               WHERE created_at > current_date - 30 GROUP BY 1) m USING (day)
    LEFT JOIN (SELECT created_at::date AS day, count(*) n FROM payments
               WHERE created_at > current_date - 30 GROUP BY 1) p USING (day)
  ),
  'monthly', (
    SELECT jsonb_agg(jsonb_build_object(
      'month', to_char(mo.month, 'YYYY-MM'), 'new_users', COALESCE(u.n, 0),
      'new_intents', COALESCE(i.n, 0), 'payments_confirmed', COALESCE(p.n, 0),
      'volume_fiat', COALESCE(p.vol, 0)
    ) ORDER BY mo.month)
    FROM (SELECT generate_series(date_trunc('month', now()) - interval '11 months',
                                 date_trunc('month', now()), '1 month')::date AS month) mo
    LEFT JOIN (SELECT date_trunc('month', created_at)::date AS month, count(*) n
               FROM users GROUP BY 1) u USING (month)
    LEFT JOIN (SELECT date_trunc('month', created_at)::date AS month, count(*) n
               FROM intents GROUP BY 1) i USING (month)
    LEFT JOIN (SELECT date_trunc('month', created_at)::date AS month, count(*) n, sum(amount_fiat) vol
               FROM payments WHERE status = 'confirmed' GROUP BY 1) p USING (month)
  ),
  'intents_by_direction', (SELECT COALESCE(jsonb_object_agg(direction, n), '{}')
    FROM (SELECT direction, count(*) n FROM intents GROUP BY 1) t),
  'intents_by_kind', (SELECT COALESCE(jsonb_object_agg(COALESCE(kind, 'unset'), n), '{}')
    FROM (SELECT kind, count(*) n FROM intents GROUP BY 1) t),
  'intents_by_status', (SELECT COALESCE(jsonb_object_agg(status, n), '{}')
    FROM (SELECT status, count(*) n FROM intents GROUP BY 1) t),
  'intents_by_source', (SELECT COALESCE(jsonb_object_agg(source, n), '{}')
    FROM (SELECT source, count(*) n FROM intents GROUP BY 1) t),
  'top_categories', (SELECT COALESCE(jsonb_agg(jsonb_build_object('category', category, 'count', n) ORDER BY n DESC), '[]')
    FROM (SELECT category, count(*) n FROM intents WHERE category IS NOT NULL
          GROUP BY 1 ORDER BY n DESC LIMIT 10) t),
  'payments_by_status', (SELECT COALESCE(jsonb_object_agg(status, n), '{}')
    FROM (SELECT status, count(*) n FROM payments GROUP BY 1) t),
  'payments_by_token', (SELECT COALESCE(jsonb_object_agg(token, n), '{}')
    FROM (SELECT token, count(*) n FROM payments GROUP BY 1) t),
  'cycles_by_status', (SELECT COALESCE(jsonb_object_agg(status, n), '{}')
    FROM (SELECT status, count(*) n FROM trade_cycles GROUP BY 1) t),
  'cycles_by_hops', (SELECT COALESCE(jsonb_object_agg(hops::text, n), '{}')
    FROM (SELECT hops, count(*) n FROM trade_cycles GROUP BY 1) t),
  'ai_by_action', (SELECT COALESCE(jsonb_object_agg(action, n), '{}')
    FROM (SELECT action, sum(count) n FROM ai_usage GROUP BY 1) t),
  'recent_users', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', id, 'display_name', display_name, 'telegram_username', telegram_username,
      'has_wallet', wallet IS NOT NULL, 'created_at', created_at, 'last_seen', last_seen
    ) ORDER BY created_at DESC), '[]')
    FROM (SELECT * FROM users ORDER BY created_at DESC LIMIT 10) t),
  'recent_intents', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', id, 'title', title, 'direction', direction, 'kind', kind,
      'status', status, 'source', source, 'created_at', created_at
    ) ORDER BY created_at DESC), '[]')
    FROM (SELECT * FROM intents ORDER BY created_at DESC LIMIT 10) t),
  'recent_payments', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', id, 'amount_fiat', amount_fiat, 'token', token, 'status', status, 'created_at', created_at
    ) ORDER BY created_at DESC), '[]')
    FROM (SELECT * FROM payments ORDER BY created_at DESC LIMIT 10) t)
);
$$;
