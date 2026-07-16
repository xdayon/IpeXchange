-- Keep semantic search behavior aligned with the public market filters.
DROP FUNCTION IF EXISTS match_intents(VECTOR, TEXT, FLOAT, INT);

CREATE FUNCTION match_intents(
  query_embedding VECTOR(768),
  p_direction TEXT DEFAULT NULL,
  p_kind TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_exclude_user UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.58,
  match_count INT DEFAULT 20,
  match_offset INT DEFAULT 0
) RETURNS TABLE (
  id UUID, user_id UUID, direction TEXT, kind TEXT, title TEXT, description TEXT,
  category TEXT, price_fiat NUMERIC, image_url TEXT, created_at TIMESTAMPTZ,
  similarity FLOAT
) LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT i.id, i.user_id, i.direction, i.kind, i.title, i.description,
         i.category, i.price_fiat, i.image_url, i.created_at,
         1 - (i.embedding <=> query_embedding) AS similarity
  FROM intents i
  WHERE (p_exclude_user IS NULL OR i.user_id <> p_exclude_user)
    AND (p_direction IS NULL OR i.direction = p_direction)
    AND (p_kind IS NULL OR i.kind = p_kind)
    AND (p_category IS NULL OR i.category = p_category)
    AND i.status = 'active'
    AND i.embedding IS NOT NULL
    AND (i.embedding <=> query_embedding) < (1 - match_threshold)
  ORDER BY i.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 60)
  OFFSET GREATEST(match_offset, 0);
$$;
