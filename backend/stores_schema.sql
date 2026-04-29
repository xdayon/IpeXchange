-- ============================================================
-- IpêXchange — Stores & Store Products Schema
-- Run in Supabase SQL Editor after supabase_schema.sql
-- ============================================================

-- ─── Stores (establishments owned by users) ───────────────
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES sessions(id),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  address TEXT,
  on_chain BOOLEAN DEFAULT false,
  reputation_score FLOAT DEFAULT 80,
  icon_key TEXT,
  icon_color TEXT,
  icon_bg TEXT,
  owner_ens TEXT,
  rating FLOAT DEFAULT 4.5,
  review_count INT DEFAULT 0,
  tags TEXT[],
  is_mock BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Store Products (items listed by stores) ───────────────
CREATE TABLE IF NOT EXISTS store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Product', 'Service')) DEFAULT 'Product',
  description TEXT,
  price_fiat NUMERIC NOT NULL DEFAULT 0,
  price_label TEXT,
  image_url TEXT,
  payments TEXT[],
  accepts_trade BOOLEAN DEFAULT false,
  embedding VECTOR(768),
  is_mock BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(active);
CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);
CREATE INDEX IF NOT EXISTS idx_store_products_store ON store_products(store_id);
CREATE INDEX IF NOT EXISTS idx_store_products_trade ON store_products(accepts_trade);
CREATE INDEX IF NOT EXISTS idx_store_products_active ON store_products(active);
CREATE INDEX IF NOT EXISTS idx_store_products_embedding ON store_products USING hnsw (embedding vector_cosine_ops);

-- ─── Seed: Mock Stores ────────────────────────────────────
INSERT INTO sessions (id) VALUES
  ('ipe-bakery-id'), ('ipe-motors-id'), ('ipe-cinema-id'),
  ('organic-mkt-id'), ('ipe-health-id'), ('studio-creative-id'),
  ('surf-shop-id'), ('wine-cheese-id'), ('ipe-tech-id'), ('bio-mkt-id')
ON CONFLICT DO NOTHING;

INSERT INTO stores (id, session_id, name, category, description, address, on_chain, reputation_score, icon_key, icon_color, icon_bg, owner_ens, rating, review_count, tags, is_mock) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'ipe-bakery-id',      'Ipê Bakery',           'Food & Drink',    'Artisan bakery with 100% organic ingredients. Accepts crypto and trade.',                          'Av. dos Búzios, 210 – Ipê City',          true,  98, 'Coffee',    '#F59E0B', 'rgba(245,158,11,0.12)',   'marina.ipecity.eth',     4.9, 142, ARRAY['Artisan Bread','Organic','Specialty Coffee'], true),
  ('a1000000-0000-0000-0000-000000000002', 'ipe-motors-id',      'Ipê City Motors',      'Services',        'Workshop specialized in electric vehicles and customization. On-chain diagnostic reports.',        'Rua das Gaivotas, 48 – Ipê City',         true,  94, 'Wrench',    '#38BDF8', 'rgba(56,189,248,0.12)',   'carlostech.ipecity.eth', 4.7,  89, ARRAY['Mechanic','EVs','Customization'], true),
  ('a1000000-0000-0000-0000-000000000003', 'ipe-cinema-id',      'Ipê Cinema',           'Entertainment',   'Community cinema with 4K Dolby Atmos. NFT tickets.',                                             'Av. das Rendeiras, 1500 – Ipê City',      true,  99, 'Film',      '#818CF8', 'rgba(129,140,248,0.12)', 'ipehub.ipecity.eth',     4.8, 317, ARRAY['4K Dolby','Events','Art & Culture'], true),
  ('a1000000-0000-0000-0000-000000000004', 'organic-mkt-id',     'Organic Market',       'Commerce',        'Local organic products with blockchain traceability.',                                            'Rua das Ostras, 32 – Ipê City',           true,  97, 'Leaf',      '#B4F44A', 'rgba(180,244,74,0.10)',   'sitioipe.ipecity.eth',   4.9, 205, ARRAY['Produce','Bulk','Delivery'], true),
  ('a1000000-0000-0000-0000-000000000005', 'ipe-health-id',      'Ipê Health Clinic',    'Health',          'Digital health records secured on-chain.',                                                        'Av. dos Dourados, 78 – Ipê City',         true, 100, 'Heart',     '#F43F5E', 'rgba(244,63,94,0.10)',    'drsarah.ipecity.eth',    5.0,  61, ARRAY['General Clinic','Physiotherapy','Nutrition'], true),
  ('a1000000-0000-0000-0000-000000000006', 'studio-creative-id', 'Studio Creative',      'Services',        'Design specialized in Web3 visual identity, NFTs and branding.',                                 'Av. dos Búzios, 840 – Ipê City',          false, 89, 'ShoppingBag','#F472B6','rgba(244,114,182,0.10)', 'designhaus.ipecity.eth', 4.6,  43, ARRAY['Graphic Design','Branding','Web3 Assets'], true),
  ('a1000000-0000-0000-0000-000000000007', 'surf-shop-id',       'Ipê City Surf Shop',   'Commerce',        'Everything for your surf. Boards, accessories and the best beachwear brands.',                    'Av. dos Búzios, 1200 – Ipê City',         true,  96, 'ShoppingBag','#10B981','rgba(16,185,129,0.12)',  'surfpoint.ipecity.eth',  4.8, 156, ARRAY['Surf Gear','Rental','Clothing'], true),
  ('a1000000-0000-0000-0000-000000000008', 'wine-cheese-id',     'Wine & Cheese Ipê',    'Food & Drink',    'Exclusive selection of national and imported wines, paired with artisan cheeses.',                 'Rua das Amoras, 15 – Ipê City',           true,  95, 'Coffee',    '#9333EA', 'rgba(147,51,234,0.12)',   'vinicius.ipecity.eth',   4.9,  74, ARRAY['Wines','Cheese','Tasting'], true),
  ('a1000000-0000-0000-0000-000000000009', 'ipe-tech-id',        'Ipê Tech Store',       'Commerce',        'Your tech store in Ipê City. Focused on hardware for Web3 enthusiasts.',                          'Open Shopping Ipê City',                  true,  93, 'ShieldCheck','#38BDF8','rgba(56,189,248,0.12)', 'alexm.ipecity.eth',      4.7, 210, ARRAY['Gadgets','Hardware Wallets','Setup'], true),
  ('a1000000-0000-0000-0000-000000000010', 'bio-mkt-id',         'Bio Market',           'Health',          'Healthy food and natural supplementation for high performance.',                                  'Av. das Rendeiras, 450',                  true,  94, 'Leaf',      '#10B981', 'rgba(16,185,129,0.10)',  'carla.ipecity.eth',      4.8,  92, ARRAY['Supplements','Gluten Free','Vegan'], true)
ON CONFLICT DO NOTHING;

-- ─── Seed: Store Products (with price_fiat for value balance) ─
INSERT INTO store_products (store_id, name, type, description, price_fiat, price_label, image_url, payments, accepts_trade, is_mock) VALUES
  -- Ipê Bakery (s1)
  ('a1000000-0000-0000-0000-000000000001','Classic Sourdough Bread','Product','Natural fermentation, 500g. Baked Tuesdays and Fridays.',4,'$4','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','ipe'],false,true),
  ('a1000000-0000-0000-0000-000000000001','Specialty Arabica Coffee','Product','250g roasted this week, coarse or fine grind.',9,'$9','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true),
  ('a1000000-0000-0000-0000-000000000001','Weekly Organic Basket','Service','Weekly delivery of bread + coffee + artisan jams.',25,'$25/week','https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','ipe'],false,true),
  ('a1000000-0000-0000-0000-000000000001','Baking Workshop','Service','3h practical class with the chef. Groups up to 8 people.',35,'$35/person','https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','trade'],true,true),
  -- Ipê City Motors (s2)
  ('a1000000-0000-0000-0000-000000000002','On-Chain Vehicle Diagnostic','Service','Full report registered on-chain. Diagnostic NFT included.',15,'$15','https://images.unsplash.com/photo-1607705703571-c5a8695f18f6?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','ipe'],false,true),
  ('a1000000-0000-0000-0000-000000000002','Full Electrical Review','Service','Battery, charger, and electrical systems in EVs.',70,'$70','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true),
  ('a1000000-0000-0000-0000-000000000002','Custom Paint Job','Service','Premium automotive paint, special effects, and wraps.',350,'Upon request','https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','trade','ipe'],true,true),
  -- Ipê Cinema (s3)
  ('a1000000-0000-0000-0000-000000000003','4K Dolby Session Ticket','Product','NFT ticket for a standard session. Seat reservation included.',8,'$8','https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','ipe'],false,true),
  ('a1000000-0000-0000-0000-000000000003','Special Event Ticket','Product','Premieres, festivals, and exclusive events at the cultural hub.',18,'$18','https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true),
  ('a1000000-0000-0000-0000-000000000003','Private Room (Up to 20 people)','Service','Rental for private sessions, celebrations, and corporate events.',120,'$120/night','https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true),
  -- Organic Market (s4)
  ('a1000000-0000-0000-0000-000000000004','Weekly Organic Veggie Box','Product','Seasonal vegetables, direct from local farms. 5kg mixed box.',22,'$22/week','https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true),
  ('a1000000-0000-0000-0000-000000000004','Bulk Grains & Legumes (5kg)','Product','Assorted organic grains and legumes. Zero-waste packaging.',15,'$15','https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','trade','ipe'],true,true),
  ('a1000000-0000-0000-0000-000000000004','Farm Delivery Subscription','Service','Monthly delivery of seasonal produce to your door.',80,'$80/month','https://images.unsplash.com/photo-1528821128474-27f963b062bf?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','ipe'],false,true),
  -- Ipê Health Clinic (s5)
  ('a1000000-0000-0000-0000-000000000005','General Consultation','Service','45-min consultation with certified practitioner.',60,'$60','https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','ipe'],false,true),
  ('a1000000-0000-0000-0000-000000000005','Physiotherapy Session','Service','60-min targeted physiotherapy. All records on-chain.',80,'$80','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true),
  -- Studio Creative (s6)
  ('a1000000-0000-0000-0000-000000000006','Logo Design','Service','Custom logo with 3 concepts and 2 revision rounds.',120,'$120','https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true),
  ('a1000000-0000-0000-0000-000000000006','Full Brand Identity','Service','Logo, palette, typography, social kit. 7-day delivery.',350,'$350','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true),
  -- Surf Shop (s7)
  ('a1000000-0000-0000-0000-000000000007','Surfboard Rental (daily)','Product','Quality shortboard or longboard rental per day.',30,'$30/day','https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto'],false,true),
  ('a1000000-0000-0000-0000-000000000007','Wetsuit + Board Package','Product','Full package: board, wetsuit, wax, leash. Best value.',50,'$50/day','https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true),
  -- Wine & Cheese (s8)
  ('a1000000-0000-0000-0000-000000000008','Wine Tasting Experience','Service','Guided tasting of 5 curated wines with charcuterie pairing.',75,'$75/person','https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true),
  ('a1000000-0000-0000-0000-000000000008','Artisan Cheese Board (500g)','Product','Curated selection of 4 artisan cheeses with accompaniments.',28,'$28','https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','trade','ipe'],true,true),
  -- Ipê Tech Store (s9)
  ('a1000000-0000-0000-0000-000000000009','Hardware Wallet Setup','Service','Tangem or Ledger setup + security briefing. 1h session.',40,'$40','https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','ipe'],false,true),
  ('a1000000-0000-0000-0000-000000000009','Used iPhone 13 Pro','Product','Excellent condition, 256GB, battery 89%. Includes case.',550,'$550','https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true),
  ('a1000000-0000-0000-0000-000000000009','Sennheiser HD 599 (Used)','Product','Over-ear headphones, excellent condition. Original box.',180,'$180','https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true),
  -- Bio Market (s10)
  ('a1000000-0000-0000-0000-000000000010','Monthly Supplement Pack','Product','Personalized monthly vitamins and adaptogens. Science-backed.',65,'$65/month','https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','ipe'],false,true),
  ('a1000000-0000-0000-0000-000000000010','Nutrition Consult + Plan','Service','60-min consultation and personalized 30-day meal plan.',90,'$90','https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=300&h=200',ARRAY['fiat','crypto','trade','ipe'],true,true)
ON CONFLICT DO NOTHING;
