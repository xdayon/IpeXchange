# IpêXchange — Platform Improvements V2
**Implementation plan for Gemini Flash / Antigravity execution**
**Demo deadline: 2026-05-01 (Thursday)**

---

## Executive Summary

14 issues across 4 areas of the platform: quick text/UX bugs, database schema expansion, discovery & listing improvements, and identity/auth flow. Organized into phases by dependency and priority. Execute Phase 1 first — it unblocks the rest.

---

## Tech Stack Context

- **Frontend:** React + Vite → `src/components/`, API calls in `src/lib/api.js`
- **Backend:** Express + Gemini Flash → `backend/server.js`, DB layer in `backend/lib/supabase.js`
- **Database:** Supabase (Postgres) — run migrations in Supabase SQL Editor
- **Auth:** Privy (wallet + email), branded as "Ipê Passport"
- **Language rule:** ALL user-facing text must be in English. Dev communicates in PT-BR, site outputs must be EN.
- **No TypeScript** — keep it plain JS

---

## Phase 1 — Quick Wins (no DB changes needed)

### 1.1 Fix Core Tip — PT-BR → English

**File:** `src/components/HomePage.jsx`, line 145

**Current:**
```jsx
<p style={{ ... }}>Alta demanda por serviços de tecnologia em Ipê City hoje. Converse com o Core para anunciar um serviço com preço premium.</p>
```

**Fix:**
```jsx
<p style={{ ... }}>High demand for tech services in Ipê City today. Chat with Core to list a service at a premium price.</p>
```

Also fix line 64 in `src/components/HomePage.jsx`:
```jsx
// Current (PT-BR):
<h4 className="feed-title" ...>
  <span className="live-dot" /> Atividade em Ipê City
</h4>

// Fix:
<h4 className="feed-title" ...>
  <span className="live-dot" /> Live Activity in Ipê City
</h4>
```

---

### 1.2 Fix Notifications Tab Crash

**File:** `src/components/NotificationsPage.jsx`

**Root cause:** The `NOTIFICATIONS` array contains React component references (`icon: Zap`, `icon: Bell`, etc.). When `JSON.stringify` saves this to localStorage, functions become `null` or `{}`. On next load, `const Icon = n.icon` is `{}`, and `<Icon size={18} />` throws. The whole page crashes and disappears.

**Fix:** Store only primitive data in localStorage; reconstruct icon references from `type` at render time.

Replace the entire component file with this corrected version:

```jsx
import React, { useState } from 'react';
import { Bell, ShieldCheck, TrendingUp, Users, Zap, MessageCircle, Star, Check, Trash2, Sparkles } from 'lucide-react';

const ICON_MAP = {
  match: Zap,
  trust: Users,
  invest: TrendingUp,
  rep: Star,
  msg: MessageCircle,
  insight: Sparkles,
  security: ShieldCheck,
};

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', type: 'match',    unread: true,  time: '2m',  color: '#B4F44A', title: '3 matches for your bicycle!', desc: 'We found 3 interested parties for your Oggi B.W 8.0. Core can connect you now.' },
  { id: 'n2', type: 'trust',   unread: true,  time: '14m', color: '#38BDF8', title: 'Roberto traded with Carlos', desc: 'Someone from your Web of Trust completed a transaction. Reputation updated.' },
  { id: 'n3', type: 'invest',  unread: true,  time: '1h',  color: '#818CF8', title: 'New investment opportunity', desc: 'Ipê Bakery is raising $9k at 4.2% p.a. — compatible with your profile.' },
  { id: 'n4', type: 'rep',     unread: false, time: '2h',  color: '#F59E0B', title: 'Your reputation rose to 95!', desc: 'Congratulations! You reached Elite level on Xchange. New benefits unlocked.' },
  { id: 'n5', type: 'msg',     unread: false, time: '4h',  color: '#38BDF8', title: 'Message from Xchange Core', desc: 'Detected plumbing services available today in Ipê City — you had an active search.' },
  { id: 'p1', type: 'insight', unread: true,  time: 'Now', color: '#A855F7', title: 'Proactive Insight: Health Focus', desc: 'Noticed your interest in improving health. Marina is selling an E-Bike and the Runners Club meets tomorrow. Want to see?' },
  { id: 'n6', type: 'security',unread: false, time: '1d',  color: '#B4F44A', title: 'ZKP sync completed', desc: '47 attestations successfully synced on Ethereum. Your history is safe.' },
  { id: 'n7', type: 'match',   unread: false, time: '2d',  color: '#B4F44A', title: 'Fair trade suggested by Core', desc: 'Graphic design ↔ 6 jars of organic honey. Marina would accept this proposal.' },
];

// Serialize only primitives — no React components in localStorage
const serialize = (notifications) =>
  JSON.stringify(notifications.map(({ id, type, unread, time, color, title, desc }) =>
    ({ id, type, unread, time, color, title, desc })
  ));

const deserialize = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed[0]?.type) return null;
    return parsed;
  } catch {
    return null;
  }
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('ipeXchange_notifications');
    return deserialize(saved) || INITIAL_NOTIFICATIONS;
  });

  React.useEffect(() => {
    localStorage.setItem('ipeXchange_notifications', serialize(notifications));
  }, [notifications]);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="inner-page container" style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 26, marginBottom: 6 }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'rgba(180,244,74,0.12)', border: '1px solid rgba(180,244,74,0.3)', color: '#B4F44A' }}>
                {unreadCount} new
              </span>
            )}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Core updates, matches, and activity from your network.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-cyan)', background: 'none', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 100, padding: '7px 14px', cursor: 'pointer' }}>
            <Check size={13} /> Mark all as read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifications.map(n => {
          const Icon = ICON_MAP[n.type] || Bell;
          return (
            <div key={n.id} className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, borderColor: n.unread ? `${n.color}30` : 'var(--border-color)', background: n.unread ? `${n.color}05` : undefined, transition: 'all 0.2s' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${n.color}12`, border: `1px solid ${n.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                <Icon size={18} style={{ color: n.color }} />
                {n.unread && <span style={{ position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: '50%', background: '#B4F44A', border: '2px solid var(--bg-primary)' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 14, fontWeight: n.unread ? 700 : 600 }}>{n.title}</p>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{n.time}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.desc}</p>
              </div>
              <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, opacity: 0.5, flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p>No notifications at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
```

---

### 1.3 Move Donations to Last in Discovery

**File:** `src/components/DiscoverPage.jsx`, line 7

**Current:**
```js
const CATEGORIES = ['All', 'Services', 'Products', 'Donations', 'Knowledge'];
```

**Fix:**
```js
const CATEGORIES = ['All', 'Services', 'Products', 'Knowledge', 'Donations'];
```

---

### 1.4 Currency: Change Platform Currency to USD

**a) Backend schema — default currency:**
In `backend/supabase_schema.sql`, line 118:
```sql
-- Current:
currency TEXT DEFAULT 'BRL',
-- Fix:
currency TEXT DEFAULT 'USD',
```
Run this migration in Supabase SQL Editor:
```sql
ALTER TABLE transactions ALTER COLUMN currency SET DEFAULT 'USD';
UPDATE transactions SET currency = 'USD' WHERE currency = 'BRL';
```

**b) Frontend — Checkout fiat label:**
In `src/components/XchangeCheckout.jsx`, line 19:
```jsx
// Current:
sublabel: 'BRL · Instant transfer',
// Fix:
sublabel: 'USD · Instant transfer',
```
Also update the "Confirm Method" button text, line 233:
```jsx
// Current:
Confirm Method · {selected === 'fiat' ? 'PIX / Fiat' : ...}
// Fix:
Confirm Method · {selected === 'fiat' ? 'USD / Card' : ...}
```

**c) Frontend — Homepage stat:**
In `src/components/HomePage.jsx`, line 45:
```jsx
// Current:
<StatCard icon={TrendingUp} color="#B4F44A" title="Volume 24h" value="R$8.2k" subtext="+12%" />
// Fix:
<StatCard icon={TrendingUp} color="#B4F44A" title="Volume 24h" value="$8.2k" subtext="+12%" />
```

**d) Update all mock listing prices to realistic USD values:**
Run this migration in Supabase SQL Editor to update existing mock listing prices to realistic USD amounts (the current values in BRL were unrealistic):

```sql
UPDATE listings SET price_fiat = CASE title
  WHEN 'Electric Bike'                    THEN 850
  WHEN 'MacBook Pro M1 14"'               THEN 1200
  WHEN 'Bracatinga Honey 500g'            THEN 12
  WHEN 'Artisan Sourdough Subscription'   THEN 45
  WHEN 'DJI Mini 4 Pro Drone'             THEN 550
  WHEN 'Touring Kayak + Gear'             THEN 400
  WHEN 'Road Bike (Cannondale)'           THEN 680
  WHEN 'Solar Panel Kit 200W'             THEN 320
  WHEN 'La Marzocco Espresso Machine'     THEN 2800
  WHEN 'Organic Seed Pack (30 varieties)' THEN 25
  WHEN 'iPad Pro M2 12.9"'               THEN 950
  WHEN 'Film Camera Kit (Pentax K1000)'   THEN 180
  WHEN 'Electric Standing Desk'           THEN 380
  WHEN 'Fermentation Starter Kit'         THEN 45
  WHEN 'Web Development Consulting'       THEN 500
  WHEN 'Yoga at the Park'                 THEN 75
  WHEN 'Legal Advice: DAO & Web3'         THEN 200
  WHEN 'Reiki & Energy Healing'           THEN 60
  WHEN 'Personal Training (5 sessions)'   THEN 200
  WHEN 'Graphic Design & Branding'        THEN 350
  WHEN 'Permaculture Consultation'        THEN 120
  WHEN 'Photography & Video (Half Day)'   THEN 480
  WHEN 'Acupuncture Session'              THEN 85
  WHEN 'Home Repair & Handyman'           THEN 55
  WHEN 'Nutritional Coaching (4 weeks)'   THEN 160
  WHEN 'Massage Therapy (Deep Tissue)'    THEN 90
  WHEN 'Python & AI Workshop (2 days)'    THEN 120
  WHEN 'Web3 & Crypto Fundamentals'       THEN 75
  WHEN 'Sourdough Baking Masterclass'     THEN 55
  WHEN 'Meditation & Mindfulness (8 weeks)' THEN 180
  WHEN 'Urban Farming Workshop (Weekend)' THEN 85
  WHEN 'Sound Healing Journey (Group)'    THEN 45
  WHEN 'Spanish Conversation Club'        THEN 40
  WHEN 'Phone Photography Masterclass'    THEN 60
  WHEN 'No-Code App Building (Bubble/Webflow)' THEN 95
  ELSE price_fiat
END
WHERE is_mock = true;
```

---

## Phase 2 — Listings Schema Expansion

### 2.1 Expanded Category Taxonomy + Tags

This is a two-step change: DB migration + backend/frontend updates.

**a) DB Migration — run in Supabase SQL Editor:**

```sql
-- Expand the listings table with new fields
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability TEXT,
  ADD COLUMN IF NOT EXISTS location_label TEXT,
  ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT false;

-- Update the category constraint to include new top-level categories
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_category_check;
ALTER TABLE listings ADD CONSTRAINT listings_category_check
  CHECK (category IN (
    'Products', 'Services', 'Knowledge', 'Donations',
    'Real Estate', 'Vehicles', 'Food & Drink', 'Events', 'Jobs'
  ));

-- Create index on tags for fast filtering
CREATE INDEX IF NOT EXISTS idx_listings_tags ON listings USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_listings_subcategory ON listings(subcategory);
```

**b) Category + Subcategory taxonomy (reference for frontend filters):**

```
Products
  └── Electronics, Furniture, Clothing, Books, Sports, Garden, Kitchen, Health

Services
  └── Technology, Maintenance & Repair, Health & Wellness, Education, Creative, Legal & Finance, Transport, Beauty

Knowledge
  └── Workshops, Courses, Mentoring, Language, Arts & Crafts, Spirituality, Science

Donations
  └── Clothes, Food, Furniture, Books, Other

Real Estate
  └── For Sale, For Rent, Short-term, Land, Commercial, Rooms

Vehicles
  └── Cars, Motorcycles, Bikes, Boats, Electric, Parts & Accessories

Food & Drink
  └── Organic, Artisan, Subscriptions, Ready to Eat, Beverages

Events
  └── Concerts, Sports, Workshops, Community, Markets

Jobs
  └── Full-time, Part-time, Freelance, Remote, Internship
```

**c) Update `backend/lib/supabase.js` — `getListings` function:**

Update the select query to include the new fields:
```js
export async function getListings({ category = null, subcategory = null, tags = null, limit = 50 } = {}) {
  // ...
  let query = supabase
    .from('listings')
    .select('id, title, description, category, subcategory, tags, condition, price_fiat, price_crypto, accepts_trade, trade_wants, provider_name, image_url, active, is_mock, availability, location_label, quantity, unit, duration_minutes, is_remote, created_at')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category && category !== 'All') query = query.eq('category', category);
  if (subcategory) query = query.eq('subcategory', subcategory);
  if (tags && tags.length > 0) query = query.overlaps('tags', tags);
  // ...
}
```

Also update `mapListingToFrontend` (around line 140 in supabase.js) to include the new fields in the mapped object:
```js
function mapListingToFrontend(l) {
  return {
    id: l.id,
    title: l.title,
    description: l.description,
    category: l.category,
    subcategory: l.subcategory || null,
    tags: l.tags || [],
    condition: l.condition,
    price: l.price_fiat != null ? `$${Number(l.price_fiat).toFixed(0)}` : null,
    price_fiat: l.price_fiat,
    price_crypto: l.price_crypto,
    acceptedPayments: buildPaymentTypes(l),
    provider: l.provider_name || 'Anonymous',
    image: l.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&q=80&w=400&h=300',
    is_mock: l.is_mock || false,
    availability: l.availability || null,
    location_label: l.location_label || 'Ipê City',
    quantity: l.quantity || 1,
    unit: l.unit || null,
    duration_minutes: l.duration_minutes || null,
    is_remote: l.is_remote || false,
    isPublic: true,
  };
}
```

**d) Update `backend/server.js` — discover endpoint to accept filters:**

```js
app.get('/api/discover', async (req, res) => {
  const { category, subcategory, tags } = req.query;
  try {
    const [listings, hotIntents] = await Promise.all([
      getListings({
        limit: 50,
        category: category || null,
        subcategory: subcategory || null,
        tags: tags ? tags.split(',') : null,
      }),
      getHotIntents(),
    ]);
    // ... rest unchanged
  }
});
```

**e) Update `src/lib/api.js` — fetchDiscoverItems to forward filters:**

```js
export async function fetchDiscoverItems({ category, subcategory, tags } = {}) {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (tags && tags.length > 0) params.set('tags', tags.join(','));
    const url = `${API_URL}/discover${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Discover fetch failed');
    return await response.json();
  } catch (error) {
    console.error('fetchDiscoverItems error:', error);
    return { listings: [], trending: [], hotIntents: [] };
  }
}
```

**f) Update `src/components/DiscoverPage.jsx` — subcategory filter UI:**

Add subcategory filter pills below the main category filter. When a category is selected, show its subcategories. When a subcategory is clicked, pass it to the API.

```jsx
const SUBCATEGORIES = {
  Products:    ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Garden', 'Kitchen', 'Health'],
  Services:    ['Technology', 'Maintenance', 'Health & Wellness', 'Education', 'Creative', 'Legal', 'Transport', 'Beauty'],
  Knowledge:   ['Workshops', 'Courses', 'Mentoring', 'Language', 'Arts', 'Spirituality', 'Science'],
  Donations:   ['Clothes', 'Food', 'Furniture', 'Books', 'Other'],
  'Real Estate': ['For Sale', 'For Rent', 'Short-term', 'Land', 'Commercial'],
  Vehicles:    ['Cars', 'Motorcycles', 'Bikes', 'Boats', 'Electric', 'Parts'],
  'Food & Drink': ['Organic', 'Artisan', 'Subscriptions', 'Ready to Eat', 'Beverages'],
  Events:      ['Concerts', 'Sports', 'Workshops', 'Community', 'Markets'],
  Jobs:        ['Full-time', 'Part-time', 'Freelance', 'Remote', 'Internship'],
};
```

Add `activeSubFilter` state. When `activeFilter` changes, reset `activeSubFilter` to null.

Show subcategory pills row only when `activeFilter !== 'All'` and there are subcategories for that category.

On filter/subcategory change, call `loadData({ category: activeFilter, subcategory: activeSubFilter })`.

---

### 2.2 Protect Mock Data from Disappearing

**Root cause:** The primary key of `listings` is a UUID auto-generated with `DEFAULT gen_random_uuid()`. This means `ON CONFLICT DO NOTHING` in the INSERT statements has no effect on title/content — it only checks the PK, which is always new. Every time the seed SQL is run, duplicate rows are created. The listing IDs change, breaking references.

**Fix:** Use stable, explicit UUIDs for all mock listings so re-running the seed is truly idempotent.

Run this migration to add a unique constraint on `(session_id, title)` for mock data:

```sql
-- Add a stable identity column for mock listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS mock_key TEXT UNIQUE;

-- Backfill existing mock data with stable keys
UPDATE listings SET mock_key = lower(regexp_replace(title, '[^a-zA-Z0-9]', '-', 'g'))
WHERE is_mock = true AND mock_key IS NULL;

-- Now future inserts can use ON CONFLICT (mock_key) DO NOTHING
```

Update all INSERT statements in `backend/add_mock_listings.sql` and `backend/supabase_schema.sql` to:
1. Include the `mock_key` column in the INSERT
2. Change `ON CONFLICT DO NOTHING` to `ON CONFLICT (mock_key) DO NOTHING`

Example:
```sql
INSERT INTO listings (session_id, title, ..., mock_key) VALUES
  ('test-session-id', 'Electric Bike', ..., 'electric-bike'),
  ('ipe-farm-id', 'Bracatinga Honey 500g', ..., 'bracatinga-honey-500g'),
  ...
ON CONFLICT (mock_key) DO NOTHING;
```

Also update `backend/run_mock_seed.js` to use the updated SQL file.

---

## Phase 3 — Listing Detail Page (Pre-Checkout)

### 3.1 Create `ListingDetailPage.jsx`

Currently, clicking "Xchange" goes straight to `XchangeCheckout`. The `StepOverview` inside checkout is minimal. Instead, clicking a listing card should go to a dedicated detail page first, and only when the user clicks "Xchange" from there does it go to checkout.

**New file:** `src/components/ListingDetailPage.jsx`

This page receives the `listing` object and `onXchange` / `onBack` callbacks. It displays:

- Full-width hero image
- Title, provider, price badge
- Category + subcategory tags + condition badge
- Full description (not truncated)
- Tags array as filter pills
- Availability + location label
- Quantity / duration if applicable
- Remote badge if `is_remote`
- `trade_wants` section: "Seller is open to trading for: ..."
- Seller reputation bar (same as StepOverview in checkout)
- Payment methods accepted
- Large "Xchange" CTA button at bottom

**In `src/components/MainPortal.jsx`:**
- Import `ListingDetailPage` as a lazy-loaded component
- Add `'listing-detail'` to `OVERLAY_PAGES`
- When a listing card's Xchange is clicked, navigate to `listing-detail` with the listing as param
- From `ListingDetailPage`, clicking "Xchange" navigates to `checkout`

**Update `src/components/DiscoverPage.jsx`:**
Change `handleXchange` to navigate to `listing-detail` instead of `checkout`:
```jsx
const handleXchange = (listing) => {
  if (onNavigate) onNavigate('listing-detail', { listing, sourceTab: 'discover' });
};
```

**Update `src/components/ListingCard.jsx`:**
The button still says "⚡ Xchange" — but now it leads to the detail page, not checkout directly. No change needed to the card itself; just update the navigation in DiscoverPage.

---

## Phase 4 — Identity & Auth Improvements

### 4.1 Fix Agent Page Persistence

**Problem:** After the SyncScreen onboarding (where the user "connects their agent"), the AgentPage still shows `ConnectAgentScreen` because the onboarding flow doesn't write to the same localStorage key that `AgentPage` reads.

**Find `SyncScreen.jsx`** (`src/components/SyncScreen.jsx`) and locate its "Connect" or "Continue" action. Make it write:
```js
localStorage.setItem('ipeXchange_agentConnected', 'true');
```
before calling the `onComplete` callback.

Then find `ConnectAgentScreen.jsx` (`src/components/ConnectAgentScreen.jsx`) and ensure its connect action also writes:
```js
localStorage.setItem('ipeXchange_agentConnected', 'true');
```

Also ensure that `AgentPage` re-reads localStorage on tab focus (not just on mount) so navigation to the Agent tab always reflects current state:

In `src/components/AgentPage.jsx`, change the initial state to a regular variable checked with `useEffect`:
```jsx
const [connected, setConnected] = useState(
  () => localStorage.getItem('ipeXchange_agentConnected') === 'true'
);

// Re-check on every mount (navigation back to tab)
useEffect(() => {
  setConnected(localStorage.getItem('ipeXchange_agentConnected') === 'true');
}, []);
```

---

### 4.2 Demo Mode — Jean's Profile

Add a "Try Demo" button on the login screen that bypasses Privy and loads a pre-configured mock session as Jean (creator of Ipê City).

**In `src/components/LoginScreen.jsx`:**

Add a demo button below the Privy login button:
```jsx
<button 
  className="btn-secondary w-full" 
  style={{ marginTop: 12, borderColor: 'rgba(180,244,74,0.3)', color: '#B4F44A' }}
  onClick={onDemoLogin}
>
  <span>Try Demo — Jean's Profile</span>
</button>
```

**In `src/App.jsx` (or wherever `LoginScreen` is rendered):**

Create a `handleDemoLogin` function that:
1. Writes a `demoMode: true` flag to localStorage
2. Writes `ipeXchange_agentConnected: 'true'`
3. Calls the same `onLogin` handler as the real login

**Create a demo data context file `src/data/demoProfile.js`:**
```js
export const DEMO_USER = {
  displayName: 'Jean Prado',
  ensName: 'jean.ipecity.eth',
  walletAddress: '0x1234...abcd',
  ipeRepScore: 99,
  isDemoMode: true,
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100',
};

export const DEMO_WALLET_BALANCE = {
  ipe: 12500,
  usdc: 3200,
  eth: 1.42,
};

export const DEMO_LISTINGS = [
  // Jean's personal listings visible in "My Listings"
  { id: 'demo-l1', title: 'Personal Training (5 sessions)', category: 'Services', price: '$200', provider: 'Jean Prado', is_mock: true, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400&h=300', acceptedPayments: ['fiat', 'crypto', 'trade'], description: '5-session personal training. Strength, mobility, conditioning. All levels welcome.', },
  { id: 'demo-l2', title: 'Web3 Strategy Consulting', category: 'Services', price: '$350', provider: 'Jean Prado', is_mock: true, image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=400&h=300', acceptedPayments: ['crypto', 'trade'], description: 'Strategic consulting for Web3 projects, DAOs, and token economics. Founder of Ipê City.', },
];

export const DEMO_PURCHASES = [
  { id: 'demo-p1', title: 'Electric Standing Desk', provider: 'Ipê Workspace', price: '$380', date: '2026-04-22', txHash: '0x7f3a...d8c2' },
  { id: 'demo-p2', title: 'Artisan Sourdough Subscription', provider: 'Bread & Co', price: '$45', date: '2026-04-18', txHash: '0x2b1c...f4a9' },
];
```

**In `src/lib/UserContext.jsx`** (or wherever user context is defined):
Check for `localStorage.getItem('demoMode') === 'true'` and return `DEMO_USER` data instead of fetching from Privy/backend.

**In `src/components/ProfilePage.jsx`, `WalletPage.jsx`, `MyListingsPage.jsx`, `MyPurchasesPage.jsx`:**
Read from user context, which already handles demo mode via the context layer.

**Add a demo banner** to `MainPortal.jsx` when demo mode is active:
```jsx
{isDemoMode && (
  <div style={{ background: 'rgba(180,244,74,0.1)', borderBottom: '1px solid rgba(180,244,74,0.2)', padding: '8px 20px', fontSize: 12, color: '#B4F44A', textAlign: 'center' }}>
    Demo Mode — Browsing as Jean Prado (Ipê City Founder) · <button onClick={exitDemo} style={{ background: 'none', border: 'none', color: '#B4F44A', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>Exit Demo</button>
  </div>
)}
```

---

### 4.3 $IPE Balance — Mock with app.ipe.city context

Connecting to `https://app.ipe.city/` requires their API auth, which we don't have. For the demo, mock the $IPE balance in `WalletPage.jsx` to show a realistic number pulled from the logged-in user's identity.

**In `src/components/WalletPage.jsx`:**
- Replace any hardcoded $IPE balance with a value from user context
- For demo mode: use `DEMO_WALLET_BALANCE.ipe` (12,500 $IPE)
- For real users: show a realistic placeholder of `500 $IPE` with a note "Sync with Ipê City for real balance"
- Add a "Sync Balance" button that shows a spinner and a toast: "Sync with app.ipe.city coming soon"

**For the Wallet page wallet connections:**
Show cards for MetaMask, WalletConnect, Coinbase Wallet, Tangem. If the user connected via Privy with MetaMask, show MetaMask as "Connected" with their address. The others show "Connect" buttons that open a toast: "Connection via [wallet] coming soon."

---

## Phase 5 — Artizen Grants Page

### 5.1 Create Grants Page

**File:** `src/components/GrantsPage.jsx`

When "Explore Grants" is clicked in `InvestmentsPage.jsx`, navigate to this page.

The page shows mock Artizen-style grants registered in Ipê City:

```js
const ARTIZEN_GRANTS = [
  {
    id: 'g1',
    title: 'Community Solar Energy Network',
    owner: 'solarpower.ipecity.eth',
    category: 'Infrastructure',
    amount: '$25,000',
    deadline: 'May 15, 2026',
    raised: 62,
    description: 'Fund the installation of solar panels across the Ipê City community center, reducing energy costs for all residents by an estimated 40%.',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400&h=200',
    backers: 18,
    tags: ['Sustainability', 'Infrastructure', 'Community'],
  },
  {
    id: 'g2',
    title: 'Ipê City Open Source Marketplace',
    owner: 'ipehub.ipecity.eth',
    category: 'Technology',
    amount: '$15,000',
    deadline: 'June 1, 2026',
    raised: 38,
    description: 'Open-source the IpêXchange marketplace engine so other pop-up cities can fork and deploy their own local economies.',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400&h=200',
    backers: 24,
    tags: ['Open Source', 'Web3', 'Technology'],
  },
  {
    id: 'g3',
    title: 'Urban Permaculture Garden',
    owner: 'green-roots.ipecity.eth',
    category: 'Environment',
    amount: '$8,000',
    deadline: 'May 30, 2026',
    raised: 85,
    description: 'Create a 500m² permaculture garden in Ipê City for food production, workshops, and community gatherings.',
    image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=400&h=200',
    backers: 31,
    tags: ['Environment', 'Food', 'Community'],
  },
  {
    id: 'g4',
    title: 'Ipê City Documentary',
    owner: 'luna-foto.ipecity.eth',
    category: 'Culture',
    amount: '$12,000',
    deadline: 'June 15, 2026',
    raised: 20,
    description: 'A full documentary capturing the first edition of Ipê City — its residents, stories, trades, and vision for the future of human organization.',
    image: 'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&q=80&w=400&h=200',
    backers: 9,
    tags: ['Culture', 'Media', 'History'],
  },
];
```

Page layout:
- Header: "Grants & Crowdfunding" + "Powered by Artizen" badge
- Subtitle: "Community-funded projects in Ipê City"
- Grid of grant cards, each with: image, title, owner, category tag, description, progress bar (raised %), amount, deadline, backers count, "Back This Grant" button
- "Back This Grant" button opens a modal/toast: "Backing via Artizen — feature coming soon"
- Back button to return to Investments tab

**In `src/components/InvestmentsPage.jsx`:**
Find the "Explore Grants" button (line ~320) and update it to use `onNavigate`:
```jsx
<button onClick={() => onNavigate && onNavigate('grants')} ...>
  Explore Grants
</button>
```

**In `src/components/MainPortal.jsx`:**
- Import `GrantsPage` lazily
- Add `'grants'` to `OVERLAY_PAGES`
- Render `GrantsPage` when active, passing `onBack`

---

## Phase 6 — Listings Completeness: Chat Creation + Discover Visibility

### 6.1 Ensure User-Created Listings Appear in Discover

**Problem:** Listings created via chat should appear in Discover. They do get inserted into the DB with `active = true`. Verify the issue isn't a frontend display bug.

**Investigate in `backend/lib/supabase.js`:**
In `getListings`, the query fetches `active = true` listings ordered by `created_at DESC`. New listings should appear at the top. Ensure there's no silent error in `createListing` that prevents insertion.

**Add logging to `createListing` in `backend/server.js`:**
```js
console.log('✅ Listing created:', listing.id, listing.title);
```

**Fix in `src/components/DiscoverPage.jsx`:**
The `loadData` function is called only once on mount. After a listing is created via chat, the user may need to refresh the page. Add a "Refresh" button or auto-reload every 30 seconds when the user has an active session:

```jsx
useEffect(() => {
  const interval = setInterval(loadData, 30000);
  return () => clearInterval(interval);
}, []);
```

Also add a manual "Refresh" icon button in the discover header.

### 6.2 Richer Listing Creation via Chat

**File:** `backend/lib/gemini.js` (the `extractListing` function) and the Gemini system prompt in `backend/server.js`.

**Update the listing extraction system prompt** to request more fields:

In the Gemini system prompt for listing extraction (find the `LISTING_READY` section in `backend/server.js` or `backend/lib/gemini.js`), update the expected JSON structure to include:
```json
{
  "title": "string",
  "description": "string (at least 3 sentences)",
  "category": "Products | Services | Knowledge | Donations | Real Estate | Vehicles | Food & Drink | Events | Jobs",
  "subcategory": "string",
  "tags": ["array", "of", "relevant", "keywords"],
  "condition": "new | like_new | good | fair | for_parts (for Products only)",
  "price_fiat": "number in USD",
  "accepts_trade": "boolean",
  "trade_wants": "string — what the seller would accept in trade",
  "availability": "string — e.g. 'Weekends', 'Monday–Friday', 'Immediate'",
  "location_label": "string — e.g. 'Ipê City Hub', 'Remote', 'Central Park'",
  "is_remote": "boolean",
  "quantity": "number",
  "unit": "string — e.g. 'units', 'hours', 'kg', 'sessions'"
}
```

**Also update the chat's proactive question flow** in `backend/server.js` (the Gemini system prompt): instruct the AI to ask for missing fields one at a time before emitting `LISTING_READY: true`. The AI should confirm:
1. Title + description
2. Category + subcategory
3. Price in USD + accepts trade?
4. Condition (if product) + availability

---

## Phase 7 — Profile Page: Consistent Identity

### 7.1 Replace "Anon.ipecity.eth" with Real User Data

**File:** `src/components/ProfilePage.jsx`

The profile page currently shows "Anon.ipecity.eth" as a placeholder. It should use the user context data (from Privy login):

- Display name: use `user.displayName` or `user.ensName` or `user?.wallet?.address.slice(0,6) + '...' + address.slice(-4)`
- Avatar: use `user.avatar_url` or a generated identicon based on wallet address
- $IPE Rep Score: from `user.ipeRepScore` in the DB
- Wallet badge: show the connected wallet type (MetaMask, Email, etc.)

In `src/lib/UserContext.jsx` (or wherever `useUser` is defined), ensure the user profile is fetched from the backend after login and stored in context. The `getUserProfile` function in `backend/lib/supabase.js` already exists — make sure it's called after `upsertUser` on login.

**For demo mode:** Return `DEMO_USER` profile data from `src/data/demoProfile.js`.

---

## Execution Order

Run phases in this order. Each phase is independent except where noted.

```
Phase 1 → Immediate, no dependencies, do first
  1.1 Core Tip text fix
  1.2 Notifications crash fix  ← most impactful, blocks demos
  1.3 Donations category order
  1.4 Currency → USD

Phase 2 → DB migration, then backend, then frontend
  2.1 Schema expansion (DB → backend supabase.js → backend server.js → frontend api.js → frontend DiscoverPage.jsx)
  2.2 Mock data protection (DB migration first, then update seed SQL files)

Phase 3 → Requires Phase 2 new fields to be useful
  3.1 Listing detail page (new component + MainPortal routing)

Phase 4 → Independent from Phase 2/3
  4.1 Agent page fix
  4.2 Demo mode (Jean's profile)
  4.3 Wallet page improvements + $IPE balance

Phase 5 → Independent
  5.1 Artizen grants page

Phase 6 → Requires Phase 2.1 for new fields
  6.1 Discover visibility fix + auto-refresh
  6.2 Richer chat listing creation

Phase 7 → Requires user context to be working correctly
  7.1 Profile page identity
```

---

## Files Modified Summary

| File | Change |
|---|---|
| `src/components/HomePage.jsx` | Core Tip EN, Live Activity label EN, stat volume USD |
| `src/components/NotificationsPage.jsx` | Fix crash (icons in localStorage) |
| `src/components/DiscoverPage.jsx` | Donations last, subcategory filters, auto-refresh |
| `src/components/XchangeCheckout.jsx` | USD currency labels |
| `src/components/AgentPage.jsx` | Re-read localStorage on mount |
| `src/components/SyncScreen.jsx` | Write `ipeXchange_agentConnected` on connect |
| `src/components/ConnectAgentScreen.jsx` | Write `ipeXchange_agentConnected` on connect |
| `src/components/LoginScreen.jsx` | Add Demo Mode button |
| `src/components/InvestmentsPage.jsx` | Explore Grants → navigate to grants page |
| `src/components/ProfilePage.jsx` | Real user identity from context |
| `src/components/WalletPage.jsx` | $IPE balance, wallet connect cards |
| `src/components/MainPortal.jsx` | Add listing-detail and grants to routing |
| `src/components/ListingDetailPage.jsx` | **NEW** — full listing detail before checkout |
| `src/components/GrantsPage.jsx` | **NEW** — Artizen grants page |
| `src/data/demoProfile.js` | **NEW** — Jean's demo profile data |
| `src/lib/api.js` | fetchDiscoverItems with filter params |
| `src/lib/UserContext.jsx` | Demo mode support |
| `backend/server.js` | Discover endpoint with filters, richer listing extraction prompt |
| `backend/lib/supabase.js` | getListings with new fields + filters, mapListingToFrontend |
| `backend/supabase_schema.sql` | currency DEFAULT USD, mock_key field |
| `backend/add_mock_listings.sql` | mock_key stable IDs, ON CONFLICT (mock_key) |

---

## What NOT to Do

- Don't mock DB/API calls — use real Supabase data
- Don't change 'Ipê City' to 'Jurerê' or 'Florianópolis'
- Don't add TypeScript
- Don't create features beyond what's listed here
- Don't drop or truncate any tables — only ADD columns and INSERT with ON CONFLICT
- Don't add unnecessary error handling for cases that can't happen
- All user-facing text must be in English
