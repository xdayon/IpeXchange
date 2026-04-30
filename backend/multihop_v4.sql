-- ============================================================
-- IpêXchange — Multi-Hop Engine v5: 3-4-5 Hops + Value Balance
-- Replace find_trade_cycles with this version.
-- Supports cycles of 3, 4, or 5 participants.
-- Value balance: max 30% difference (ratio >= 0.70)
-- ============================================================

DROP FUNCTION IF EXISTS find_trade_cycles(TEXT, FLOAT);

CREATE OR REPLACE FUNCTION find_trade_cycles(
  target_session_id TEXT,
  match_threshold    FLOAT DEFAULT 0.65
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result         JSONB;
  value_threshold FLOAT := 0.70;
BEGIN

  -- ── Shared base CTEs ──────────────────────────────────────
  WITH

  user_offers AS (
    SELECT * FROM unified_tradeable_items
    WHERE owner_session_id = target_session_id
  ),

  -- HOP 1: A wants → B has
  h1 AS (
    SELECT
      d1.session_id        AS ua,
      u1.owner_session_id  AS ub,
      u1.id                AS ib_id,
      u1.name              AS ib_name,
      u1.price_fiat        AS pb,
      u1.owner_name        AS ub_name,
      u1.image_url         AS ub_avatar,
      u1.is_mock           AS ib_mock,
      u1.source_type       AS ib_src,
      u1.store_id          AS ib_store,
      (1-(d1.embedding<=>u1.embedding)) AS s1
    FROM demands d1
    JOIN unified_tradeable_items u1
      ON d1.embedding IS NOT NULL AND u1.embedding IS NOT NULL
      AND (1-(d1.embedding<=>u1.embedding)) > match_threshold
    WHERE d1.session_id = target_session_id
      AND u1.owner_session_id != target_session_id
  ),

  -- HOP 2: B wants → C has
  h2 AS (
    SELECT h1.*,
      u2.owner_session_id AS uc,
      u2.id   AS ic_id,   u2.name       AS ic_name,
      u2.price_fiat AS pc, u2.owner_name AS uc_name,
      u2.image_url  AS uc_avatar,
      u2.is_mock    AS ic_mock, u2.source_type AS ic_src,
      u2.store_id   AS ic_store,
      (1-(d2.embedding<=>u2.embedding)) AS s2
    FROM h1
    JOIN demands d2 ON d2.session_id = h1.ub
    JOIN unified_tradeable_items u2
      ON d2.embedding IS NOT NULL AND u2.embedding IS NOT NULL
      AND (1-(d2.embedding<=>u2.embedding)) > match_threshold
    WHERE u2.owner_session_id NOT IN (h1.ua, h1.ub)
  ),

  -- HOP 3: C wants → D has (or closes back to A for 3-hop)
  h3 AS (
    SELECT h2.*,
      u3.owner_session_id AS ud,
      u3.id   AS id_id,   u3.name       AS id_name,
      u3.price_fiat AS pd, u3.owner_name AS ud_name,
      u3.image_url  AS ud_avatar,
      u3.is_mock    AS id_mock, u3.source_type AS id_src,
      u3.store_id   AS id_store,
      (1-(d3.embedding<=>u3.embedding)) AS s3
    FROM h2
    JOIN demands d3 ON d3.session_id = h2.uc
    JOIN unified_tradeable_items u3
      ON d3.embedding IS NOT NULL AND u3.embedding IS NOT NULL
      AND (1-(d3.embedding<=>u3.embedding)) > match_threshold
    WHERE u3.owner_session_id NOT IN (h2.ua, h2.ub, h2.uc)
       OR u3.owner_session_id = h2.ua   -- allow cycle close at hop3
  ),

  -- HOP 4: D wants → E has (or closes back to A for 4-hop)
  h4 AS (
    SELECT h3.*,
      u4.owner_session_id AS ue,
      u4.id   AS ie_id,   u4.name       AS ie_name,
      u4.price_fiat AS pe, u4.owner_name AS ue_name,
      u4.image_url  AS ue_avatar,
      u4.is_mock    AS ie_mock, u4.source_type AS ie_src,
      u4.store_id   AS ie_store,
      (1-(d4.embedding<=>u4.embedding)) AS s4
    FROM h3
    JOIN demands d4 ON d4.session_id = h3.ud
    JOIN unified_tradeable_items u4
      ON d4.embedding IS NOT NULL AND u4.embedding IS NOT NULL
      AND (1-(d4.embedding<=>u4.embedding)) > match_threshold
    WHERE u4.owner_session_id NOT IN (h3.ua, h3.ub, h3.uc, h3.ud)
       OR u4.owner_session_id = h3.ua
  ),

  -- ── 3-HOP CYCLES (A→B→C→A) ──────────────────────────────
  cycles3 AS (
    SELECT
      h3.ua, h3.ub, h3.uc,
      h3.ib_name, h3.ic_name,
      h3.ub_name, h3.uc_name,
      h3.pb, h3.pc,
      h3.ub_avatar, h3.uc_avatar,
      h3.ib_mock, h3.ic_mock,
      h3.ib_src, h3.ic_src,
      h3.ib_store, h3.ic_store,
      h3.s1, h3.s2, h3.s3,
      uo.name AS ia_name, uo.price_fiat AS pa,
      uo.is_mock AS ia_mock, uo.source_type AS ia_src,
      3 AS hops,
      (h3.s1+h3.s2+h3.s3)/3.0 AS avg_sem,
      LEAST(
        CASE WHEN GREATEST(uo.price_fiat,h3.pb)>0 THEN LEAST(uo.price_fiat,h3.pb)/GREATEST(uo.price_fiat,h3.pb) ELSE 0 END,
        CASE WHEN GREATEST(uo.price_fiat,h3.pc)>0 THEN LEAST(uo.price_fiat,h3.pc)/GREATEST(uo.price_fiat,h3.pc) ELSE 0 END
      ) AS vr
    FROM h3
    JOIN user_offers uo ON uo.id = h3.id_id  -- h3.ud = ua (cycle closed)
    WHERE h3.ud = h3.ua AND uo.price_fiat > 0 AND h3.pb > 0 AND h3.pc > 0
  ),

  -- ── 4-HOP CYCLES (A→B→C→D→A) ─────────────────────────────
  cycles4 AS (
    SELECT
      h4.ua, h4.ub, h4.uc, h4.ud,
      h4.ib_name, h4.ic_name, h4.id_name,
      h4.ub_name, h4.uc_name, h4.ud_name,
      h4.pb, h4.pc, h4.pd,
      h4.ub_avatar, h4.uc_avatar, h4.ud_avatar,
      h4.ib_mock, h4.ic_mock, h4.id_mock,
      h4.ib_src, h4.ic_src, h4.id_src,
      h4.ib_store, h4.ic_store, h4.id_store,
      h4.s1, h4.s2, h4.s3, h4.s4,
      uo.name AS ia_name, uo.price_fiat AS pa,
      uo.is_mock AS ia_mock, uo.source_type AS ia_src,
      4 AS hops,
      (h4.s1+h4.s2+h4.s3+h4.s4)/4.0 AS avg_sem,
      LEAST(
        CASE WHEN GREATEST(uo.price_fiat,h4.pb)>0 THEN LEAST(uo.price_fiat,h4.pb)/GREATEST(uo.price_fiat,h4.pb) ELSE 0 END,
        CASE WHEN GREATEST(uo.price_fiat,h4.pc)>0 THEN LEAST(uo.price_fiat,h4.pc)/GREATEST(uo.price_fiat,h4.pc) ELSE 0 END,
        CASE WHEN GREATEST(uo.price_fiat,h4.pd)>0 THEN LEAST(uo.price_fiat,h4.pd)/GREATEST(uo.price_fiat,h4.pd) ELSE 0 END
      ) AS vr
    FROM h4
    JOIN user_offers uo ON uo.id = h4.ie_id
    WHERE h4.ue = h4.ua AND uo.price_fiat > 0 AND h4.pb > 0 AND h4.pc > 0 AND h4.pd > 0
  ),

  -- ── 5-HOP CYCLES (A→B→C→D→E→A) ──────────────────────────
  -- E wants → A has (final close)
  cycles5 AS (
    SELECT
      h4.ua, h4.ub, h4.uc, h4.ud, h4.ue,
      h4.ib_name, h4.ic_name, h4.id_name, h4.ie_name,
      h4.ub_name, h4.uc_name, h4.ud_name, h4.ue_name,
      h4.pb, h4.pc, h4.pd, h4.pe,
      h4.ub_avatar, h4.uc_avatar, h4.ud_avatar, h4.ue_avatar,
      h4.ib_mock, h4.ic_mock, h4.id_mock, h4.ie_mock,
      h4.ib_src, h4.ic_src, h4.id_src, h4.ie_src,
      h4.ib_store, h4.ic_store, h4.id_store, h4.ie_store,
      h4.s1, h4.s2, h4.s3, h4.s4,
      uo_a.name AS ia_name, uo_a.price_fiat AS pa,
      uo_a.is_mock AS ia_mock, uo_a.source_type AS ia_src,
      (1-(d5.embedding<=>uo_a.embedding)) AS s5,
      5 AS hops,
      LEAST(
        CASE WHEN GREATEST(uo_a.price_fiat,h4.pb)>0 THEN LEAST(uo_a.price_fiat,h4.pb)/GREATEST(uo_a.price_fiat,h4.pb) ELSE 0 END,
        CASE WHEN GREATEST(uo_a.price_fiat,h4.pc)>0 THEN LEAST(uo_a.price_fiat,h4.pc)/GREATEST(uo_a.price_fiat,h4.pc) ELSE 0 END,
        CASE WHEN GREATEST(uo_a.price_fiat,h4.pd)>0 THEN LEAST(uo_a.price_fiat,h4.pd)/GREATEST(uo_a.price_fiat,h4.pd) ELSE 0 END,
        CASE WHEN GREATEST(uo_a.price_fiat,h4.pe)>0 THEN LEAST(uo_a.price_fiat,h4.pe)/GREATEST(uo_a.price_fiat,h4.pe) ELSE 0 END
      ) AS vr
    FROM h4
    JOIN demands d5 ON d5.session_id = h4.ue
    JOIN user_offers uo_a
      ON d5.embedding IS NOT NULL AND uo_a.embedding IS NOT NULL
      AND (1-(d5.embedding<=>uo_a.embedding)) > match_threshold
    WHERE h4.ue != h4.ua
      AND uo_a.price_fiat > 0 AND h4.pb > 0 AND h4.pc > 0 AND h4.pd > 0 AND h4.pe > 0
  ),

  -- ── Union all cycle sizes, score, and rank ─────────────────
  all_cycles AS (

    -- 3-hop
    SELECT hops, avg_sem, vr,
      md5(ua||ub||uc) AS cycle_key,
      jsonb_build_array(
        jsonb_build_object('user','You','item',ia_name,'price',pa,'rep',85,'is_mock',ia_mock,'sourceType',ia_src,'avatar',null),
        jsonb_build_object('user',COALESCE(ub_name,ub),'item',ib_name,'price',pb,'rep',92,'is_mock',ib_mock,'sourceType',ib_src,'storeId',ib_store,'avatar',ub_avatar),
        jsonb_build_object('user',COALESCE(uc_name,uc),'item',ic_name,'price',pc,'rep',98,'is_mock',ic_mock,'sourceType',ic_src,'storeId',ic_store,'avatar',uc_avatar)
      ) AS nodes
    FROM cycles3
    WHERE vr >= value_threshold

    UNION ALL

    -- 4-hop
    SELECT hops, avg_sem, vr,
      md5(ua||ub||uc||ud) AS cycle_key,
      jsonb_build_array(
        jsonb_build_object('user','You','item',ia_name,'price',pa,'rep',85,'is_mock',ia_mock,'sourceType',ia_src,'avatar',null),
        jsonb_build_object('user',COALESCE(ub_name,ub),'item',ib_name,'price',pb,'rep',92,'is_mock',ib_mock,'sourceType',ib_src,'storeId',ib_store,'avatar',ub_avatar),
        jsonb_build_object('user',COALESCE(uc_name,uc),'item',ic_name,'price',pc,'rep',88,'is_mock',ic_mock,'sourceType',ic_src,'storeId',ic_store,'avatar',uc_avatar),
        jsonb_build_object('user',COALESCE(ud_name,ud),'item',id_name,'price',pd,'rep',95,'is_mock',id_mock,'sourceType',id_src,'storeId',id_store,'avatar',ud_avatar)
      ) AS nodes
    FROM cycles4
    WHERE vr >= value_threshold

    UNION ALL

    -- 5-hop
    SELECT hops, (s1+s2+s3+s4+s5)/5.0 AS avg_sem, vr,
      md5(ua||ub||uc||ud||ue) AS cycle_key,
      jsonb_build_array(
        jsonb_build_object('user','You','item',ia_name,'price',pa,'rep',85,'is_mock',ia_mock,'sourceType',ia_src,'avatar',null),
        jsonb_build_object('user',COALESCE(ub_name,ub),'item',ib_name,'price',pb,'rep',92,'is_mock',ib_mock,'sourceType',ib_src,'storeId',ib_store,'avatar',ub_avatar),
        jsonb_build_object('user',COALESCE(uc_name,uc),'item',ic_name,'price',pc,'rep',88,'is_mock',ic_mock,'sourceType',ic_src,'storeId',ic_store,'avatar',uc_avatar),
        jsonb_build_object('user',COALESCE(ud_name,ud),'item',id_name,'price',pd,'rep',95,'is_mock',id_mock,'sourceType',id_src,'storeId',id_store,'avatar',ud_avatar),
        jsonb_build_object('user',COALESCE(ue_name,ue),'item',ie_name,'price',pe,'rep',91,'is_mock',ie_mock,'sourceType',ie_src,'storeId',ie_store,'avatar',ue_avatar)
      ) AS nodes
    FROM cycles5
    WHERE vr >= value_threshold
  )

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',         'cycle-' || cycle_key,
      'hops',       hops,
      'matchScore', ROUND(((avg_sem*0.6 + vr*0.4)*100)::numeric, 1),
      'valueRatio', ROUND((vr*100)::numeric, 1),
      'nodes',      nodes
    )
    ORDER BY (avg_sem*0.6 + vr*0.4) DESC
  ) INTO result
  FROM (SELECT * FROM all_cycles LIMIT 6) ranked;

  -- ── DEMO FALLBACK ──────────────────────────────────────────
  -- 4 cycles: one 3-hop, one 4-hop, one 5-hop, one 4-hop
  IF result IS NULL OR jsonb_array_length(result) = 0 THEN
    SELECT jsonb_agg(c) INTO result FROM (

      -- 3-hop: Bike ↔ Web Dev ↔ Woodworking (all within 30% of $850 anchor)
      -- vr = min(800/850, 720/850) = min(0.941, 0.847) = 0.847 → 84.7%
      SELECT jsonb_build_object(
        'id','cycle-demo-1','hops',3,'matchScore',92.0,'valueRatio',84.7,
        'nodes', jsonb_build_array(
          jsonb_build_object('user','You','item','Electric Bike','price',850,'rep',85,'is_mock',true,'sourceType','user_listing','avatar',null),
          jsonb_build_object('user','Bia Tech','item','Web Dev Consulting (10h)','price',800,'rep',92,'is_mock',true,'sourceType','user_listing','avatar','https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=60&h=60'),
          jsonb_build_object('user','WoodCraft','item','Woodworking Workshop (6 lessons)','price',720,'rep',79,'is_mock',true,'sourceType','user_listing','avatar','https://images.unsplash.com/photo-1540314227222-2daee298072c?auto=format&fit=crop&q=80&w=60&h=60')
        )
      ) AS c

      UNION ALL

      -- 4-hop: MacBook ↔ Brand Identity ↔ Photography Full Day ↔ Adventure Tour
      -- anchor $1200 | vr = min(1050/1200, 980/1200, 1100/1200) = min(0.875, 0.817, 0.917) = 0.817 → 81.7%
      SELECT jsonb_build_object(
        'id','cycle-demo-2','hops',4,'matchScore',88.8,'valueRatio',81.7,
        'nodes', jsonb_build_array(
          jsonb_build_object('user','You','item','MacBook Pro M1 14"','price',1200,'rep',85,'is_mock',true,'sourceType','user_listing','avatar',null),
          jsonb_build_object('user','Studio Pixel','item','Full Brand Identity Package','price',1050,'rep',89,'is_mock',true,'sourceType','store_product','avatar','https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=60&h=60'),
          jsonb_build_object('user','Luna Foto','item','Photography Full Day Session','price',980,'rep',94,'is_mock',true,'sourceType','user_listing','avatar','https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&q=80&w=60&h=60'),
          jsonb_build_object('user','TrailCo','item','Adventure Tour + Gear Rental','price',1100,'rep',88,'is_mock',true,'sourceType','user_listing','avatar','https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=60&h=60')
        )
      )

      UNION ALL

      -- 5-hop: Drone ↔ EV Review ↔ Permaculture Day ↔ Wellness Package ↔ No-Code Sprint
      -- anchor $550 | vr = min(480/550, 500/550, 520/550, 450/550) = min(0.873, 0.909, 0.945, 0.818) = 0.818 → 81.8%
      SELECT jsonb_build_object(
        'id','cycle-demo-3','hops',5,'matchScore',86.3,'valueRatio',81.8,
        'nodes', jsonb_build_array(
          jsonb_build_object('user','You','item','DJI Mini 4 Pro Drone','price',550,'rep',85,'is_mock',true,'sourceType','user_listing','avatar',null),
          jsonb_build_object('user','Ipê City Motors','item','Full Electrical Review','price',480,'rep',94,'is_mock',true,'sourceType','store_product','avatar','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=60&h=60'),
          jsonb_build_object('user','Green Roots','item','Permaculture + Urban Farm Day','price',500,'rep',91,'is_mock',true,'sourceType','user_listing','avatar','https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=60&h=60'),
          jsonb_build_object('user','Marina H.','item','Wellness & Massage Package','price',520,'rep',97,'is_mock',true,'sourceType','user_listing','avatar','https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=60&h=60'),
          jsonb_build_object('user','Code Lab','item','No-Code App Sprint (20h)','price',450,'rep',93,'is_mock',true,'sourceType','user_listing','avatar','https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=60&h=60')
        )
      )

      UNION ALL

      -- 4-hop: Road Bike ↔ Physiotherapy ↔ Personal Training ↔ Sourdough + Coffee
      -- anchor $680 | vr = min(600/680, 620/680, 580/680) = min(0.882, 0.912, 0.853) = 0.853 → 85.3%
      SELECT jsonb_build_object(
        'id','cycle-demo-4','hops',4,'matchScore',87.1,'valueRatio',85.3,
        'nodes', jsonb_build_array(
          jsonb_build_object('user','You','item','Road Bike (Cannondale)','price',680,'rep',85,'is_mock',true,'sourceType','user_listing','avatar',null),
          jsonb_build_object('user','Ipê Health Clinic','item','Physiotherapy (6 sessions)','price',600,'rep',100,'is_mock',true,'sourceType','store_product','avatar','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=60&h=60'),
          jsonb_build_object('user','FitCoach','item','Personal Training (10 sessions)','price',620,'rep',88,'is_mock',true,'sourceType','user_listing','avatar','https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=60&h=60'),
          jsonb_build_object('user','Bread & Co','item','Sourdough + Coffee Bundle','price',580,'rep',98,'is_mock',true,'sourceType','store_product','avatar','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=60&h=60')
        )
      )

    ) cycles(c);
  END IF;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
