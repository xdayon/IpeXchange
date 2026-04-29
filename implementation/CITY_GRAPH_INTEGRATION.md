# City Graph Integration Plan

**Objetivo:** Substituir o `CityMap.jsx` (Leaflet simples com círculos estáticos) pelo City Graph visual do repositório `iggymtrkd/ipe-city-graph` — com entidades animadas, edges bezier com dots em movimento, layer toggles e painel de detalhes — conectado à nossa database Supabase ao invés de dados estáticos TypeScript.

**Regra:** Nenhum push para `git@github.com:iggymtrkd/ipe-city-graph.git`. O código é copiado manualmente.

---

## O que é o ipe-city-graph

Repositório React + TypeScript + Vite + Tailwind + Leaflet que renderiza um mapa interativo da cidade com:

- **7 layers de entidades:** identity (pessoas), infrastructure, governance, commerce (marketplace), safety, environment, events
- **Markers animados:** SVG pins com pulse via `L.divIcon` no Leaflet
- **Edges Bezier:** linhas curvas com dots animados (`requestAnimationFrame`) que fluem entre entidades — representam trocas/relações
- **EntityDetailPanel:** painel bottom-right com info da entidade selecionada e suas conexões
- **LayerToggle:** botões de filtro por layer
- **Sistema de coordenadas:** `latLonToSvg()` converte lat/lon para x/y num canvas 1000×760, dentro do bounding box de Jurerê (SW: -27.4518, -48.5135 | NE: -27.4334, -48.4905)

---

## Mapeamento: Supabase DB → City Graph Layers

| Layer City Graph | Fonte no IpeXchange DB | Detalhes |
|------------------|------------------------|----------|
| **commerce** | tabela `listings` | Products, Services, Knowledge, Donations → nós do marketplace |
| **identity** | tabela `users` | Usuários reais com wallet/Privy → nós de pessoas |
| **commerce** (stores) | tabela `stores` | Lojas on-chain → nós especiais com ícone de store |
| **edges animados** | tabela `transactions` | source = listing_id, animação de dot = fluxo de troca concluída |
| **edges demand** | tabela `demands` cruzada com `listings` | source = session_id da demand, target = listing correspondente |
| infrastructure / governance / safety / environment | dados estáticos (copiados do ipe-city-graph) | Mantidos como contexto de cidade; não têm equivalente no DB |

### Posicionamento Geográfico

A maioria dos listings no DB não tem `location_lat`/`location_lng`. Estratégia:

1. Se `location_lat` e `location_lng` existirem → usar direto
2. Caso contrário → gerar coordenadas determinísticas via hash do `id` ou `mock_key`, sempre dentro do bounding box de Jurerê

---

## Arquivos a Criar / Modificar

```
src/
  components/
    CityGraph/
      CityGraphMap.jsx          ← CRIAR (port do CityGraphMap.tsx)
      EntityDetailPanel.jsx     ← CRIAR (port do EntityDetailPanel.tsx)
      LayerToggle.jsx           ← CRIAR (port do LayerToggle.tsx)
      MapPin.jsx                ← CRIAR (port do MapPin.tsx)
      MapZone.jsx               ← CRIAR (port do MapZone.tsx)
  lib/
    api.js                      ← MODIFICAR (adicionar fetchCityGraphData)
    cityGraphAdapter.js         ← CRIAR (DB response → entity format)

backend/
  server.js                     ← MODIFICAR (adicionar GET /api/city-graph)
  lib/
    supabase.js                 ← MODIFICAR (adicionar getCityGraphData)

src/index.css (ou App.css)      ← MODIFICAR (adicionar animações e estilos)
src/components/HomePage.jsx     ← MODIFICAR (trocar CityMap por CityGraphMap)
```

---

## Step 1 — Backend: `backend/lib/supabase.js`

Adicionar a função `getCityGraphData()` no final do arquivo, antes de `export default supabase`:

```js
export async function getCityGraphData() {
  if (!dbAvailable) {
    return { listings: [], users: [], stores: [], transactions: [], demands: [] };
  }
  try {
    const [listingsRes, usersRes, storesRes, txRes, demandsRes] = await Promise.all([
      supabase
        .from('listings')
        .select('id, title, description, category, subcategory, price_fiat, accepts_trade, trade_wants, provider_name, image_url, is_mock, mock_key, location_lat, location_lng, session_id')
        .eq('active', true)
        .limit(80),
      supabase
        .from('users')
        .select('id, display_name, wallet_address, ipe_rep_score, location_lat, location_lng')
        .limit(40),
      supabase
        .from('stores')
        .select('id, name, description, category, location_lat, location_lng, is_mock, session_id')
        .limit(30),
      supabase
        .from('transactions')
        .select('id, listing_id, buyer_wallet, seller_wallet, is_trade, created_at')
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('demands')
        .select('id, session_id, description, category, is_mock')
        .eq('is_mock', false)
        .limit(40),
    ]);
    return {
      listings: listingsRes.data || [],
      users: usersRes.data || [],
      stores: storesRes.data || [],
      transactions: txRes.data || [],
      demands: demandsRes.data || [],
    };
  } catch (err) {
    console.error('getCityGraphData error:', err);
    return { listings: [], users: [], stores: [], transactions: [], demands: [] };
  }
}
```

---

## Step 2 — Backend: `backend/server.js`

### 2a. Adicionar import da função nova (no topo do arquivo, junto aos outros imports de supabase.js):

```js
import {
  // ... imports já existentes ...
  getCityGraphData,   // ← adicionar esta linha
} from './lib/supabase.js';
```

### 2b. Adicionar a rota (após a rota `/api/discover` existente):

```js
// ─── City Graph ──────────────────────────────────────────────────────────────

app.get('/api/city-graph', async (req, res) => {
  try {
    const { listings, users, stores, transactions, demands } = await getCityGraphData();
    const { buildCityGraphPayload } = await import('./lib/cityGraphBuilder.js');
    const payload = buildCityGraphPayload({ listings, users, stores, transactions, demands });
    res.json(payload);
  } catch (err) {
    console.error('City graph error:', err);
    res.status(500).json({ entities: [], edges: [] });
  }
});
```

---

## Step 3 — Backend: `backend/lib/cityGraphBuilder.js` (CRIAR)

Este módulo transforma os dados brutos do Supabase no formato `{ entities, edges }` esperado pelo CityGraphMap.

```js
// backend/lib/cityGraphBuilder.js
// Transforms raw Supabase data into the city-graph entity+edge format.

const BBOX = {
  minLat: -27.4518, maxLat: -27.4334,
  minLon: -48.5135, maxLon: -48.4905,
};

// Deterministic coordinates for entities without real lat/lon.
// Uses a simple string hash to produce stable positions within Jurerê bbox.
function deterministicCoords(seed) {
  let h1 = 0, h2 = 0;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = (Math.imul(31, h1) + c) | 0;
    h2 = (Math.imul(37, h2) + c) | 0;
  }
  const t1 = (Math.abs(h1) % 9000 + 500) / 10000;
  const t2 = (Math.abs(h2) % 9000 + 500) / 10000;
  return {
    lat: BBOX.minLat + t1 * (BBOX.maxLat - BBOX.minLat),
    lon: BBOX.minLon + t2 * (BBOX.maxLon - BBOX.minLon),
  };
}

const CATEGORY_TO_KIND = {
  Products: 'marketplace',
  Services: 'skill-exchange',
  Knowledge: 'skill-exchange',
  Donations: 'marketplace',
};

function listingToEntity(listing) {
  const location = (listing.location_lat && listing.location_lng)
    ? { lat: listing.location_lat, lon: listing.location_lng }
    : deterministicCoords(listing.mock_key || listing.id);

  return {
    id: `listing-${listing.id}`,
    layer: 'commerce',
    label: listing.title,
    description: listing.description || '',
    location,
    status: 'active',
    createdAt: listing.created_at || new Date().toISOString(),
    kind: CATEGORY_TO_KIND[listing.category] || 'marketplace',
    category: listing.category,
    provider: listing.provider_name || 'Unknown',
    priceFiat: listing.price_fiat,
    acceptsTrade: listing.accepts_trade,
    tradeWants: listing.trade_wants,
    image: listing.image_url,
    isMock: listing.is_mock,
    sessionId: listing.session_id,
    sourceType: 'listing',
  };
}

function userToEntity(user) {
  const location = (user.location_lat && user.location_lng)
    ? { lat: user.location_lat, lon: user.location_lng }
    : deterministicCoords(user.wallet_address || user.id);

  return {
    id: `user-${user.id}`,
    layer: 'identity',
    label: user.display_name || user.wallet_address?.slice(0, 8) + '...' || 'Citizen',
    description: `Ipê Rep Score: ${user.ipe_rep_score || 0}`,
    location,
    status: 'active',
    createdAt: new Date().toISOString(),
    wallet: user.wallet_address,
    repScore: user.ipe_rep_score,
    sourceType: 'user',
  };
}

function storeToEntity(store) {
  const location = (store.location_lat && store.location_lng)
    ? { lat: store.location_lat, lon: store.location_lng }
    : deterministicCoords(store.id);

  return {
    id: `store-${store.id}`,
    layer: 'commerce',
    label: store.name,
    description: store.description || '',
    location,
    status: 'active',
    createdAt: new Date().toISOString(),
    kind: 'store',
    category: store.category,
    isMock: store.is_mock,
    sourceType: 'store',
  };
}

function transactionToEdge(tx, listingEntityMap) {
  const targetId = `listing-${tx.listing_id}`;
  if (!listingEntityMap[targetId]) return null;
  return {
    id: `tx-${tx.id}`,
    source: targetId,
    target: targetId,
    relationship: tx.is_trade ? 'trade' : 'purchase',
    label: tx.is_trade ? 'Trade' : 'Purchase',
    buyerWallet: tx.buyer_wallet,
    sellerWallet: tx.seller_wallet,
    createdAt: tx.created_at,
  };
}

// Synthesize edges between listings that share trade relationships
// (listing A wants what listing B offers and vice versa)
function synthesizeTradeEdges(listings) {
  const edges = [];
  for (let i = 0; i < listings.length; i++) {
    for (let j = i + 1; j < listings.length; j++) {
      const a = listings[i];
      const b = listings[j];
      if (!a.accepts_trade || !b.accepts_trade) continue;
      const aWants = (a.trade_wants || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      const bWants = (b.trade_wants || '').toLowerCase();
      const aTitle = (a.title || '').toLowerCase();
      const aMatchesB = aWants && bTitle && (
        aWants.split(' ').some(word => word.length > 4 && bTitle.includes(word))
      );
      const bMatchesA = bWants && aTitle && (
        bWants.split(' ').some(word => word.length > 4 && aTitle.includes(word))
      );
      if (aMatchesB || bMatchesA) {
        edges.push({
          id: `trade-match-${a.id}-${b.id}`,
          source: `listing-${a.id}`,
          target: `listing-${b.id}`,
          relationship: 'trade-match',
          label: 'Trade Match',
        });
      }
    }
  }
  return edges;
}

export function buildCityGraphPayload({ listings, users, stores, transactions, demands }) {
  const entities = [
    ...listings.map(listingToEntity),
    ...users.map(userToEntity),
    ...stores.map(storeToEntity),
  ];

  const listingEntityMap = {};
  entities.forEach(e => { listingEntityMap[e.id] = e; });

  const txEdges = transactions
    .map(tx => transactionToEdge(tx, listingEntityMap))
    .filter(Boolean);

  const tradeEdges = synthesizeTradeEdges(listings);

  // Deduplicate edges
  const seenEdges = new Set();
  const edges = [...txEdges, ...tradeEdges].filter(e => {
    const key = `${e.source}-${e.target}`;
    if (seenEdges.has(key)) return false;
    seenEdges.add(key);
    return true;
  });

  return { entities, edges };
}
```

---

## Step 4 — Frontend: `src/lib/api.js`

Adicionar ao final do arquivo a função `fetchCityGraphData`:

```js
export async function fetchCityGraphData() {
  try {
    const res = await fetch(`${API_URL}/city-graph`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('fetchCityGraphData error:', err);
    return { entities: [], edges: [] };
  }
}
```

---

## Step 5 — Frontend: `src/lib/cityGraphAdapter.js` (CRIAR)

Utilitários compartilhados entre os componentes frontend do CityGraph.

```js
// src/lib/cityGraphAdapter.js

export const LAYER_META = [
  { id: 'commerce',       label: 'Commerce',       color: '#B4F44A', icon: 'Store' },
  { id: 'identity',       label: 'Citizens',        color: '#38BDF8', icon: 'Users' },
  { id: 'infrastructure', label: 'Infrastructure',  color: '#F59E0B', icon: 'Cpu' },
  { id: 'governance',     label: 'Governance',      color: '#818CF8', icon: 'Vote' },
  { id: 'safety',         label: 'Safety',          color: '#F43F5E', icon: 'ShieldAlert' },
  { id: 'environment',    label: 'Environment',     color: '#34D399', icon: 'Leaf' },
  { id: 'events',         label: 'Events',          color: '#FB923C', icon: 'CalendarDays' },
];

export const LAYER_COLOR = Object.fromEntries(LAYER_META.map(l => [l.id, l.color]));

export function getLayerMeta(layerId) {
  return LAYER_META.find(l => l.id === layerId) || LAYER_META[0];
}

// Jurerê bounding box — must match backend/lib/cityGraphBuilder.js
const BBOX = {
  minLat: -27.4518, maxLat: -27.4334,
  minLon: -48.5135, maxLon: -48.4905,
};
export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 760;

export function latLonToSvg(point) {
  const x = ((point.lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon)) * MAP_WIDTH;
  const y = ((BBOX.maxLat - point.lat) / (BBOX.maxLat - BBOX.minLat)) * MAP_HEIGHT;
  return { x, y };
}

export function getEdgesForEntity(entityId, edges) {
  return edges.filter(e => e.source === entityId || e.target === entityId);
}

export function getConnectedEntities(entityId, edges, entities) {
  const entityMap = Object.fromEntries(entities.map(e => [e.id, e]));
  return getEdgesForEntity(entityId, edges)
    .map(edge => {
      const otherId = edge.source === entityId ? edge.target : edge.source;
      const other = entityMap[otherId];
      return other ? { entity: other, relationship: edge.relationship, label: edge.label } : null;
    })
    .filter(Boolean);
}
```

---

## Step 6 — Frontend: `src/components/CityGraph/CityGraphMap.jsx` (CRIAR)

Este é o componente principal. Port completo do `CityGraphMap.tsx` do ipe-city-graph, adaptado para:
- JavaScript (sem tipos TypeScript)
- Dados vindos da nossa API (`fetchCityGraphData`) em vez de arquivos estáticos
- Compatível com o design system do IpeXchange (variáveis CSS `--text-primary`, etc.)

```jsx
// src/components/CityGraph/CityGraphMap.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchCityGraphData } from '../../lib/api';
import { LAYER_META, LAYER_COLOR, latLonToSvg, MAP_WIDTH, MAP_HEIGHT } from '../../lib/cityGraphAdapter';
import { EntityDetailPanel } from './EntityDetailPanel';
import { LayerToggle } from './LayerToggle';

// Jurerê bounding box for Leaflet
const BOUNDS_SW = [-27.4518, -48.5135];
const BOUNDS_NE = [-27.4334, -48.4905];
const CENTER = [-27.43934, -48.50254];

// ─── Marker HTML ──────────────────────────────────────────────────────────────

function markerHtml(entity, color, isSelected) {
  const size = isSelected ? 20 : 14;
  const haloSize = isSelected ? 36 : 26;
  const pulse = isSelected ? 'style="animation: city-graph-pulse 2s infinite;"' : '';
  return `
    <div style="position:relative;width:${haloSize}px;height:${haloSize}px;display:flex;align-items:center;justify-content:center;">
      <div ${pulse} style="
        position:absolute;width:${haloSize}px;height:${haloSize}px;
        border-radius:50%;background:${color}22;
        border:1.5px solid ${color}55;
        transition:all 0.2s;
      "></div>
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};
        box-shadow:0 0 ${isSelected ? 12 : 6}px ${color}88;
        border:2px solid ${color}dd;
        transition:all 0.2s;
        z-index:1;
      "></div>
    </div>
  `;
}

// ─── Bezier path utilities ────────────────────────────────────────────────────

function bezierControlPoint(p1, p2, curvature = 0.3) {
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return { x: mx, y: my };
  return {
    x: mx - dy * curvature,
    y: my + dx * curvature,
  };
}

function sampleBezier(t, p0, cp, p1) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * cp.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * cp.y + t * t * p1.y,
  };
}

function svgToLatLon(svgPt) {
  const BBOX = { minLat: -27.4518, maxLat: -27.4334, minLon: -48.5135, maxLon: -48.4905 };
  const lon = (svgPt.x / MAP_WIDTH) * (BBOX.maxLon - BBOX.minLon) + BBOX.minLon;
  const lat = BBOX.maxLat - (svgPt.y / MAP_HEIGHT) * (BBOX.maxLat - BBOX.minLat);
  return [lat, lon];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CityGraphMap() {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const svgOverlayRef = useRef(null);
  const markersRef = useRef({});
  const animFrameRef = useRef(null);
  const dotsRef = useRef([]);
  const edgePathsRef = useRef([]);

  const [entities, setEntities] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeLayers, setActiveLayers] = useState(new Set(['commerce', 'identity']));
  const [loading, setLoading] = useState(true);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCityGraphData().then(data => {
      setEntities(data.entities || []);
      setEdges(data.edges || []);
      setLoading(false);
    });
  }, []);

  // ── Init Leaflet map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    const map = L.map(mapRef.current, {
      center: CENTER,
      zoom: 15,
      minZoom: 14,
      maxZoom: 17,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 17,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    leafletRef.current = map;

    return () => {
      map.remove();
      leafletRef.current = null;
    };
  }, []);

  // ── Render markers & edges ─────────────────────────────────────────────────
  useEffect(() => {
    const map = leafletRef.current;
    if (!map || entities.length === 0) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    // Cancel previous animation
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    dotsRef.current.forEach(d => d.remove());
    dotsRef.current = [];
    edgePathsRef.current = [];

    // Remove old SVG overlay
    if (svgOverlayRef.current) {
      svgOverlayRef.current.remove();
      svgOverlayRef.current = null;
    }

    // Create SVG overlay for edges
    const bounds = L.latLngBounds(BOUNDS_SW, BOUNDS_NE);
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('viewBox', `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
    svgEl.style.overflow = 'visible';

    // Render edges as bezier paths
    const entityMap = Object.fromEntries(entities.map(e => [e.id, e]));
    const validEdges = edges.filter(edge => entityMap[edge.source] && entityMap[edge.target]);

    validEdges.forEach(edge => {
      const src = entityMap[edge.source];
      const tgt = entityMap[edge.target];
      if (!activeLayers.has(src.layer) && !activeLayers.has(tgt.layer)) return;

      const p0 = latLonToSvg(src.location);
      const p1 = latLonToSvg(tgt.location);
      const cp = bezierControlPoint(p0, p1);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = `M${p0.x},${p0.y} Q${cp.x},${cp.y} ${p1.x},${p1.y}`;
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', LAYER_COLOR[src.layer] || '#38BDF8');
      path.setAttribute('stroke-width', '1');
      path.setAttribute('stroke-opacity', '0.35');
      path.setAttribute('stroke-dasharray', '6 4');
      path.style.animation = 'city-graph-flow 1.8s linear infinite';
      svgEl.appendChild(path);
      edgePathsRef.current.push({ path, p0, cp, p1, color: LAYER_COLOR[src.layer] || '#38BDF8' });
    });

    const overlay = L.svgOverlay(svgEl, bounds, { opacity: 1, interactive: false });
    overlay.addTo(map);
    svgOverlayRef.current = overlay;

    // Render entity markers
    const visibleEntities = entities.filter(e => activeLayers.has(e.layer));
    visibleEntities.forEach(entity => {
      const color = LAYER_COLOR[entity.layer] || '#38BDF8';
      const isSelected = entity.id === selectedId;
      const icon = L.divIcon({
        html: markerHtml(entity, color, isSelected),
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      const marker = L.marker([entity.location.lat, entity.location.lon], { icon })
        .addTo(map)
        .on('click', () => setSelectedId(id => id === entity.id ? null : entity.id));

      // Tooltip
      marker.bindTooltip(`
        <div style="font-size:12px;font-weight:600;color:#fff;background:rgba(4,25,43,0.95);padding:6px 10px;border-radius:8px;border:1px solid ${color}44;backdrop-filter:blur(8px);">
          <span style="color:${color};margin-right:6px;">●</span>${entity.label}
          <div style="font-size:10px;color:#94a3b8;margin-top:2px;">${entity.layer.charAt(0).toUpperCase() + entity.layer.slice(1)}</div>
        </div>
      `, { className: 'city-graph-tooltip', direction: 'top', offset: [0, -12] });

      markersRef.current[entity.id] = marker;
    });

    // Animate dots along edges
    const activeDots = edgePathsRef.current.map(ep => {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', ep.color);
      dot.setAttribute('opacity', '0.9');
      svgEl.appendChild(dot);
      return { dot, ...ep, t: Math.random() };
    });
    dotsRef.current = activeDots.map(d => d.dot);

    let lastTime = null;
    function animateDots(ts) {
      if (!lastTime) lastTime = ts;
      const dt = (ts - lastTime) / 1000;
      lastTime = ts;
      activeDots.forEach(dotData => {
        dotData.t = (dotData.t + dt * 0.15) % 1;
        const pos = sampleBezier(dotData.t, dotData.p0, dotData.cp, dotData.p1);
        dotData.dot.setAttribute('cx', pos.x);
        dotData.dot.setAttribute('cy', pos.y);
      });
      animFrameRef.current = requestAnimationFrame(animateDots);
    }
    if (activeDots.length > 0) {
      animFrameRef.current = requestAnimationFrame(animateDots);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [entities, edges, activeLayers, selectedId]);

  // ── Layer toggle ───────────────────────────────────────────────────────────
  const handleLayerToggle = useCallback((layerId) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(layerId) ? next.delete(layerId) : next.add(layerId);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setActiveLayers(prev =>
      prev.size === LAYER_META.length
        ? new Set(['commerce', 'identity'])
        : new Set(LAYER_META.map(l => l.id))
    );
  }, []);

  const selectedEntity = entities.find(e => e.id === selectedId) || null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0B1421' }}>
      {/* Badge */}
      <div style={{ position: 'absolute', top: 16, left: 60, zIndex: 1000 }}>
        <span className="badge">CITY GRAPH • JURERÊ LIVE</span>
      </div>

      {/* Layer Toggle */}
      <div style={{ position: 'absolute', top: 56, left: 16, zIndex: 1000 }}>
        <LayerToggle
          activeLayers={activeLayers}
          onToggle={handleLayerToggle}
          onToggleAll={handleToggleAll}
          entityCount={entities.length}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, background: 'rgba(11,20,33,0.7)' }}>
          <span style={{ color: '#38BDF8', fontSize: 14 }}>Loading city graph…</span>
        </div>
      )}

      {/* Map container */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Detail panel */}
      {selectedEntity && (
        <EntityDetailPanel
          entity={selectedEntity}
          edges={edges}
          entities={entities}
          onClose={() => setSelectedId(null)}
          onSelectEntity={setSelectedId}
        />
      )}
    </div>
  );
}
```

---

## Step 7 — Frontend: `src/components/CityGraph/EntityDetailPanel.jsx` (CRIAR)

Port do `EntityDetailPanel.tsx`. Exibe detalhes da entidade selecionada e suas conexões.

```jsx
// src/components/CityGraph/EntityDetailPanel.jsx
import { X } from 'lucide-react';
import { LAYER_COLOR, getLayerMeta, getConnectedEntities } from '../../lib/cityGraphAdapter';

export function EntityDetailPanel({ entity, edges, entities, onClose, onSelectEntity }) {
  const layerMeta = getLayerMeta(entity.layer);
  const color = LAYER_COLOR[entity.layer] || '#38BDF8';
  const connections = getConnectedEntities(entity.id, edges, entities);

  const statusColor = entity.status === 'active' ? '#34D399'
    : entity.status === 'warning' ? '#F59E0B'
    : entity.status === 'critical' ? '#F43F5E'
    : '#94a3b8';

  return (
    <div style={{
      position: 'absolute', bottom: 24, right: 24,
      width: 300, maxHeight: 420,
      background: 'rgba(4,25,43,0.96)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${color}44`,
      borderRadius: 16,
      zIndex: 1000,
      overflow: 'hidden',
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${color}22`,
      animation: 'slide-in 0.2s ease-out',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color, background: `${color}18`, padding: '2px 8px', borderRadius: 100,
              border: `1px solid ${color}44`,
            }}>
              {layerMeta.label}
            </span>
            <h4 style={{ fontSize: 15, fontWeight: 700, margin: '8px 0 0', color: '#fff', lineHeight: 1.3 }}>
              {entity.label}
            </h4>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', borderRadius: 8, padding: 6, cursor: 'pointer', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        {entity.status && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
            <span style={{ fontSize: 11, color: statusColor, textTransform: 'capitalize' }}>{entity.status}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 16, overflowY: 'auto', maxHeight: 300 }}>
        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 12 }}>
          {entity.description}
        </p>

        {/* Commerce-specific details */}
        {entity.priceFiat !== undefined && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>
              {entity.priceFiat > 0 ? `$${entity.priceFiat}` : 'Free'}
            </span>
            {entity.acceptsTrade && (
              <span style={{ fontSize: 10, color: '#B4F44A', background: '#B4F44A18', padding: '2px 8px', borderRadius: 100, border: '1px solid #B4F44A44' }}>
                Accepts Trade
              </span>
            )}
          </div>
        )}

        {entity.provider && (
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
            by {entity.provider}
          </p>
        )}

        {/* Connections */}
        {connections.length > 0 && (
          <div>
            <h5 style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {connections.length} Connection{connections.length !== 1 ? 's' : ''}
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {connections.slice(0, 5).map(conn => {
                const connColor = LAYER_COLOR[conn.entity.layer] || '#38BDF8';
                return (
                  <button key={conn.entity.id}
                    onClick={() => onSelectEntity(conn.entity.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid rgba(255,255,255,0.06)`,
                      cursor: 'pointer', textAlign: 'left', color: '#fff',
                    }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: connColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conn.entity.label}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{conn.label || conn.relationship}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Step 8 — Frontend: `src/components/CityGraph/LayerToggle.jsx` (CRIAR)

Port do `LayerToggle.tsx`. Botões de filtro por layer, posicionados no canto superior esquerdo.

```jsx
// src/components/CityGraph/LayerToggle.jsx
import { Eye, EyeOff, Users, Cpu, Vote, Store, ShieldAlert, Leaf, CalendarDays } from 'lucide-react';
import { LAYER_META } from '../../lib/cityGraphAdapter';

const ICONS = { Users, Cpu, Vote, Store, ShieldAlert, Leaf, CalendarDays };

export function LayerToggle({ activeLayers, onToggle, onToggleAll, entityCount }) {
  const allActive = activeLayers.size >= LAYER_META.length;

  return (
    <div style={{
      background: 'rgba(4,25,43,0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 40,
    }}>
      {/* Entity count */}
      {entityCount > 0 && (
        <div style={{ fontSize: 9, color: '#38BDF8', textAlign: 'center', fontWeight: 700, letterSpacing: '0.05em', paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {entityCount} nodes
        </div>
      )}

      {/* Toggle all */}
      <button
        onClick={onToggleAll}
        title={allActive ? 'Show fewer' : 'Show all layers'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 6, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
          cursor: 'pointer', marginBottom: 2,
        }}>
        {allActive ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>

      {/* Per-layer buttons */}
      {LAYER_META.map(layer => {
        const Icon = ICONS[layer.icon] || Store;
        const isActive = activeLayers.has(layer.id);
        return (
          <button
            key={layer.id}
            onClick={() => onToggle(layer.id)}
            title={layer.label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 6, borderRadius: 8,
              border: `1px solid ${isActive ? layer.color + '55' : 'rgba(255,255,255,0.06)'}`,
              background: isActive ? `${layer.color}18` : 'transparent',
              color: isActive ? layer.color : '#475569',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
            <Icon size={12} />
          </button>
        );
      })}
    </div>
  );
}
```

---

## Step 9 — CSS: Adicionar Animações ao Stylesheet Global

**Arquivo:** `src/index.css` (ou onde estiver o CSS global do IpeXchange)

Adicionar ao final do arquivo:

```css
/* ─── City Graph Animations ─────────────────────────────────────────────── */

@keyframes city-graph-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.25); }
}

@keyframes city-graph-flow {
  from { stroke-dashoffset: 24; }
  to   { stroke-dashoffset: 0; }
}

@keyframes city-graph-zone {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.7; }
}

@keyframes dashboard-scan {
  0%   { transform: translateY(-100%); opacity: 0; }
  10%  { opacity: 0.4; }
  90%  { opacity: 0.4; }
  100% { transform: translateY(100vh); opacity: 0; }
}

/* Override Leaflet tooltip for city graph */
.city-graph-tooltip .leaflet-tooltip {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.city-graph-tooltip.leaflet-tooltip::before {
  display: none;
}

/* Zoom controls dark theme */
.leaflet-control-zoom a {
  background: rgba(4, 25, 43, 0.92) !important;
  color: #94a3b8 !important;
  border-color: rgba(255,255,255,0.1) !important;
}
.leaflet-control-zoom a:hover {
  color: #fff !important;
  background: rgba(56, 189, 248, 0.15) !important;
}
```

---

## Step 10 — Frontend: `src/components/HomePage.jsx`

### 10a. Trocar o import lazy do CityMap pelo CityGraphMap:

```js
// Linha atual:
const CityMap = lazy(() => import('./CityMap'));

// Substituir por:
const CityGraphMap = lazy(() => import('./CityGraph/CityGraphMap'));
```

### 10b. Trocar o uso do componente no JSX:

```jsx
// Linha atual (dentro do Suspense):
<CityMap activeCategory={null} />

// Substituir por:
<CityGraphMap />
```

O `CityGraphMap` não precisa da prop `activeCategory` — o controle de layers é interno ao componente via `LayerToggle`.

---

## Step 11 — Adicionar `mock_key` na tabela `listings` (se ainda não existir)

O `cityGraphBuilder.js` usa `listing.mock_key` para gerar coordenadas determinísticas. Verificar se a coluna existe — se não, executar no Supabase SQL Editor:

```sql
ALTER TABLE listings ADD COLUMN IF NOT EXISTS mock_key TEXT;
```

(Este step já está coberto no plano `MOCK_DATA_PERSISTENCE.md` — executar primeiro aquele plano se ainda não foi feito.)

---

## Ordem de Execução

1. **Backend** — Criar `backend/lib/cityGraphBuilder.js` (Step 3)
2. **Backend** — Modificar `backend/lib/supabase.js` (Step 1)
3. **Backend** — Modificar `backend/server.js` (Step 2)
4. **Frontend lib** — Adicionar `fetchCityGraphData` em `src/lib/api.js` (Step 4)
5. **Frontend lib** — Criar `src/lib/cityGraphAdapter.js` (Step 5)
6. **Frontend components** — Criar os 4 componentes em `src/components/CityGraph/` (Steps 6–8)
7. **CSS** — Adicionar animações no stylesheet global (Step 9)
8. **HomePage** — Trocar `CityMap` por `CityGraphMap` (Step 10)

Testar com `npm run dev` e verificar:
- [ ] Mapa carrega sem erros no console
- [ ] Pins aparecem no mapa (mesmo sem dados do DB, deve mostrar 0 nodes com loading state)
- [ ] Com DB populado (após executar `MOCK_DATA_PERSISTENCE.md`): ~50–80 nodes aparecem no mapa
- [ ] Edges animados (dots em movimento) aparecem entre listings que aceitam trade
- [ ] LayerToggle filtra os nodes visiveis
- [ ] Clicar num node abre o EntityDetailPanel com info e conexões
- [ ] Clicar num node conectado no painel navega para aquele node

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| ~7 círculos estáticos de `mockData.js` local | 50–80 nodes animados vindos do Supabase |
| Sem edges / conexões | Bezier edges com dots animados entre listings com trade match |
| Sem filtros | LayerToggle com botões por layer |
| Panel simples com imagem + preço | EntityDetailPanel com layer badge, status, connections navegáveis |
| Dados hardcoded (não refletem DB) | Cada listing novo criado via chat aparece automaticamente no mapa |

---

## Nota Técnica: Por Que JS e Não TypeScript

O ipe-city-graph usa TypeScript. IpeXchange é um projeto JS puro (conforme CLAUDE.md). Todos os ports acima foram escritos sem tipos. Para garantir:
- Nenhum arquivo `.ts` ou `.tsx` deve ser criado
- Nenhum `tsconfig.json` deve ser adicionado
- Nenhum `@types/*` package deve ser instalado
- O `vite.config.js` existente não precisa ser alterado
