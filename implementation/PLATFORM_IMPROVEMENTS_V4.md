# IpêXchange — Platform Improvements V4

**Scope:** 3 independent feature tracks executed in order.
**Deadline context:** Demo 2026-05-01.

---

## Track 1 — Multi-Hop Engine: Real DB + 3/4/5-Hop Support

### Problem

The live app only shows 3-hop cycles. `multihop_v4.sql` already contains the full 3/4/5-hop SQL engine (file is on disk, not deployed). Crucially, the function depends on a view called `unified_tradeable_items` that **does not exist anywhere in the schema** — this is the primary blocker.

### Root Cause

`multihop_v4.sql` uses `FROM unified_tradeable_items` in every CTE, but that view was never defined in `supabase_schema.sql` or `stores_schema.sql`. The view must union `listings` (user P2P) and `store_products` (store inventory) into one queryable surface, which is what makes multi-hop touch real site data.

### Implementation Steps

#### Step 1 — Create `unified_tradeable_items` view (new SQL file)

Create `backend/unified_view.sql`:

```sql
-- Drop if exists (safe to re-run)
DROP VIEW IF EXISTS unified_tradeable_items;

CREATE OR REPLACE VIEW unified_tradeable_items AS

  -- P2P listings from the discover page
  SELECT
    l.id,
    l.title          AS name,
    l.price_fiat,
    l.embedding,
    l.image_url,
    l.is_mock,
    l.session_id     AS owner_session_id,
    l.provider_name  AS owner_name,
    'user_listing'   AS source_type,
    NULL             AS store_id
  FROM listings l
  WHERE l.active = true
    AND l.embedding IS NOT NULL

  UNION ALL

  -- Store products (linked via store → session)
  SELECT
    sp.id,
    sp.name,
    sp.price_fiat,
    sp.embedding,
    sp.image_url,
    sp.is_mock,
    s.session_id     AS owner_session_id,
    s.name           AS owner_name,
    'store_product'  AS source_type,
    sp.store_id
  FROM store_products sp
  JOIN stores s ON sp.store_id = s.id
  WHERE sp.active = true
    AND sp.embedding IS NOT NULL;
```

**Why this matters:** With this view, any listing created via chat (Discover page) or any store product is automatically visible to the multi-hop matching engine. Real trades, real data.

#### Step 2 — Deploy `multihop_v4.sql` to Supabase

`multihop_v4.sql` is already correct and complete (3/4/5-hop CTEs, value-balance filter ≥ 70%, 6-result limit, demo fallback). Deploy order must be:

1. Run `unified_view.sql` (Step 1 above)
2. Run `multihop_v4.sql`

Use the Supabase SQL Editor or `backend/db-setup.js`. **Do not** run `multihop_v4.sql` alone — it will fail with "relation unified_tradeable_items does not exist".

#### Step 3 — Update backend in-memory fallback (`backend/lib/supabase.js`)

`getTradeCycles()` has an in-memory fallback path when Supabase is unavailable. It currently only returns 3-hop demo cycles. Add 4-hop and 5-hop fallback entries so the UI always demonstrates the full range.

Find `getTradeCycles` in `backend/lib/supabase.js`. The fallback currently returns an array — extend it with:

```js
// 4-hop demo fallback (add after existing 3-hop entry)
{
  id: 'cycle-demo-4hop',
  hops: 4,
  matchScore: 88.7,
  valueRatio: 74.0,
  nodes: [
    { user: 'You', item: 'Electric Bike', price: 850, rep: 85, is_mock: true, sourceType: 'user_listing', avatar: null },
    { user: 'FitCoach', item: 'Yoga Sessions (10h)', price: 600, rep: 88, is_mock: true, sourceType: 'user_listing', avatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=60&h=60' },
    { user: 'CoffeeLab', item: 'Coffee Roasting Workshop', price: 700, rep: 94, is_mock: true, sourceType: 'store_product', storeId: 'store-coffee', avatar: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=60&h=60' },
    { user: 'AI Haus', item: 'Smart Home Setup', price: 800, rep: 91, is_mock: true, sourceType: 'store_product', storeId: 'store-aihaus', avatar: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=60&h=60' },
  ]
},
// 5-hop demo fallback
{
  id: 'cycle-demo-5hop',
  hops: 5,
  matchScore: 82.3,
  valueRatio: 71.5,
  nodes: [
    { user: 'You', item: 'Macbook Pro M1', price: 1200, rep: 85, is_mock: true, sourceType: 'user_listing', avatar: null },
    { user: 'Bia Tech', item: 'Web Dev Consulting (15h)', price: 1000, rep: 92, is_mock: true, sourceType: 'user_listing', avatar: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=60&h=60' },
    { user: 'WoodCraft', item: 'Woodworking Workshop (5 lessons)', price: 900, rep: 79, is_mock: true, sourceType: 'user_listing', avatar: 'https://images.unsplash.com/photo-1540314227222-2daee298072c?auto=format&fit=crop&q=80&w=60&h=60' },
    { user: 'Ipê Bakery', item: '3-Month Sourdough Subscription', price: 750, rep: 96, is_mock: true, sourceType: 'store_product', storeId: 'store-bakery', avatar: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=60&h=60' },
    { user: 'Green Roots', item: 'Organic Veggie Box (3 months)', price: 975, rep: 88, is_mock: true, sourceType: 'store_product', storeId: 'store-organic', avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=60&h=60' },
  ]
}
```

#### Step 4 — Verify `MultiHopTradeCard.jsx` renders 4 and 5 nodes

Read `src/components/MultiHopTradeCard.jsx` in full. The card renders `cycle.nodes` as a loop, so if it maps over `nodes` it should handle 4 and 5 automatically. Verify:
- The connector arrow between nodes scales correctly with more participants
- The "Value Chain" section sums prices from all nodes regardless of count
- If there is any hardcoded `nodes[0]`, `nodes[1]`, `nodes[2]` slicing, rewrite to use `nodes.map()`

#### Step 5 — Add "View Listing" deep links in MultiHopTradeCard

Each node in the cycle has `sourceType` (`user_listing` | `store_product`) and optionally `storeId`. Use these to add a small "View →" link on each node card that navigates to the real listing:

- `sourceType === 'user_listing'` → navigate to `discover` tab (or `listing-detail` if an `id` is present)
- `sourceType === 'store_product'` → navigate to `store-detail` with `storeId`

Pass `onNavigate` prop down from `CircularTradePage` (which is already called from MainPortal via `onNavigate={handleNavigate}`). Add the prop chain:

```
MainPortal → CircularTradePage (pass onNavigate) → MultiHopTradeCard (pass onNavigate)
```

In `MainPortal.jsx`, the render:
```jsx
{tab === 'circular' && <CircularTradePage onNavigate={handleNavigate} />}
```

In `CircularTradePage.jsx`:
```jsx
const CircularTradePage = ({ onNavigate }) => {
  // ...
  {!isScanning && filtered.map(cycle => (
    <MultiHopTradeCard key={cycle.id} cycle={cycle} onNavigate={onNavigate} />
  ))}
```

#### Step 6 — Update demo fallback in `multihop_v4.sql` (already has good examples)

The existing demo fallback in `multihop_v4.sql` (lines 250+) already includes 3-hop, 4-hop, and 5-hop demo cycles. No changes needed to the SQL demo section — it's correct.

### Files Changed (Track 1)

| File | Action |
|------|--------|
| `backend/unified_view.sql` | **Create** — new view definition |
| `backend/multihop_v4.sql` | Deploy to Supabase (no code changes, already correct) |
| `backend/lib/supabase.js` | Add 4-hop and 5-hop entries to in-memory fallback |
| `src/components/CircularTradePage.jsx` | Accept and forward `onNavigate` prop |
| `src/components/MultiHopTradeCard.jsx` | Accept `onNavigate`, add "View →" links per node, verify variable-length node rendering |
| `src/components/MainPortal.jsx` | Pass `onNavigate={handleNavigate}` to CircularTradePage |

---

## Track 2 — Listings Curation: Crypto Payments, Deduplification, Images

### 2A — Enable Crypto on All Listings

#### Frontend mock data (`src/data/mockData.js`)

The following listings are missing `'crypto'` in their `acceptedPayments` array:

| ID | Title | Current payments | Fix |
|----|-------|-----------------|-----|
| l7 | Climate Data Analysis | `['fiat']` | → `['fiat', 'crypto']` |
| l28 | Cello Lessons | `['fiat', 'trade']` | → `['fiat', 'crypto', 'trade']` |
| l30 | Woodworking Workshop | `['fiat', 'trade']` | → `['fiat', 'crypto', 'trade']` |
| l32 | Artisan Sourdough Bakery | `['fiat', 'trade']` | → `['fiat', 'crypto', 'trade']` |
| l36 | Honda PCX 150 | `['fiat']` | → `['fiat', 'crypto']` |
| l37 | Organic Veggie Box | `['fiat', 'trade']` | → `['fiat', 'crypto', 'trade']` |
| l42 | Part-time Barista | `['fiat']` | → `['fiat', 'crypto']` |
| l46 | Beach Life-Guard | `['fiat']` | → `['fiat', 'crypto']` |

Do NOT change `['free']` listings (l23, l27, l39) — these are donations, no currency applies.

#### Backend SQL listings (Supabase)

Create `backend/fix_crypto_payments.sql`:

```sql
-- Add price_crypto to all active listings that have price_fiat but no crypto price
UPDATE listings
SET price_crypto = ROUND(price_fiat * 0.9, 2)   -- 10% discount for crypto
WHERE active = true
  AND price_fiat IS NOT NULL
  AND price_fiat > 0
  AND (price_crypto IS NULL OR price_crypto = 0);

-- Add 'crypto' to store_products.payments[] where it's missing
UPDATE store_products
SET payments = array_append(payments, 'crypto')
WHERE active = true
  AND NOT ('crypto' = ANY(payments))
  AND NOT ('free' = ANY(payments));
```

#### Backend mock data (`backend/lib/mockData.js`)

Read this file and apply the same pattern: any `acceptedPayments` array that has `'fiat'` but not `'crypto'` should have `'crypto'` added (excluding free/donation items).

### 2B — Deduplicate Listings

#### The Cannondale duplicate

The Road Bike (Cannondale) entry in `backend/add_mock_listings.sql` (line 40) may have been seeded multiple times into Supabase. Add to `backend/fix_crypto_payments.sql`:

```sql
-- Deduplicate by title: keep oldest row (first created), delete the rest
DELETE FROM listings
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at ASC) AS rn
    FROM listings
    WHERE title ILIKE '%cannondale%'
       OR title ILIKE '%road bike%'
  ) ranked
  WHERE rn > 1
);

-- Generic deduplication: for any title that appears more than once in is_mock listings
DELETE FROM listings
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY title, is_mock ORDER BY created_at ASC) AS rn
    FROM listings
    WHERE is_mock = true
  ) ranked
  WHERE rn > 1
);
```

#### Frontend `mockData.js`

Scan all 50 listings visually — no duplicate IDs or titles found in the current file. No changes needed in the frontend mock data for deduplication.

### 2C — Fix Duplicate Images

#### In `src/data/mockData.js`

Three pairs share identical Unsplash photo IDs:

| Duplicate URL fragment | Items sharing it | Fix |
|------------------------|------------------|-----|
| `photo-1544367567-0f2fcb009e0b` | l4 (Yoga at Park) + l39 (Beach Cleanup & Sunset Yoga) | Keep l4 yoga image. Change l39 to a beach cleanup photo: `photo-1507525428034-b723cf961d3e` |
| `photo-1522708323590-d24dbb6b0267` | l34 (Beachfront Studio) + l45 (Private Room in Shared House) | Keep l34 studio image. Change l45 to a bedroom/room photo: `photo-1631049307264-da0ec9d70304` |
| `photo-1544551763-46a013bb70d5` | l49 (Catamaran Sunset Boat Party) + l50 (PADI Scuba Diving) | Keep l49 catamaran image. Change l50 to a scuba diving photo: `photo-1559825481-12a05cc00344` |

Apply `?auto=format&fit=crop&q=80&w=400&h=300` to all replacement URLs as per existing convention.

Full replacement strings for `src/data/mockData.js`:

```
l39 image → 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400&h=300'
l45 image → 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=400&h=300'
l50 image → 'https://images.unsplash.com/photo-1559825481-12a05cc00344?auto=format&fit=crop&q=80&w=400&h=300'
```

#### In Supabase (SQL)

Add to `backend/fix_crypto_payments.sql`:

```sql
-- Fix duplicate images in DB listings
-- Listings that share the same image_url should get unique ones
-- This updates specific known duplicates from the seed data

UPDATE listings SET image_url = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400&h=300'
WHERE title ILIKE '%beach cleanup%' OR title ILIKE '%sunset yoga%';

UPDATE listings SET image_url = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=400&h=300'
WHERE title ILIKE '%private room%' OR title ILIKE '%shared house%';

UPDATE listings SET image_url = 'https://images.unsplash.com/photo-1559825481-12a05cc00344?auto=format&fit=crop&q=80&w=400&h=300'
WHERE title ILIKE '%scuba%' OR title ILIKE '%padi%' OR title ILIKE '%dive%';

-- Any listing with NULL image_url gets a generic placeholder
UPDATE listings
SET image_url = 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?auto=format&fit=crop&q=80&w=400&h=300'
WHERE image_url IS NULL AND active = true;
```

### Files Changed (Track 2)

| File | Action |
|------|--------|
| `src/data/mockData.js` | Edit `acceptedPayments` for 8 listings; fix 3 image URLs |
| `backend/lib/mockData.js` | Add `'crypto'` to fiat-only `acceptedPayments` arrays |
| `backend/fix_crypto_payments.sql` | **Create** — SQL for DB crypto prices, deduplication, image fixes |

---

## Track 3 — Recycle Hub: New Page + Top Nav Icon

### Overview

Add a "Recycle Hub" reachable from the top nav (icon to the right of Wallet). This is the city's circular economy service: citizens can submit unwanted items for recycling in exchange for `$IPE` tokens and reputation points. The page is self-contained with mock data (no new DB tables needed for demo).

### 3A — Add Icon to Top Navbar

**File: `src/components/MainPortal.jsx`**

1. Add `Recycle2` to the import from `lucide-react` (line 2):
   ```js
   import {
     Home, Compass, Store, TrendingUp,
     User, Wallet, Bot, Settings, Bell, Repeat,
     MessageCircle, ChevronRight, BarChart3, Recycle2
   } from 'lucide-react';
   ```

2. Add recycle to `NAV_ICONS` array (line 46), after the `wallet` entry:
   ```js
   const NAV_ICONS = [
     { id: 'profile',  icon: <User size={20} />,     label: 'Profile' },
     { id: 'wallet',   icon: <Wallet size={20} />,   label: 'Wallet' },
     { id: 'recycle',  icon: <Recycle2 size={20} />, label: 'Recycle' },
     { id: 'agent',    icon: <Bot size={20} />,      label: 'Agent' },
     { id: 'config',   icon: <Settings size={20} />, label: 'Config' },
   ];
   ```

3. Add `'recycle'` to the `PAGES` array (line 53):
   ```js
   const PAGES = ['profile', 'wallet', 'recycle', 'agent', 'circular', 'config', 'notifications'];
   ```

4. Add lazy import (after line 23):
   ```js
   const RecyclePage = lazy(() => import('./RecyclePage'));
   ```

5. Add render case in the tab switch section:
   ```jsx
   {tab === 'recycle' && <RecyclePage />}
   ```

### 3B — Create `RecyclePage.jsx`

**File: `src/components/RecyclePage.jsx`**

The page has 5 visual sections:

---

#### Section 1 — Hero / Mission Banner

Full-width dark card with lime/green gradient accent. Text:
- Headline: `"Recycle Hub"` with gradient on "Hub"
- Subline: `"Nothing goes to waste in Ipê City. Turn your unused items into $IPE tokens and reputation — while contributing to the city's circular economy."`
- Three small stat badges inline: `♻️ Zero Waste City` · `⚡ Earn $IPE` · `⭐ Boost Reputation`

---

#### Section 2 — City Recycling Stats (mock data, static)

A 2×2 (or 4-col) grid of stat cards showing city-wide recycling totals. Use the same `glass-panel` style from other pages.

```js
const CITY_STATS = [
  { material: 'Plastic',  kg: 284.7, color: '#38BDF8', icon: '🧴' },
  { material: 'Metal',    kg: 193.2, color: '#B4F44A', icon: '🔩' },
  { material: 'Glass',    kg: 121.5, color: '#818CF8', icon: '🫙' },
  { material: 'Organic',  kg: 512.0, color: '#F59E0B', icon: '🍃' },
  { material: 'E-Waste',  kg: 47.8,  color: '#F472B6', icon: '📱' },
  { material: 'Textiles', kg: 88.3,  color: '#A78BFA', icon: '👕' },
];
```

Each card shows: icon + material name + `{kg} kg` with accent color.

---

#### Section 3 — Submit Item for Recycling

A card with a simple form:
- **Item name** — text input
- **Material type** — dropdown: Plastic · Metal · Glass · Organic · E-Waste · Textiles · Mixed
- **Estimated weight** — number input with "kg" label
- **Description** (optional) — textarea, max 200 chars
- **Submit** button — `"Submit for Recycling"` with recycle icon

On submit (client-side only, no API call for demo):
1. Add the item to a local `useState` history array
2. Show a success toast-like message: `"Item submitted! You'll earn $IPE once processed."`
3. Reset the form

```js
const [history, setHistory] = useState(MOCK_HISTORY);
const [form, setForm] = useState({ name: '', material: 'Plastic', weight: '', description: '' });

const handleSubmit = () => {
  if (!form.name || !form.weight) return;
  const newItem = {
    id: `r-${Date.now()}`,
    name: form.name,
    material: form.material,
    weight: parseFloat(form.weight),
    status: 'Pending',
    submittedAt: new Date().toLocaleDateString('en-US'),
    ipeEarned: null,
    repEarned: null,
  };
  setHistory([newItem, ...history]);
  setForm({ name: '', material: 'Plastic', weight: '', description: '' });
  // show inline success message
};
```

---

#### Section 4 — My Recycled Items History

A list of submitted items with status badges:

```js
const MOCK_HISTORY = [
  { id: 'r1', name: 'Broken iPhone 7', material: 'E-Waste', weight: 0.18, status: 'Rewarded', submittedAt: 'Apr 12, 2026', ipeEarned: 12.5, repEarned: 8 },
  { id: 'r2', name: 'Aluminum cans (bag)', material: 'Metal', weight: 2.3, status: 'Processing', submittedAt: 'Apr 22, 2026', ipeEarned: null, repEarned: null },
  { id: 'r3', name: 'Old winter jacket', material: 'Textiles', weight: 1.1, status: 'Rewarded', submittedAt: 'Mar 30, 2026', ipeEarned: 7.0, repEarned: 5 },
  { id: 'r4', name: 'Glass wine bottles (x6)', material: 'Glass', weight: 3.6, status: 'Pending', submittedAt: 'Apr 28, 2026', ipeEarned: null, repEarned: null },
];
```

Status badge color scheme:
- `Pending` → amber `#F59E0B`
- `Processing` → cyan `#38BDF8`
- `Rewarded` → lime `#B4F44A`

Each row shows: item name, material chip, weight, status badge, `+{ipeEarned} $IPE` (if rewarded), and `+{repEarned} REP` (if rewarded).

---

#### Section 5 — My Recycle Rewards Summary

Two side-by-side summary cards at the bottom:

**Card A — $IPE from Recycling**
```
Total earned: 19.5 $IPE
[lime glow icon: ♻️ + coin]
"Crypto tokens earned by contributing to the city's material recovery."
```

**Card B — Reputation from Recycling**
```
Reputation earned: 13 pts
[purple glow icon: ⭐]
"Your recycling score contributes to your Ipê City citizen tier."
```

Compute these dynamically from the `history` state (sum `ipeEarned` and `repEarned` for all `status === 'Rewarded'` items), so newly submitted items that move to "Rewarded" would update the totals.

---

### Full `RecyclePage.jsx` structure outline

```jsx
import React, { useState } from 'react';
import { Recycle2, Leaf, Coins, Star, ChevronRight, Send } from 'lucide-react';

const CITY_STATS = [ /* as above */ ];
const MOCK_HISTORY = [ /* as above */ ];
const MATERIALS = ['Plastic', 'Metal', 'Glass', 'Organic', 'E-Waste', 'Textiles', 'Mixed'];

const RecyclePage = () => {
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [form, setForm] = useState({ name: '', material: 'Plastic', weight: '', description: '' });
  const [submitted, setSubmitted] = useState(false);

  const totalIpe = history.filter(h => h.status === 'Rewarded').reduce((a, h) => a + (h.ipeEarned || 0), 0);
  const totalRep = history.filter(h => h.status === 'Rewarded').reduce((a, h) => a + (h.repEarned || 0), 0);

  const handleSubmit = () => { /* as above */ };

  return (
    <div className="inner-page container">
      {/* Section 1: Hero */}
      {/* Section 2: City Stats Grid */}
      {/* Section 3: Submit Form */}
      {/* Section 4: History List */}
      {/* Section 5: Rewards Summary */}
    </div>
  );
};

export default RecyclePage;
```

Styling follows the same patterns as other pages: `glass-panel`, `text-gradient-lime`, `checkout-cta`, `btn-secondary`, inline `style` objects using CSS vars (`var(--bg-card)`, `var(--text-secondary)`, `var(--accent-cyan)`).

---

### Files Changed (Track 3)

| File | Action |
|------|--------|
| `src/components/MainPortal.jsx` | Add `Recycle2` import; add `recycle` to NAV_ICONS + PAGES; add lazy import + render case |
| `src/components/RecyclePage.jsx` | **Create** — full new page component |

---

## Execution Order

1. **Track 2** first — lowest risk, pure data curation, no new components. Fixes the DB and frontend mock data.
2. **Track 1** next — deploy `unified_view.sql` → deploy `multihop_v4.sql` → update `supabase.js` fallback → verify `MultiHopTradeCard.jsx` → add deep links.
3. **Track 3** last — purely additive (new component + minor nav edit), no risk to existing pages.

---

## Verification Checklist

### Track 1
- [ ] `unified_tradeable_items` view returns rows from both `listings` and `store_products`
- [ ] `/api/cycles/test-session-id` returns cycles with `hops: 3`, `hops: 4`, and `hops: 5`
- [ ] Hop filter chips on the UI show "3-Hop", "4-Hop", "5-Hop" and filter correctly
- [ ] `MultiHopTradeCard` renders 4-node and 5-node cycles without layout overflow
- [ ] Clicking "View →" on a node navigates to Discover or Store Detail

### Track 2
- [ ] All listings in Discover page show crypto payment option in checkout
- [ ] Store products show crypto as accepted payment in StoreDetailPage
- [ ] No duplicate listing titles appear in Discover page
- [ ] No two listings share the same thumbnail image
- [ ] Donation/free listings (`acceptedPayments: ['free']`) are unchanged

### Track 3
- [ ] Recycle2 icon appears in top nav between Wallet and Agent
- [ ] Clicking it opens the Recycle Hub page
- [ ] Hero section, city stats, form, history list, and rewards summary all render
- [ ] Submitting a valid form adds a new item to the history with `status: Pending`
- [ ] $IPE and Rep totals compute correctly from history state
- [ ] All text is in English, styling matches the rest of the app
