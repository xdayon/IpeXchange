# IpêXchange — Platform Improvements V3
**15 items · Filed 2026-04-29 · For execution by Gemini**

---

## Item 1 — Discover page crashes to blank screen

**Root cause:** `DiscoverPage.jsx` renders a `<Suspense>`-lazy component tree; any unhandled runtime error (e.g., a `ListingCard` receiving `undefined` for a required prop, or `getSoldProductIds()` throwing) will silently blank the page because there is no error boundary wrapping the lazy-loaded tab.

**Files:** `src/components/DiscoverPage.jsx`, `src/components/MainPortal.jsx`

**Steps:**

1. In `MainPortal.jsx` line ~258, wrap each lazy tab in an inline error boundary or use a shared one:
   ```jsx
   // Add a tiny ErrorBoundary class component at top of MainPortal.jsx
   class TabBoundary extends React.Component {
     state = { error: null };
     static getDerivedStateFromError(e) { return { error: e }; }
     render() {
       if (this.state.error) return (
         <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
           <p>Something went wrong loading this page.</p>
           <button onClick={() => this.setState({ error: null })} className="btn-secondary" style={{ marginTop: 16 }}>
             Retry
           </button>
         </div>
       );
       return this.props.children;
     }
   }
   ```
   Wrap each `{tab === 'discover' && <DiscoverPage ... />}` with `<TabBoundary key={tab}>...</TabBoundary>`.

2. In `DiscoverPage.jsx:44`, the `loadData` function catches API errors but sets `listings = []` via `data.listings || []` — that is fine. However, `ListingCard` may crash if listing fields are `null`. Add a guard in `DiscoverPage.jsx` before rendering:
   ```js
   const safeListings = available.filter(l => l && l.id && l.title);
   ```
   Then use `safeListings` in the render instead of `available`.

3. Verify `getSoldProductIds()` from `xchangeStore.js` never throws — it already has a `read(KEYS.soldProducts, [])` default, so it should be safe.

4. If the API itself is returning a 500 (Supabase not connected), add a visible error state in `DiscoverPage.jsx`:
   ```jsx
   const [fetchError, setFetchError] = useState(null);
   // in loadData catch block: setFetchError('Could not reach the marketplace. Try again.')
   // in render, show: {fetchError && <p style={{color:'#F43F5E'}}>{fetchError}</p>}
   ```

---

## Item 2 — Live Activity feed: replace hardcoded data with real listings

**File:** `src/components/HomePage.jsx`

**Current state:** `LIVE_FEED` constant (lines 8–16) is a hardcoded array with stale items (MacBook, Electric Bike).

**Steps:**

1. Remove the `LIVE_FEED` constant entirely.

2. Add import at top:
   ```js
   import { fetchDiscoverItems } from '../lib/api';
   ```

3. Add state + effect inside `HomePage`:
   ```js
   const [liveFeed, setLiveFeed] = useState([]);

   useEffect(() => {
     fetchDiscoverItems({}).then(data => {
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
       setLiveFeed(items);
     });
   }, []);
   ```

4. In the JSX, replace `LIVE_FEED.map(...)` with `liveFeed.map(...)`. If `liveFeed.length === 0`, render a skeleton placeholder (3–4 grey shimmer rows).

5. The `Store` and `Network` icons from lucide are already imported — add `Zap, Users, MapPin, TrendingUp` to the import list if not present.

---

## Item 3 — Village Demands: real AI-generated gap analysis

**Strategy:** Two-phase approach:
- **Phase A (immediate, for demo):** Pseudo-random rotation from a large hardcoded pool, seeded by the current day, so it changes daily and looks live.
- **Phase B (ideal, post-demo):** Backend endpoint that calls Gemini with current listings as context to infer real city gaps.

### Phase A — Day-seeded rotation (implement now)

**File:** `src/data/mockData.js`, `src/components/HomePage.jsx`

1. In `mockData.js`, expand `mockDemands` from 4 items to ~12 diverse items covering different categories and urgency levels. Examples to add:
   - Yoga/meditation instructor (Services, Medium)
   - Bulk organic vegetables for community kitchen (Products, High)
   - Electric vehicle charging station (Infrastructure, High)
   - Legal aid for small business permits (Services, Medium)
   - Photography services for city events (Services, Low)
   - Childcare / babysitting collective (Services, High)
   - Mushroom foraging guide (Knowledge, Low)
   - Bicycle repair workshop (Services, Medium)

2. In `HomePage.jsx`, replace the direct `mockDemands.map(...)` render with:
   ```js
   const todaysSeed = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
   const shuffled = [...mockDemands].sort((a, b) =>
     (a.id + todaysSeed).localeCompare(b.id + todaysSeed)
   );
   const visibleDemands = shuffled.slice(0, 4);
   ```
   Render `visibleDemands` instead of `mockDemands`.

3. Add a "Last analyzed today" caption below the section title:
   ```jsx
   <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
     · Last analyzed {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
   </span>
   ```

### Phase B — Gemini live analysis (implement post-demo)

**Files:** `backend/server.js`, `src/lib/api.js`, `src/components/HomePage.jsx`

1. Add backend route `GET /api/city-demands`:
   - Calls `getListings({ limit: 50 })` to get current supply.
   - Calls Gemini Flash with prompt:
     > "You are the city intelligence engine of Ipê City. Given these active listings (supply), identify 4 significant unmet demands or market gaps in the community. Return a JSON array with fields: title, category, urgency (High/Medium/Low), tags (array), description."
   - Cache the result in a module-level variable with a 6-hour TTL to avoid re-calling Gemini on every page load.
   - Returns `{ demands: [...], generatedAt: ISO_STRING }`.

2. Add `fetchCityDemands()` to `src/lib/api.js`.

3. In `HomePage.jsx`, call `fetchCityDemands()` in a `useEffect` and fall back to `mockDemands` if the API fails.

---

## Item 4 — Artizen Grants: "Explore Grants" button opens a real modal

**File:** `src/components/InvestmentsPage.jsx`

**Current state:** The "Explore Grants" button (line 319) has no `onClick`. Clicking it does nothing.

**Steps:**

1. Add `useState` for the grants modal: `const [showGrants, setShowGrants] = useState(false)`.

2. Wire the button: `onClick={() => setShowGrants(true)}`.

3. Create an `ArtizenGrantsModal` component (inline in `InvestmentsPage.jsx` above `InvestmentsPage`):

   ```jsx
   const ArtizenGrantsModal = ({ onClose }) => (
     <div className="modal-overlay" onClick={onClose}>
       <div className="modal-box glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '85vh', overflowY: 'auto' }}>
         {/* Header */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
           <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
               <h3 style={{ fontSize: 22, fontWeight: 800 }}>Grants & Crowdfunding</h3>
               <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: '#38BDF8', color: '#000', fontWeight: 800 }}>POWERED BY ARTIZEN</span>
             </div>
             <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
               Art, science, and technology projects through match funding and NFT-based Artifacts — local projects from Ipê City.
             </p>
           </div>
           <button className="btn-icon" onClick={onClose}><X size={22} /></button>
         </div>

         {/* Project cards */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           {ARTIZEN_PROJECTS.map(p => (
             <div key={p.id} className="glass-panel" style={{ padding: '20px 24px', border: `1px solid ${p.color}30` }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                 <div>
                   <span style={{ fontSize: 11, color: p.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{p.type}</span>
                   <h4 style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{p.title}</h4>
                   <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>by {p.creator}</p>
                 </div>
                 <div style={{ textAlign: 'right', flexShrink: 0 }}>
                   <p style={{ fontSize: 18, fontWeight: 800, color: p.color }}>{p.raised}</p>
                   <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>of {p.goal} goal</p>
                 </div>
               </div>
               <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>{p.description}</p>
               <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                 <div style={{ height: '100%', width: `${p.percent}%`, background: `linear-gradient(to right, ${p.color}88, ${p.color})`, borderRadius: 4 }} />
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                   {p.tags.map(t => <span key={t} className="store-tag">{t}</span>)}
                 </div>
                 <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: p.color, background: `${p.color}10`, border: `1px solid ${p.color}30`, borderRadius: 100, padding: '6px 16px', cursor: 'pointer' }}>
                   Back Project <ArrowUpRight size={13} />
                 </button>
               </div>
             </div>
           ))}
         </div>
       </div>
     </div>
   );
   ```

4. Render `{showGrants && <ArtizenGrantsModal onClose={() => setShowGrants(false)} />}` at the bottom of `InvestmentsPage` JSX.

---

## Item 5 — New "Loans" tab in Investments

**File:** `src/components/InvestmentsPage.jsx`

**Steps:**

1. Add `'Loans'` to the `FILTERS` array (after `'Donations'`).

2. Create `LoanCard` component (inline, above `InvestmentsPage`):

   ```jsx
   const LoanCard = ({ loan }) => (
     <div className="glass-panel invest-card" style={{ borderLeft: '3px solid #B4F44A' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
         <div>
           <span style={{ fontSize: 11, color: '#B4F44A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>P2P Loan Request</span>
           <h3 style={{ fontSize: 17, fontWeight: 700, margin: '6px 0 4px' }}>{loan.title}</h3>
           <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{loan.borrower}</p>
         </div>
         <div style={{ textAlign: 'right', flexShrink: 0 }}>
           <p style={{ fontSize: 20, fontWeight: 800, color: '#B4F44A' }}>{loan.amount}</p>
           <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{loan.rate} APY</p>
         </div>
       </div>
       <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>{loan.description}</p>
       <div className="invest-financials" style={{ marginBottom: 14 }}>
         <div className="invest-stat"><span className="invest-stat-label">Term</span><span className="invest-stat-value">{loan.term}</span></div>
         <div className="invest-stat"><span className="invest-stat-label">Collateral</span><span className="invest-stat-value">{loan.collateral}</span></div>
         <div className="invest-stat"><span className="invest-stat-label">Rep Score</span><span className="invest-stat-value" style={{ color: '#B4F44A' }}>{loan.repScore}</span></div>
       </div>
       <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
         {loan.badges.map(b => (
           <span key={b} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)' }}>
             <Lock size={9} style={{ display: 'inline', marginRight: 3 }} />{b}
           </span>
         ))}
       </div>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
         <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>On-chain smart contract</span>
         <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#B4F44A', background: 'rgba(180,244,74,0.1)', border: '1px solid rgba(180,244,74,0.3)', borderRadius: 100, padding: '6px 16px', cursor: 'pointer' }}>
           Lend Now <ArrowUpRight size={13} />
         </button>
       </div>
     </div>
   );
   ```

3. Update the filtered render section: when `filter === 'Loans'`, render `LOAN_REQUESTS.map(l => <LoanCard key={l.id} loan={l} />)` instead of `OPPORTUNITIES.map(...)`.

4. Update the `filtered` variable logic:
   ```js
   const filtered = filter === 'Loans' ? [] : (filter === 'All' ? OPPORTUNITIES : OPPORTUNITIES.filter(o => o.type === filter));
   const showLoans = filter === 'Loans';
   ```
   Then in JSX:
   ```jsx
   {showLoans
     ? LOAN_REQUESTS.map(l => <LoanCard key={l.id} loan={l} />)
     : filtered.map(opp => <OpportunityCard key={opp.id} opp={opp} onInvest={handleInvest} />)
   }
   ```

---

## Item 6 — Mock data: Artizen projects + Loan requests (do NOT delete existing data)

**File:** `src/components/InvestmentsPage.jsx` — add two new constant arrays above the existing `OPPORTUNITIES` array.

### `ARTIZEN_PROJECTS` array (insert before `OPPORTUNITIES`):

```js
const ARTIZEN_PROJECTS = [
  {
    id: 'ag1', type: 'Science', color: '#818CF8',
    title: 'Bioluminescent Urban Garden',
    creator: 'lucia.bio.ipecity.eth',
    description: 'Genetically engineered plants that glow at night to illuminate public walkways, reducing electricity costs and creating a living art installation in Ipê City commons.',
    raised: '$8,400', goal: '$15,000', percent: 56,
    tags: ['BioTech', 'Urban Design', 'Science', 'NFT Artifact'],
  },
  {
    id: 'ag2', type: 'Art', color: '#F472B6',
    title: 'Sounds of Ipê — Generative Music Archive',
    creator: 'soundsofipe.eth',
    description: 'An on-chain archive of field recordings from Ipê City, transformed into generative musical pieces. Each donor mints a unique Artifact NFT with their name embedded in the composition.',
    raised: '$3,200', goal: '$8,000', percent: 40,
    tags: ['Music', 'NFT', 'Generative Art', 'Archive'],
  },
  {
    id: 'ag3', type: 'Technology', color: '#38BDF8',
    title: 'Open-Source Mesh Comms for City Events',
    creator: 'meshnet.ipecity.eth',
    description: 'Building a Meshtastic LoRa mesh network for offline communication during Ipê City gatherings. Hardware + firmware fully open-sourced. Backers receive a node kit.',
    raised: '$11,750', goal: '$20,000', percent: 59,
    tags: ['Open Source', 'Hardware', 'LoRa', 'Community Tech'],
  },
  {
    id: 'ag4', type: 'Art', color: '#F59E0B',
    title: 'Murals of the Future — Community Street Art',
    creator: 'ipewalls.eth',
    description: 'Commissioning 6 large-scale murals by local and international artists across Ipê City public spaces. Each wall is tokenized as an NFT co-owned by backers.',
    raised: '$5,600', goal: '$12,000', percent: 47,
    tags: ['Street Art', 'Public Space', 'NFT', 'Community'],
  },
];
```

### `LOAN_REQUESTS` array (insert after `ARTIZEN_PROJECTS`):

```js
const LOAN_REQUESTS = [
  {
    id: 'l1',
    title: 'Ipê Bakery Equipment Upgrade',
    borrower: 'marina.ipecity.eth',
    amount: '$4,200',
    rate: '3.5%',
    term: '12 months',
    collateral: 'Business NFT + Rep 98',
    repScore: 98,
    description: 'Financing a new commercial oven and display case. 3 years of on-chain verified sales history. Monthly installments via smart contract.',
    badges: ['ZKP Verified', 'Auto-Repay', 'Reputation Backed'],
  },
  {
    id: 'l2',
    title: 'Solar Panel Installation — 3 Homes',
    borrower: 'greenhood.ipecity.eth',
    amount: '$9,000',
    rate: '4.0%',
    term: '24 months',
    collateral: 'Property Title NFT',
    repScore: 94,
    description: 'Group loan for three neighboring homes to install a shared solar panel system. Shared energy savings cover repayment within 18 months.',
    badges: ['Eco Project', 'Smart Contract', 'Group Collateral'],
  },
  {
    id: 'l3',
    title: 'Mobile Wellness Studio Setup',
    borrower: 'yogaflow.ipecity.eth',
    amount: '$2,800',
    rate: '3.0%',
    term: '6 months',
    collateral: 'Reputation Score 91',
    repScore: 91,
    description: 'Purchasing a portable massage table, yoga mats, and sound equipment to run sessions across city venues. Already has 22 confirmed client bookings.',
    badges: ['Low Rate', 'Short Term', 'ZKP Identity'],
  },
  {
    id: 'l4',
    title: 'Artisan Ceramics Workshop — Kiln Purchase',
    borrower: 'clayhands.ipecity.eth',
    amount: '$6,500',
    rate: '4.2%',
    term: '18 months',
    collateral: 'Equipment + 4 NFT pieces',
    repScore: 89,
    description: 'Expanding a ceramics studio with a second electric kiln. The studio already sells through IpêXchange and local markets. NFT artworks provided as partial collateral.',
    badges: ['Arts & Crafts', 'NFT Collateral', 'Verified'],
  },
];
```

---

## Item 7 — Multi-hop trade: expand demo cycles beyond 3-hop

**Root cause:** The `find_trade_cycles()` SQL function in Supabase was seeded with cycles tied to `test-session-id`. The demo fallback in `CircularTradePage.jsx` (line 23) already fetches `test-session-id` cycles when the real session has none — so cycles do appear. The limitation is that the seed only contains 3-node (3-hop) cycles.

**Files:** `backend/add_mock_listings.sql` (or a new migration), `backend/run_mock_seed.js`

**Steps:**

1. Create a new SQL file `backend/add_mock_cycles.sql` that inserts listings for additional sessions (`alice-session`, `bob-session`, `carol-session`, `dave-session`) and then ensures the `find_trade_cycles` function can find 4-hop and 5-hop cycles starting from `test-session-id`.

   The key: `find_trade_cycles` traces `demands → matching listings` across sessions. To get 4-hop, we need a chain:
   - `test-session-id` offers X, wants Y
   - `alice-session` offers Y, wants Z
   - `bob-session` offers Z, wants W
   - `carol-session` offers W, wants X (closes the 4-hop loop)

   Insert ~3 complete 4-hop chains and ~2 complete 5-hop chains covering different categories (e.g., Tech Services → Wellness → Food → Art → back to Tech).

2. Add the categories and `trade_wants` fields correctly so the vector similarity (`1 - (embedding <=> query_embedding) > 0.65`) finds the matches. Since we don't have real embeddings for mock data, check the current SQL: if `embedding IS NULL` bypasses the threshold check, the chains will resolve. If not, insert placeholder embeddings (zero vectors or call the backend embedding API for each).

3. After adding cycles data, update `backend/run_mock_seed.js` to also run `add_mock_cycles.sql` so future reseeds include it.

4. In `CircularTradePage.jsx`, if cycles still show only 3-hop, also check the hop filter UI (line 53): the `filter` state might be set to `3` by default. Change the initial filter to `'All'` so all hops are shown on load.

---

## Item 8 — Demo Login: Jean Hansen founder profile

**Goal:** A single button on the login screen that bypasses Privy and loads a richly pre-populated demo session for Jean Hansen, Founder of Ipê City.

### Frontend — LoginScreen.jsx

1. Below the existing `<button className="btn-primary w-full pulse-btn" onClick={login}>` block (line 43), add:

   ```jsx
   <button
     onClick={handleDemoLogin}
     style={{ marginTop: 12, width: '100%', padding: '12px', borderRadius: 100, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
     onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(180,244,74,0.4)'; e.currentTarget.style.color = '#B4F44A'; }}
     onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
   >
     ✦ Demo Login — Jean Hansen, Ipê City Founder
   </button>
   ```

2. Define `handleDemoLogin` inside `LoginScreen`:
   ```js
   const handleDemoLogin = () => {
     localStorage.setItem('ipeXchangeState', 'portal');
     localStorage.setItem('ipeXchange_demoMode', 'true');
     localStorage.setItem('ipeXchange_agentConnected', 'true');
     localStorage.setItem('ipeCoreSessionId', 'jean-hansen-demo-session');
     onLogin();
   };
   ```

### Demo profile data — new file `src/data/demoProfile.js`

Create `src/data/demoProfile.js` with Jean Hansen's full profile:

```js
export const DEMO_USER = {
  isDemoMode: true,
  displayName: 'jean',
  email: 'jean.hansen@ipecity.eth',
  walletAddress: '0xJean...0001',
  shortWallet: '0xJean...0001',
  xchangeUser: {
    id: 'jean-hansen-demo',
    display_name: 'jean.hansen',
    wallet_address: '0xJEAN0000000001',
    reputation_score: 99,
    total_trades: 47,
    total_listings: 12,
    member_since: '2024-01-15',
    badges: ['Founder', 'Top Trader', 'ZKP Pioneer', 'Ipê Ambassador'],
    bio: 'Founder of Ipê City. Building the most advanced pop-up innovation city in Latin America.',
  },
};

export const DEMO_WALLETS = [
  { id: 'metamask', label: 'MetaMask', sub: '0xJean...0001', color: '#F6851B', emoji: '🦊', connected: true },
  { id: 'coinbase', label: 'Coinbase Wallet', sub: '0x4c2b...a91f', color: '#0052FF', emoji: '🔵', connected: true },
];

export const DEMO_LISTINGS = [
  { id: 'jl1', title: 'Smart Contract Architecture Consulting', category: 'Services', subcategory: 'Technology', priceFiat: 300, priceCrypto: null, acceptsTrade: true, tradeWants: 'Design services or branding', providerName: 'jean.hansen', description: 'Senior Web3 architect with 8 years of Solidity experience. Audit, design, and deploy custom smart contracts for your Ipê business.', condition: null, tags: ['Web3', 'Smart Contracts', 'Consulting'], imageUrl: null },
  { id: 'jl2', title: 'ZKP Workshop — Zero-Knowledge Proofs for Builders', category: 'Knowledge', subcategory: 'Workshops', priceFiat: 150, priceCrypto: 0.05, acceptsTrade: true, tradeWants: 'Any service listing', providerName: 'jean.hansen', description: '3-hour hands-on workshop on ZKP fundamentals and practical use cases. Max 12 participants. Certificate on-chain.', condition: null, tags: ['ZKP', 'Cryptography', 'Workshop'], imageUrl: null },
  { id: 'jl3', title: 'City Innovation Strategy — 1:1 Mentoring', category: 'Knowledge', subcategory: 'Mentoring', priceFiat: 200, priceCrypto: null, acceptsTrade: false, tradeWants: null, providerName: 'jean.hansen', description: 'Personal mentoring sessions on building regenerative city ecosystems, tokenized governance, and post-capital communities.', condition: null, tags: ['Mentoring', 'City Planning', 'Innovation'], imageUrl: null },
  { id: 'jl4', title: 'Open-Source Governance Toolkit (Digital)', category: 'Products', subcategory: 'Electronics', priceFiat: 50, priceCrypto: 0.02, acceptsTrade: true, tradeWants: 'Books or courses', providerName: 'jean.hansen', description: 'Digital toolkit: templates, smart contract code, and governance frameworks developed during Ipê City phase 1.', condition: 'New', tags: ['Governance', 'Open Source', 'DAO'], imageUrl: null },
];

export const DEMO_PURCHASES = [
  { id: 'jp1', listing: { title: 'Organic Honey — 1kg jar', category: 'Products' }, date: '2026-04-20', amount: '$18', status: 'Completed' },
  { id: 'jp2', listing: { title: 'Graphic Design — Brand Identity', category: 'Services' }, date: '2026-04-15', amount: 'Trade', status: 'Completed' },
  { id: 'jp3', listing: { title: 'Yoga Session — 1 hour', category: 'Services' }, date: '2026-04-08', amount: '$60', status: 'Completed' },
  { id: 'jp4', listing: { title: 'Urban Farming Workshop', category: 'Knowledge' }, date: '2026-03-28', amount: '$90', status: 'Completed' },
  { id: 'jp5', listing: { title: 'Artisan Ceramic Bowl', category: 'Products' }, date: '2026-03-14', amount: 'Trade', status: 'Completed' },
];

export const DEMO_REPUTATION = {
  overall: 99,
  categories: [
    { label: 'Reliability', score: 100 },
    { label: 'Communication', score: 99 },
    { label: 'Trade Ethics', score: 98 },
    { label: 'Expertise', score: 100 },
  ],
  webOfTrust: [
    { name: 'marina.ipecity.eth', score: 98, relationship: 'Trade partner' },
    { name: 'ipehub.ipecity.eth', score: 99, relationship: 'Collaborator' },
    { name: 'soliditydev.ipecity.eth', score: 92, relationship: 'Student' },
    { name: 'biofarm.ipecity.eth', score: 95, relationship: 'Trade partner' },
    { name: 'dayonx.ipecity.eth', score: 95, relationship: 'Co-founder' },
  ],
};
```

### UserContext.jsx — demo mode injection

In `UserContext.jsx`, after the existing state declarations, add:

```js
// Demo mode bypass — reads from localStorage flag
const isDemoMode = localStorage.getItem('ipeXchange_demoMode') === 'true';
```

If `isDemoMode`, expose the `DEMO_USER` values directly from the context instead of the Privy-derived values. Wrap `syncUser` and Privy calls in `if (!isDemoMode)` guards so they don't fire.

Expose `isDemoMode` in the context value object.

### Multi-hop for Jean Hansen

In `CircularTradePage.jsx` (line 16):
```js
const sessionId = localStorage.getItem('ipeCoreSessionId') || 'test-session-id';
```
The demo session is stored as `'jean-hansen-demo-session'`. Add a row of mock listings to the DB seed (via `add_mock_listings.sql`) under session_id `'jean-hansen-demo-session'` that mirrors `DEMO_LISTINGS`, ensuring `find_trade_cycles` can find cycles for this session too (or simply fall through to the existing `test-session-id` fallback).

---

## Item 9 — Passport logo: replace PNG screenshot with proper SVG component

**File:** `src/components/LoginScreen.jsx` (line 27), `public/passport-logo.png`

**Current:** `<img src="/passport-logo.png" style={{ width: 80, height: 80, borderRadius: 20 }} />`

**Goal:** Replicate the dark square tile with gradient background + white fingerprint icon as an inline JSX component.

**Steps:**

1. Replace the `<img src="/passport-logo.png">` at line 27 with an inline SVG/JSX component:

   ```jsx
   <div style={{
     width: 80, height: 80, borderRadius: 20,
     background: 'linear-gradient(135deg, #1a2a1a 0%, #1a3a1a 40%, #2a4a2a 100%)',
     display: 'flex', alignItems: 'center', justifyContent: 'center',
     boxShadow: '0 0 0 1px rgba(56,189,248,0.2), 0 8px 32px rgba(0,0,0,0.4)',
     position: 'relative', overflow: 'hidden',
   }}>
     {/* Subtle gradient overlay for depth */}
     <div style={{
       position: 'absolute', inset: 0,
       background: 'radial-gradient(ellipse at 30% 30%, rgba(56,189,248,0.12) 0%, transparent 70%)',
     }} />
     {/* Fingerprint SVG from ipe-passport.svg */}
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

2. The `Fingerprint` lucide import in `LoginScreen.jsx:2` is no longer needed after this — remove it if unused.

3. Do **not** delete `public/passport-logo.png` immediately; only remove the `<img>` reference.

---

## Item 10 — SyncScreen: update to new agent image

**File:** `src/components/SyncScreen.jsx`

**Current:** Line 3: `import personalAgentImg from '../assets/personal_agent.png';`

**Fix:**
1. Change import to: `import personalAgentImg from '../assets/agent_bot.svg';`
2. No other changes needed — the `<img>` at line 52 already uses `personalAgentImg`.

---

## Item 11 — AgentPage: fix name/disconnect overlap

**File:** `src/components/AgentPage.jsx`

**Current state (lines 39–58):** The Disconnect button uses `position: absolute, top: 16, right: 16` inside `.agent-status-hero`. The agent name `<h2>` is inside a sibling `<div>` — on narrow viewports, the absolute button overlays the name text.

**Fix:** Restructure the hero section layout:

Replace the current hero div with a two-row layout:

```jsx
<div className="agent-status-hero" style={{ position: 'relative' }}>
  {/* Top row: title + disconnect button side by side */}
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 }}>
    <h2 style={{ fontSize: '26px', margin: 0 }}>
      Your <span className="text-gradient-cyan">Personal Agent</span>
    </h2>
    <button onClick={handleDisconnect} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
      <Power size={13} /> Disconnect
    </button>
  </div>

  {/* Bottom row: avatar + identity info */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
    <div className="agent-avatar-container floating-animation" style={{ width: 100, height: 100, flexShrink: 0 }}>
      <img src={personalAgentImg} alt="Agent" className="agent-image" />
      <div className="glow-ring" />
    </div>
    <div>
      <p style={{ color: 'var(--text-secondary)', marginTop: 0, marginBottom: 10 }}>dx.agent.aihaus.ipe</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="tag badge" style={{ color: '#B4F44A', borderColor: 'rgba(180,244,74,0.3)', background: 'rgba(180,244,74,0.08)' }}>
          <Activity size={12} style={{ display: 'inline', marginRight: 4 }} /> Online
        </span>
        <span className="tag badge" style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.08)' }}>
          <ShieldCheck size={12} style={{ display: 'inline', marginRight: 4 }} /> ZKP Active
        </span>
      </div>
    </div>
  </div>
</div>
```

Remove the `position: absolute` from the button entirely.

---

## Item 12 — Command Center: skill card redesign + icon colors + rename to Core + HUD improvements

**Files:** `src/components/AgentCommandCenter.jsx`, `src/index.css`

### 12a — Rename to "Core Command Center" and swap HUD avatar

In `AgentCommandCenter.jsx`:

1. Line 217: Change `Agent Command Center` → `Core Command Center`.
2. Line 230: Change `<img src={personalAgentImg}` to `<img src={xchangeCoreImg}` (already imported as `xchangeCoreImg` on line 3).
3. Lines 255–257: Change the message stream avatar from `personalAgentImg` to `xchangeCoreImg`.
4. Line 307: Change the typing indicator avatar from `personalAgentImg` to `xchangeCoreImg`.

### 12b — Add more HUD stats

Replace the existing `acc-hud-stats` block (lines 233–246) with:

```jsx
<div className="acc-hud-stats">
  <div className="acc-hud-stat">
    <span className="label">Identity</span>
    <span className="value">{displayName || 'Anon'}</span>
  </div>
  <div className="acc-hud-stat">
    <span className="label">Status</span>
    <span className="value text-gradient-lime">ZKP Active</span>
  </div>
  <div className="acc-hud-stat">
    <span className="label">Memory</span>
    <span className="value">1.4 GB</span>
  </div>
  <div className="acc-hud-stat">
    <span className="label">Session</span>
    <span className="value" style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
      {sessionId ? sessionId.slice(0, 8) + '…' : '—'}
    </span>
  </div>
  <div className="acc-hud-stat">
    <span className="label">Network</span>
    <span className="value" style={{ color: '#B4F44A' }}>Ipê City</span>
  </div>
  <div className="acc-hud-stat">
    <span className="label">Msg Count</span>
    <span className="value">{messages.length}</span>
  </div>
</div>
```

### 12c — Skill card visual redesign + unique icon colors

In `AgentCommandCenter.jsx`, update the `SKILLS` array to include a unique `color` per skill:

```js
const SKILLS = [
  { label: 'Market Insight',   icon: <Activity size={18} />,  color: '#B4F44A', desc: 'Trending offers today',          prompt: "Show me what's trending in the city today" },
  { label: 'Price Estimator',  icon: <Zap size={18} />,       color: '#F59E0B', desc: 'Get fair value advice',           prompt: 'I need help pricing something I want to sell' },
  { label: 'Trade Finder',     icon: <ArrowRight size={18} />, color: '#38BDF8', desc: 'Suggest swap matches',            prompt: 'What interesting trades do you suggest for me?' },
  { label: 'Multi-Hop Loop',   icon: <Network size={18} />,   color: '#818CF8', desc: 'Deep liquidity search',           prompt: 'Search for circular multi-hop trade opportunities in the ecosystem' },
  { label: 'Knowledge Hub',    icon: <Brain size={18} />,     color: '#F472B6', desc: 'List your workshops',             prompt: 'I want to publish a course or workshop I teach' },
  { label: 'Service Catalog',  icon: <Database size={18} />,  color: '#34D399', desc: 'Offer your professional skills',  prompt: 'I want to list a therapy or wellness service' },
];
```

Update the skill card render to pass color:

```jsx
{SKILLS.map((skill) => (
  <button key={skill.label} className="acc-skill-card" onClick={() => handleSendMessage(skill.prompt)} disabled={isTyping}>
    <div className="skill-icon" style={{ background: `${skill.color}15`, border: `1px solid ${skill.color}30` }}>
      <span style={{ color: skill.color }}>{skill.icon}</span>
    </div>
    <div className="skill-info">
      <span className="skill-label">{skill.label}</span>
      <span className="skill-desc">{skill.desc}</span>
    </div>
  </button>
))}
```

In `index.css`, update `.acc-skill-card` and `.skill-icon`:

```css
.acc-skill-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  text-align: left;
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);   /* was missing border */
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);      /* subtle depth */
  transition: all 0.18s ease;
}

.acc-skill-card:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.18);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
}

.skill-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* background and border now set inline per skill */
}
```

---

## Item 13 — CTA button overlap with input bar

**File:** `src/index.css` and `src/components/AgentCommandCenter.jsx`

**Root cause:** The `.acc-stream` scrollable area has no bottom padding, so the last message's CTA button (`chat-cta-btn`) can scroll under the fixed `.acc-input-bar`.

**Fix in `index.css`:**

```css
/* Find .acc-stream (around line 3841) and add: */
.acc-stream {
  /* existing styles... */
  padding-bottom: 24px;   /* add this line */
}
```

Additionally, in `AgentCommandCenter.jsx`, ensure the CTA button renders inside the message bubble area with `margin-top: 10px` and does not position itself outside the scroll container.

If the `.acc-input-bar` is `position: sticky` or `position: absolute`, verify it has a `z-index` higher than the stream but that the stream content still scrolls beneath it (use `overflow: hidden` on the panel, `overflow-y: auto` only on `.acc-stream-container`).

---

## Item 14 — Mic button: make it primary + expand soundwave

**File:** `src/index.css`

### Mic button prominence

Find `.acc-action-btn` (around line 3984) and update:

```css
.acc-action-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #B4F44A;                                      /* lime accent instead of secondary */
  background: rgba(180, 244, 74, 0.1);                 /* subtle lime fill */
  border: 1.5px solid rgba(180, 244, 74, 0.35);        /* visible border */
  box-shadow: 0 0 12px rgba(180, 244, 74, 0.15);       /* soft glow */
  transition: all 0.2s ease;
}

.acc-action-btn:hover {
  background: rgba(180, 244, 74, 0.2);
  box-shadow: 0 0 20px rgba(180, 244, 74, 0.3);
  transform: scale(1.05);
}
```

### Soundwave expansion

Find `.acc-wave` (around line 4023) and update:

```css
.acc-wave {
  flex: 1;
  height: 56px;           /* was 40px — taller for elegance */
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 0 8px;
}
```

Find `.wave-bar` (around line 1035) and ensure the bars used inside `.acc-wave` are tall:

```css
.acc-wave .wave-bar {
  width: 3px;
  border-radius: 3px;
  background: linear-gradient(to top, rgba(180,244,74,0.4), #B4F44A);
  animation: wave-anim 1.2s ease-in-out infinite;
  min-height: 6px;
  max-height: 44px;       /* allow taller peaks */
}
```

Also increase the number of wave bars from 12 to 20 in `AgentCommandCenter.jsx` line ~341:
```jsx
{[...Array(20)].map((_, i) => <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.07}s` }} />)}
```

---

## Item 15 — FAB button label vs panel title

This is already addressed in **Item 12a** above. Summary:

- **FAB button** in `MainPortal.jsx` (the floating action button): keep its label as **"Command Center"** — it is already correct.
- **Panel title** inside `AgentCommandCenter.jsx` line 217: change `"Agent Command Center"` → **`"Core Command Center"`** — this is the fix.
- The subtitle / description below the header (if any): can add `"Powered by Xchange Core · ZKP secured"` in small text below the title for extra context.

---

## Execution order recommendation

Run items in this sequence to avoid dependency issues:

1. **Item 10** (SyncScreen image) — 1 line change, zero risk
2. **Item 1** (Discover crash + error boundary) — unblocks all discover testing
3. **Item 9** (Passport logo SVG) — pure visual, isolated
4. **Item 11** (AgentPage layout) — isolated CSS/layout change
5. **Item 15 + 12** (Core Command Center rename + skill redesign) — combined pass on AgentCommandCenter
6. **Item 13** (CTA overlap) — CSS only
7. **Item 14** (Mic + soundwave) — CSS + minor JSX
8. **Item 2** (Live Activity real data) — requires working Discover/API
9. **Item 3** (Village Demands rotation) — data layer only
10. **Item 6** (Mock data arrays) — adds arrays to InvestmentsPage, no deletions
11. **Item 4** (Artizen modal) — depends on Item 6 data
12. **Item 5** (Loans tab) — depends on Item 6 data
13. **Item 7** (Multi-hop cycles expansion) — DB migration, test carefully
14. **Item 8** (Demo Login Jean Hansen) — largest change, do last to avoid breaking auth flow
