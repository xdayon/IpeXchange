# Mock Data Persistence & Recovery Plan

**Objetivo:** Recuperar os listings no Discovery e tornar o mock data permanente — sem risco de sumir em futuras atualizações.

---

## Diagnóstico: Por Que os Listings Sumiram

Existem 4 causas possíveis (execute o Step 0 para confirmar qual ocorreu):

| # | Causa | Sintoma |
|---|-------|---------|
| A | Colunas faltando no DB (`subcategory`, `tags`, `mock_key` UNIQUE, etc.) | `getListings()` lança erro e retorna `[]` silenciosamente |
| B | Dados deletados ou `active = false` em todos os listings | DB conectado, query funciona, mas retorna vazio |
| C | `mock_key UNIQUE` constraint faltando | Seeds falham ao rodar `ON CONFLICT (mock_key)` |
| D | DB indisponível (`dbAvailable = false`) | Fallback in-memory está vazio, tela fica em branco |

---

## Step 0 — Diagnóstico (Supabase SQL Editor)

Cole e execute para entender o estado atual:

```sql
-- Quantos listings existem?
SELECT COUNT(*), active FROM listings GROUP BY active;

-- Quantos são mock?
SELECT COUNT(*) FROM listings WHERE is_mock = true;

-- mock_key UNIQUE existe?
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'listings' AND constraint_name LIKE '%mock%';

-- Colunas que existem na tabela listings
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'listings'
ORDER BY ordinal_position;
```

---

## Step 1 — Migration SQL (Supabase SQL Editor)

Adiciona as colunas que `supabase.js:getListings()` já tenta selecionar mas podem não existir no DB, e cria a constraint `UNIQUE` para `mock_key` funcionar corretamente.

```sql
-- ============================================================
-- IpêXchange — Schema Migration: Missing Columns + mock_key
-- Safe to re-run (all use IF NOT EXISTS / IF NOT EXISTS)
-- ============================================================

-- Colunas usadas no SELECT de getListings() que podem não existir
ALTER TABLE listings ADD COLUMN IF NOT EXISTS mock_key        TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS subcategory     TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS tags            TEXT[];
ALTER TABLE listings ADD COLUMN IF NOT EXISTS availability    TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_label  TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS quantity        FLOAT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS unit            TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS duration_minutes INT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_remote       BOOLEAN DEFAULT false;

-- Unique constraint para ON CONFLICT (mock_key) funcionar
-- (só cria se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'listings' AND constraint_type = 'UNIQUE'
      AND constraint_name = 'listings_mock_key_key'
  ) THEN
    ALTER TABLE listings ADD CONSTRAINT listings_mock_key_key UNIQUE (mock_key);
  END IF;
END;
$$;

-- mock_key para demands também (idempotência no seed)
ALTER TABLE demands ADD COLUMN IF NOT EXISTS mock_key TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'demands' AND constraint_type = 'UNIQUE'
      AND constraint_name = 'demands_mock_key_key'
  ) THEN
    ALTER TABLE demands ADD CONSTRAINT demands_mock_key_key UNIQUE (mock_key);
  END IF;
END;
$$;

-- Index para proteger mock data
CREATE INDEX IF NOT EXISTS idx_listings_is_mock ON listings(is_mock) WHERE is_mock = true;
```

---

## Step 2 — Trigger de Proteção (Supabase SQL Editor)

Este trigger impede que listings mock sejam desativados no banco. Se alguém (código ou usuário) setar `active = false` num listing com `is_mock = true`, o trigger silenciosamente reverte para `active = true`.

```sql
-- ============================================================
-- Proteção: listings is_mock = true NÃO podem ser desativados
-- ============================================================

CREATE OR REPLACE FUNCTION protect_mock_listings()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_mock = true AND NEW.active = false THEN
    NEW.active := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_mock_deactivation ON listings;

CREATE TRIGGER prevent_mock_deactivation
BEFORE UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION protect_mock_listings();
```

---

## Step 3 — Seed Persistente (Supabase SQL Editor)

Este é o arquivo canônico de mock data. A diferença crítica em relação ao `add_mock_listings.sql` anterior:

- **Antes:** `ON CONFLICT (mock_key) DO NOTHING` — se o listing foi deletado ou desativado, ele NÃO é restaurado
- **Agora:** `ON CONFLICT (mock_key) DO UPDATE SET active = true, updated_at = now()` — sempre restaura

Cole e execute o bloco abaixo inteiro no SQL Editor do Supabase:

```sql
-- ============================================================
-- IpêXchange — Persistent Mock Seed v1
-- SAFE TO RE-RUN: ON CONFLICT ... DO UPDATE garante restauração
-- NÃO DELETAR: é o seed canônico do Discovery
-- ============================================================

-- ─── Sessions ────────────────────────────────────────────────
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
ON CONFLICT (id) DO NOTHING;

-- ─── Products ────────────────────────────────────────────────
INSERT INTO listings (session_id, title, description, category, subcategory, condition, price_fiat, accepts_trade, trade_wants, provider_name, image_url, active, ai_generated, is_mock, mock_key)
VALUES

  ('test-session-id', 'Electric Bike',
   'Urban electric bike in great condition, perfect for daily mobility. 48V battery, 25km range, hydraulic brakes.',
   'Products', 'Mobility', 'good', 850, true, 'Web design or development work',
   'Alex M.',
   'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'electric-bike'),

  ('test-session-id', 'MacBook Pro M1 14"',
   'MacBook Pro M1 14-inch, 16GB RAM, 512GB SSD. Used 1 year. Battery at 92%. Excellent condition. Includes original charger.',
   'Products', 'Electronics', 'like_new', 1200, false, null,
   'Alex M.',
   'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'macbook-pro-m1-14'),

  ('ipe-farm-id', 'Bracatinga Honey 500g',
   '100% pure Bracatinga honeydew, hand-harvested from our local sanctuary. Cold-extracted, no additives.',
   'Products', 'Food & Drink', 'new', 12, true, 'Seeds, plants, or organic goods',
   'Ipê Farm',
   'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'bracatinga-honey-500g'),

  ('bread-co-id', 'Artisan Sourdough Subscription',
   'Fresh sourdough delivered weekly for a month. 100% natural fermentation, no additives. 4 loaves total.',
   'Products', 'Food & Drink', 'new', 45, true, 'Fresh produce or fermented foods',
   'Bread & Co',
   'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'artisan-sourdough-subscription'),

  ('skyview-lab-id', 'DJI Mini 4 Pro Drone',
   'DJI Mini 4 Pro with 2 batteries and carrying case. 4K/60fps, 34min flight time. Less than 10 flights.',
   'Products', 'Electronics', 'like_new', 550, true, 'Photography gear or tech equipment',
   'SkyView Lab',
   'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'dji-mini-4-pro-drone'),

  ('trailco-id', 'Touring Kayak + Gear',
   'Single touring kayak 4.2m with paddle, life vest and dry bag. Great for coastal exploration. Ideal trade for fitness equipment.',
   'Products', 'Outdoor', 'good', 400, true, 'Mountain bike or fitness equipment',
   'TrailCo',
   'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'touring-kayak-gear'),

  ('fitcoach-id', 'Road Bike (Cannondale)',
   'Cannondale CAAD12 road bike, size M, full Shimano 105 groupset. Recently serviced, new tires and chain.',
   'Products', 'Sports', 'good', 680, true, 'Yoga or wellness sessions',
   'FitCoach',
   'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'road-bike-cannondale'),

  ('green-roots-id', 'Solar Panel Kit 200W',
   'Complete off-grid solar kit: 200W panel, 20A charge controller, cables and mounting brackets. Perfect for van or tiny house.',
   'Products', 'Electric', 'new', 320, true, 'Construction materials or tools',
   'Green Roots',
   'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'solar-panel-kit-200w'),

  ('community-id', 'La Marzocco Espresso Machine',
   'La Marzocco Linea Mini — the gold standard for home espresso. Single group, recently serviced. Includes grinder.',
   'Products', 'Kitchen', 'good', 2800, false, null,
   'Café Ipê',
   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'la-marzocco-espresso-machine'),

  ('ipe-farm-id', 'Organic Seed Pack (30 varieties)',
   'Curated selection of 30 heirloom vegetable and herb seeds, all open-pollinated and organic. Grown at our permaculture site.',
   'Products', 'Garden', 'new', 25, true, 'Fermented foods or kombucha',
   'Ipê Farm',
   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'organic-seed-pack-30-varieties'),

  ('studio-pixel-id', 'iPad Pro M2 12.9"',
   'iPad Pro M2 12.9" with Apple Pencil 2 and Magic Keyboard. Perfect for design, illustration or note-taking. 256GB WiFi.',
   'Products', 'Electronics', 'like_new', 950, true, 'Design work or creative services',
   'Studio Pixel',
   'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'ipad-pro-m2-12-9'),

  ('luna-photo-id', 'Film Camera Kit (Pentax K1000)',
   'Classic Pentax K1000 fully manual camera with 50mm f/2 lens and 3 rolls of Kodak Gold 200. Fully functional, just serviced.',
   'Products', 'Photography', 'good', 180, true, 'Photography session or prints',
   'Luna Foto',
   'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'film-camera-kit-pentax-k1000'),

  ('community-id', 'Electric Standing Desk',
   'Motorized standing desk, 160x80cm, dual-motor, adjustable height 65-130cm. Excellent for home office. Walnut top.',
   'Products', 'Furniture', 'like_new', 380, true, 'Ergonomic chair or office setup help',
   'Ipê Workspace',
   'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'electric-standing-desk'),

  ('community-id', 'Fermentation Starter Kit',
   'Complete kit for making kombucha, kefir and sourdough. Includes SCOBY, grains, jar, airlock and full guide.',
   'Products', 'Food & Drink', 'new', 45, true, 'Organic produce or cooking class',
   'Ferment Lab',
   'https://images.unsplash.com/photo-1601984843624-f5b5f1069f48?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'fermentation-starter-kit'),

  ('sound-lab-id', 'Crystal Singing Bowl Set',
   'Set of 7 quartz crystal singing bowls, one per chakra note. Includes mallet, o-rings and carrying case. Perfect for sound therapy.',
   'Products', 'Wellness', 'like_new', 420, true, 'Sound healing or meditation sessions',
   'Sound Lab',
   'https://images.unsplash.com/photo-1544783985-0af069aecd5b?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'crystal-singing-bowl-set'),

  ('inner-spaces-id', 'Meditation Cushion & Mat Set',
   'High-quality zafu and zabuton meditation set. Natural kapok filling, organic cotton cover. Ideal for daily sitting practice.',
   'Products', 'Wellness', 'new', 95, true, 'Yoga classes or wellness sessions',
   'Inner Spaces',
   'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'meditation-cushion-mat-set'),

  ('trailco-id', 'Camping Gear Bundle',
   'Complete 2-person camping kit: 3-season tent, sleeping bags, cook set, headlamps. Everything you need for a weekend trip.',
   'Products', 'Outdoor', 'good', 260, true, 'Hiking boots or sports gear',
   'TrailCo',
   'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'camping-gear-bundle'),

  ('community-id', 'Vintage Vinyl Record Collection',
   '80 vinyl records: rock, jazz, bossa nova, soul. 70s-90s. All in great playable condition. Includes some rare Brazilian pressings.',
   'Products', 'Music', 'good', 300, true, 'Music instruments or audio equipment',
   'Vinyl Corner',
   'https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'vintage-vinyl-record-collection')

ON CONFLICT (mock_key) DO UPDATE SET active = true, updated_at = now();

-- ─── Services ────────────────────────────────────────────────
INSERT INTO listings (session_id, title, description, category, subcategory, price_fiat, accepts_trade, trade_wants, provider_name, image_url, active, ai_generated, is_mock, mock_key)
VALUES

  ('bia-tech-id', 'Web Development Consulting',
   '10h package of Web Design and Development consulting. React, Next.js, Node.js. Portfolio available.',
   'Services', 'Technology', 500, true, 'Electronic equipment or quality food',
   'Bia Tech',
   'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'web-development-consulting'),

  (null, 'Yoga at the Park',
   'Morning yoga sessions at Central Park. All levels welcome. Vinyasa + Yin combo. 5-class package.',
   'Services', 'Fitness', 75, false, null,
   'FitCity',
   'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'yoga-at-the-park'),

  (null, 'Legal Advice: DAO & Web3',
   'Legal consulting specialized in DAOs, smart contracts and tokenization. First session free. 2h package.',
   'Services', 'Legal', 200, true, 'Tech services or design work',
   'Ipê Law',
   'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'legal-advice-dao-web3'),

  ('marina-h-id', 'Reiki & Energy Healing',
   'Full Reiki session (60 min) for energy balancing, stress relief and inner alignment. Peaceful space with aromatherapy and sound bowl.',
   'Services', 'Health & Wellness', 60, true, 'Yoga classes or organic food',
   'Marina H.',
   'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'reiki-energy-healing'),

  ('fitcoach-id', 'Personal Training (5 sessions)',
   'Customized 5-session personal training program. Strength, mobility and conditioning. All fitness levels. Outdoor or indoor.',
   'Services', 'Fitness', 200, true, 'Nutrition coaching or supplements',
   'FitCoach',
   'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'personal-training-5-sessions'),

  ('studio-pixel-id', 'Graphic Design & Branding',
   'Complete visual identity: logo, color palette, typography, social media kit. 2 revision rounds included. Delivery in 7 days.',
   'Services', 'Design', 350, true, 'Web development or photography',
   'Studio Pixel',
   'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'graphic-design-branding'),

  ('green-roots-id', 'Permaculture Consultation',
   'On-site permaculture consultation for your garden or land. Zone mapping, plant guild design, water management. 3h visit.',
   'Services', 'Nature & Garden', 120, true, 'Seeds, tools or organic inputs',
   'Green Roots',
   'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'permaculture-consultation'),

  ('luna-photo-id', 'Photography & Video (Half Day)',
   'Professional photography and video for events, portraits, products or architecture. 4-hour session, 50 edited photos + 1 short video.',
   'Services', 'Photography', 480, true, 'Design work or social media management',
   'Luna Foto',
   'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'photography-video-half-day'),

  ('balance-studio-id', 'Acupuncture Session',
   'Traditional acupuncture session (60 min) for pain relief, stress, sleep improvement or immunity boost. Licensed practitioner with 12 years of experience.',
   'Services', 'Health & Wellness', 85, true, 'Massage or sound healing session',
   'Balance Studio',
   'https://images.unsplash.com/photo-1554244933-d876deb6b2ff?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'acupuncture-session'),

  ('community-id', 'Home Repair & Handyman',
   'General home repairs: plumbing, electrical, painting, furniture assembly, door locks. Hourly rate. Same-day availability most days.',
   'Services', 'Home', 55, false, null,
   'FixIt City',
   'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'home-repair-handyman'),

  ('community-id', 'Nutritional Coaching (4 weeks)',
   '4-week personalized nutrition program. Initial assessment, meal plan, weekly check-ins and adjustment. Online or in-person.',
   'Services', 'Health & Wellness', 160, true, 'Fitness coaching or wellness sessions',
   'NutriCity',
   'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'nutritional-coaching-4-weeks'),

  ('community-id', 'Massage Therapy (Deep Tissue)',
   'Professional deep tissue massage, 75 minutes. Tension release, athletic recovery or relaxation. Home visits available in Ipê City.',
   'Services', 'Health & Wellness', 90, true, 'Yoga, acupuncture or healing sessions',
   'BodyWork Ipê',
   'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'massage-therapy-deep-tissue'),

  ('balance-studio-id', 'Life Coaching (3 sessions)',
   '3-session life coaching program. Goal setting, mindset work, accountability. Certified coach with ICF credentials.',
   'Services', 'Coaching', 180, true, 'Workshops or retreat access',
   'Balance Studio',
   'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'life-coaching-3-sessions'),

  ('community-id', 'Community Childcare (Weekend)',
   'Shared childcare for Ipê City residents on weekends. 4 hours per session. Qualified educator, max 6 children. Trade welcome.',
   'Services', 'Community', 0, true, 'Any skill or product you can offer',
   'Ipê Kids',
   'https://images.unsplash.com/photo-1587895874090-ba4fcced37ae?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'community-childcare-weekend'),

  ('bia-tech-id', 'AI Automation Setup',
   'Set up AI automations for your business: content scheduling, email sequences, chatbot integration. 5h package.',
   'Services', 'Technology', 400, true, 'Design, photography or hardware',
   'Bia Tech',
   'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'ai-automation-setup')

ON CONFLICT (mock_key) DO UPDATE SET active = true, updated_at = now();

-- ─── Knowledge ───────────────────────────────────────────────
INSERT INTO listings (session_id, title, description, category, subcategory, price_fiat, accepts_trade, trade_wants, provider_name, image_url, active, ai_generated, is_mock, mock_key)
VALUES

  ('code-lab-id', 'Python & AI Workshop (2 days)',
   'Hands-on 2-day workshop: Python fundamentals → AI/ML basics → building your first model. Small group (max 8 people). All materials included.',
   'Knowledge', 'Workshops', 120, true, 'Design, photography or content creation',
   'Code Lab',
   'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'python-ai-workshop-2-days'),

  ('community-id', 'Web3 & Crypto Fundamentals',
   'Learn the essentials: wallets, DeFi, NFTs, DAOs and the Ipê ecosystem. 3 online sessions of 90 min. Perfect for newcomers to crypto.',
   'Knowledge', 'Courses', 75, true, 'Tech consulting or app development',
   'Crypto Club',
   'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'web3-crypto-fundamentals'),

  ('bread-co-id', 'Sourdough Baking Masterclass',
   'Learn to make your own sourdough starter and bake bakery-quality bread at home. 4-hour hands-on session. All ingredients provided.',
   'Knowledge', 'Workshops', 55, true, 'Fresh produce or cooking equipment',
   'Bread & Co',
   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'sourdough-baking-masterclass'),

  ('inner-spaces-id', 'Meditation & Mindfulness (8 weeks)',
   '8-week structured mindfulness program. Daily practices, guided meditations, group sessions and 1:1 check-ins. MBSR-based curriculum.',
   'Knowledge', 'Courses', 180, true, 'Yoga, sound healing or retreat access',
   'Inner Spaces',
   'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'meditation-mindfulness-8-weeks'),

  ('green-roots-id', 'Urban Farming Workshop (Weekend)',
   'Weekend intensive: soil science, composting, raised beds, vertical gardens, seed saving. Includes take-home seedling kit.',
   'Knowledge', 'Workshops', 85, true, 'Tools, soil or organic inputs',
   'Green Roots',
   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'urban-farming-workshop-weekend'),

  ('sound-lab-id', 'Sound Healing Journey (Group)',
   'Group sound bath with crystal bowls, Tibetan bowls, gongs and chimes. 75-minute journey for deep relaxation. Max 12 people.',
   'Knowledge', 'Experiences', 45, true, 'Yoga, meditation or breathwork class',
   'Sound Lab',
   'https://images.unsplash.com/photo-1544783985-0af069aecd5b?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'sound-healing-journey-group'),

  ('community-id', 'Spanish Conversation Club',
   'Weekly Spanish conversation circles for intermediate speakers. Casual, practical, fun. 4 sessions per month. Native speaker facilitator.',
   'Knowledge', 'Language', 40, true, 'Language exchange or cultural events',
   'Lingua Hub',
   'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'spanish-conversation-club'),

  ('luna-photo-id', 'Phone Photography Masterclass',
   '3-hour workshop on how to take stunning photos with your smartphone. Composition, lighting, editing apps. Small group.',
   'Knowledge', 'Workshops', 60, true, 'Design course or creative workshop',
   'Luna Foto',
   'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'phone-photography-masterclass'),

  ('code-lab-id', 'No-Code App Building (Bubble/Webflow)',
   'Build a real web app without code using Bubble and Webflow. 1-day workshop, you leave with a working MVP. Beginner-friendly.',
   'Knowledge', 'Workshops', 95, true, 'Tech mentoring or product strategy',
   'Code Lab',
   'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'no-code-app-building-bubble-webflow'),

  ('marina-h-id', 'Breathwork & Pranayama (4 sessions)',
   '4 guided breathwork sessions combining Pranayama, Wim Hof and conscious connected breathing. Online or in-person. Transformative.',
   'Knowledge', 'Wellness', 95, true, 'Yoga, reiki or sound healing sessions',
   'Marina H.',
   'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'breathwork-pranayama-4-sessions'),

  ('community-id', 'First Aid & Emergency Response',
   'Official first aid certification course. CPR, AED, choking, wound care. 8-hour class, certificate issued on completion.',
   'Knowledge', 'Health', 80, false, null,
   'Ipê Safety',
   'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'first-aid-emergency-response'),

  ('balance-studio-id', 'Yin Yoga Teacher Training (Weekend)',
   'Weekend yin yoga immersion for practitioners wanting to teach or deepen their practice. TCM theory, sequencing, assists.',
   'Knowledge', 'Training', 250, true, 'Wellness services or retreat accommodation',
   'Balance Studio',
   'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'yin-yoga-teacher-training-weekend')

ON CONFLICT (mock_key) DO UPDATE SET active = true, updated_at = now();

-- ─── Donations ───────────────────────────────────────────────
INSERT INTO listings (session_id, title, description, category, subcategory, price_fiat, accepts_trade, provider_name, image_url, active, ai_generated, is_mock, mock_key)
VALUES

  ('community-id', 'Box of Books (Mixed genres)',
   'Curated selection of 20 books: fiction, philosophy, science, self-development. Excellent condition. Pick up at Ipê City Hub.',
   'Donations', 'Books', 0, false,
   'Book Exchange',
   'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'box-of-books-mixed-genres'),

  ('community-id', 'Baby Clothes (0–12 months)',
   'Full set of baby clothes, 0 to 12 months. Clean, washed, organized by size. Mix of brands. Passing forward with love.',
   'Donations', 'Clothing', 0, false,
   'Family Circle',
   'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'baby-clothes-0-12-months'),

  ('green-roots-id', 'Garden Tool Collection',
   'Set of 8 garden tools: trowels, pruners, fork, hoe, gloves. Used but in good working condition. For anyone starting a garden.',
   'Donations', 'Garden', 0, false,
   'Ipê Farm',
   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'garden-tool-collection'),

  ('community-id', 'Weekly Community Lunch',
   'Every Sunday we cook a large plant-based meal and share. Free for all Ipê City residents. Bring a dish to contribute if you can.',
   'Donations', 'Community', 0, false,
   'Community Kitchen',
   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'weekly-community-lunch'),

  ('community-id', 'Leftover Building Materials',
   'Assorted construction materials: tiles, wood boards, paint cans, screws, brackets. Free for community projects.',
   'Donations', 'Construction', 0, false,
   'Build Together',
   'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'leftover-building-materials'),

  ('inner-spaces-id', 'Free Guided Meditation (Weekly)',
   'Free 30-min guided meditation every Tuesday morning at the park. Suitable for all levels. No sign-up required.',
   'Donations', 'Wellness', 0, false,
   'Inner Spaces',
   'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'free-guided-meditation-weekly'),

  ('community-id', 'Surplus Harvest Share',
   'Weekly surplus from our urban farm: seasonal vegetables, herbs, eggs. Free for residents. Available Friday mornings.',
   'Donations', 'Food & Drink', 0, false,
   'Ipê Farm',
   'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'surplus-harvest-share'),

  ('community-id', 'Kids Bicycle (Free)',
   '12-inch kids bicycle, suitable for ages 3-5. Red, in good condition, recently cleaned and oiled. Pass it forward!',
   'Donations', 'Sports', 0, false,
   'Family Circle',
   'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'kids-bicycle-free'),

  ('sound-lab-id', 'Community Sound Bath (Free)',
   'Monthly free community sound bath at the main pavilion. Open to all Ipê City residents. Bring your own mat.',
   'Donations', 'Wellness', 0, false,
   'Sound Lab',
   'https://images.unsplash.com/photo-1544783985-0af069aecd5b?auto=format&fit=crop&q=80&w=400&h=300',
   true, false, true, 'community-sound-bath-free')

ON CONFLICT (mock_key) DO UPDATE SET active = true, updated_at = now();

-- ─── Demands (multi-hop trade cycles) ────────────────────────
INSERT INTO demands (session_id, description, category, accepts_trade, is_mock, mock_key)
VALUES
  ('test-session-id', 'Looking for web design and development consulting', 'Services', true, true, 'demand-test-web-dev'),
  ('bia-tech-id',     'I want fresh artisan sourdough bread',              'Products', true, true, 'demand-bia-bread'),
  ('bread-co-id',     'Need an electric bike for deliveries',              'Products', true, true, 'demand-bread-bike'),
  ('luna-photo-id',   'I want graphic design for my portfolio',            'Services', true, true, 'demand-luna-design'),
  ('studio-pixel-id', 'Looking for a kayak to explore the coast',          'Products', true, true, 'demand-pixel-kayak'),
  ('trailco-id',      'I want photography for my brand',                   'Services', true, true, 'demand-trail-photo'),
  ('marina-h-id',     'Looking for Python and AI training',                'Knowledge', true, true, 'demand-marina-python'),
  ('code-lab-id',     'I want a sound healing session',                    'Knowledge', true, true, 'demand-code-sound'),
  ('sound-lab-id',    'I want reiki and energy healing',                   'Services', true, true, 'demand-sound-reiki'),
  ('fitcoach-id',     'I want a no-code app building workshop',            'Knowledge', true, true, 'demand-fit-nocode'),
  ('inner-spaces-id', 'I want personal training and fitness coaching',     'Services', true, true, 'demand-inner-fit'),
  ('code-lab-id',     'I need a MacBook for development work',             'Products', true, true, 'demand-code-macbook'),
  ('green-roots-id',  'I want permaculture and farming knowledge',         'Knowledge', true, true, 'demand-green-perma'),
  ('balance-studio-id','I want yoga teacher training',                     'Knowledge', true, true, 'demand-balance-yoga'),
  ('skyview-lab-id',  'I want acupuncture and body work',                  'Services', true, true, 'demand-sky-acupuncture')
ON CONFLICT (mock_key) DO NOTHING;
```

---

## Step 4 — Atualizar `backend/lib/supabase.js`: seedDatabase()

**Arquivo:** `backend/lib/supabase.js`  
**Função:** `seedDatabase()` (linha ~583)

Alterar a seção de Demands de `insert` para `upsert`, para evitar duplicatas em re-execuções:

```js
// Antes (linha ~595):
if (demands?.length) {
  await supabase.from('demands').insert(demands);
}

// Depois:
if (demands?.length) {
  await supabase.from('demands').upsert(demands, { onConflict: 'mock_key', ignoreDuplicates: true });
}
```

---

## Step 5 — Atualizar `backend/lib/mockData.js`

O arquivo `mockData.js` serve como fallback in-memory quando o DB está offline. Precisa refletir o mesmo mock data do SQL, mas já está atualizado em grande parte. A mudança essencial é garantir que `MOCK_DEMANDS` tenha o campo `mock_key`:

```js
// Em cada objeto de MOCK_DEMANDS, adicionar mock_key:
{ session_id: 'test-session-id', description: '...', category: 'Services', accepts_trade: true, is_mock: true, mock_key: 'demand-test-web-dev' },
// ... e assim por diante para todos os 15 demands
```

---

## Step 6 — Auto-seed no Startup do Backend

**Arquivo:** `backend/server.js`  
**Onde:** após o bloco de importações e antes de `app.listen`

Adicionar uma função que verifica se há listings ativos. Se não houver, seeda automaticamente:

```js
// Adicionar após as importações existentes
async function ensureMockData() {
  try {
    const listings = await getListings({ limit: 1 });
    if (listings.length === 0) {
      console.log('⚠️  No listings found — auto-seeding mock data...');
      const result = await seedDatabase(MOCK_SESSIONS, MOCK_LISTINGS, MOCK_DEMANDS);
      if (result.success) {
        console.log('✅ Mock data auto-seeded on startup.');
      } else {
        console.warn('⚠️  Auto-seed failed:', result.error);
      }
    } else {
      console.log(`ℹ️  Discovery has ${listings.length}+ active listing(s). No seed needed.`);
    }
  } catch (err) {
    console.warn('⚠️  ensureMockData check failed:', err.message);
  }
}

// Chamar após o app.listen:
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  ensureMockData(); // <-- adicionar esta linha
});
```

---

## Step 7 — Pre-populate In-Memory Fallback

**Arquivo:** `backend/lib/supabase.js`  
**Onde:** na inicialização do `inMemory` (linha ~30 aprox., onde `inMemory` é declarado)

Quando o DB está offline (`dbAvailable = false`), o `getListings()` retorna `inMemory.listings` — mas hoje começa vazio. Importar o mock data para que a tela nunca fique em branco:

```js
// No topo do arquivo, adicionar import:
import { MOCK_LISTINGS } from './mockData.js';

// Onde inMemory é declarado (provavelmente algo como):
const inMemory = { listings: [], demands: [] };

// Alterar para:
const inMemory = { listings: [...MOCK_LISTINGS], demands: [] };
```

---

## Ordem de Execução

Execute nessa ordem exata:

1. **Supabase SQL Editor** → Step 1 (migration)
2. **Supabase SQL Editor** → Step 2 (protection trigger)
3. **Supabase SQL Editor** → Step 3 (persistent seed) — este restaura imediatamente os listings no Discovery
4. **Código** → Step 4 (`supabase.js` seedDatabase demands upsert)
5. **Código** → Step 5 (`mockData.js` adicionar mock_key nos demands)
6. **Código** → Step 6 (`server.js` auto-seed on startup)
7. **Código** → Step 7 (`supabase.js` pre-populate inMemory)

Os Steps 1–3 são suficientes para restaurar o Discovery imediatamente. Os Steps 4–7 são a camada de resiliência que previne o problema de acontecer de novo.

---

## Por Que Isso É Persistente Agora

| Proteção | Mecanismo |
|----------|-----------|
| Re-rodar o seed não deleta | `ON CONFLICT DO UPDATE SET active = true` restaura ao invés de ignorar |
| Deactivar listing mock | Trigger `protect_mock_listings` reverte `active = false → true` no DB |
| DB offline ou vazio | `inMemory.listings` pre-populado com mock data |
| Deploy fresco | `ensureMockData()` roda no startup e semeia se Discovery estiver vazio |
| demands duplicados | `upsert` com `mock_key` — sem duplicatas em re-seeds |
