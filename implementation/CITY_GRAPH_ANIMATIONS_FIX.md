# City Graph — Fix: Animações, Conexões e Raios

**Objetivo:** Restaurar as conexões animadas (edges com dots em movimento), os raios de zonas de safety, os labels de sensores de ambiente, e o sistema de highlight de hover/seleção.

---

## Diagnóstico: Por Que Sumiu Tudo

O código está estruturalmente correto — os dados chegam do backend, as funções de desenho existem e estão bem escritas. O problema é um **bug de timing do React**: as funções de desenho rodam no momento errado (sem dados) e nunca são chamadas de novo quando os dados chegam.

### A Cadeia do Problema

**1. Fetch assíncrono:** Os dados (`entities`, `edges`) chegam do servidor DEPOIS que o componente monta. No momento do mount, os estados são `[]`.

**2. `useCallback` com deps erradas:** As três funções principais têm dependências que não incluem `entities` ou `edges`:

```js
// redrawEdges — deps: [redrawOverlays], onde redrawOverlays tem []
// → Nunca muda, roda UMA VEZ no mount, com edges = []
const redrawEdges = useCallback(() => { ... }, [redrawOverlays]);

// rebuildMarkers — deps: [activeLayers, selectedId]
// → Só muda quando o usuário clica em layers/markers, não quando dados chegam
const rebuildMarkers = useCallback(() => { ... }, [activeLayers, selectedId]);

// redrawHighlights — deps: []
// → Idem, roda uma vez no mount
const redrawHighlights = useCallback(() => { ... }, []);
```

**3. Os effects disparam uma vez, sem dados:**

```js
useEffect(() => { rebuildMarkers(); }, [rebuildMarkers]);  // roda no mount: entities = []
useEffect(() => { redrawEdges(); }, [redrawEdges]);        // roda no mount: edges = []
useEffect(() => { redrawHighlights(); }, [...]);           // idem
```

**4. Quando os dados chegam:** `setEntities(...)` e `setEdges(...)` mudam o estado React. `entitiesRef.current` e `edgesRef.current` são atualizados (linhas 147-148 no componente). Mas **nenhum dos três effects re-dispara** porque `activeLayers`, `selectedId`, e `redrawOverlays` não mudaram.

**Resultado:** Os nós aparecem (porque `rebuildMarkers` depende de `activeLayers` que tem valor correto desde o início), mas edges, dots animados, safety zones e environment sensors nunca são desenhados.

Wait — os nós só aparecem porque o componente re-renderiza por causa do `setLoading(false)` e nessa re-renderização `rebuildMarkers` não muda... então na verdade os nós também não deveriam aparecer pelo mesmo motivo.

**Explicação dos nós visíveis:** Os nós aparecem porque `activeLayers` é inicializado com todos os layers no primeiro render, e o `useEffect(() => { rebuildMarkers() }, [rebuildMarkers])` roda no mount. Nesse momento, `entitiesRef.current` JÁ tem dados se a fetch for rápida o suficiente (menos de um frame). Se for lenta, os nós também não aparecem até o usuário interagir com um layer toggle.

**O problema adicional de `startDotAnimation`:** É uma função regular (não `useCallback`/`useRef`). O handler `zoomend` captura a instância do primeiro render. Essa instância é estável (só usa refs internamente), mas se `animDotsRef.current` estiver vazio quando `zoomend` disparar (porque `redrawEdges` nunca rodou com dados), `startDotAnimation` retorna imediatamente.

---

## A Solução

**Um único effect consolidado que dispara quando os dados chegam ou o estado visual muda.**

Em vez de três effects separados com deps incorretas, usar um único:

```js
useEffect(() => {
  if (!mapRef.current || !edgeLayerRef.current || entities.length === 0) return;
  rebuildMarkersStable();
  redrawEdgesStable();
  redrawHighlightsStable();
}, [entities, edges, activeLayers, selectedId, hoveredId]);
```

Para isso funcionar, as funções precisam ser **estáveis** (não recriadas a cada render) e ler tudo de refs. Converter de `useCallback` para `useRef` com atualização síncrona.

---

## Arquivos a Modificar

```
src/components/CityGraph/CityGraphMap.jsx   ← REESCREVER (fix de triggers)
```

Somente este arquivo. Backend e demais componentes estão corretos.

---

## Step 1 — Reescrever `src/components/CityGraph/CityGraphMap.jsx`

Substituir o arquivo completo pelo código abaixo. As mudanças em relação à versão atual:

1. Funções `rebuildMarkers`, `redrawEdges`, `redrawHighlights`, `redrawOverlays` convertidas de `useCallback` para **funções normais** que são atualizadas em um `useRef` a cada render
2. `startDotAnimation` e `stopDotAnimation` convertidas para `useRef` estável
3. Um único `useEffect` consolidado que dispara quando `entities`, `edges`, `activeLayers`, `selectedId` ou `hoveredId` mudam
4. `activeLayers.has()` substituído por `activeLayersRef.current.has()` onde necessário (stale closure fix)
5. `startDotAnimation` chamada com `useCallback` da ref em vez de função solta

```jsx
// src/components/CityGraph/CityGraphMap.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import jurereMap from '../../data/jurere-map.json';
import { fetchCityGraphData } from '../../lib/api';
import { LAYER_META, LAYER_COLOR } from '../../lib/cityGraphAdapter';
import { EntityDetailPanel } from './EntityDetailPanel';
import { LayerToggle } from './LayerToggle';

const SW = [-27.4518, -48.5135];
const NE = [-27.4334, -48.4905];
const MAP_CENTER = [-27.43934, -48.50254];
const SVG_BOUNDS = L.latLngBounds(SW, NE);

const VENUE_IDS = new Set(['venue-founder-haus', 'venue-ai-haus', 'venue-privacy-haus']);
const MAIN_VENUE_ID = 'venue-founder-haus';
const VENUE_GOLD = '#FFC857';

// ─── Geo helpers ──────────────────────────────────────────────────────────────

function bezierCP(from, to) {
  const mx = (from.lng + to.lng) / 2;
  const my = (from.lat + to.lat) / 2;
  const dx = to.lng - from.lng;
  const dy = to.lat - from.lat;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const offset = Math.min(0.0012, len * 0.18);
  return { lng: mx + (-dy / len) * offset, lat: my + (dx / len) * offset };
}

function sampleBezier(from, to, steps = 24) {
  const cp = bezierCP(from, to);
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * from.lat + 2 * u * t * cp.lat + t * t * to.lat,
      u * u * from.lng + 2 * u * t * cp.lng + t * t * to.lng,
    ]);
  }
  return pts;
}

function interpolatePath(path, progress) {
  const p = Math.max(0, Math.min(0.9999, progress));
  const scaled = p * (path.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const [lat1, lng1] = path[idx];
  const [lat2, lng2] = path[Math.min(idx + 1, path.length - 1)];
  return [lat1 + (lat2 - lat1) * frac, lng1 + (lng2 - lng1) * frac];
}

// ─── Marker HTML ──────────────────────────────────────────────────────────────

function markerHtml(color, isSelected, isVenue, isMainVenue, label) {
  if (isMainVenue) {
    const size = isSelected ? 44 : 36;
    return `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;inset:0;border-radius:50%;background:${VENUE_GOLD};opacity:0.15;box-shadow:0 0 30px ${VENUE_GOLD}80,0 0 60px ${VENUE_GOLD}30"></div>
      <div style="width:14px;height:14px;border-radius:50%;background:${VENUE_GOLD};box-shadow:0 0 14px ${VENUE_GOLD}"></div>
      ${label ? `<div style="position:absolute;bottom:${size+6}px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:12px;font-weight:700;color:white;background:rgba(4,25,43,0.92);padding:3px 10px;border-radius:8px;border:1px solid ${VENUE_GOLD}60;pointer-events:none">${label}</div>` : ''}
    </div>`;
  }
  if (isVenue) {
    const size = isSelected ? 32 : 28;
    return `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;inset:0;border-radius:50%;background:${VENUE_GOLD};opacity:0.12;box-shadow:0 0 20px ${VENUE_GOLD}60"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:${VENUE_GOLD};box-shadow:0 0 10px ${VENUE_GOLD}"></div>
      ${label ? `<div style="position:absolute;bottom:${size+5}px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:600;color:white;background:rgba(4,25,43,0.90);padding:2px 7px;border-radius:7px;border:1px solid ${VENUE_GOLD}40;pointer-events:none">${label}</div>` : ''}
    </div>`;
  }
  const size = isSelected ? 22 : 16;
  const dot = isSelected ? 8 : 5;
  return `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.12;box-shadow:0 0 ${isSelected ? 14 : 6}px ${color}"></div>
    <div style="width:${dot}px;height:${dot}px;border-radius:50%;background:${color};box-shadow:0 0 5px ${color}80"></div>
    ${(isSelected && label) ? `<div style="position:absolute;bottom:${size+4}px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:600;color:white;background:rgba(4,25,43,0.9);padding:2px 6px;border-radius:6px;border:1px solid ${color}40;pointer-events:none">${label}</div>` : ''}
  </div>`;
}

function tooltipHtml(entity, color, layerLabel) {
  return `<div style="display:flex;gap:10px;align-items:flex-start;min-width:200px;max-width:260px">
    <div style="width:36px;height:36px;border-radius:8px;background:${color}22;border:1px solid ${color}30;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;font-weight:700;color:${color}">${entity.label.charAt(0)}</div>
    <div style="min-width:0;flex:1">
      <div style="font-size:13px;font-weight:600;color:white;line-height:1.3">${entity.label}</div>
      <div style="display:flex;align-items:center;gap:4px;margin-top:4px">
        <span style="width:7px;height:7px;border-radius:50%;background:${color};flex-shrink:0"></span>
        <span style="font-size:10px;color:${color};text-transform:uppercase;letter-spacing:0.08em;font-weight:600">${layerLabel}</span>
      </div>
      <div style="font-size:11px;line-height:1.5;color:rgba(255,255,255,0.55);margin-top:4px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${entity.description || ''}</div>
    </div>
  </div>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CityGraphMap() {
  // ── Leaflet refs ──────────────────────────────────────────────────────────
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const layerGroupsRef = useRef(new Map());
  const edgeLayerRef = useRef(null);
  const edgeHighlightLayerRef = useRef(null);
  const overlayLayerRef = useRef(null);

  // ── Animation refs ────────────────────────────────────────────────────────
  const animDotsRef = useRef([]);
  const animFrameRef = useRef(null);
  const animBaseTimeRef = useRef(0);
  const animPausedAtRef = useRef(null);
  const animPausedTotalRef = useRef(0);

  // ── State ─────────────────────────────────────────────────────────────────
  const [entities, setEntities] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [activeLayers, setActiveLayers] = useState(
    new Set(LAYER_META.map(l => l.id))
  );
  const [loading, setLoading] = useState(true);

  // ── Sync all mutable values into refs so draw functions always see latest ─
  const activeLayersRef = useRef(activeLayers);
  const selectedIdRef = useRef(selectedId);
  const hoveredIdRef = useRef(hoveredId);
  const entitiesRef = useRef(entities);
  const edgesRef = useRef(edges);
  activeLayersRef.current = activeLayers;
  selectedIdRef.current = selectedId;
  hoveredIdRef.current = hoveredId;
  entitiesRef.current = entities;
  edgesRef.current = edges;

  // ── Animation: stable ref functions ──────────────────────────────────────
  // Using refs so the zoomend handler always calls the latest version
  const stopAnimRef = useRef(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  });

  const startAnimRef = useRef(() => {
    if (!animDotsRef.current.length) return;
    stopAnimRef.current();
    const now = performance.now();
    if (animBaseTimeRef.current === 0) animBaseTimeRef.current = now;
    if (animPausedAtRef.current != null) {
      animPausedTotalRef.current += now - animPausedAtRef.current;
      animPausedAtRef.current = null;
    }
    const tick = () => {
      const elapsed = performance.now() - animBaseTimeRef.current - animPausedTotalRef.current;
      for (const dot of animDotsRef.current) {
        const progress = ((elapsed + dot.offsetMs) % dot.durationMs) / dot.durationMs;
        dot.marker.setLatLng(interpolatePath(dot.path, progress));
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  });

  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCityGraphData().then(data => {
      setEntities(data.entities || []);
      setEdges(data.edges || []);
      setLoading(false);
    });
  }, []);

  // ── Init Leaflet (runs once) ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: MAP_CENTER,
      zoom: 15,
      minZoom: 13,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      maxBounds: SVG_BOUNDS.pad(0.5),
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map);

    const tilePane = map.getPane('tilePane');
    if (tilePane) {
      tilePane.style.filter = 'brightness(0.45) hue-rotate(-10deg) saturate(1.4)';
    }

    // SVG road overlay from jurere-map.json
    const roadSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    roadSvg.setAttribute('viewBox', `0 0 ${jurereMap.width} ${jurereMap.height}`);

    const svgLayers = [
      { paths: jurereMap.green,      stroke: 'rgba(162,215,41,0.28)',  width: '10' },
      { paths: jurereMap.water,      stroke: 'rgba(122,231,255,0.42)', width: '8' },
      { paths: jurereMap.roadsMinor, stroke: 'rgba(58,165,255,0.20)',  width: '2.1' },
      { paths: jurereMap.roadsMajor, stroke: 'rgba(122,231,255,0.50)', width: '3.3' },
      { paths: jurereMap.coastline,  stroke: 'rgba(162,215,41,0.88)',  width: '5' },
    ];

    for (const layer of svgLayers) {
      for (const d of layer.paths) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', layer.stroke);
        path.setAttribute('stroke-width', layer.width);
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        roadSvg.appendChild(path);
      }
    }

    L.svgOverlay(roadSvg, SVG_BOUNDS, { interactive: false, pane: 'overlayPane' }).addTo(map);

    // Leaflet layer groups (order matters for z-stacking within Leaflet)
    edgeLayerRef.current = L.layerGroup().addTo(map);          // bottom: base edge lines
    overlayLayerRef.current = L.layerGroup().addTo(map);       // middle: zones + env labels
    edgeHighlightLayerRef.current = L.layerGroup().addTo(map); // top: hover/selected highlights

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Pause animation during zoom to prevent dot glitches
    map.on('zoomstart', () => {
      if (animPausedAtRef.current != null) return;
      animPausedAtRef.current = performance.now();
      stopAnimRef.current();
    });
    map.on('zoomend', () => {
      startAnimRef.current();
    });

    mapRef.current = map;

    return () => {
      stopAnimRef.current();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Draw functions (plain functions, always read from refs) ───────────────

  function drawOverlays() {
    const overlayLayer = overlayLayerRef.current;
    const map = mapRef.current;
    if (!overlayLayer || !map) return;
    overlayLayer.clearLayers();

    // Safety zones — dashed circles
    if (activeLayersRef.current.has('safety')) {
      for (const entity of entitiesRef.current.filter(e => e.isSafetyZone)) {
        L.circle([entity.location.lat, entity.location.lon], {
          radius: entity.zoneRadiusMeters || 80,
          color: 'rgba(255,107,107,0.35)',
          weight: 1.5,
          dashArray: '6 4',
          fillColor: 'rgba(255,107,107,0.07)',
          fillOpacity: 0.07,
          interactive: false,
          bubblingMouseEvents: false,
        }).addTo(overlayLayer);
      }
    }

    // Environment sensors — soft glow + floating value label
    if (activeLayersRef.current.has('environment')) {
      for (const entity of entitiesRef.current.filter(e => e.layer === 'environment')) {
        // Soft glow circle
        L.circle([entity.location.lat, entity.location.lon], {
          radius: 30,
          stroke: false,
          fillColor: '#4ECDC4',
          fillOpacity: 0.12,
          interactive: false,
          bubblingMouseEvents: false,
        }).addTo(overlayLayer);

        // Floating value label
        if (entity.value != null) {
          L.marker([entity.location.lat, entity.location.lon], {
            interactive: false,
            keyboard: false,
            zIndexOffset: 50,
            icon: L.divIcon({
              className: 'city-graph-marker-wrapper',
              html: `<div style="transform:translateY(3px);text-align:center;color:#4ECDC4;font-size:9px;font-weight:700;opacity:0.9;white-space:nowrap;text-shadow:0 0 8px #4ECDC488">${entity.value}${entity.unit || ''}</div>`,
              iconSize: [48, 16],
              iconAnchor: [24, 8],
            }),
          }).addTo(overlayLayer);
        }
      }
    }
  }

  function drawEdges() {
    const edgeLayer = edgeLayerRef.current;
    if (!edgeLayer) return;

    edgeLayer.clearLayers();
    stopAnimRef.current();
    animDotsRef.current = [];
    animBaseTimeRef.current = 0;
    animPausedAtRef.current = null;
    animPausedTotalRef.current = 0;

    const entityMap = Object.fromEntries(entitiesRef.current.map(e => [e.id, e]));

    const validEdges = edgesRef.current.filter(edge => {
      const src = entityMap[edge.source];
      const tgt = entityMap[edge.target];
      if (!src || !tgt) return false;
      if (!activeLayersRef.current.has(src.layer)) return false;
      if (!activeLayersRef.current.has(tgt.layer)) return false;
      return true;
    });

    const edgesWithPaths = [];

    for (const edge of validEdges) {
      const src = entityMap[edge.source];
      const tgt = entityMap[edge.target];
      const from = { lat: src.location.lat, lng: src.location.lon };
      const to = { lat: tgt.location.lat, lng: tgt.location.lon };
      const path = sampleBezier(from, to);

      // Base line — very subtle white
      L.polyline(path, {
        color: 'rgba(255,255,255,0.10)',
        weight: 0.8,
        interactive: false,
        smoothFactor: 1,
        bubblingMouseEvents: false,
      }).addTo(edgeLayer);

      const hash = edge.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      edgesWithPaths.push({ path, hash, edge });
    }

    // Animated dots: halo + core, cyan or lime, for ~2/3 of edges
    for (const { path, hash } of edgesWithPaths) {
      if (hash % 3 === 0) continue;

      const isAqua = hash % 2 === 0;
      const durationMs = (4.5 + (hash % 11) * 0.5) * 1000;
      const offsetMs = (hash % 16) * 500;

      const halo = L.circleMarker(path[0], {
        radius: 5,
        stroke: false,
        fillOpacity: 1,
        fillColor: isAqua ? 'rgba(122,231,255,0.12)' : 'rgba(162,215,41,0.10)',
        interactive: false,
        bubblingMouseEvents: false,
      }).addTo(edgeLayer);

      const core = L.circleMarker(path[0], {
        radius: 2,
        stroke: false,
        fillOpacity: 1,
        fillColor: isAqua ? 'rgba(122,231,255,0.55)' : 'rgba(162,215,41,0.45)',
        interactive: false,
        bubblingMouseEvents: false,
      }).addTo(edgeLayer);

      animDotsRef.current.push(
        { marker: halo, path, durationMs, offsetMs },
        { marker: core, path, durationMs, offsetMs }
      );
    }

    if (animDotsRef.current.length > 0) {
      startAnimRef.current();
    }
  }

  function drawHighlights() {
    const hlLayer = edgeHighlightLayerRef.current;
    if (!hlLayer) return;
    hlLayer.clearLayers();

    const entityMap = Object.fromEntries(entitiesRef.current.map(e => [e.id, e]));
    const sel = selectedIdRef.current;
    const hov = hoveredIdRef.current;

    const toHighlight = [];
    if (sel) toHighlight.push({ id: sel, sticky: true });
    if (hov && hov !== sel) toHighlight.push({ id: hov, sticky: false });

    for (const { id, sticky } of toHighlight) {
      const entity = entityMap[id];
      if (!entity || !activeLayersRef.current.has(entity.layer)) continue;

      const connectedEdges = edgesRef.current.filter(e => e.source === id || e.target === id);

      for (const edge of connectedEdges) {
        const otherId = edge.source === id ? edge.target : edge.source;
        const other = entityMap[otherId];
        if (!other || !activeLayersRef.current.has(other.layer)) continue;

        const from = { lat: entity.location.lat, lng: entity.location.lon };
        const to = { lat: other.location.lat, lng: other.location.lon };
        const path = sampleBezier(from, to);

        L.polyline(path, {
          color: sticky ? 'rgba(255,255,255,0.40)' : 'rgba(122,231,255,0.32)',
          weight: sticky ? 1.4 : 1,
          dashArray: '6 4',
          interactive: false,
          smoothFactor: 1,
          bubblingMouseEvents: false,
        }).addTo(hlLayer);
      }
    }
  }

  function drawMarkers() {
    const map = mapRef.current;
    if (!map) return;

    for (const [, group] of layerGroupsRef.current) {
      group.clearLayers();
      map.removeLayer(group);
    }
    layerGroupsRef.current.clear();
    markersRef.current.clear();

    for (const layerMeta of LAYER_META) {
      const group = L.layerGroup();
      layerGroupsRef.current.set(layerMeta.id, group);

      if (!activeLayersRef.current.has(layerMeta.id)) continue;

      const layerEntities = entitiesRef.current.filter(e => e.layer === layerMeta.id);

      for (const entity of layerEntities) {
        if (entity.isSafetyZone) continue;    // drawn as L.circle in drawOverlays
        if (entity.layer === 'environment') continue; // drawn as label in drawOverlays

        const isSelected = selectedIdRef.current === entity.id;
        const isVenue = VENUE_IDS.has(entity.id);
        const isMain = entity.id === MAIN_VENUE_ID;
        const showLabel = isSelected || isVenue;
        const size = isMain
          ? (isSelected ? 44 : 36)
          : isVenue
            ? (isSelected ? 32 : 28)
            : (isSelected ? 22 : 16);

        const icon = L.divIcon({
          html: markerHtml(layerMeta.color, isSelected, isVenue, isMain, showLabel ? entity.label : undefined),
          className: 'city-graph-marker-wrapper',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([entity.location.lat, entity.location.lon], {
          icon,
          zIndexOffset: isVenue ? 1000 : 0,
        });

        marker.on('click', () => setSelectedId(prev => prev === entity.id ? null : entity.id));
        marker.on('mouseover', () => setHoveredId(entity.id));
        marker.on('mouseout', () => setHoveredId(null));

        marker.bindTooltip(
          tooltipHtml(entity, layerMeta.color, layerMeta.label),
          { className: 'city-graph-tooltip', direction: 'top', offset: [0, -(size / 2 + 4)] }
        );

        marker.addTo(group);
        markersRef.current.set(entity.id, marker);
      }

      group.addTo(map);
    }
  }

  // ── THE CONSOLIDATED EFFECT — the core of the fix ────────────────────────
  // Runs whenever data or view state changes. Reads everything from refs.
  useEffect(() => {
    // Wait for Leaflet to be ready AND for data to arrive
    if (!mapRef.current || !edgeLayerRef.current) return;

    drawMarkers();
    drawEdges();     // includes drawOverlays() call below
    drawOverlays();
    drawHighlights();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, edges, activeLayers, selectedId, hoveredId]);

  // ── Layer toggle ──────────────────────────────────────────────────────────
  const handleLayerToggle = useCallback((layerId) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(layerId) ? next.delete(layerId) : next.add(layerId);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setActiveLayers(prev =>
      prev.size >= LAYER_META.length
        ? new Set(['commerce', 'identity'])
        : new Set(LAYER_META.map(l => l.id))
    );
  }, []);

  const selectedEntity = entities.find(e => e.id === selectedId) || null;

  return (
    <div className="city-graph-map-wrapper">
      <div className="city-graph-map-grid" />
      <div className="city-graph-map-scanline" />
      <div className="city-graph-map-tint" />

      <div
        ref={containerRef}
        className="city-graph-leaflet-map"
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      />

      {/* Badge */}
      <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 600, pointerEvents: 'none' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          border: '1px solid rgba(122,231,255,0.18)',
          background: 'rgba(7,37,61,0.78)',
          borderRadius: 9999, padding: '5px 14px',
          color: 'rgba(239,242,241,0.84)', fontSize: 11,
          fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>
          City Graph · Live
        </div>
      </div>

      {/* Layer toggle */}
      <div style={{ position: 'absolute', top: 56, left: 16, zIndex: 600 }}>
        <LayerToggle
          activeLayers={activeLayers}
          onToggle={handleLayerToggle}
          onToggleAll={handleToggleAll}
          entityCount={entities.filter(e => activeLayers.has(e.layer)).length}
        />
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(3,21,38,0.80)',
        }}>
          <span style={{ color: '#7AE7FF', fontSize: 13, letterSpacing: '0.08em' }}>
            Loading city graph…
          </span>
        </div>
      )}

      {/* Entity detail panel */}
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

## O Que Mudou vs. Versão Anterior

| Aspecto | Antes (quebrado) | Depois (fix) |
|---------|-----------------|--------------|
| Draw trigger | 3 `useEffect` separados com deps estáticas | 1 `useEffect` com `[entities, edges, activeLayers, selectedId, hoveredId]` |
| `rebuildMarkers` | `useCallback([activeLayers, selectedId])` — roda quando layer muda | Função pura, lê `activeLayersRef.current` — roda quando qualquer dado muda |
| `redrawEdges` | `useCallback([redrawOverlays])` — roda UMA VEZ no mount | Função pura lendo de refs — roda junto com o effect consolidado |
| `redrawOverlays` | `useCallback([])` — roda UMA VEZ no mount (sem dados) | Função pura — roda dentro do effect consolidado |
| `redrawHighlights` | `useCallback([])` — roda UMA VEZ no mount | Função pura — roda dentro do effect consolidado |
| `startDotAnimation` | Função regular solta, capturada em closures antigas | `useRef` estável (`startAnimRef`) — sempre a mesma referência |
| `stopDotAnimation` | Não existia como função separada | `useRef` estável (`stopAnimRef`) |
| Quando edges aparecem | Nunca (dados chegam depois do único disparo) | Assim que `setEdges(data)` é chamado |
| Quando zones aparecem | Nunca | Assim que `setEntities(data)` é chamado |
| Quando env labels aparecem | Nunca | Idem |
| Hover highlight | Funcionava apenas se dados já estivessem carregados E layers mudassem | Dispara corretamente em `hoveredId` change |

---

## Checklist de Validação

Após executar, verificar na ordem:

- [ ] Mapa carrega com loading spinner
- [ ] Spinner some e ~122 nodes aparecem
- [ ] Dots animados visíveis fluindo entre nodes (cyan e lime alternados)
- [ ] Safety zones: dois círculos dashed vermelhos aparecem no mapa quando layer Safety está ativa
- [ ] Environment sensors: labels flutuantes (`28 AQI`, `52dB`, `26°C`, etc.) aparecem quando layer Environment está ativa
- [ ] Hover sobre qualquer node: conexões dashed aparecem em branco/cyan
- [ ] Click num node: painel de detalhes abre com as conexões listadas
- [ ] Click num node conectado no painel: câmera move e aquele node fica selecionado
- [ ] Toggle de layer Safety OFF → circles somem; ON → voltam
- [ ] Toggle de layer Environment OFF → labels somem; ON → voltam
- [ ] Zoom in/out: dots não "pulam" ou desaparecem (pausa/retoma animação)
- [ ] Os dots continuam animando após zoom (startAnimRef dispara no zoomend)
