-- ============================================================
-- IpêXchange — Rich Mock Data Seed (Safe to re-run)
-- Run this in Supabase SQL Editor to populate the city with
-- diverse listings across all categories.
-- ON CONFLICT (mock_key) DO NOTHING means it's idempotent.
-- ============================================================

-- ─── Extra Sessions ───────────────────────────────────────────────────────────
INSERT INTO sessions (id) VALUES
  ('test-session-id'),
  ('bia-tech-id'),
  ('bread-co-id'),
  ('luna-photo-id'),
  ('fitcoach-id'),
  ('sound-lab-id'),
  ('green-roots-id'),
  ('code-lab-id'),
  ('ipe-farm-id'),
  ('marina-h-id'),
  ('trailco-id'),
  ('studio-pixel-id'),
  ('balance-studio-id'),
  ('inner-spaces-id'),
  ('skyview-lab-id'),
  ('community-id')
ON CONFLICT DO NOTHING;

-- ─── Products ────────────────────────────────────────────────────────────────
INSERT INTO listings (session_id, title, description, category, condition, price_fiat, accepts_trade, trade_wants, provider_name, image_url, active, ai_generated, is_mock, mock_key) VALUES

  -- Existing
  ('test-session-id', 'Electric Bike', 'Urban electric bike in great condition, perfect for daily mobility. 48V battery, 25km range, hydraulic brakes.', 'Products', 'good', 850, true, 'Web design or development work', 'Alex M.', 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'electric-bike'),
  ('test-session-id', 'MacBook Pro M1 14"', 'MacBook Pro M1 14-inch, 16GB RAM, 512GB SSD. Used 1 year. Battery at 92%. Excellent condition. Includes original charger.', 'Products', 'like_new', 1200, false, null, 'Alex M.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'macbook-pro-m1-14'),
  ('ipe-farm-id', 'Bracatinga Honey 500g', '100% pure Bracatinga honeydew, hand-harvested from our local sanctuary. Cold-extracted, no additives.', 'Products', 'new', 12, true, 'Seeds, plants, or organic goods', 'Ipê Farm', 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'bracatinga-honey-500g'),
  ('bread-co-id', 'Artisan Sourdough Subscription', 'Fresh sourdough delivered weekly for a month. 100% natural fermentation, no additives. 4 loaves total.', 'Products', 'new', 45, true, 'Fresh produce or fermented foods', 'Bread & Co', 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'artisan-sourdough-subscription'),

  -- New Products
  ('skyview-lab-id', 'DJI Mini 4 Pro Drone', 'DJI Mini 4 Pro with 2 batteries and carrying case. 4K/60fps, 34min flight time. Less than 10 flights.', 'Products', 'like_new', 550, true, 'Photography gear or tech equipment', 'SkyView Lab', 'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'dji-mini-4-pro-drone'),
  ('trailco-id', 'Touring Kayak + Gear', 'Single touring kayak 4.2m with paddle, life vest and dry bag. Great for coastal exploration. Ideal trade for fitness equipment.', 'Products', 'good', 400, true, 'Mountain bike or fitness equipment', 'TrailCo', 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'touring-kayak-gear'),
  ('fitcoach-id', 'Road Bike (Cannondale)', 'Cannondale CAAD12 road bike, size M, full Shimano 105 groupset. Recently serviced, new tires and chain.', 'Products', 'good', 680, true, 'Yoga or wellness sessions', 'FitCoach', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'road-bike-cannondale'),
  ('green-roots-id', 'Solar Panel Kit 200W', 'Complete off-grid solar kit: 200W panel, 20A charge controller, cables and mounting brackets. Perfect for van or tiny house.', 'Products', 'new', 320, true, 'Construction materials or tools', 'Green Roots', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'solar-panel-kit-200w'),
  ('community-id', 'La Marzocco Espresso Machine', 'La Marzocco Linea Mini — the gold standard for home espresso. Single group, recently serviced. Includes grinder.', 'Products', 'good', 2800, false, null, 'Café Ipê', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'la-marzocco-espresso-machine'),
  ('ipe-farm-id', 'Organic Seed Pack (30 varieties)', 'Curated selection of 30 heirloom vegetable and herb seeds, all open-pollinated and organic. Grown at our permaculture site.', 'Products', 'new', 25, true, 'Fermented foods or kombucha', 'Ipê Farm', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'organic-seed-pack-30-varieties'),
  ('studio-pixel-id', 'iPad Pro M2 12.9"', 'iPad Pro M2 12.9" with Apple Pencil 2 and Magic Keyboard. Perfect for design, illustration or note-taking. 256GB WiFi.', 'Products', 'like_new', 950, true, 'Design work or creative services', 'Studio Pixel', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'ipad-pro-m2-12-9'),
  ('luna-photo-id', 'Film Camera Kit (Pentax K1000)', 'Classic Pentax K1000 fully manual camera with 50mm f/2 lens and 3 rolls of Kodak Gold 200. Fully functional, just serviced.', 'Products', 'good', 180, true, 'Photography session or prints', 'Luna Foto', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'film-camera-kit-pentax-k1000'),
  ('community-id', 'Electric Standing Desk', 'Motorized standing desk, 160x80cm, dual-motor, adjustable height 65-130cm. Excellent for home office. Walnut top.', 'Products', 'like_new', 380, true, 'Ergonomic chair or office setup help', 'Ipê Workspace', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'electric-standing-desk'),
  ('community-id', 'Fermentation Starter Kit', 'Complete kit for making kombucha, kefir and sourdough. Includes SCOBY, grains, jar, airlock and full guide.', 'Products', 'new', 45, true, 'Organic produce or cooking class', 'Ferment Lab', 'https://images.unsplash.com/photo-1601984843624-f5b5f1069f48?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'fermentation-starter-kit')

ON CONFLICT (mock_key) DO NOTHING;

-- ─── Services ─────────────────────────────────────────────────────────────────
INSERT INTO listings (session_id, title, description, category, price_fiat, accepts_trade, trade_wants, provider_name, image_url, active, ai_generated, is_mock, mock_key) VALUES

  -- Existing
  ('bia-tech-id', 'Web Development Consulting', '10h package of Web Design and Development consulting. React, Next.js, Node.js. Portfolio available.', 'Services', 500, true, 'Electronic equipment or quality food', 'Bia Tech', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'web-development-consulting'),
  (NULL, 'Yoga at the Park', 'Morning yoga sessions at Central Park. All levels welcome. Vinyasa + Yin combo. 5-class package.', 'Services', 75, false, null, 'FitCity', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'yoga-at-the-park'),
  (NULL, 'Legal Advice: DAO & Web3', 'Legal consulting specialized in DAOs, smart contracts and tokenization. First session free. 2h package.', 'Services', 200, true, 'Tech services or design work', 'Ipê Law', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'legal-advice-dao-web3'),

  -- New Services
  ('marina-h-id', 'Reiki & Energy Healing', 'Full Reiki session (60 min) for energy balancing, stress relief and inner alignment. Peaceful space with aromatherapy and sound bowl.', 'Services', 60, true, 'Yoga classes or organic food', 'Marina H.', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'reiki-energy-healing'),
  ('fitcoach-id', 'Personal Training (5 sessions)', 'Customized 5-session personal training program. Strength, mobility and conditioning. All fitness levels. Outdoor or indoor.', 'Services', 200, true, 'Nutrition coaching or supplements', 'FitCoach', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'personal-training-5-sessions'),
  ('studio-pixel-id', 'Graphic Design & Branding', 'Complete visual identity: logo, color palette, typography, social media kit. 2 revision rounds included. Delivery in 7 days.', 'Services', 350, true, 'Web development or photography', 'Studio Pixel', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'graphic-design-branding'),
  ('green-roots-id', 'Permaculture Consultation', 'On-site permaculture consultation for your garden or land. Zone mapping, plant guild design, water management. 3h visit.', 'Services', 120, true, 'Seeds, tools or organic inputs', 'Green Roots', 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'permaculture-consultation'),
  ('luna-photo-id', 'Photography & Video (Half Day)', 'Professional photography and video for events, portraits, products or architecture. 4-hour session, 50 edited photos + 1 short video.', 'Services', 480, true, 'Design work or social media management', 'Luna Foto', 'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'photography-video-half-day'),
  ('balance-studio-id', 'Acupuncture Session', 'Traditional acupuncture session (60 min) for pain relief, stress, sleep improvement or immunity boost. Licensed practitioner with 12 years of experience.', 'Services', 85, true, 'Massage or sound healing session', 'Balance Studio', 'https://images.unsplash.com/photo-1554244933-d876deb6b2ff?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'acupuncture-session'),
  ('community-id', 'Home Repair & Handyman', 'General home repairs: plumbing, electrical, painting, furniture assembly, door locks. Hourly rate. Same-day availability most days.', 'Services', 55, false, null, 'FixIt City', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'home-repair-handyman'),
  ('community-id', 'Nutritional Coaching (4 weeks)', '4-week personalized nutrition program. Initial assessment, meal plan, weekly check-ins and adjustment. Online or in-person.', 'Services', 160, true, 'Fitness coaching or wellness sessions', 'NutriCity', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'nutritional-coaching-4-weeks'),
  ('community-id', 'Massage Therapy (Deep Tissue)', 'Professional deep tissue massage, 75 minutes. Tension release, athletic recovery or relaxation. Home visits available in Ipê City.', 'Services', 90, true, 'Yoga, acupuncture or healing sessions', 'BodyWork Ipê', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'massage-therapy-deep-tissue')

ON CONFLICT (mock_key) DO NOTHING;

-- ─── Knowledge ────────────────────────────────────────────────────────────────
INSERT INTO listings (session_id, title, description, category, price_fiat, accepts_trade, trade_wants, provider_name, image_url, active, ai_generated, is_mock, mock_key) VALUES

  ('code-lab-id', 'Python & AI Workshop (2 days)', 'Hands-on 2-day workshop: Python fundamentals → AI/ML basics → building your first model. Small group (max 8 people). All materials included.', 'Knowledge', 120, true, 'Design, photography or content creation', 'Code Lab', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'python-ai-workshop-2-days'),
  ('community-id', 'Web3 & Crypto Fundamentals', 'Learn the essentials: wallets, DeFi, NFTs, DAOs and the Ipê ecosystem. 3 online sessions of 90 min. Perfect for newcomers to crypto.', 'Knowledge', 75, true, 'Tech consulting or app development', 'Crypto Club', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'web3-crypto-fundamentals'),
  ('bread-co-id', 'Sourdough Baking Masterclass', 'Learn to make your own sourdough starter and bake bakery-quality bread at home. 4-hour hands-on session. All ingredients provided. Take your starter home.', 'Knowledge', 55, true, 'Fresh produce or cooking equipment', 'Bread & Co', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'sourdough-baking-masterclass'),
  ('inner-spaces-id', 'Meditation & Mindfulness (8 weeks)', '8-week structured mindfulness program. Daily practices, guided meditations, group sessions and 1:1 check-ins. MBSR-based curriculum.', 'Knowledge', 180, true, 'Yoga, sound healing or retreat access', 'Inner Spaces', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'meditation-mindfulness-8-weeks'),
  ('green-roots-id', 'Urban Farming Workshop (Weekend)', 'Weekend intensive: soil science, composting, raised beds, vertical gardens, seed saving. Includes take-home seedling kit and resources.', 'Knowledge', 85, true, 'Tools, soil or organic inputs', 'Green Roots', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'urban-farming-workshop-weekend'),
  ('sound-lab-id', 'Sound Healing Journey (Group)', 'Group sound bath with crystal bowls, Tibetan bowls, gongs and chimes. 75-minute journey for deep relaxation and nervous system reset. Max 12 people.', 'Knowledge', 45, true, 'Yoga, meditation or breathwork class', 'Sound Lab', 'https://images.unsplash.com/photo-1544783985-0af069aecd5b?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'sound-healing-journey-group'),
  ('community-id', 'Spanish Conversation Club', 'Weekly Spanish conversation circles for intermediate speakers. Casual, practical, fun. 4 sessions per month. Native speaker facilitator.', 'Knowledge', 40, true, 'Language exchange or cultural events', 'Lingua Hub', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'spanish-conversation-club'),
  ('luna-photo-id', 'Phone Photography Masterclass', '3-hour workshop on how to take stunning photos with your smartphone. Composition, lighting, editing apps. Small group, lots of practice.', 'Knowledge', 60, true, 'Design course or creative workshop', 'Luna Foto', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'phone-photography-masterclass'),
  ('code-lab-id', 'No-Code App Building (Bubble/Webflow)', 'Build a real web app without code using Bubble and Webflow. 1-day workshop, you leave with a working MVP. Beginner-friendly.', 'Knowledge', 95, true, 'Tech mentoring or product strategy', 'Code Lab', 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'no-code-app-building-bubble-webflow')

ON CONFLICT (mock_key) DO NOTHING;

-- ─── Donations ────────────────────────────────────────────────────────────────
INSERT INTO listings (session_id, title, description, category, price_fiat, accepts_trade, provider_name, image_url, active, ai_generated, is_mock, mock_key) VALUES

  ('community-id', 'Box of Books (Mixed genres)', 'Curated selection of 20 books: fiction, philosophy, science, self-development. Excellent condition. Pick up at Ipê City Hub.', 'Donations', 0, false, 'Book Exchange', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'box-of-books-mixed-genres'),
  ('community-id', 'Baby Clothes (0–12 months)', 'Full set of baby clothes, 0 to 12 months. Clean, washed, organized by size. Mix of brands. Passing forward with love.', 'Donations', 0, false, 'Family Circle', 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'baby-clothes-0-12-months'),
  ('green-roots-id', 'Garden Tool Collection', 'Set of 8 garden tools: trowels, pruners, fork, hoe, gloves. Used but in good working condition. For anyone starting a garden.', 'Donations', 0, false, 'Ipê Farm', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'garden-tool-collection'),
  ('community-id', 'Weekly Community Lunch', 'Every Sunday we cook a large plant-based meal and share. Free for all Ipê City residents. Bring a dish to contribute if you can.', 'Donations', 0, false, 'Community Kitchen', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'weekly-community-lunch'),
  ('community-id', 'Leftover Building Materials', 'Assorted construction and renovation materials: tiles, wood boards, paint cans, screws, brackets. Free for community projects.', 'Donations', 0, false, 'Build Together', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'leftover-building-materials'),
  ('inner-spaces-id', 'Free Guided Meditation (Weekly)', 'Free 30-min guided meditation every Tuesday morning at the park. Suitable for all levels. No sign-up required.', 'Donations', 0, false, 'Inner Spaces', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400&h=300', true, false, true, 'free-guided-meditation-weekly')

ON CONFLICT (mock_key) DO NOTHING;


-- ─── Multi-hop demands for new cycles ─────────────────────────────────────────
-- These pair with the hardcoded cycles in find_trade_cycles fallback
INSERT INTO demands (session_id, description, category, accepts_trade, is_mock) VALUES
  ('test-session-id',    'Looking for web design and development consulting',  'Services', true, true),
  ('bia-tech-id',        'I want fresh artisan sourdough bread',               'Products', true, true),
  ('bread-co-id',        'Need an electric bike for deliveries',               'Products', true, true),
  ('luna-photo-id',      'I want graphic design for my portfolio',             'Services', true, true),
  ('studio-pixel-id',    'Looking for a kayak to explore the coast',           'Products', true, true),
  ('trailco-id',         'I want photography for my brand',                    'Services', true, true),
  ('marina-h-id',        'Looking for Python and AI training',                 'Knowledge', true, true),
  ('code-lab-id',        'I want a sound healing session',                     'Knowledge', true, true),
  ('sound-lab-id',       'I want reiki and energy healing',                    'Services', true, true),
  ('fitcoach-id',        'I want a no-code app building workshop',             'Knowledge', true, true),
  ('inner-spaces-id',    'I want personal training and fitness coaching',      'Services', true, true),
  ('code-lab-id',        'I need a MacBook for development work',              'Products', true, true)
ON CONFLICT DO NOTHING;


-- ─── Update find_trade_cycles to return 4 diverse demo cycles ─────────────────
-- (Replace the old function entirely)
CREATE OR REPLACE FUNCTION find_trade_cycles(
  target_session_id TEXT,
  match_threshold FLOAT DEFAULT 0.65
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Try semantic matching first (works when listings have real embeddings)
  WITH hop1 AS (
    SELECT
      d1.session_id AS user_a,
      d1.id AS demand_a_id,
      l1.session_id AS user_b,
      l1.id AS listing_b_id,
      l1.title AS listing_b_title,
      l1.provider_name AS user_b_name,
      l1.is_mock AS b_is_mock,
      l1.image_url AS b_avatar,
      (1 - (d1.embedding <=> l1.embedding)) AS match_score_1
    FROM demands d1
    JOIN listings l1 ON d1.embedding IS NOT NULL AND l1.embedding IS NOT NULL
      AND (1 - (d1.embedding <=> l1.embedding)) > match_threshold
    WHERE d1.session_id = target_session_id
      AND l1.session_id != target_session_id
      AND l1.active = true
  ),
  hop2 AS (
    SELECT
      h1.*,
      d2.id AS demand_b_id,
      l2.session_id AS user_c,
      l2.id AS listing_c_id,
      l2.title AS listing_c_title,
      l2.provider_name AS user_c_name,
      l2.is_mock AS c_is_mock,
      l2.image_url AS c_avatar,
      (1 - (d2.embedding <=> l2.embedding)) AS match_score_2
    FROM hop1 h1
    JOIN demands d2 ON d2.session_id = h1.user_b
    JOIN listings l2 ON d2.embedding IS NOT NULL AND l2.embedding IS NOT NULL
      AND (1 - (d2.embedding <=> l2.embedding)) > match_threshold
    WHERE l2.session_id != h1.user_a AND l2.session_id != h1.user_b AND l2.active = true
  ),
  hop3 AS (
    SELECT
      h2.*,
      d3.id AS demand_c_id,
      l3.id AS listing_a_id,
      l3.title AS listing_a_title,
      l3.is_mock AS a_is_mock,
      (1 - (d3.embedding <=> l3.embedding)) AS match_score_3
    FROM hop2 h2
    JOIN demands d3 ON d3.session_id = h2.user_c
    JOIN listings l3 ON d3.embedding IS NOT NULL AND l3.embedding IS NOT NULL
      AND (1 - (d3.embedding <=> l3.embedding)) > match_threshold
    WHERE l3.session_id = h2.user_a AND l3.active = true
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', 'cycle-' || md5(user_a || user_b || user_c),
      'matchScore', ROUND(((match_score_1 + match_score_2 + match_score_3) / 3.0 * 100)::numeric, 1),
      'nodes', jsonb_build_array(
        jsonb_build_object('user', 'You', 'item', listing_a_title, 'rep', 85, 'is_mock', a_is_mock, 'avatar', null),
        jsonb_build_object('user', COALESCE(user_b_name, user_b), 'item', listing_b_title, 'rep', 92, 'is_mock', b_is_mock, 'avatar', b_avatar),
        jsonb_build_object('user', COALESCE(user_c_name, user_c), 'item', listing_c_title, 'rep', 98, 'is_mock', c_is_mock, 'avatar', c_avatar)
      )
    )
  ) INTO result
  FROM hop3
  LIMIT 5;

  -- DEMO FALLBACK: if no semantic cycles found, return 4 diverse hardcoded demo cycles.
  -- This fires for any session, ensuring the page is never empty during demos.
  IF result IS NULL OR jsonb_array_length(result) = 0 THEN
    SELECT jsonb_agg(c) INTO result FROM (

      -- Cycle 1: Tech & Food (classic)
      SELECT jsonb_build_object(
        'id', 'cycle-demo-1',
        'matchScore', 96.5,
        'nodes', jsonb_build_array(
          jsonb_build_object('user', 'You', 'item', 'Electric Bike', 'rep', 85, 'is_mock', true, 'avatar', null),
          jsonb_build_object('user', 'Bia Tech', 'item', 'Web Development Consulting', 'rep', 92, 'is_mock', true,
            'avatar', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=60&h=60'),
          jsonb_build_object('user', 'Bread & Co', 'item', 'Artisan Sourdough Subscription', 'rep', 98, 'is_mock', true,
            'avatar', 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80&w=60&h=60')
        )
      ) AS c

      UNION ALL

      -- Cycle 2: Creative & Outdoor
      SELECT jsonb_build_object(
        'id', 'cycle-demo-2',
        'matchScore', 89.8,
        'nodes', jsonb_build_array(
          jsonb_build_object('user', 'You', 'item', 'Graphic Design Package', 'rep', 85, 'is_mock', true, 'avatar', null),
          jsonb_build_object('user', 'Luna Foto', 'item', 'Photography (Half Day)', 'rep', 94, 'is_mock', true,
            'avatar', 'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&q=80&w=60&h=60'),
          jsonb_build_object('user', 'TrailCo', 'item', 'Touring Kayak + Gear', 'rep', 88, 'is_mock', true,
            'avatar', 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=60&h=60')
        )
      )

      UNION ALL

      -- Cycle 3: Knowledge & Wellness
      SELECT jsonb_build_object(
        'id', 'cycle-demo-3',
        'matchScore', 93.1,
        'nodes', jsonb_build_array(
          jsonb_build_object('user', 'You', 'item', 'Python & AI Workshop', 'rep', 85, 'is_mock', true, 'avatar', null),
          jsonb_build_object('user', 'Marina H.', 'item', 'Reiki & Energy Healing', 'rep', 97, 'is_mock', true,
            'avatar', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=60&h=60'),
          jsonb_build_object('user', 'Sound Lab', 'item', 'Sound Healing Journey', 'rep', 95, 'is_mock', true,
            'avatar', 'https://images.unsplash.com/photo-1544783985-0af069aecd5b?auto=format&fit=crop&q=80&w=60&h=60')
        )
      )

      UNION ALL

      -- Cycle 4: Skills & Fitness
      SELECT jsonb_build_object(
        'id', 'cycle-demo-4',
        'matchScore', 87.4,
        'nodes', jsonb_build_array(
          jsonb_build_object('user', 'You', 'item', 'No-Code App Workshop', 'rep', 85, 'is_mock', true, 'avatar', null),
          jsonb_build_object('user', 'FitCoach', 'item', 'Personal Training (5 sessions)', 'rep', 91, 'is_mock', true,
            'avatar', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=60&h=60'),
          jsonb_build_object('user', 'Inner Spaces', 'item', 'Meditation & Mindfulness (8 weeks)', 'rep', 99, 'is_mock', true,
            'avatar', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=60&h=60')
        )
      )

    ) cycles(c);
  END IF;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
