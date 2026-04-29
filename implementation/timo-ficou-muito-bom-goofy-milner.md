# IpêXchange — Platform Fixes v4
**6 items · Diagnosed from live codebase · Ready for execution**

---

## Context

Six interconnected issues affecting the demo-readiness of IpêXchange:
1. Discover page blank — duplicate backend route shadows the correct handler
2. Config page blank — missing lucide imports cause a render crash
3. Login logo gradient needs improvement + page not vertically centered
4. Guest/demo mode incomplete — Jean Hansen profile shows zeros, no purchases
5. Live Activity feed empty — depends on Fix 1 being resolved
6. Core AI has no awareness of stores — sends users to Discover when stores exist for what they need

---

## Fix 1 — Remove duplicate `/api/discover` route

**File:** `backend/server.js`

**Problem:** Two handlers registered for `GET /api/discover`. Express uses the first one (lines 166–186), which is the inferior version — no hot-intents cross-reference, wrong response shape. The correct handler is at lines 218–252.

**Change:** Delete lines 166–186 (the first handler block including its comment header):

```
// Lines 166–186 to delete:
// ─── Get listings ─────────────────────────────────────────────────────────────

app.get('/api/discover', async (req, res) => {
  const { category, subcategory, tags } = req.query;
  try {
    const listings = await getListings({ category, subcategory, tags });
    console.log(`[Diagnostic] /api/discover: ...`);
    let trending = [];
    if (!category || category === 'All') {
      trending = await getHotIntents();
      console.log(`[Diagnostic] trending found: ...`);
    }
    res.json({ listings, trending });
  } catch (error) {
    console.error('Discover API error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});
```

After deletion, line 165 (`});` closing the POST /api/listings handler) is followed immediately by the `// ─── Semantic search ─────` block at line 188. The correct `/api/discover` handler at line 218 becomes the only handler.

**No other changes.**

---

## Fix 2 — ConfigPage missing lucide imports

**File:** `src/components/ConfigPage.jsx`

**Problem:** File starts with `import React, { useState } from 'react';` — no lucide-react import. Component uses 10 icons which are all undefined at runtime → ReferenceError → error boundary triggers.

**Change:** Insert as line 2 (after the React import, before the `seedMockData` import):

```js
import { Sliders, RefreshCw, Database, CheckCircle2, AlertCircle, Shield, Bot, Bell, Network, Key } from 'lucide-react';
```

Final top 4 lines of the file:
```js
import React, { useState } from 'react';
import { Sliders, RefreshCw, Database, CheckCircle2, AlertCircle, Shield, Bot, Bell, Network, Key } from 'lucide-react';
import { seedMockData } from '../lib/api';
import { useUser } from '../lib/UserContext';
```

**No other changes.**

---

## Fix 3 — Login page: logo gradient + vertical centering

### 3a — Vertical centering

**File:** `src/App.jsx`

The `<main className="main-content">` wrapping `LoginScreen` has `paddingTop: 40px` from its CSS class, pushing the card down. Override it inline only for the login state:

```jsx
// Change (around line 48):
{appState === 'login' && (
  <div className="app-layout">
    <main className="main-content" style={{ paddingTop: 0, display: 'flex', flex: 1 }}>
      <LoginScreen onLogin={() => handleSetAppState('agent')} />
    </main>
  </div>
)}
```

Also update `.onboarding-screen` in `src/index.css` (find the existing rule) to use full viewport height:
```css
.onboarding-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
}
```

### 3b — Logo gradient (closer to original dark tile with blue-green edge glow)

**File:** `src/components/LoginScreen.jsx`

Replace the outer `<div>` of the passport logo tile (the `width:80, height:80` container) with:

```jsx
<div style={{
  width: 80, height: 80, borderRadius: 20,
  background: 'linear-gradient(145deg, #080C14 0%, #0B1421 35%, #0d1f2d 65%, #0a1a1a 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 0 0 1px rgba(56,189,248,0.35), 0 0 24px rgba(56,189,248,0.15), 0 8px 32px rgba(0,0,0,0.6)',
  position: 'relative', overflow: 'hidden',
}}>
  <div style={{
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 20% 20%, rgba(56,189,248,0.22) 0%, rgba(0,180,140,0.08) 40%, transparent 70%)',
  }} />
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
    background: 'linear-gradient(to top, rgba(56,189,248,0.07) 0%, transparent 100%)',
  }} />
  <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none"
    stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ position: 'relative', zIndex: 1 }}>
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
    <path d="M2 12a10 10 0 0 1 18-6" />
    <path d="M2 16h.01" />
    <path d="M21.8 16c.2-2 .131-5.354 0-6" />
    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
  </svg>
</div>
```

Key design: base is deep navy-black (`#080C14`), blue-cyan radial glow at top-left corner, subtle bottom reflection, strong cyan border glow via `box-shadow`.

---

## Fix 4 — Demo mode: Jean Hansen complete profile

Four sub-steps in order.

### 4a — Create `src/data/demoProfile.js` (new file)

Full static mock profile for Jean Hansen. Shape of `DEMO_USER` must match what `fetchUserProfile` returns (fields: `id`, `wallet_address`, `display_name`, `ipe_rep_score`, `rep_score`, `total_tx`, `listing_count`, plus extended demo-only fields). Shape of `DEMO_PURCHASES` entries must match what `getPurchases()` returns from `xchangeStore.js` (fields: `id`, `listing`, `paymentMethod`, `txHash`, `date`, `status`). Shape of `DEMO_LISTINGS` entries must match what `getMyListings()` returns (fields: `id`, `title`, `category`, `type`, `acceptedPayments`, `price`, `description`, `isPublic`, `status`, `views`, `inquiries`, `image`, `createdAt`).

```js
// src/data/demoProfile.js

export const DEMO_USER = {
  id: 'demo-jean-hansen-001',
  wallet_address: '0x73a4f8b2E9cD1F3a5B7c2d8E4f0A6b3C9e1D2f5A',
  display_name: 'Jean Hansen',
  email: null,
  privy_id: 'demo-privy-jean',
  ipe_rep_score: 99,
  rep_score: 99,
  total_tx: 47,
  listing_count: 12,
  purchase_count: 31,
  sales_count: 16,
  created_at: '2023-06-01T10:00:00Z',
  last_seen: new Date().toISOString(),
  bio: 'Co-founder of Ipê City. Web3 builder, circular economy advocate, and full-stack developer. Trading inside community economies since 2018. Here to trade code for wellness, knowledge for tools, and build the city from the inside out.',
  badges: [
    { id: 'founder',     label: 'City Co-Founder',   color: '#F59E0B', icon: '🏛️' },
    { id: 'earlytrader', label: 'Early Trader',       color: '#B4F44A', icon: '🌱' },
    { id: 'toptrader',   label: 'Top Trader 2024',    color: '#38BDF8', icon: '🏆' },
    { id: 'zkpioneer',   label: 'ZK Pioneer',         color: '#818CF8', icon: '🔐' },
    { id: 'multihop',    label: 'Multi-Hop Master',   color: '#F472B6', icon: '🔄' },
  ],
  web_of_trust: [
    { name: 'Layla M.',  wallet: '0xA1b2...C3d4', rep: 91, relation: 'Direct trade partner' },
    { name: 'Tomás R.',  wallet: '0xE5f6...G7h8', rep: 87, relation: '3 completed swaps'    },
    { name: 'Sun Wei',   wallet: '0xI9j0...K1l2', rep: 95, relation: 'Knowledge exchange'   },
    { name: 'Priya K.',  wallet: '0xM3n4...O5p6', rep: 78, relation: 'Service provider'     },
    { name: 'Carlos A.', wallet: '0xQ7r8...S9t0', rep: 83, relation: 'Co-listed product'    },
  ],
};

export const DEMO_LISTINGS = [
  { id: 'jl1',  title: 'Full-Stack Web3 Development',         category: 'Services',   type: 'Service',  acceptedPayments: ['fiat','crypto','trade'], price: '$120/day',    description: 'React, Node, Solidity, Supabase. 18 on-chain projects delivered. Available for 2-week sprints.',                            isPublic: true,  status: 'active',  views: 284, inquiries: 17, image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*60).toISOString() },
  { id: 'jl2',  title: 'Circular Economy Workshop (3h)',       category: 'Knowledge',  type: 'Service',  acceptedPayments: ['fiat','trade','ipe'],    price: '$45/person',  description: 'Barter networks, multi-hop trades, local currency design. Saturdays at AI Haus.',                                        isPublic: true,  status: 'active',  views: 156, inquiries: 9,  image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*45).toISOString() },
  { id: 'jl3',  title: 'MacBook Pro M2 14" (2023)',            category: 'Products',   type: 'Product',  acceptedPayments: ['crypto','trade'],        price: '$1,600',      description: 'M2 Pro, 16GB RAM, 512GB SSD, Space Gray. Pristine. Trade for high-end camera or audio gear.',                             isPublic: true,  status: 'active',  views: 412, inquiries: 23, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*7).toISOString()  },
  { id: 'jl4',  title: 'Smart Contract Security Audit',        category: 'Services',   type: 'Service',  acceptedPayments: ['crypto','ipe'],          price: '$300/contract',description: 'Manual + automated audit. Full report + fix recommendations. 3-day turnaround.',                                       isPublic: true,  status: 'active',  views: 98,  inquiries: 6,  image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*30).toISOString() },
  { id: 'jl5',  title: 'Permaculture Design Consultation',     category: 'Services',   type: 'Service',  acceptedPayments: ['fiat','trade'],          price: '$60/hour',    description: 'Urban garden and small-farm design. Zone analysis, water harvesting, companion planting.',                                 isPublic: true,  status: 'active',  views: 73,  inquiries: 4,  image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*20).toISOString() },
  { id: 'jl6',  title: 'Vintage Roland SH-101 Synthesizer',    category: 'Products',   type: 'Product',  acceptedPayments: ['crypto','trade'],        price: '$900',        description: 'Classic analog monosynth, serviced 2022. Will trade for high-end lenses or woodworking tools.',                              isPublic: true,  status: 'active',  views: 201, inquiries: 14, image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*14).toISOString() },
  { id: 'jl7',  title: 'PT-BR → EN Tech Translation',          category: 'Knowledge',  type: 'Service',  acceptedPayments: ['fiat','ipe'],            price: '$0.08/word',  description: 'Technical docs, whitepapers, smart contract specs. 24h delivery under 2,000 words.',                                      isPublic: true,  status: 'active',  views: 45,  inquiries: 3,  image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*10).toISOString() },
  { id: 'jl8',  title: 'DJI Mini 3 Pro Drone',                 category: 'Products',   type: 'Product',  acceptedPayments: ['fiat','crypto'],         price: '$650',        description: 'RC controller, 3 batteries, original case. Under 50 flights. Perfect for real estate.',                                  isPublic: true,  status: 'paused',  views: 87,  inquiries: 5,  image: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*3).toISOString()  },
  { id: 'jl9',  title: '1:1 ZK Proof Mentorship',              category: 'Knowledge',  type: 'Service',  acceptedPayments: ['crypto','ipe','trade'],  price: '$80/hour',    description: 'Personal ZKP mentorship: circom circuits, groth16, practical stack. Zoom or in-person at Hub.',                          isPublic: true,  status: 'active',  views: 62,  inquiries: 7,  image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*25).toISOString() },
  { id: 'jl10', title: 'Kombucha Starter Kit + 2L First Batch',category: 'Donations',  type: 'Service',  acceptedPayments: ['trade','ipe'],           price: 'Pay what you want', description: 'SCOBY + 2L first ferment + printed guide. Great for home fermentation starters.',                                  isPublic: true,  status: 'active',  views: 38,  inquiries: 11, image: 'https://images.unsplash.com/photo-1600718374662-0483d2b9da44?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*5).toISOString()  },
  { id: 'jl11', title: 'Freelance DevOps — CI/CD & Docker',    category: 'Services',   type: 'Service',  acceptedPayments: ['fiat','crypto'],         price: '$90/hour',    description: 'GitHub Actions, Docker Compose, Render/Railway deploys. Full pipeline in one session.',                                  isPublic: false, status: 'paused',  views: 19,  inquiries: 2,  image: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*18).toISOString() },
  { id: 'jl12', title: 'Antique Leica M6 Film Camera',         category: 'Products',   type: 'Product',  acceptedPayments: ['crypto','trade'],        price: '$1,200',      description: 'Leica M6 TTL 0.72 silver chrome + 50mm Summicron f/2. Traded through 4 Ipê citizens.',                                  isPublic: false, status: 'sold',    views: 334, inquiries: 28, image: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&q=80&w=400&h=300', createdAt: new Date(Date.now()-86400000*90).toISOString() },
];

export const DEMO_PURCHASES = [
  { id: 'dp1', listing: { id: 'ext1', title: 'Vinyasa Yoga — 10 Class Pack',       provider: 'Sol Studio',       category: 'Services',  type: 'Service',  price: '$120', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=300', description: 'Flow yoga with Priya K.' },          paymentMethod: 'ipe',    txHash: '0x4a8f2c...e91b', date: new Date(Date.now()-86400000*2).toISOString(),  status: 'confirmed' },
  { id: 'dp2', listing: { id: 'ext2', title: 'Sony WH-1000XM5 Headphones',         provider: 'Layla M.',         category: 'Products',  type: 'Product',  price: '$280', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400&h=300', description: 'Best-in-class noise cancelling.' }, paymentMethod: 'trade',  txHash: '0x7d3c1a...b44f', date: new Date(Date.now()-86400000*8).toISOString(),  status: 'confirmed' },
  { id: 'dp3', listing: { id: 'ext3', title: 'Deep Tissue Massage (90 min)',        provider: 'Carlos A.',        category: 'Services',  type: 'Service',  price: '$75',  image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=400&h=300', description: 'Sport and therapeutic massage.' },   paymentMethod: 'crypto', txHash: '0xb29e4d...c11a', date: new Date(Date.now()-86400000*15).toISOString(), status: 'confirmed' },
  { id: 'dp4', listing: { id: 'ext4', title: 'ZK Proofs Crash Course (4h)',         provider: 'Sun Wei',          category: 'Knowledge', type: 'Service',  price: '$160', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400&h=300', description: 'Intensive ZKP fundamentals.' },      paymentMethod: 'trade',  txHash: '0xf05c9e...2d87', date: new Date(Date.now()-86400000*21).toISOString(), status: 'confirmed' },
  { id: 'dp5', listing: { id: 'ext5', title: 'Single-Origin Coffee (1 month sub)', provider: 'Terra Café',       category: 'Products',  type: 'Service',  price: '$40',  image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400&h=300', description: 'Weekly 250g single-origin beans.' }, paymentMethod: 'ipe',    txHash: '0xa17d3b...8f22', date: new Date(Date.now()-86400000*30).toISOString(), status: 'confirmed' },
  { id: 'dp6', listing: { id: 'ext6', title: 'DAO Legal Structure Consultation',   provider: 'Tomás R.',         category: 'Services',  type: 'Service',  price: '$200', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400&h=300', description: '2h session + written summary.' },     paymentMethod: 'fiat',   txHash: '0xc88e1f...5a63', date: new Date(Date.now()-86400000*45).toISOString(), status: 'confirmed' },
  { id: 'dp7', listing: { id: 'ext7', title: 'Debt: The First 5,000 Years (signed)',provider: 'Community Library',category: 'Donations', type: 'Service',  price: 'Free', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400&h=300', description: 'David Graeber — pass it on.' },         paymentMethod: 'trade',  txHash: '0xe33b7c...9d01', date: new Date(Date.now()-86400000*60).toISOString(), status: 'confirmed' },
];
```

### 4b — Inject demo user into UserContext

**File:** `src/lib/UserContext.jsx`

Add import after line 15 (`import { upsertUser, fetchUserProfile } from './api';`):
```js
import { DEMO_USER } from '../data/demoProfile';
```

Add a new `useEffect` immediately before the existing Privy-based `useEffect` (which is around line 71):
```js
// Demo mode: populate xchangeUser from static profile without Privy
useEffect(() => {
  if (localStorage.getItem('ipeXchange_demoSession')) {
    setXchangeUser(DEMO_USER);
    setInitialized(true);
  }
}, []); // runs once on mount only
```

The existing `syncUser` guards on `if (!authenticated || !privyUser) return` — in demo mode both are falsy, so it is a safe no-op.

### 4c — MyPurchasesPage: show demo purchases

**File:** `src/components/MyPurchasesPage.jsx`

Add import after line 7 (`import { getPurchases, clearPurchases } from '../data/xchangeStore';`):
```js
import { DEMO_PURCHASES } from '../data/demoProfile';
```

Replace the `useEffect` at lines 191–193:
```js
// BEFORE:
useEffect(() => {
  setPurchases(getPurchases());
}, []);

// AFTER:
useEffect(() => {
  const isDemo = !!localStorage.getItem('ipeXchange_demoSession');
  setPurchases(isDemo ? DEMO_PURCHASES : getPurchases());
}, []);
```

### 4d — MyListingsPage: show Jean Hansen listings

**File:** `src/components/MyListingsPage.jsx`

Add import after line 8 (`import { getMyListings, toggleListingStatus, markListingAsSold } from '../data/xchangeStore';`):
```js
import { DEMO_LISTINGS } from '../data/demoProfile';
```

Replace the `useEffect` at lines 197–199:
```js
// BEFORE:
useEffect(() => {
  setListings(getMyListings());
}, []);

// AFTER:
useEffect(() => {
  const isDemo = !!localStorage.getItem('ipeXchange_demoSession');
  setListings(isDemo ? DEMO_LISTINGS : getMyListings());
}, []);
```

---

## Fix 5 — Live Activity: error handling + empty-state fallback

**File:** `src/components/HomePage.jsx`

The `useEffect` at lines 28–44 already has the correct fetch + transform logic and is already implemented. The **only missing piece** is error handling and an empty-state fallback (if `listings` is empty or the API is unreachable, the skeleton shows indefinitely).

Replace the `useEffect` (lines 28–44) with a version that adds cleanup + fallback:

```js
useEffect(() => {
  let cancelled = false;
  fetchDiscoverItems({})
    .then(data => {
      if (cancelled) return;
      const items = (data.listings || []).slice(0, 7).map((l, i) => ({
        icon: l.category === 'Services' ? <Zap size={14} /> :
              l.category === 'Knowledge' ? <Users size={14} /> :
              l.category === 'Donations' ? <MapPin size={14} /> : <TrendingUp size={14} />,
        color: l.category === 'Services' ? '#B4F44A' :
               l.category === 'Knowledge' ? '#818CF8' :
               l.category === 'Donations' ? '#F43F5E' : '#38BDF8',
        text: l.acceptsTrade
          ? `${l.title} — accepts trade`
          : `New listing: ${l.title}${l.priceFiat ? ` — $${l.priceFiat}` : ''}`,
        time: i === 0 ? '2m' : i === 1 ? '5m' : `${(i + 1) * 4}m`,
      }));
      setLiveFeed(items.length > 0 ? items : [
        { icon: <TrendingUp size={14} />, color: '#B4F44A', text: 'Marketplace is live — be the first to list!', time: 'now' },
      ]);
    })
    .catch(() => {
      if (!cancelled) setLiveFeed([
        { icon: <TrendingUp size={14} />, color: '#38BDF8', text: 'Live feed connecting...', time: 'now' },
      ]);
    });
  return () => { cancelled = true; };
}, []);
```

This fix only has visible effect after Fix 1 is deployed (the duplicate route caused the API to return empty results).

---

## Fix 6 — Core AI: inject stores into Gemini context + extend CTA routing

Four sub-steps.

### 6a — server.js: fetch stores alongside listings

**File:** `backend/server.js`

Replace line 84:
```js
// BEFORE:
const contextListings = await getListings({ limit: 20 });

// AFTER:
const [contextListings, contextStores] = await Promise.all([
  getListings({ limit: 20 }),
  getStores(),
]);
```

Replace line 90:
```js
// BEFORE:
const response = await chat(history, message, audioBase64, mimeType, contextListings);

// AFTER:
const response = await chat(history, message, audioBase64, mimeType, contextListings, contextStores);
```

`getStores` is already imported (confirm it's in the import list at the top; if not, add it alongside the other supabase imports).

### 6b — gemini.js: inject stores into system prompt + extend CTA protocol

**File:** `backend/lib/gemini.js`

**Step 1 — Update `SYSTEM_PROMPT` CTA format lines (lines 33–35):**
```
// BEFORE:
CTA_ACTION: [discover|checkout|investments|circular|home|none]
CTA_LABEL: [Short button label]

// AFTER:
CTA_ACTION: [discover|checkout|investments|circular|home|stores|store-detail|none]
CTA_LABEL: [Short button label]
CTA_STORE_ID: [store UUID, only when CTA_ACTION is store-detail — otherwise omit this line]
```

**Step 2 — Update `chat()` function signature (line 76):**
```js
// BEFORE:
export async function chat(history, userMessage, audioBase64 = null, mimeType = null, contextListings = null) {

// AFTER:
export async function chat(history, userMessage, audioBase64 = null, mimeType = null, contextListings = null, contextStores = null) {
```

**Step 3 — Inject stores after the existing listings injection (after line 86):**
```js
// ADD after the listings injection block (after line 86):
if (contextStores && contextStores.length > 0) {
  const storesSummary = contextStores
    .slice(0, 8)
    .map(s => `- ${s.name} [${s.category}] rep:${s.reputation_score || '?'} id:${s.id}`)
    .join('\n');
  systemPrompt += `\n\nActive stores in the city (use id for CTA_STORE_ID when routing to a store):\n${storesSummary}`;
}
```

**Step 4 — Parse `CTA_STORE_ID` from response (lines 123–142):**

Replace line 123:
```js
// BEFORE:
const ctaActionMatch = rawText.match(/CTA_ACTION:\s*(\w+)/i);

// AFTER:
const ctaActionMatch  = rawText.match(/CTA_ACTION:\s*([\w-]+)/i);
```

Add after line 124 (`const ctaLabelMatch = ...`):
```js
const ctaStoreIdMatch = rawText.match(/CTA_STORE_ID:\s*([^\s\n]+)/i);
```

Replace lines 131–136 (cta object construction):
```js
// BEFORE:
if (ctaActionMatch && ctaActionMatch[1] !== 'none') {
  cta = {
    tab:   ctaActionMatch[1].toLowerCase(),
    label: ctaLabelMatch ? ctaLabelMatch[1].trim() : 'View more',
  };
}

// AFTER:
if (ctaActionMatch && ctaActionMatch[1] !== 'none') {
  cta = {
    tab:     ctaActionMatch[1].toLowerCase(),
    label:   ctaLabelMatch ? ctaLabelMatch[1].trim() : 'View more',
    storeId: ctaStoreIdMatch ? ctaStoreIdMatch[1].trim() : null,
  };
}
```

Add `CTA_STORE_ID` to the text cleanup block (lines 138–142):
```js
text = rawText
  .replace(/CTA_ACTION:.*$/im, '')
  .replace(/CTA_LABEL:.*$/im, '')
  .replace(/CTA_STORE_ID:.*$/im, '')   // ADD THIS LINE
  .replace(/LISTING_READY:.*$/im, '')
  .trim();
```

### 6c — AgentCommandCenter.jsx: pass storeId in CTA navigation

**File:** `src/components/AgentCommandCenter.jsx`

Replace `handleCTA` (lines 198–203):
```js
// BEFORE:
const handleCTA = (cta) => {
  if (cta && onNavigate) {
    onNavigate(cta.tab, null);
    onClose();
  }
};

// AFTER:
const handleCTA = (cta) => {
  if (cta && onNavigate) {
    const params = (cta.tab === 'store-detail' && cta.storeId)
      ? { storeId: cta.storeId }
      : null;
    onNavigate(cta.tab, params);
    onClose();
  }
};
```

### 6d — MainPortal.jsx + StoreDetailPage.jsx: accept storeId param

**File:** `src/components/MainPortal.jsx`

Find the `tab === 'store-detail'` render condition (currently `navParams?.store`). Update the condition to also accept `navParams?.storeId`:
```jsx
// BEFORE:
{tab === 'store-detail' && navParams?.store && (
  ...
    <StoreDetailPage
      store={navParams.store}
      ...
    />
  ...
)}

// AFTER:
{tab === 'store-detail' && (navParams?.store || navParams?.storeId) && (
  ...
    <StoreDetailPage
      store={navParams.store || null}
      storeId={navParams.storeId || null}
      ...
    />
  ...
)}
```

**File:** `src/components/StoreDetailPage.jsx`

`StoreDetailPage` already has its own data fetching for products (confirmed — it uses `FALLBACK_CATALOG` keyed by store UUID). Add a self-fetch `useEffect` at the top of the component for when `storeId` is provided without a full `store` object:

```js
// Add storeId to props destructuring:
const StoreDetailPage = ({ store, storeId, onBack, onXchange }) => {
  const [resolvedStore, setResolvedStore] = useState(store || null);

  useEffect(() => {
    if (!resolvedStore && storeId) {
      fetch(`/api/stores`)
        .then(r => r.json())
        .then(data => {
          const found = (data.stores || []).find(s => s.id === storeId);
          if (found) setResolvedStore(found);
        })
        .catch(() => {});
    }
  }, [storeId, resolvedStore]);

  // Replace all references to `store` prop with `resolvedStore` in the component body
  // ...
```

Everywhere the component uses `store.name`, `store.id`, etc., replace with `resolvedStore?.name`, `resolvedStore?.id`, etc. Add a loading state: if `!resolvedStore`, show a spinner or skeleton.

---

## Execution order

| Step | Fix | Files touched |
|------|-----|---------------|
| 1 | **Fix 1** — Delete duplicate route | `backend/server.js` lines 166–186 |
| 2 | **Fix 2** — Add lucide import | `src/components/ConfigPage.jsx` line 2 |
| 3 | **Fix 3** — Login centering + gradient | `src/App.jsx`, `src/index.css`, `src/components/LoginScreen.jsx` |
| 4 | **Fix 4a** — Create demoProfile.js | `src/data/demoProfile.js` (new) |
| 5 | **Fix 4b** — UserContext demo branch | `src/lib/UserContext.jsx` |
| 6 | **Fix 4c** — MyPurchasesPage demo | `src/components/MyPurchasesPage.jsx` |
| 7 | **Fix 4d** — MyListingsPage demo | `src/components/MyListingsPage.jsx` |
| 8 | **Fix 5** — HomePage live feed cleanup | `src/components/HomePage.jsx` |
| 9 | **Fix 6a** — server.js fetch stores | `backend/server.js` lines 84, 90 |
| 10 | **Fix 6b** — gemini.js prompt + CTA | `backend/lib/gemini.js` lines 33–35, 76, 86, 123–142 |
| 11 | **Fix 6c** — AgentCommandCenter CTA | `src/components/AgentCommandCenter.jsx` lines 198–203 |
| 12 | **Fix 6d** — MainPortal + StoreDetailPage | `src/components/MainPortal.jsx`, `src/components/StoreDetailPage.jsx` |

---

## Verification

1. **Fix 1:** Navigate to Discover tab → listings appear. Refresh → no blank screen.
2. **Fix 2:** Navigate to Config tab → settings page renders without error.
3. **Fix 3:** Open login page → card is centered vertically on all viewport heights. Logo tile looks dark navy with blue-cyan glow edge.
4. **Fix 4:** Click "Enter as Guest (Demo Mode)" → lands on portal. Check Profile page → shows rep 99, 47 trades, badges, web of trust. Check Wallet → My Listings shows 12 Jean Hansen listings. Check Wallet → My Purchases shows 7 purchases.
5. **Fix 5:** Open Home tab after Fix 1 is live → Live Activity sidebar shows real listing titles from the DB.
6. **Fix 6:** Open Core Command Center → type "I want to watch a movie tonight" → agent mentions Ipê Cinema and offers a CTA button "View Cinema" → clicking it opens `StoreDetailPage` for the cinema directly.
