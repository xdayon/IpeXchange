# DISCOVER_NEW_CATEGORIES_FIX

Fix the Discover page not showing new mock data for categories: Real Estate, Vehicles, Food & Drink, Events, and Jobs.

---

## Root Cause (3 layers)

### Layer 1 — Wrong file was edited
The new mock listings (l33–l50) were added to `src/data/mockData.js`. That file is **not** used by the Discover page. The Discover pipeline is:

```
DiscoverPage → fetchDiscoverItems() → GET /api/discover → getListings() → Supabase DB
```

The file that feeds the DB is `backend/lib/mockData.js` (`MOCK_LISTINGS` array). It was never updated.

### Layer 2 — Supabase schema blocks new categories
`backend/supabase_schema.sql` line 51 has a hard CHECK constraint:

```sql
category TEXT CHECK (category IN ('Products', 'Services', 'Knowledge', 'Donations'))
```

Any insert with 'Real Estate', 'Vehicles', 'Food & Drink', 'Events', or 'Jobs' will be **rejected by the DB** even if Layer 1 is fixed.

### Layer 3 — Auto-seed won't re-run
`ensureMockData()` only seeds when there are **zero** listings. Since the original 10 mock listings exist, auto-seed on restart is a no-op. Re-seed must be triggered manually.

---

## Fix Plan — 3 Steps

---

### Step 1 — Fix the Supabase schema constraint

Run this SQL in the **Supabase SQL Editor** (Dashboard → SQL Editor → New query):

```sql
-- Drop the old restrictive CHECK constraint
ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_category_check;

-- Add expanded CHECK constraint with all 9 categories
ALTER TABLE listings
  ADD CONSTRAINT listings_category_check
  CHECK (category IN (
    'Products',
    'Services',
    'Knowledge',
    'Donations',
    'Real Estate',
    'Vehicles',
    'Food & Drink',
    'Events',
    'Jobs'
  ));
```

> **Why**: Without this, the upsert in Step 3 will throw a constraint violation and silently fail (the seed endpoint returns `{ success: false }` but the server continues running).

---

### Step 2 — Add new sessions and listings to `backend/lib/mockData.js`

#### 2a. Add new sessions to `MOCK_SESSIONS`

Append the following entries to the `MOCK_SESSIONS` array in [backend/lib/mockData.js](backend/lib/mockData.js):

```js
  { id: 'founder-haus-id' },
  { id: 'carlos-m-id' },
  { id: 'tech-rent-id' },
  { id: 'moto-jurere-id' },
  { id: 'ocean-rides-id' },
  { id: 'marina-boats-id' },
  { id: 'brewery-jurere-id' },
  { id: 'community-hub-id' },
  { id: 'ai-haus-id' },
  { id: 'ipe-tech-id' },
  { id: 'ipe-bakery-id' },
  { id: 'safety-tower-id' },
  { id: 'surf-shop-id' },
  { id: 'chef-roberto-id' },
  { id: 'ocean-vibe-id' },
  { id: 'deep-blue-dive-id' },
```

#### 2b. Add new listings to `MOCK_LISTINGS`

Append the following entries to the `MOCK_LISTINGS` array in [backend/lib/mockData.js](backend/lib/mockData.js):

```js
  // ── Real Estate ──────────────────────────────────────────────────────────────
  {
    session_id: 'founder-haus-id',
    title: 'Dedicated Desk at Founder Haus',
    description: '24/7 access to our co-working space. High-speed internet, meeting rooms, and coffee included.',
    category: 'Real Estate',
    subcategory: 'Commercial',
    price_fiat: 200,
    accepts_trade: false,
    provider_name: 'Founder Haus',
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'dedicated-desk-founder-haus'
  },
  {
    session_id: 'carlos-m-id',
    title: 'Beachfront Studio (Short-term)',
    description: 'Cozy studio directly facing Jurerê beach. Fully furnished, perfect for digital nomads.',
    category: 'Real Estate',
    subcategory: 'Short-term',
    price_fiat: 80,
    accepts_trade: false,
    provider_name: 'Carlos M.',
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'beachfront-studio-short-term'
  },
  {
    session_id: 'test-session-id',
    title: 'Private Room in Shared House',
    description: 'Renting out a private room with an en-suite bathroom in my 3-bedroom house. 5 mins walking to the beach. Shared kitchen and pool.',
    category: 'Real Estate',
    subcategory: 'For Rent',
    price_fiat: 500,
    accepts_trade: false,
    provider_name: 'Alex M.',
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'private-room-shared-house'
  },

  // ── Vehicles ─────────────────────────────────────────────────────────────────
  {
    session_id: 'tech-rent-id',
    title: 'Xiaomi Electric Scooter Pro 2',
    description: 'Used for 6 months. Great condition, 45km range. Includes charger and helmet.',
    category: 'Vehicles',
    subcategory: 'Electric',
    condition: 'good',
    price_fiat: 350,
    accepts_trade: false,
    provider_name: 'Tech Rent',
    image_url: 'https://images.unsplash.com/photo-1593955675402-1b154a86f7b1?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'xiaomi-electric-scooter-pro-2'
  },
  {
    session_id: 'moto-jurere-id',
    title: 'Honda PCX 150 - 2022',
    description: 'Automatic scooter, 8,000km. Perfect for moving around the city. Documentation up to date.',
    category: 'Vehicles',
    subcategory: 'Motorcycles',
    condition: 'good',
    price_fiat: 2800,
    accepts_trade: false,
    provider_name: 'Moto Jurere',
    image_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'honda-pcx-150-2022'
  },
  {
    session_id: 'ocean-rides-id',
    title: 'Yamaha WaveRunner Jet-Ski',
    description: 'Rent our high-speed Jet-Ski for an hour. Departs from Jurerê Internacional beach.',
    category: 'Vehicles',
    subcategory: 'Boats',
    price_fiat: 120,
    accepts_trade: false,
    provider_name: 'Ocean Rides',
    image_url: 'https://images.unsplash.com/photo-1579704283838-51ec41e174ab?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'yamaha-waverunner-jet-ski'
  },
  {
    session_id: 'marina-boats-id',
    title: 'Speedboat Focker 240',
    description: 'Selling my speedboat. 24ft, fits 8 people comfortably. Engine recently revised. Excellent condition.',
    category: 'Vehicles',
    subcategory: 'Boats',
    condition: 'good',
    price_fiat: 45000,
    accepts_trade: false,
    provider_name: 'Marina G.',
    image_url: 'https://images.unsplash.com/photo-1560377484-909d854e4c27?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'speedboat-focker-240'
  },

  // ── Food & Drink ──────────────────────────────────────────────────────────────
  {
    session_id: 'green-roots-id',
    title: 'Organic Veggie Box (Weekly)',
    description: 'Seasonal organic vegetables and greens from our urban farm delivered to your door.',
    category: 'Food & Drink',
    subcategory: 'Organic',
    condition: 'new',
    price_fiat: 25,
    accepts_trade: true,
    trade_wants: 'Other organic products or fermented foods',
    provider_name: 'Green Roots',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'organic-veggie-box-weekly'
  },
  {
    session_id: 'brewery-jurere-id',
    title: 'Ipê Craft IPA - 6 Pack',
    description: 'Local craft IPA brewed with native Brazilian hops. Support local brewing!',
    category: 'Food & Drink',
    subcategory: 'Beverages',
    condition: 'new',
    price_fiat: 18,
    accepts_trade: false,
    provider_name: 'Brewery Jurerê',
    image_url: 'https://images.unsplash.com/photo-1614316784845-f938fae8fcbc?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'ipe-craft-ipa-6-pack'
  },
  {
    session_id: 'chef-roberto-id',
    title: 'Seafood Paella (Weekend Special)',
    description: 'Authentic Spanish Paella made with fresh local seafood. Available only on weekends. Pre-order recommended!',
    category: 'Food & Drink',
    subcategory: 'Ready to Eat',
    condition: 'new',
    price_fiat: 45,
    accepts_trade: false,
    provider_name: 'Chef Roberto',
    image_url: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'seafood-paella-weekend-special'
  },

  // ── Events ────────────────────────────────────────────────────────────────────
  {
    session_id: 'community-hub-id',
    title: 'Beach Cleanup & Sunset Yoga',
    description: 'Join us for a 1-hour beach cleanup followed by a sunset yoga session. Bring your own mat!',
    category: 'Events',
    subcategory: 'Community',
    price_fiat: 0,
    accepts_trade: false,
    provider_name: 'Community Hub',
    image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'beach-cleanup-sunset-yoga'
  },
  {
    session_id: 'ai-haus-id',
    title: 'Web3 Builders Hackathon',
    description: 'Weekend hackathon focusing on local DAO governance and smart contracts. Food and drinks included.',
    category: 'Events',
    subcategory: 'Workshops',
    price_fiat: 15,
    accepts_trade: false,
    provider_name: 'AI Haus',
    image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'web3-builders-hackathon'
  },
  {
    session_id: 'ocean-vibe-id',
    title: 'Catamaran Sunset Boat Party',
    description: 'Join us for a 4-hour sunset boat party with live DJs, drinks, and ocean swimming. Limited tickets.',
    category: 'Events',
    subcategory: 'Community',
    price_fiat: 60,
    accepts_trade: false,
    provider_name: 'Ocean Vibe',
    image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'catamaran-sunset-boat-party'
  },

  // ── Jobs ──────────────────────────────────────────────────────────────────────
  {
    session_id: 'ipe-tech-id',
    title: 'Senior React Native Dev',
    description: 'Looking for an experienced RN developer to help build the mobile version of IpêXchange. Remote OK. 5,000 USDC/mo.',
    category: 'Jobs',
    subcategory: 'Remote',
    price_fiat: 5000,
    accepts_trade: false,
    provider_name: 'Ipê Tech',
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'senior-react-native-dev'
  },
  {
    session_id: 'ipe-bakery-id',
    title: 'Part-time Barista',
    description: 'We are looking for a friendly barista for the morning shift (7 AM - 12 PM). Experience preferred but not required.',
    category: 'Jobs',
    subcategory: 'Part-time',
    price_fiat: 12,
    accepts_trade: false,
    provider_name: 'Ipê Bakery',
    image_url: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'part-time-barista'
  },
  {
    session_id: 'safety-tower-id',
    title: 'Beach Life-Guard',
    description: 'Looking for a certified life-guard for the summer season (Dec–Mar). Must have valid CPR and water rescue certificates. 3,500 BRL/mo.',
    category: 'Jobs',
    subcategory: 'Full-time',
    price_fiat: null,
    accepts_trade: false,
    provider_name: 'Jurerê Safety',
    image_url: 'https://images.unsplash.com/photo-1534008897995-27a23e859048?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'beach-life-guard'
  },

  // ── Extra Services (beach-themed) ─────────────────────────────────────────────
  {
    session_id: 'surf-shop-id',
    title: 'Professional Surfboard Repair',
    description: 'Dings, fin boxes, and full restorations. Fast turnaround. We accept crypto or trade for surf accessories.',
    category: 'Services',
    subcategory: 'Maintenance',
    price_fiat: 40,
    accepts_trade: true,
    trade_wants: 'Surf accessories or wax',
    provider_name: 'Ipê City Surf Shop',
    image_url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'professional-surfboard-repair'
  },

  // ── Extra Knowledge (beach-themed) ────────────────────────────────────────────
  {
    session_id: 'deep-blue-dive-id',
    title: 'PADI Scuba Diving Certification',
    description: 'Get your PADI Open Water certification. 3 days of pool and ocean training in the clear waters near Jurerê.',
    category: 'Knowledge',
    subcategory: 'Courses',
    price_fiat: 350,
    accepts_trade: true,
    trade_wants: 'Underwater photography or dive gear',
    provider_name: 'Deep Blue Dive',
    image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=400&h=300',
    active: true,
    ai_generated: false,
    is_mock: true,
    mock_key: 'padi-scuba-diving-certification'
  },
```

---

### Step 3 — Trigger re-seed

After the schema fix (Step 1) and code changes are deployed/running locally, call the seed endpoint. Two options:

**Option A — Via ConfigPage UI (easiest)**
1. Open the app → go to **Config** page (settings icon)
2. Scroll to **Admin & Debug** section
3. Click **"Seed Mock City Data"** button
4. Wait for the green success toast

**Option B — Via curl (faster for local dev)**
```bash
curl -X POST http://localhost:3001/api/admin/seed
```

The `seedDatabase()` function uses `upsert` with `onConflict: 'mock_key'`, so it is safe to run multiple times — it will insert new entries and update existing ones without creating duplicates.

---

## Files to Change

| File | Change |
|------|--------|
| Supabase SQL Editor (dashboard) | Run the ALTER TABLE from Step 1 |
| [backend/lib/mockData.js](backend/lib/mockData.js) | Add 16 sessions to `MOCK_SESSIONS` + 18 listings to `MOCK_LISTINGS` |

**No frontend changes needed.** `DiscoverPage.jsx` already has all 9 category filter chips and subcategory maps wired up.

---

## Verification Checklist

After executing all steps:

- [ ] Supabase SQL Editor: the ALTER TABLE ran without errors
- [ ] `MOCK_SESSIONS` has 32 entries (16 original + 16 new)
- [ ] `MOCK_LISTINGS` has 28 entries (10 original + 18 new)
- [ ] Seed endpoint returns `{ "success": true }`
- [ ] Discover page → filter "Real Estate" → 3 listings appear
- [ ] Discover page → filter "Vehicles" → 4 listings appear
- [ ] Discover page → filter "Food & Drink" → 3 listings appear
- [ ] Discover page → filter "Events" → 3 listings appear
- [ ] Discover page → filter "Jobs" → 3 listings appear
- [ ] Discover page → filter "All" → 28+ listings appear
