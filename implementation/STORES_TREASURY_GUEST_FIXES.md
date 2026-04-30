# Stores no Mapa + Treasury Page + Guest Profile + P2P Loans

**Status:** Pronto para execução  
**Demo deadline:** 2026-05-01  
**Estimated effort:** ~2.5 horas  

---

## DIAGNÓSTICOS

| Bug | Causa | Arquivo |
|-----|-------|---------|
| P2P Loans crash | `Wallet` não importado em `InvestmentsPage.jsx` | InvestmentsPage.jsx |
| Guest profile vazio (rep, nome, activity) | Privy `!authenticated` sobrescreve DEMO_USER com `null` | UserContext.jsx |
| Lojas não aparecem no mapa | Supabase stores não têm `location_lat/lng` → `deterministicCoords` aleatório | cityGraphBuilder.js |

---

## ETAPA 1 — Correções Críticas (15 minutos)

### 1.1 — `backend/lib/cityGraphBuilder.js` — Rename + Store Locations

**Mudança A — Renomear Privacy Haus → Artizen Haus:**

Localizar e substituir:
```js
{ id: 'venue-privacy-haus', layer: 'commerce', label: 'Privacy Haus', description: 'ZK and cryptography builders space. Smart contract audits and security research.', location: { lat: -27.44166, lon: -48.50434 }, kind: 'venue' },
```
Por:
```js
{ id: 'venue-artizen-haus', layer: 'commerce', label: 'Artizen Haus', description: 'ZK, cryptography and regenerative design hub. Smart contract audits, security research and bio-design workshops.', location: { lat: -27.44166, lon: -48.50434 }, kind: 'venue' },
```

Nos STATIC_EDGES, atualizar todas as referências a `venue-privacy-haus`:
```js
{ id: 'e-marina-privacy',  source: 'citizen-marina', target: 'venue-privacy-haus', ... },
{ id: 'e-founder-privacy', source: 'venue-founder-haus', target: 'venue-privacy-haus', ... },
```
Por:
```js
{ id: 'e-marina-artizen',  source: 'citizen-marina',      target: 'venue-artizen-haus', relationship: 'uses',         label: 'Practitioner' },
{ id: 'e-founder-artizen', source: 'venue-founder-haus',  target: 'venue-artizen-haus', relationship: 'sister-venue', label: 'Sister Venue' },
```

**Mudança B — Coordenadas explícitas para as lojas reais:**

Adicionar antes de `function listingToEntity(listing)` (início do arquivo, depois de `const BBOX`):

```js
// Explicit map coordinates for known stores (matched by Supabase UUID).
// Prevents stores from landing in random positions via deterministicCoords.
const KNOWN_STORE_LOCATIONS = {
  'a1000000-0000-0000-0000-000000000001': { lat: -27.44580, lon: -48.50100 }, // Ipê Bakery
  'a1000000-0000-0000-0000-000000000002': { lat: -27.44810, lon: -48.50350 }, // Ipê City Motors
  'a1000000-0000-0000-0000-000000000003': { lat: -27.44200, lon: -48.49680 }, // Ipê Cinema
  'a1000000-0000-0000-0000-000000000004': { lat: -27.44700, lon: -48.50480 }, // Organic Market
  'a1000000-0000-0000-0000-000000000005': { lat: -27.44340, lon: -48.50730 }, // Ipê Health Clinic
  'a1000000-0000-0000-0000-000000000006': { lat: -27.44160, lon: -48.50560 }, // Studio Creative
  'a1000000-0000-0000-0000-000000000007': { lat: -27.43850, lon: -48.49760 }, // Ipê City Surf Shop
  'a1000000-0000-0000-0000-000000000008': { lat: -27.44480, lon: -48.49820 }, // Wine & Cheese Ipê
  'a1000000-0000-0000-0000-000000000009': { lat: -27.44130, lon: -48.50540 }, // Ipê Tech Store
  'a1000000-0000-0000-0000-000000000010': { lat: -27.44650, lon: -48.50250 }, // Bio Market
};
```

Atualizar `storeToEntity` para usar as coordenadas conhecidas:

Localizar:
```js
function storeToEntity(store) {
  const location = (store.location_lat && store.location_lng)
    ? { lat: store.location_lat, lon: store.location_lng }
    : deterministicCoords(store.id);
```

Substituir por:
```js
function storeToEntity(store) {
  const location = (store.location_lat && store.location_lng)
    ? { lat: store.location_lat, lon: store.location_lng }
    : KNOWN_STORE_LOCATIONS[store.id]
    || deterministicCoords(store.id);
```

---

### 1.2 — `src/components/InvestmentsPage.jsx` — Fix crash P2P Loans

**Mudança A — Adicionar `Wallet` ao import:**

Localizar:
```js
import { TrendingUp, Users, Briefcase, ShieldCheck, Zap, Lock, Star, ChevronRight, ArrowUpRight, X, ExternalLink, Activity } from 'lucide-react';
```
Substituir por:
```js
import { TrendingUp, Users, Briefcase, ShieldCheck, Zap, Lock, Star, ChevronRight, ArrowUpRight, X, ExternalLink, Activity, Wallet } from 'lucide-react';
```

**Mudança B — Expandir MOCK_LOANS com mais dados realistas:**

Em `src/data/mockData.js`, localizar `export const MOCK_LOANS = [` e substituir o array inteiro por:

```js
export const MOCK_LOANS = [
  {
    id: 'loan1',
    title: 'Expansion: Artisan Sourdough',
    provider: 'Bread & Co · marina.ipecity.eth',
    type: 'Loan Request',
    description: 'We need to purchase a larger stone oven to meet the increasing demand for our local bread. Loan backed by 2-year revenue track record.',
    amount: '$1,200',
    repayment: '10 months @ 5%',
    collateral: 'Business Assets + Rep Score 98',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400&h=300',
    funded: 45,
  },
  {
    id: 'loan2',
    title: 'Eco-Sensor Node Inventory',
    provider: 'Jurere Climate · lucas.ipecity.eth',
    type: 'Loan Request',
    description: 'Purchasing 20 new air quality sensors to expand our monitoring network across the South Sector. No-interest community loan.',
    amount: '500 USDC',
    repayment: '3 months @ 0%',
    collateral: 'Data Revenue Streams',
    image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&q=80&w=400&h=300',
    funded: 80,
  },
  {
    id: 'loan3',
    title: 'Solar Panel Installation — AI Haus',
    provider: 'AI Haus · bia.ipecity.eth',
    type: 'Loan Request',
    description: 'Funding 24 rooftop solar panels for the AI Haus co-working space. Projected energy savings will cover 100% of loan within 18 months.',
    amount: '$8,400',
    repayment: '18 months @ 3.2%',
    collateral: 'Real Estate NFT (AI Haus)',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=400&h=300',
    funded: 62,
  },
  {
    id: 'loan4',
    title: 'Mobile Photography Studio Kit',
    provider: 'Luna Foto · luna.ipecity.eth',
    type: 'Loan Request',
    description: 'Professional lighting equipment and a new mirrorless camera body to expand wedding and event photography services.',
    amount: '$3,100',
    repayment: '8 months @ 4%',
    collateral: 'Reputation Score 91 + Active Contracts',
    image: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&q=80&w=400&h=300',
    funded: 28,
  },
  {
    id: 'loan5',
    title: 'Kayak & Trail Gear Expansion',
    provider: 'TrailCo · trailco.ipecity.eth',
    type: 'Loan Request',
    description: 'Adding 4 new sea kayaks and 2 canoes to meet peak-season demand. Revenue from rentals projected to repay in full within 6 months.',
    amount: '$5,600',
    repayment: '6 months @ 2.5%',
    collateral: 'Equipment NFT + Business Revenue',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=400&h=300',
    funded: 91,
  },
  {
    id: 'loan6',
    title: 'Permaculture Design Tools & Seeds',
    provider: 'Green Roots · green.ipecity.eth',
    type: 'Loan Request',
    description: 'Purchasing specialized equipment and seed inventory for the upcoming urban farming cohort in Ipê City. Impact-first, zero-interest.',
    amount: '$900',
    repayment: '5 months @ 0%',
    collateral: 'Community Vouched (Rep Score 88)',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400&h=300',
    funded: 55,
  },
];
```

---

### 1.3 — `src/lib/UserContext.jsx` — Fix race condition guest profile

**O problema:** O `useEffect` de detecção do Privy chama `setXchangeUser(null)` quando `!authenticated`, sobrescrevendo o DEMO_USER que o `useEffect` de demo acabou de setar. Como o Privy não está logado no modo guest, isso sempre acontece e apaga o perfil do Jean Hansen.

Localizar o `useEffect` de sync do Privy:
```js
useEffect(() => {
  if (ready && authenticated) {
    syncUser();
  } else if (ready && !authenticated) {
    setXchangeUser(null);
    setInitialized(true);
  }
}, [ready, authenticated, syncUser]);
```

Substituir por:
```js
useEffect(() => {
  if (ready && authenticated) {
    syncUser();
  } else if (ready && !authenticated) {
    // Don't reset the user if we're in demo mode — the demo useEffect already set DEMO_USER.
    if (!localStorage.getItem('ipeXchange_demoSession')) {
      setXchangeUser(null);
    }
    setInitialized(true);
  }
}, [ready, authenticated, syncUser]);
```

> **Por quê:** O Privy é inicializado (`ready = true`) mesmo no modo guest, e como não há login (`authenticated = false`), ele entrava no branch `else if` e chamava `setXchangeUser(null)`. Isso apagava o DEMO_USER carregado pelo outro useEffect, tornando `repScore = 0`, `totalTx = 0` e `heroName = '0x73a...Hansen'`.

---

## ETAPA 2 — Treasury Page (1.5 horas)

### 2.1 — Criar `src/components/TreasuryPage.jsx`

Criar o arquivo do zero com o seguinte conteúdo:

```jsx
// src/components/TreasuryPage.jsx
import React, { useState } from 'react';
import {
  TrendingUp, Zap, BarChart3, Globe, ArrowUpRight,
  ShieldCheck, Users, Store, Briefcase, Gift, BookOpen, Repeat
} from 'lucide-react';

// ─── Mock Treasury Data ──────────────────────────────────────────────────────

const TREASURY_BALANCE = 847_520;   // $IPE
const TAX_RATE         = '1%';
const TOTAL_TX         = 84_752;    // cumulative transactions (balance / avg tx = 847k / ~$10 avg fee)

const REVENUE_SOURCES = [
  { id: 'jobs',        label: 'Jobs & Freelance',      pct: 22, amount: 186_454, color: '#B4F44A', icon: Briefcase },
  { id: 'investments', label: 'Investments & Grants',  pct: 15, amount: 127_128, color: '#FFC857', icon: TrendingUp },
  { id: 'tech',        label: 'Tech Services',         pct: 17, amount: 144_078, color: '#38BDF8', icon: Zap },
  { id: 'products',    label: 'Physical Products',     pct: 12, amount: 101_702, color: '#818CF8', icon: Store },
  { id: 'knowledge',   label: 'Knowledge & Education', pct: 14, amount: 118_653, color: '#F472B6', icon: BookOpen },
  { id: 'commerce',    label: 'Store Commerce',        pct: 12, amount: 101_702, color: '#FB923C', icon: Store },
  { id: 'donations',   label: 'Donations & Circular',  pct:  8, amount:  67_802, color: '#34D399', icon: Gift },
];

const MONTHLY_COLLECTION = [
  { month: 'Oct', amount: 48_200 },
  { month: 'Nov', amount: 62_400 },
  { month: 'Dec', amount: 71_800 },
  { month: 'Jan', amount: 89_300 },
  { month: 'Feb', amount: 104_600 },
  { month: 'Mar', amount: 128_900 },
  { month: 'Apr', amount: 147_520 },
];

const TOP_CONTRIBUTORS = [
  { name: 'Ipê Bakery',          category: 'Food & Drink',  contribution: 12_840, pct: 1.52 },
  { name: 'AI Haus',             category: 'Venue',         contribution: 10_200, pct: 1.20 },
  { name: 'Tech Services Pool',  category: 'Services',      contribution: 9_440,  pct: 1.11 },
  { name: 'Ipê Health Clinic',   category: 'Health',        contribution: 7_980,  pct: 0.94 },
  { name: 'Grants Program',      category: 'Investment',    contribution: 7_200,  pct: 0.85 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const fmt = (n) => n.toLocaleString('en-US');

const StatBox = ({ icon: Icon, color, label, value, sub }) => (
  <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 46, height: 46, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={22} style={{ color }} />
    </div>
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: color, marginTop: 2 }}>{sub}</p>}
    </div>
  </div>
);

// CSS-only horizontal bar chart for revenue sources
const RevenueBar = ({ source, maxPct }) => {
  const Icon = source.icon;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${source.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} style={{ color: source.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
          <span style={{ fontWeight: 600 }}>{source.label}</span>
          <span style={{ color: source.color, fontWeight: 700 }}>{source.pct}% · {fmt(source.amount)} $IPE</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(source.pct / maxPct) * 100}%`,
            background: `linear-gradient(to right, ${source.color}80, ${source.color})`,
            borderRadius: 4,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>
    </div>
  );
};

// CSS-only vertical bar chart for monthly collection
const MonthlyChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.amount));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, paddingBottom: 24, position: 'relative' }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const heightPct = (d.amount / maxVal) * 100;
        return (
          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%', borderRadius: '4px 4px 0 0',
              height: `${heightPct}%`,
              background: isLast
                ? 'linear-gradient(to top, #B4F44A80, #B4F44A)'
                : 'rgba(255,255,255,0.08)',
              border: isLast ? '1px solid rgba(180,244,74,0.4)' : 'none',
              minHeight: 4,
              position: 'relative',
            }}>
              {isLast && (
                <span style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: '#B4F44A', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {fmt(d.amount)}
                </span>
              )}
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{d.month}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

const TreasuryPage = () => {
  const [activeSource, setActiveSource] = useState(null);
  const maxPct = Math.max(...REVENUE_SOURCES.map(s => s.pct));

  return (
    <div className="inner-page container" style={{ maxWidth: 960 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#B4F44A', boxShadow: '0 0 8px #B4F44A', animation: 'fast-pulse 1.5s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#B4F44A', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live · Transparent</span>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Ipê City <span className="text-gradient-lime">Treasury</span>
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 560, lineHeight: 1.6 }}>
          Every Xchange transaction contributes 1% to the DAO Treasury. These funds are governed collectively by Ipê City citizens and allocated through on-chain proposals.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatBox icon={Zap}        color="#B4F44A" label="Total Treasury Balance" value={`${fmt(TREASURY_BALANCE)} $IPE`} sub="+17.4% this month" />
        <StatBox icon={BarChart3}  color="#38BDF8" label="All-Time Transactions"  value={fmt(TOTAL_TX)}                  sub="contributing to treasury" />
        <StatBox icon={Users}      color="#818CF8" label="Active Contributors"    value="1,240"                           sub="Ipê City citizens" />
        <StatBox icon={ShieldCheck}color="#FFC857" label="Tax Rate (1% / tx)"     value={TAX_RATE}                       sub="Auto-collected on-chain" />
      </div>

      {/* Two-column: Revenue breakdown + Monthly chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Revenue by source */}
        <div className="glass-panel" style={{ padding: '28px 32px' }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Revenue by Source</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {REVENUE_SOURCES.map(s => (
              <RevenueBar key={s.id} source={s} maxPct={maxPct} />
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 16 }}>
            Based on {fmt(TOTAL_TX)} total transactions collected since launch.
          </p>
        </div>

        {/* Monthly collection + top contributors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" style={{ padding: '28px 32px' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Monthly Collection ($IPE)</h4>
            <MonthlyChart data={MONTHLY_COLLECTION} />
          </div>

          <div className="glass-panel" style={{ padding: '24px 28px' }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Top Contributors</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TOP_CONTRIBUTORS.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', width: 16 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.category}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#B4F44A' }}>{fmt(c.contribution)} $IPE</p>
                    <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{c.pct}% of total</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24 }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>How the Treasury Works</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { icon: Repeat,      color: '#38BDF8', title: 'Automatic Collection', desc: 'Every Xchange transaction has 1% automatically routed to the DAO Treasury smart contract. No intermediaries.' },
            { icon: ShieldCheck, color: '#B4F44A', title: 'On-Chain Transparency', desc: 'All treasury balances and transactions are public and verifiable on-chain. Anyone can audit at any time.' },
            { icon: Globe,       color: '#818CF8', title: 'Citizen Governance',    desc: 'Any citizen with Rep Score > 10 can create spending proposals. Decisions are made via token-weighted voting.' },
            { icon: ArrowUpRight,color: '#FFC857', title: 'Protocol Revenue',      desc: 'A portion of treasury revenue is allocated to public goods, city infrastructure, and grants each quarter.' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{item.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Governance CTA */}
      <div className="glass-panel" style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 24, borderLeft: '4px solid #B4F44A' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Want to participate in treasury decisions?</h4>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            To access detailed treasury data, participate in votes, and create budget allocation proposals, visit <strong style={{ color: 'white' }}>Ipêconomics</strong> — the city's governance platform for public finance.
          </p>
        </div>
        <a
          href="https://app.ipe.city/economics"
          target="_blank"
          rel="noreferrer"
          className="btn-primary"
          style={{ textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
        >
          <ArrowUpRight size={16} /> Open Ipêconomics
        </a>
      </div>

    </div>
  );
};

export default TreasuryPage;
```

---

### 2.2 — `src/components/MainPortal.jsx` — Adicionar Treasury ao nav

**Mudança A — Import:**

Adicionar na seção de lazy imports:
```js
const TreasuryPage = lazy(() => import('./TreasuryPage'));
```

**Mudança B — NAV_TABS:**

Localizar:
```js
const NAV_TABS = [
  { id: 'home',        icon: <Home size={16} />,       label: 'Home' },
  { id: 'discover',   icon: <Compass size={16} />,     label: 'Discover' },
  { id: 'stores',     icon: <Store size={16} />,       label: 'Stores' },
  { id: 'investments',icon: <TrendingUp size={16} />,  label: 'Invest' },
  { id: 'circular',   icon: <Repeat size={16} />,      label: 'Multi-Hop' },
];
```

Substituir por:
```js
const NAV_TABS = [
  { id: 'home',        icon: <Home size={16} />,       label: 'Home' },
  { id: 'discover',   icon: <Compass size={16} />,     label: 'Discover' },
  { id: 'stores',     icon: <Store size={16} />,       label: 'Stores' },
  { id: 'investments',icon: <TrendingUp size={16} />,  label: 'Invest' },
  { id: 'circular',   icon: <Repeat size={16} />,      label: 'Multi-Hop' },
  { id: 'treasury',   icon: <BarChart3 size={16} />,   label: 'Treasury' },
];
```

> **Nota:** Se `BarChart3` não está importado no topo de MainPortal.jsx, adicionar ao import do lucide-react.

**Mudança C — Render da página:**

Na seção onde as tabs são renderizadas (onde estão os outros `tab === 'X' && <XPage ...>`), adicionar após a linha do `circular`:
```jsx
{tab === 'treasury' && <TreasuryPage />}
```

---

## Ordem de Execução

```
1. UserContext.jsx        — Fix race condition (crítico para demo)
2. cityGraphBuilder.js    — Rename Artizen Haus + KNOWN_STORE_LOCATIONS
3. InvestmentsPage.jsx    — Wallet import fix
4. mockData.js            — Expand MOCK_LOANS
5. TreasuryPage.jsx       — Criar arquivo do zero
6. MainPortal.jsx         — Import + NAV_TABS + render
```

---

## O Que NÃO Mudar

| Arquivo | Status |
|---------|--------|
| `src/components/ProfilePage.jsx` | ✅ heroName já usa `xchangeUser.display_name` (implementado) |
| `src/data/demoProfile.js` | ✅ DEMO_USER, DEMO_LISTINGS, DEMO_PURCHASES, DEMO_TRANSACTIONS já corretos |
| `src/components/HomePage.jsx` | ✅ handleRegisterSimEdge em useCallback (mapa estável) |
| `src/App.jsx` | ✅ Skip do onboarding removido |

---

## Checklist de Validação

### Map
- [ ] Layer "Stores" mostra: Ipê Bakery, Ipê City Motors, Ipê Cinema, Organic Market, Ipê Health Clinic, Studio Creative, Ipê City Surf Shop, Wine & Cheese Ipê, Ipê Tech Store, Bio Market
- [ ] Venues mostram: Founder Haus, AI Haus, **Artizen Haus** (não mais "Privacy Haus")
- [ ] Lojas aparecem espalhadas pelo mapa em posições fixas (não agrupadas)

### P2P Loans
- [ ] Clicar em "Invest" → "P2P Loans" não trava mais (sem "Something went wrong")
- [ ] 6 loan cards aparecem com dados realistas
- [ ] Barra de progresso "Funded" funciona corretamente

### Treasury
- [ ] Aba "Treasury" aparece no menu principal
- [ ] Mostra balance de 847,520 $IPE
- [ ] Gráfico de barras horizontais com 7 categorias de receita
- [ ] Gráfico de barras mensais (Out → Abr)
- [ ] Top 5 contributors listados
- [ ] CTA "Open Ipêconomics" presente
- [ ] "Something went wrong" NÃO aparece

### Guest Profile
- [ ] Login como guest → onboarding completo (Connect Agent + Sync)
- [ ] Perfil mostra `jean.ipecity.eth` (não "0x73a...Hansen")
- [ ] On-Chain Reputation mostra RepRing com score 99 + label "Elite Member"
- [ ] Barras de progresso: Completed Trades = 94, Active Listings = 100, Community Trust = 99
- [ ] Activity Summary: "47 Xchanges", "12 Active Listings", "Rep Score: 99"
- [ ] Badges: 5 badges visíveis
- [ ] Web of Trust: 5 conexões visíveis
- [ ] Latest Transactions: 7 transações (mix in/out)
