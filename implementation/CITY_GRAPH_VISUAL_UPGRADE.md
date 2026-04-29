# City Graph — Visual Upgrade & Layer Population Plan

**Objetivo:** Aproximar o City Graph do IpeXchange ao visual do `ipe-city-graph` original — fundo teal profundo, overlay de ruas em cyan/lime, dots duplos animados, todas as 7 layers com entidades, e connections reais fluindo no mapa.

---

## Diagnóstico: O Que Está Diferente

| Aspecto | Original (ipe-city-graph) | Atual (IpeXchange) |
|---------|--------------------------|-------------------|
| Fundo do mapa | `#031526` — teal escuro | `#0B1421` — azul-preto |
| Tile filter | `brightness(0.45) hue-rotate(-10deg) saturate(1.4)` | Nenhum — tile colorido original |
| Overlay de ruas | SVG com paths de `jurere-map.json` (coastline lime, roads cyan) | Não existe |
| Grid animado | `.city-graph-map-grid` + `.city-graph-map-scanline` + `.city-graph-map-tint` | Não implementado |
| Edges | `L.polyline` (move com o mapa) + `L.circleMarker` p/ dots | `L.svgOverlay` estático — não acompanha zoom/pan |
| Dots animados | Dois círculos por edge: halo (r=5, 10% opac.) + core (r=2, 50% opac.) | Um único dot SVG |
| Cores dos dots | Alternância cyan `#7AE7FF` / lime `#A2D729` baseada em hash do ID | Cor única por layer |
| Highlight de hover | Layer separada com dashed polylines ao hoverar/selecionar | Não implementado |
| Marker design | Venue especial (gold glow `#FFC857`), 3 tamanhos (main/venue/regular) | Todos iguais |
| Tooltip | Rico — ícone swatch + nome + badge de categoria + descrição | Só nome + layer |
| Layers ativas ao iniciar | Todas as 7 | Apenas commerce + identity |
| Commerce | 80+ listings do DB ✓ | ✓ |
| Identity | 8 pessoas (estáticas) | 1 usuário real do DB |
| Infrastructure | 7 nós (estáticos) | 0 |
| Governance | 3 propostas (estáticas) | 0 |
| Safety | 2 incidentes + 2 zonas (estáticos) | 0 |
| Environment | 6 sensores (estáticos) | 0 |
| Events | 3 eventos (estáticos) | 0 |

---

## Arquivos a Criar / Modificar

```
src/
  data/
    jurere-map.json               ← CRIAR (copiar do ipe-city-graph)
  lib/
    cityGraphAdapter.js           ← MODIFICAR (adicionar STATIC_ENTITIES)
  components/
    CityGraph/
      CityGraphMap.jsx            ← REESCREVER completamente
      EntityDetailPanel.jsx       ← MODIFICAR (tooltip rico)
      LayerToggle.jsx             ← sem mudança necessária

backend/
  lib/
    cityGraphBuilder.js           ← MODIFICAR (adicionar entidades estáticas + personas)

src/index.css                     ← MODIFICAR (adicionar classes visuais do original)
```

---

## Step 1 — Criar `src/data/jurere-map.json`

Este arquivo contém todos os paths SVG do mapa de Jurerê. Ele é copiado do repositório do Iggy — não é gerado nem modificado.

Criar o arquivo `src/data/jurere-map.json` com o seguinte conteúdo exato:

```json
{
  "bbox": {
    "minLat": -27.4518,
    "maxLat": -27.4334,
    "minLon": -48.5135,
    "maxLon": -48.4905
  },
  "width": 1000,
  "height": 760,
  "coastline": [
    "M860.7,167.9 L701.6,155.5 L610.9,142.1 L378.0,102.5 L202.5,41.1 L142.3,13.8",
    "M981.8,177.4 L860.7,167.9"
  ],
  "water": [
    "M291.7,106.8 L300.6,89.3 L304.9,78.0",
    "M2.3,400.7 L24.2,392.4 L28.8,387.5 L43.0,346.7 L32.7,316.5 L25.5,292.9 L21.4,266.9 L26.1,253.6 L26.5,241.1 L29.4,236.7 L42.3,233.4 L44.0,228.1 L41.9,213.0 L47.2,203.4 L52.8,202.1 L74.3,208.0 L90.4,216.3 L141.9,235.8"
  ],
  "green": [
    "M505.3,614.8 L511.6,618.1 L508.9,624.5 L506.7,622.1 L505.3,614.8",
    "M468.3,633.8 L467.7,638.1 L470.1,641.5 L482.0,646.6 L495.4,647.6 L508.5,644.5 L507.4,639.3 L494.6,631.6 L479.3,630.9 L468.3,633.8",
    "M524.8,161.5 L587.3,215.8 L549.8,186.2 L524.8,161.5",
    "M830.3,467.1 L827.7,467.3 L825.4,468.4 L823.8,470.1 L823.1,472.3 L823.4,474.5 L824.7,476.4 L826.7,477.8 L829.2,478.4 L831.9,478.1 L834.1,477.1 L835.8,475.3 L836.5,473.2 L836.2,471.0 L834.9,469.1 L832.9,467.7 L830.3,467.1",
    "M556.3,542.1 L584.7,542.4 L556.3,542.1",
    "M273.7,467.9 L269.9,630.8 L279.5,634.9 L313.4,630.4 L386.0,625.9 L447.5,629.6 L459.7,618.8 L437.3,578.4 L463.2,547.5 L444.9,522.0 L449.0,479.9 L434.2,438.2 L362.0,424.0 L355.6,465.3 L333.5,473.6 L273.7,467.9"
  ],
  "roadsMajor": [
    "M989.9,250.4 L978.9,249.5 L943.6,246.7 L935.8,246.1 L914.1,244.4 L895.0,242.9 L858.8,240.0 L849.4,239.3",
    "M270.9,397.1 L291.9,342.3 L321.2,262.5 L333.6,230.9",
    "M468.0,613.4 L462.9,623.5 L457.0,628.5 L448.6,631.7 L440.9,633.1",
    "M467.5,642.7 L477.5,647.7 L485.5,649.6 L494.3,650.0 L505.9,648.6",
    "M466.5,632.4 L465.5,635.3 L465.5,638.4 L466.6,641.3 L467.5,642.7",
    "M509.7,636.1 L499.5,630.7 L489.8,628.9 L482.5,628.9 L476.8,629.6 L470.8,631.1 L466.5,632.4",
    "M509.7,636.1 L504.8,627.8 L502.5,617.2 L509.1,556.6 L510.6,543.7 L515.6,500.9 L521.6,448.7 L522.3,443.4",
    "M440.9,633.1 L399.7,628.6 L376.2,627.6 L349.4,628.5 L328.8,630.9 L281.1,637.6",
    "M846.7,295.6 L859.7,296.5 L889.1,298.6 L929.4,301.6 L950.8,303.1 L969.3,304.5",
    "M313.7,225.6 L302.9,257.1 L282.7,310.8 L272.8,337.2 L252.2,392.1",
    "M522.3,443.4 L526.8,404.4 L529.3,382.9 L531.5,363.3 L535.5,329.0 L541.7,275.9 L542.4,269.9",
    "M507.5,271.2 L508.0,267.1",
    "M505.9,648.6 L516.4,648.4 L526.6,651.6 L532.0,654.2",
    "M522.3,443.4 L516.6,442.9 L506.0,442.0 L503.6,441.8 L487.6,440.4",
    "M520.7,644.6 L512.0,629.5 L511.1,623.3 L513.2,619.1 L522.4,614.3",
    "M252.2,392.1 L258.6,404.1 L261.0,414.3 L259.2,521.1 L257.0,626.8",
    "M263.4,640.2 L263.4,626.9 L264.5,574.6 L268.1,412.3 L268.7,406.1 L270.9,397.1",
    "M487.6,440.4 L481.3,496.5 L476.2,541.4 L474.8,553.3 L468.8,605.9 L468.0,613.4",
    "M846.7,295.6 L854.9,242.8 L855.2,239.8",
    "M846.7,295.6 L842.9,354.5 L831.4,459.5 L830.7,465.7",
    "M849.4,239.3 L844.1,291.5 L846.7,295.6",
    "M988.9,479.1 L939.1,475.0 L909.7,472.6 L851.4,467.9 L838.9,466.9 L834.0,466.5",
    "M738.7,458.7 L738.3,463.3",
    "M522.3,443.4 L552.3,447.9 L619.9,453.5 L692.9,459.6 L738.3,463.3 L793.9,467.9 L817.5,470.1 L821.1,472.7",
    "M834.0,466.5 L830.7,465.7 L826.9,465.9",
    "M507.5,271.2 L503.9,299.4 L497.0,358.9",
    "M507.5,271.2 L524.7,272.6 L544.3,274.3 L587.2,277.3 L642.5,282.3 L675.0,284.9 L712.7,288.0 L734.5,289.8 L762.7,292.1 L796.5,294.9 L809.6,295.9 L837.5,297.7 L846.7,295.6",
    "M846.7,295.6 L820.3,292.4 L734.9,285.5 L674.8,280.7 L594.0,274.0 L545.1,270.2 L537.9,269.6 L525.2,268.5 L508.0,267.1",
    "M508.0,267.1 L469.2,263.8 L453.9,261.2 L422.2,254.6 L408.4,251.2 L341.2,232.9 L327.9,229.5 L313.7,225.6 L249.0,208.2 L240.1,205.4 L219.4,196.0 L149.4,163.5 L139.2,158.7 L53.6,118.8 L5.6,96.5 L1.0,20.5",
    "M44.8,118.9 L52.7,122.6 L121.0,154.4 L142.6,164.5 L206.6,194.3 L234.3,207.2 L243.0,210.6 L305.5,227.4 L322.4,232.0 L331.9,234.3 L389.9,250.2 L417.3,257.4 L453.7,265.3 L468.0,267.6 L507.5,271.2",
    "M497.0,358.9 L494.4,380.8 L492.0,401.8 L488.4,433.8 L487.6,440.4",
    "M492.0,401.8 L512.3,403.3 L526.8,404.4",
    "M263.4,626.9 L257.0,626.8",
    "M281.1,637.6 L263.4,640.2",
    "M263.4,640.2 L221.4,646.6",
    "M257.0,626.8 L257.0,641.1",
    "M221.4,646.6 L118.5,662.4 L105.1,665.3 L93.0,669.9 L80.5,676.6 L72.4,682.7 L9.6,742.7 L0.2,750.1"
  ],
  "roadsMinor": [
    "M548.3,387.3 L699.8,399.8 L749.8,403.9 L800.9,408.1 L876.7,414.4",
    "M280.5,126.0 L240.1,205.4 L238.3,208.9",
    "M541.8,442.7 L548.3,387.3 L554.8,331.8 L561.5,275.6",
    "M189.3,314.9 L323.5,350.8 L443.9,378.6 L494.1,383.9",
    "M813.9,296.3 L794.4,463.3",
    "M779.5,293.5 L760.7,460.5",
    "M746.0,290.7 L727.0,457.8",
    "M712.7,288.0 L693.5,455.1",
    "M674.8,280.7 L662.9,396.8 L656.9,452.1",
    "M487.6,440.4 L437.6,436.0 L385.9,426.6 L358.8,420.7 L252.2,392.1 L141.1,362.3",
    "M895.0,242.9 L876.7,414.4 L870.8,469.5",
    "M554.8,331.8 L689.1,342.8 L739.6,346.9 L790.3,351.1 L842.9,354.5",
    "M503.9,299.4 L459.6,295.6 L409.6,285.8 L321.2,262.5",
    "M491.0,410.8 L434.9,405.6 L378.7,394.3 L281.6,369.1",
    "M378.7,394.3 L386.3,367.6",
    "M464.2,352.6 L440.1,349.4 L394.1,340.2 L333.2,324.3",
    "M323.5,350.8 L343.3,297.2",
    "M160.3,367.5 L249.4,394.5 L252.2,392.1",
    "M282.7,310.8 L203.3,289.4",
    "M302.9,257.1 L231.6,237.9",
    "M160.3,367.5 L203.3,289.4 L237.1,228.0",
    "M313.7,225.6 L302.9,257.1 L282.7,310.8 L272.8,337.2 L252.2,392.1",
    "M508.0,267.1 L517.6,203.4 L521.2,171.9",
    "M515.2,171.4 L507.7,237.1 L508.0,267.1",
    "M591.3,244.8 L678.1,251.9 L813.1,262.9 L829.4,264.2",
    "M674.8,280.7 L681.2,223.9",
    "M638.6,299.1 L631.1,366.2 L623.7,432.2",
    "M638.6,299.1 L642.5,282.3",
    "M619.9,453.5 L608.0,559.6 L601.0,621.1",
    "M515.6,500.9 L574.3,505.8 L613.6,509.0",
    "M552.3,447.9 L546.2,503.5",
    "M474.8,553.3 L509.1,556.6",
    "M522.4,614.3 L527.8,567.2",
    "M53.0,11.3 L192.7,70.5 L201.1,75.7 L223.8,83.6 L291.3,108.9 L352.7,125.8 L364.4,129.0 L375.7,131.7 L510.5,163.7",
    "M824.2,478.5 L813.3,637.5 L818.3,606.5 L823.8,558.6 L828.6,516.4 L832.3,483.1 L832.7,479.6",
    "M824.2,478.5 L812.9,515.8 L788.4,523.9 L757.3,531.7 L736.1,521.3 L725.0,506.0 L708.5,496.8 L690.3,492.5 L666.4,490.2 L651.6,491.8 L631.2,484.4 L620.9,487.4 L618.0,507.2 L635.2,523.3 L649.4,529.8 L683.6,532.9 L691.3,546.0 L710.4,558.9 L719.6,583.6 L714.3,612.8 L685.4,619.2 L663.3,612.6 L641.4,608.6 L619.4,625.0 L620.7,628.7",
    "M695.6,575.1 L694.6,566.0 L708.1,560.3 L709.0,554.2 L700.3,544.4 L689.5,533.3 L653.4,527.9 L637.5,521.6 L619.2,503.7 L624.1,487.4 L635.3,486.2 L652.4,494.0 L681.3,493.6 L700.6,497.5 L728.8,509.9 L733.7,519.9 L746.2,533.6 L761.0,531.7 L779.5,531.9 L800.2,524.4 L814.7,516.2 L822.1,481.7 L824.2,478.5"
  ]
}
```

---

## Step 2 — Atualizar CSS Global (`src/index.css`)

Substituir a seção `/* ─── City Graph Animations ─── */` existente pelo bloco completo abaixo. Se não existir, adicionar ao final:

```css
/* ─── City Graph: Visual Classes (port from ipe-city-graph) ──────────────── */

@keyframes city-graph-pulse {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}

@keyframes city-graph-zone {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 0.8; }
}

@keyframes city-graph-flow {
  0%   { stroke-dashoffset: 20; }
  100% { stroke-dashoffset: 0; }
}

@keyframes dashboard-scan {
  0%   { transform: translateY(-180%); }
  100% { transform: translateY(420%); }
}

/* Map wrapper with exact dimensions from original */
.city-graph-map-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #031526;
}

/* Animated grid overlay */
.city-graph-map-grid {
  position: absolute;
  inset: 0;
  z-index: 500;
  pointer-events: none;
  opacity: 0.35;
  background-image:
    linear-gradient(rgba(122, 231, 255, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(122, 231, 255, 0.07) 1px, transparent 1px);
  background-size: 3rem 3rem;
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.88), transparent 90%);
}

/* Horizontal scanning line */
.city-graph-map-scanline {
  position: absolute;
  inset: 0;
  z-index: 501;
  height: 24px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(122, 231, 255, 0), rgba(122, 231, 255, 0.12), rgba(122, 231, 255, 0));
  animation: dashboard-scan 8s linear infinite;
  opacity: 0.4;
}

/* Color tint gradients */
.city-graph-map-tint {
  position: absolute;
  inset: 0;
  z-index: 502;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 18%, rgba(122, 231, 255, 0.16), transparent 26%),
    radial-gradient(circle at 78% 74%, rgba(162, 215, 41, 0.16), transparent 24%),
    linear-gradient(135deg, rgba(2, 38, 66, 0.1), rgba(58, 165, 255, 0.06) 52%, rgba(162, 215, 41, 0.06)),
    linear-gradient(180deg, rgba(1, 17, 31, 0.08), rgba(1, 17, 31, 0.28));
}

/* Leaflet container background */
.city-graph-leaflet-map,
.city-graph-leaflet-map .leaflet-container {
  background: #031526 !important;
}

/* Marker wrapper — reset Leaflet defaults */
.city-graph-marker-wrapper {
  border: none !important;
  background: none !important;
}

/* Rich tooltip */
.city-graph-tooltip {
  max-width: 260px !important;
  padding: 10px 12px !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 0.65rem !important;
  background: rgba(4, 25, 43, 0.94) !important;
  color: white !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(16px);
}

.city-graph-tooltip .leaflet-tooltip-tip {
  display: none;
}

/* Leaflet zoom controls — dark style */
.city-graph-leaflet-map .leaflet-control-zoom {
  z-index: 600 !important;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 0.9rem !important;
}

.city-graph-leaflet-map .leaflet-control-zoom a {
  border-color: rgba(255, 255, 255, 0.12) !important;
  background: rgba(4, 25, 43, 0.85) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(12px);
}

.city-graph-leaflet-map .leaflet-control-zoom a:hover {
  background: rgba(4, 25, 43, 0.95) !important;
  color: white !important;
}

/* Safety zone pulse */
.city-graph-zone-pulse {
  animation: city-graph-zone 4s ease-in-out infinite;
}

/* Pin pulse */
.city-graph-pin-pulse {
  animation: city-graph-pulse 2.4s ease-in-out infinite;
}
```

---

## Step 3 — Reescrever `src/components/CityGraph/CityGraphMap.jsx`

Esta é a mudança mais importante. O arquivo atual deve ser **completamente substituído** pelo código abaixo.

Diferenças chave em relação à versão atual:
- Importa `jurere-map.json` e renderiza como SVG overlay
- Aplica filtro de tile pane: `brightness(0.45) hue-rotate(-10deg) saturate(1.4)`
- Usa `L.polyline` para edges (move com o mapa)
- Usa `L.circleMarker` com `setLatLng()` para dots animados (halo + core por edge)
- Implementa hover highlight layer
- Marcadores com 3 categorias: venue principal (gold), venues (gold menor), regular (cor do layer)
- Tooltip rico com ícone swatch + descrição
- Todas as 7 layers ativas ao iniciar
- Pausa/retoma animação durante zoom

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
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 760;

// IDs das venues principais (receberão tratamento especial de marker)
const VENUE_IDS = new Set(['venue-founder-haus', 'venue-ai-haus', 'venue-privacy-haus']);
const MAIN_VENUE_ID = 'venue-founder-haus';
const VENUE_GOLD = '#FFC857';

// ─── Geo helpers ─────────────────────────────────────────────────────────────

function latLonToSvg(loc) {
  const BBOX = { minLat: -27.4518, maxLat: -27.4334, minLon: -48.5135, maxLon: -48.4905 };
  return {
    x: ((loc.lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon)) * MAP_WIDTH,
    y: ((BBOX.maxLat - loc.lat) / (BBOX.maxLat - BBOX.minLat)) * MAP_HEIGHT,
  };
}

// Bezier control point: slight perpendicular offset for curve
function bezierCP(from, to) {
  const mx = (from.lng + to.lng) / 2;
  const my = (from.lat + to.lat) / 2;
  const dx = to.lng - from.lng;
  const dy = to.lat - from.lat;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const offset = Math.min(0.0012, len * 0.18);
  return { lng: mx + (-dy / len) * offset, lat: my + (dx / len) * offset };
}

// Sample bezier curve into array of LatLng points
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

// Interpolate a position along a sampled path
function interpolatePath(path, progress) {
  const p = Math.max(0, Math.min(0.9999, progress));
  const scaled = p * (path.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const [lat1, lng1] = path[idx];
  const [lat2, lng2] = path[Math.min(idx + 1, path.length - 1)];
  return [lat1 + (lat2 - lat1) * frac, lng1 + (lng2 - lng1) * frac];
}

// ─── Marker HTML builders ─────────────────────────────────────────────────────

function markerHtml(color, isSelected, isVenue, isMainVenue, label) {
  if (isMainVenue) {
    const size = isSelected ? 44 : 36;
    return `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;inset:0;border-radius:50%;background:${VENUE_GOLD};opacity:0.15;box-shadow:0 0 30px ${VENUE_GOLD}80,0 0 60px ${VENUE_GOLD}30"></div>
      <div style="width:14px;height:14px;border-radius:50%;background:${VENUE_GOLD};box-shadow:0 0 14px ${VENUE_GOLD}"></div>
      ${label ? `<div style="position:absolute;bottom:${size + 6}px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:12px;font-weight:700;color:white;background:rgba(4,25,43,0.92);padding:3px 10px;border-radius:8px;border:1px solid ${VENUE_GOLD}60;pointer-events:none">${label}</div>` : ''}
    </div>`;
  }
  if (isVenue) {
    const size = isSelected ? 32 : 28;
    return `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;inset:0;border-radius:50%;background:${VENUE_GOLD};opacity:0.12;box-shadow:0 0 20px ${VENUE_GOLD}60"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:${VENUE_GOLD};box-shadow:0 0 10px ${VENUE_GOLD}"></div>
      ${label ? `<div style="position:absolute;bottom:${size + 5}px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:600;color:white;background:rgba(4,25,43,0.90);padding:2px 7px;border-radius:7px;border:1px solid ${VENUE_GOLD}40;pointer-events:none">${label}</div>` : ''}
    </div>`;
  }
  const size = isSelected ? 22 : 16;
  const dot = isSelected ? 8 : 5;
  return `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.12;box-shadow:0 0 ${isSelected ? 14 : 6}px ${color}"></div>
    <div style="width:${dot}px;height:${dot}px;border-radius:50%;background:${color};box-shadow:0 0 5px ${color}80"></div>
    ${(isSelected && label) ? `<div style="position:absolute;bottom:${size + 4}px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:600;color:white;background:rgba(4,25,43,0.9);padding:2px 6px;border-radius:6px;border:1px solid ${color}40;pointer-events:none">${label}</div>` : ''}
  </div>`;
}

// Rich tooltip HTML matching original design
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
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const layerGroupsRef = useRef(new Map());
  const edgeLayerRef = useRef(null);
  const edgeHighlightLayerRef = useRef(null);
  const overlayLayerRef = useRef(null);
  const animDotsRef = useRef([]);
  const animFrameRef = useRef(null);
  const animBaseTimeRef = useRef(0);
  const animPausedAtRef = useRef(null);
  const animPausedTotalRef = useRef(0);

  const [entities, setEntities] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [activeLayers, setActiveLayers] = useState(
    new Set(LAYER_META.map(l => l.id))
  );
  const [loading, setLoading] = useState(true);

  // Keep refs in sync for use inside callbacks
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

  // ── Fetch data ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCityGraphData().then(data => {
      setEntities(data.entities || []);
      setEdges(data.edges || []);
      setLoading(false);
    });
  }, []);

  // ── Init Leaflet ─────────────────────────────────────────────────────────
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

    // Tile layer with the exact filter from the original
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map);

    // Apply tile pane filter — makes the base map darker and slightly teal-shifted
    const tilePane = map.getPane('tilePane');
    if (tilePane) {
      tilePane.style.filter = 'brightness(0.45) hue-rotate(-10deg) saturate(1.4)';
    }

    // ── Jurere map SVG overlay (roads, coastline, water, green areas) ──────
    const roadSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    roadSvg.setAttribute('viewBox', `0 0 ${jurereMap.width} ${jurereMap.height}`);
    roadSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const svgLayers = [
      { paths: jurereMap.green,      stroke: 'rgba(162,215,41,0.28)',   width: '10' },
      { paths: jurereMap.water,      stroke: 'rgba(122,231,255,0.42)',  width: '8' },
      { paths: jurereMap.roadsMinor, stroke: 'rgba(58,165,255,0.20)',   width: '2.1' },
      { paths: jurereMap.roadsMajor, stroke: 'rgba(122,231,255,0.50)',  width: '3.3' },
      { paths: jurereMap.coastline,  stroke: 'rgba(162,215,41,0.88)',   width: '5' },
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

    // ── Layer groups for entities ──────────────────────────────────────────
    edgeLayerRef.current = L.layerGroup().addTo(map);
    edgeHighlightLayerRef.current = L.layerGroup().addTo(map);
    overlayLayerRef.current = L.layerGroup().addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Pause/resume dot animation during zoom (prevents visual glitches)
    map.on('zoomstart', () => {
      if (animPausedAtRef.current != null) return;
      animPausedAtRef.current = performance.now();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    });
    map.on('zoomend', () => {
      if (animPausedAtRef.current != null) {
        animPausedTotalRef.current += performance.now() - animPausedAtRef.current;
        animPausedAtRef.current = null;
      }
      startDotAnimation();
    });

    mapRef.current = map;
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Dot animation ─────────────────────────────────────────────────────────
  function startDotAnimation() {
    if (!animDotsRef.current.length) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const now = performance.now();
    if (animBaseTimeRef.current === 0) animBaseTimeRef.current = now;

    const tick = () => {
      const t = performance.now();
      const elapsed = t - animBaseTimeRef.current - animPausedTotalRef.current;
      for (const dot of animDotsRef.current) {
        const progress = ((elapsed + dot.offsetMs) % dot.durationMs) / dot.durationMs;
        const pos = interpolatePath(dot.path, progress);
        dot.marker.setLatLng(pos);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }

  // ── Build markers ─────────────────────────────────────────────────────────
  const rebuildMarkers = useCallback(() => {
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
      if (!activeLayers.has(layerMeta.id)) continue;

      const layerEntities = entitiesRef.current.filter(e => e.layer === layerMeta.id);

      for (const entity of layerEntities) {
        // Safety zones are drawn as circles in the overlay, not markers
        if (entity.isSafetyZone) continue;
        // Environment sensors shown as label overlays, not click markers
        if (entity.layer === 'environment') continue;

        const isSelected = selectedIdRef.current === entity.id;
        const isVenue = VENUE_IDS.has(entity.id);
        const isMain = entity.id === MAIN_VENUE_ID;
        const showLabel = isSelected || isVenue;
        const size = isMain ? (isSelected ? 44 : 36) : isVenue ? (isSelected ? 32 : 28) : (isSelected ? 22 : 16);

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

        marker.bindTooltip(tooltipHtml(entity, layerMeta.color, layerMeta.label), {
          className: 'city-graph-tooltip',
          direction: 'top',
          offset: [0, -(size / 2 + 4)],
        });

        marker.addTo(group);
        markersRef.current.set(entity.id, marker);
      }
      group.addTo(map);
    }
  }, [activeLayers, selectedId]);

  // ── Draw static overlays (safety zones, environment sensors) ─────────────
  const redrawOverlays = useCallback(() => {
    const overlayLayer = overlayLayerRef.current;
    const map = mapRef.current;
    if (!overlayLayer || !map) return;
    overlayLayer.clearLayers();

    // Safety zones as dashed circles
    if (activeLayersRef.current.has('safety')) {
      for (const entity of entitiesRef.current.filter(e => e.isSafetyZone)) {
        L.circle([entity.location.lat, entity.location.lon], {
          radius: entity.zoneRadiusMeters || 80,
          color: 'rgba(255,107,107,0.25)',
          weight: 1.5,
          dashArray: '6 4',
          fillColor: 'rgba(255,107,107,0.07)',
          fillOpacity: 0.07,
          interactive: false,
          bubblingMouseEvents: false,
        }).addTo(overlayLayer);
      }
    }

    // Environment sensors as soft glow + label
    if (activeLayersRef.current.has('environment')) {
      for (const entity of entitiesRef.current.filter(e => e.layer === 'environment')) {
        L.circle([entity.location.lat, entity.location.lon], {
          radius: 35,
          stroke: false,
          fillColor: '#4ECDC4',
          fillOpacity: 0.1,
          interactive: false,
          bubblingMouseEvents: false,
        }).addTo(overlayLayer);

        if (entity.value != null) {
          L.marker([entity.location.lat, entity.location.lon], {
            interactive: false,
            keyboard: false,
            zIndexOffset: 50,
            icon: L.divIcon({
              className: 'city-graph-marker-wrapper',
              html: `<div style="transform:translateY(3px);text-align:center;color:#4ECDC4;font-size:9px;font-weight:600;opacity:0.8;white-space:nowrap">${entity.value}${entity.unit || ''}</div>`,
              iconSize: [42, 16],
              iconAnchor: [21, 8],
            }),
          }).addTo(overlayLayer);
        }
      }
    }
  }, []);

  // ── Draw edges ────────────────────────────────────────────────────────────
  const redrawEdges = useCallback(() => {
    const edgeLayer = edgeLayerRef.current;
    if (!edgeLayer) return;

    edgeLayer.clearLayers();
    animDotsRef.current = [];
    animBaseTimeRef.current = 0;
    animPausedAtRef.current = null;
    animPausedTotalRef.current = 0;

    redrawOverlays();

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
      edgesWithPaths.push({ path, hash });
    }

    // Animated dots (halo + core) for ~2/3 of edges
    for (const { path, hash } of edgesWithPaths) {
      if (hash % 3 === 0) continue; // skip 1/3 for visual breathing room

      const isAqua = hash % 2 === 0;
      const durationMs = (4.5 + (hash % 11) * 0.5) * 1000;
      const offsetMs = (hash % 16) * 500;

      const haloColor = isAqua ? 'rgba(122,231,255,0.12)' : 'rgba(162,215,41,0.10)';
      const coreColor = isAqua ? 'rgba(122,231,255,0.50)' : 'rgba(162,215,41,0.40)';

      const halo = L.circleMarker(path[0], {
        radius: 5, stroke: false, fillOpacity: 1,
        fillColor: haloColor, interactive: false, bubblingMouseEvents: false,
      }).addTo(edgeLayer);

      const core = L.circleMarker(path[0], {
        radius: 2, stroke: false, fillOpacity: 1,
        fillColor: coreColor, interactive: false, bubblingMouseEvents: false,
      }).addTo(edgeLayer);

      animDotsRef.current.push(
        { marker: halo, path, durationMs, offsetMs },
        { marker: core, path, durationMs, offsetMs }
      );
    }

    if (animDotsRef.current.length > 0) startDotAnimation();
  }, [redrawOverlays]);

  // ── Highlight selected/hovered entity connections ─────────────────────────
  const redrawHighlights = useCallback(() => {
    const hlLayer = edgeHighlightLayerRef.current;
    if (!hlLayer) return;
    hlLayer.clearLayers();

    const entityMap = Object.fromEntries(entitiesRef.current.map(e => [e.id, e]));

    const toHighlight = [];
    if (selectedIdRef.current) toHighlight.push({ id: selectedIdRef.current, sticky: true });
    if (hoveredIdRef.current && hoveredIdRef.current !== selectedIdRef.current) {
      toHighlight.push({ id: hoveredIdRef.current, sticky: false });
    }

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
          color: sticky ? 'rgba(255,255,255,0.38)' : 'rgba(122,231,255,0.30)',
          weight: sticky ? 1.3 : 1,
          dashArray: '6 4',
          interactive: false,
          smoothFactor: 1,
          bubblingMouseEvents: false,
        }).addTo(hlLayer);
      }
    }
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => { rebuildMarkers(); }, [rebuildMarkers]);
  useEffect(() => { redrawEdges(); }, [redrawEdges]);
  useEffect(() => { redrawHighlights(); }, [redrawHighlights, selectedId, hoveredId]);

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
      {/* Visual overlay layers — order matters (z-index 500–502) */}
      <div className="city-graph-map-grid" />
      <div className="city-graph-map-scanline" />
      <div className="city-graph-map-tint" />

      {/* Leaflet container (z-index below overlays) */}
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

      {/* Loading */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(3,21,38,0.75)',
        }}>
          <span style={{ color: '#7AE7FF', fontSize: 13, letterSpacing: '0.08em' }}>
            Loading city graph…
          </span>
        </div>
      )}

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

## Step 4 — Atualizar `backend/lib/cityGraphBuilder.js`

### 4a. Adicionar entidades estáticas (todos os layers faltantes)

Adicionar antes da função `buildCityGraphPayload`:

```js
// ─── Static entities for non-DB layers ───────────────────────────────────────
// These mirror the data from ipe-city-graph's static TypeScript files.
// They populate infrastructure, governance, safety, environment, and events layers.

const STATIC_ENTITIES = [
  // ── Identity (citizen personas from mock sessions) ─────────────────────────
  { id: 'citizen-alex',       layer: 'identity', label: 'Alex M.',     description: 'Ipê City resident. Offers electric mobility and tech gear.',      location: { lat: -27.43890, lon: -48.49985 } },
  { id: 'citizen-bia',        layer: 'identity', label: 'Bia Tech',    description: 'Full-stack developer. React, Next.js, Node.js. AI automation.',    location: { lat: -27.43810, lon: -48.50120 } },
  { id: 'citizen-bread',      layer: 'identity', label: 'Bread & Co',  description: 'Artisan baker. Sourdough subscriptions. Loves fresh produce.',     location: { lat: -27.44050, lon: -48.50200 } },
  { id: 'citizen-luna',       layer: 'identity', label: 'Luna Foto',   description: 'Photographer and videographer. Available for events and portraits.',location: { lat: -27.44200, lon: -48.49800 } },
  { id: 'citizen-fitcoach',   layer: 'identity', label: 'FitCoach',    description: 'Personal trainer and wellness coach. Yoga, strength, mobility.',    location: { lat: -27.43750, lon: -48.50400 } },
  { id: 'citizen-sound',      layer: 'identity', label: 'Sound Lab',   description: 'Sound healing practitioner. Crystal bowls, gongs, group journeys.',location: { lat: -27.44300, lon: -48.50350 } },
  { id: 'citizen-green',      layer: 'identity', label: 'Green Roots', description: 'Permaculture designer. Solar kits, urban farming workshops.',        location: { lat: -27.44100, lon: -48.50600 } },
  { id: 'citizen-code',       layer: 'identity', label: 'Code Lab',    description: 'Python and AI educator. No-code tools. Workshops and mentoring.',   location: { lat: -27.43900, lon: -48.50550 } },
  { id: 'citizen-marina',     layer: 'identity', label: 'Marina H.',   description: 'Reiki practitioner and breathwork guide. Holistic healing space.',  location: { lat: -27.44166, lon: -48.50434 } },
  { id: 'citizen-trailco',    layer: 'identity', label: 'TrailCo',     description: 'Outdoor adventure gear rental. Kayaking and trail exploration.',    location: { lat: -27.44400, lon: -48.49700 } },
  { id: 'citizen-pixel',      layer: 'identity', label: 'Studio Pixel',description: 'Graphic designer and brand identity specialist. Visual storytelling.',location: { lat: -27.43680, lon: -48.50250 } },
  { id: 'citizen-balance',    layer: 'identity', label: 'Balance Studio',description: 'Acupuncture and life coaching. Traditional medicine meets modern coaching.',location: { lat: -27.44050, lon: -48.50450 } },
  { id: 'citizen-inner',      layer: 'identity', label: 'Inner Spaces',description: 'Mindfulness and meditation programs. 8-week MBSR curriculum.',     location: { lat: -27.44350, lon: -48.50150 } },
  { id: 'citizen-skyview',    layer: 'identity', label: 'SkyView Lab', description: 'Drone pilot and aerial photographer. DJI specialist.',              location: { lat: -27.43700, lon: -48.49900 } },
  { id: 'citizen-community',  layer: 'identity', label: 'Community Hub',description: 'Ipê City community center. Donations, events, shared resources.',  location: { lat: -27.44050, lon: -48.50050 } },

  // ── Venues (commerce, special gold markers) ────────────────────────────────
  { id: 'venue-founder-haus', layer: 'commerce', label: 'Founder Haus', description: 'The main co-living and co-working hub of Ipê City. Builders, creators, operators gather here.', location: { lat: -27.43890, lon: -48.49985 }, kind: 'venue' },
  { id: 'venue-ai-haus',      layer: 'commerce', label: 'AI Haus',      description: 'ML research and hackathon space. Weekly AI study groups and builders sprint.', location: { lat: -27.43747, lon: -48.50342 }, kind: 'venue' },
  { id: 'venue-privacy-haus', layer: 'commerce', label: 'Privacy Haus', description: 'ZK and cryptography builders space. Smart contract audits and security research.', location: { lat: -27.44166, lon: -48.50434 }, kind: 'venue' },

  // ── Infrastructure ─────────────────────────────────────────────────────────
  { id: 'infra-solar-north',   layer: 'infrastructure', label: 'North Solar Array',     description: 'Community solar panel cluster powering the co-working hub. 50kW, currently at 34kW load.', location: { lat: -27.43822, lon: -48.50714 }, kind: 'solar-panel',  capacity: 50,   currentLoad: 34,  unit: 'kW' },
  { id: 'infra-solar-south',   layer: 'infrastructure', label: 'South Solar Array',     description: 'Residential solar cluster along the southern village grid. 35kW capacity.', location: { lat: -27.44478, lon: -48.50050 }, kind: 'solar-panel',  capacity: 35,   currentLoad: 28,  unit: 'kW' },
  { id: 'infra-internet-hub',  layer: 'infrastructure', label: 'Mesh Internet Hub',     description: 'Main internet relay node providing decentralized connectivity. 1Gbps, 620Mbps in use.', location: { lat: -27.43845, lon: -48.50142 }, kind: 'internet-node', capacity: 1000, currentLoad: 620, unit: 'Mbps' },
  { id: 'infra-internet-beach',layer: 'infrastructure', label: 'Beachfront Relay',      description: 'Coastal mesh node extending coverage to the beach. 500Mbps, 180Mbps in use.', location: { lat: -27.43701, lon: -48.49950 }, kind: 'internet-node', capacity: 500,  currentLoad: 180, unit: 'Mbps' },
  { id: 'infra-water-main',    layer: 'infrastructure', label: 'Water Quality Station', description: 'Monitors and filters village water supply with real-time quality reporting. 72% capacity.', location: { lat: -27.44123, lon: -48.49687 }, kind: 'water-station', capacity: 100,  currentLoad: 72,  unit: '%' },
  { id: 'infra-ev-charger',    layer: 'infrastructure', label: 'EV Charging Station',   description: 'Four-port electric vehicle charging station powered by South Solar Array. 2/4 ports active.', location: { lat: -27.44413, lon: -48.50623 }, kind: 'ev-charger',   capacity: 4,    currentLoad: 2,   unit: 'ports' },
  { id: 'infra-power-grid',    layer: 'infrastructure', label: 'Microgrid Controller',  description: 'Smart grid controller balancing solar, battery, and grid power. 145kW / 200kW.', location: { lat: -27.43850, lon: -48.49822 }, kind: 'power-grid',   capacity: 200,  currentLoad: 145, unit: 'kW' },

  // ── Governance ─────────────────────────────────────────────────────────────
  { id: 'gov-bike-lanes',      layer: 'governance', label: 'Bike Lane Expansion',        description: 'Proposal to extend bike lane network by 2.4km. 24 votes for, 3 against. Budget: $15,000.', location: { lat: -27.43945, lon: -48.50567 }, status: 'active', votesFor: 24, votesAgainst: 3,  budget: 15000 },
  { id: 'gov-garden',          layer: 'governance', label: 'Community Garden',           description: 'Permaculture food garden proposal. Already passed: 31 for, 2 against. Budget: $8,000.', location: { lat: -27.44452, lon: -48.50430 }, status: 'passed', votesFor: 31, votesAgainst: 2,  budget: 8000 },
  { id: 'gov-noise-policy',    layer: 'governance', label: 'Data-Driven Noise Ordinance',description: 'Draft proposal using sensor data to shape noise policies. Community-driven, pending votes.', location: { lat: -27.44379, lon: -48.49593 }, status: 'draft',  votesFor: 0,  votesAgainst: 0, budget: 0 },

  // ── Safety ─────────────────────────────────────────────────────────────────
  { id: 'safety-flood',   layer: 'safety', label: 'Coastal Flood Warning',   description: 'Medium severity. High tide + storm surge advisory for beachfront properties. Marcelo and Lucas responding.', location: { lat: -27.44000, lon: -48.49000 }, severity: 'medium', resolved: false },
  { id: 'safety-power',   layer: 'safety', label: 'Microgrid Brownout',      description: 'Low severity. Temporary power dip in south sector. Battery backup engaged. Pedro responding.', location: { lat: -27.44300, lon: -48.50500 }, severity: 'low', resolved: true },
  { id: 'safety-zone-beach',  layer: 'safety', label: 'Beachfront Monitoring Zone',  description: 'Environmental monitoring zone for flood and storm surge conditions. 60m radius.', location: { lat: -27.44050, lon: -48.49200 }, isSafetyZone: true, zoneRadiusMeters: 80 },
  { id: 'safety-zone-village',layer: 'safety', label: 'Village Core Response Zone',  description: 'Primary emergency response area covering the residential village grid. 80m radius.', location: { lat: -27.44100, lon: -48.50300 }, isSafetyZone: true, zoneRadiusMeters: 110 },

  // ── Environment sensors ────────────────────────────────────────────────────
  { id: 'env-air-north',      layer: 'environment', label: 'Air Quality — North',    description: 'AQI 28 — excellent. Beachfront sensor monitoring particulate matter and CO₂.',     location: { lat: -27.43800, lon: -48.49700 }, value: 28,   unit: ' AQI' },
  { id: 'env-air-south',      layer: 'environment', label: 'Air Quality — South',    description: 'AQI 22 — excellent. Residential area sensor.',                                       location: { lat: -27.44300, lon: -48.50100 }, value: 22,   unit: ' AQI' },
  { id: 'env-noise-beach',    layer: 'environment', label: 'Noise Level — Beach',    description: '52 dB near event areas. Within normal parameters for daytime activity.',             location: { lat: -27.43900, lon: -48.49600 }, value: 52,   unit: 'dB' },
  { id: 'env-noise-village',  layer: 'environment', label: 'Noise Level — Village',  description: '38 dB in village core. Quiet residential ambiance.',                                  location: { lat: -27.44200, lon: -48.50200 }, value: 38,   unit: 'dB' },
  { id: 'env-water-lagoon',   layer: 'environment', label: 'Water Quality — Lagoon', description: '92% safe. Lagoon edge water sensor. Monitoring pH, turbidity and contaminants.',      location: { lat: -27.44400, lon: -48.49900 }, value: '92%', unit: ' safe' },
  { id: 'env-temp-center',    layer: 'environment', label: 'Temperature — Center',   description: '26°C at village center. Comfortable for outdoor activity.',                           location: { lat: -27.44100, lon: -48.50100 }, value: 26,   unit: '°C' },

  // ── Events ─────────────────────────────────────────────────────────────────
  { id: 'event-grants',   layer: 'events', label: 'Grants Kickoff',     description: 'Opening ceremony for Ipê Village 2026 grants program. All citizens welcome.', location: { lat: -27.43890, lon: -48.49985 }, startDate: '2026-05-06', attendees: 48 },
  { id: 'event-xmtp',    layer: 'events', label: 'XMTP Workshop',       description: 'Hands-on workshop building encrypted, wallet-native messaging apps.',          location: { lat: -27.43890, lon: -48.49985 }, startDate: '2026-05-10', attendees: 24 },
  { id: 'event-ai-gov',  layer: 'events', label: 'AI Governance',       description: 'Exploring AI agents for Ipê City operations. Open discussion format.',          location: { lat: -27.43747, lon: -48.50342 }, startDate: '2026-05-14', attendees: 36 },
];

// Mock session ID → citizen entity ID mapping
const SESSION_TO_CITIZEN = {
  'test-session-id':    'citizen-alex',
  'bia-tech-id':        'citizen-bia',
  'bread-co-id':        'citizen-bread',
  'luna-photo-id':      'citizen-luna',
  'fitcoach-id':        'citizen-fitcoach',
  'sound-lab-id':       'citizen-sound',
  'green-roots-id':     'citizen-green',
  'code-lab-id':        'citizen-code',
  'ipe-farm-id':        'citizen-alex',
  'marina-h-id':        'citizen-marina',
  'trailco-id':         'citizen-trailco',
  'studio-pixel-id':    'citizen-pixel',
  'balance-studio-id':  'citizen-balance',
  'inner-spaces-id':    'citizen-inner',
  'skyview-lab-id':     'citizen-skyview',
  'community-id':       'citizen-community',
};

// Static relationships between entities in different layers
const STATIC_EDGES = [
  // Venues ↔ citizens
  { id: 'e-alex-founder',       source: 'citizen-alex',      target: 'venue-founder-haus', relationship: 'uses',       label: 'Resident' },
  { id: 'e-bia-ai-haus',        source: 'citizen-bia',       target: 'venue-ai-haus',      relationship: 'provides',   label: 'Builder' },
  { id: 'e-marina-privacy',     source: 'citizen-marina',    target: 'venue-privacy-haus', relationship: 'uses',       label: 'Practitioner' },
  { id: 'e-code-ai-haus',       source: 'citizen-code',      target: 'venue-ai-haus',      relationship: 'provides',   label: 'Educator' },
  { id: 'e-pixel-founder',      source: 'citizen-pixel',     target: 'venue-founder-haus', relationship: 'provides',   label: 'Creative' },
  // Venues ↔ events
  { id: 'e-grants-founder',     source: 'event-grants',      target: 'venue-founder-haus', relationship: 'hosts',      label: 'Hosted at' },
  { id: 'e-xmtp-founder',       source: 'event-xmtp',        target: 'venue-founder-haus', relationship: 'hosts',      label: 'Hosted at' },
  { id: 'e-ai-gov-aihaus',      source: 'event-ai-gov',      target: 'venue-ai-haus',      relationship: 'hosts',      label: 'Hosted at' },
  // Infrastructure ↔ venues
  { id: 'e-solar-n-founder',    source: 'infra-solar-north', target: 'venue-founder-haus', relationship: 'powers',     label: 'Powers' },
  { id: 'e-solar-s-ev',         source: 'infra-solar-south', target: 'infra-ev-charger',   relationship: 'powers',     label: 'Powers' },
  { id: 'e-grid-solar-n',       source: 'infra-power-grid',  target: 'infra-solar-north',  relationship: 'depends-on', label: 'Balances' },
  { id: 'e-grid-solar-s',       source: 'infra-power-grid',  target: 'infra-solar-south',  relationship: 'depends-on', label: 'Balances' },
  { id: 'e-internet-founder',   source: 'infra-internet-hub',target: 'venue-founder-haus', relationship: 'provides',   label: 'Connects' },
  // Safety ↔ infrastructure/environment
  { id: 'e-flood-water',        source: 'safety-flood',      target: 'infra-water-main',   relationship: 'monitors',   label: 'Monitors' },
  { id: 'e-power-grid',         source: 'safety-power',      target: 'infra-power-grid',   relationship: 'responds-to',label: 'Responded' },
  // Governance ↔ citizens/infrastructure
  { id: 'e-bike-community',     source: 'gov-bike-lanes',    target: 'citizen-community',  relationship: 'proposed-by',label: 'Proposed by' },
  { id: 'e-garden-green',       source: 'gov-garden',        target: 'citizen-green',      relationship: 'proposed-by',label: 'Proposed by' },
  { id: 'e-noise-env',          source: 'gov-noise-policy',  target: 'env-noise-beach',    relationship: 'monitors',   label: 'Data from' },
  // Citizen ↔ citizen (sister venues connection)
  { id: 'e-founder-aihaus',     source: 'venue-founder-haus',target: 'venue-ai-haus',      relationship: 'sister-venue',label: 'Sister Venue' },
  { id: 'e-founder-privacy',    source: 'venue-founder-haus',target: 'venue-privacy-haus', relationship: 'sister-venue',label: 'Sister Venue' },
];
```

### 4b. Atualizar a função `buildCityGraphPayload`

Substituir a função `buildCityGraphPayload` existente pela versão abaixo:

```js
export function buildCityGraphPayload({ listings, users, stores, transactions, demands }) {
  // DB-derived entities
  const dbEntities = [
    ...listings.map(listingToEntity),
    ...users.map(userToEntity),
    ...stores.map(storeToEntity),
  ];

  // Merge static entities (all layers) — avoiding ID collisions with DB entities
  const allEntities = [...dbEntities, ...STATIC_ENTITIES];

  const entityMap = Object.fromEntries(allEntities.map(e => [e.id, e]));

  // DB edges: real transactions
  const txEdges = transactions
    .map(tx => transactionToEdge(tx, entityMap))
    .filter(Boolean);

  // DB edges: trade keyword matches between listings
  const tradeEdges = synthesizeTradeEdges(listings);

  // DB edges: citizen → their listings
  const citizenListingEdges = [];
  for (const listing of listings) {
    const citizenId = SESSION_TO_CITIZEN[listing.session_id];
    const listingEntityId = `listing-${listing.id}`;
    if (citizenId && entityMap[listingEntityId]) {
      citizenListingEdges.push({
        id: `citizen-listing-${citizenId}-${listing.id}`,
        source: citizenId,
        target: listingEntityId,
        relationship: 'provides',
        label: 'Offers',
      });
    }
  }

  // Deduplicate all edges
  const seenEdges = new Set();
  const allEdges = [...STATIC_EDGES, ...txEdges, ...tradeEdges, ...citizenListingEdges]
    .filter(e => {
      const key = [e.source, e.target].sort().join('|');
      if (seenEdges.has(key)) return false;
      seenEdges.add(key);
      // Only include edges where both endpoints exist
      return entityMap[e.source] && entityMap[e.target];
    });

  return { entities: allEntities, edges: allEdges };
}
```

---

## Step 5 — Verificar que `src/components/HomePage.jsx` usa `CityGraphMap`

Confirmar que a linha do import já aponta para o novo componente (deve estar assim após o plano anterior):

```js
const CityGraphMap = lazy(() => import('./CityGraph/CityGraphMap'));
```

E no JSX:
```jsx
<CityGraphMap />
```

---

## Resultado Esperado

| Elemento | Antes | Depois |
|----------|-------|--------|
| Fundo | Azul-preto `#0B1421` | Teal profundo `#031526` com gradientes cyan/lime |
| Mapa base | CartoDB Dark sem filtro | CartoDB Dark + `brightness(0.45) hue-rotate(-10deg) saturate(1.4)` |
| Linhas da cidade | Não existem | Coastline verde-lima, ruas cyan, água azul sobre o mapa |
| Grid animado | Não existe | Grid de pontos cyan + linha de scan horizontal |
| Nós comerciais | ~80 verdes | ~80 verde-lima (commerce), mais 3 venues em dourado |
| Nós cidadãos | 1 azul | 15 cidadãos azuis, cada um posicionado near their listings |
| Infrastructure | 0 | 7 nós laranja (solar, internet, water, EV, power grid) |
| Governance | 0 | 3 nós roxos (proposals com status visual) |
| Safety | 0 | 2 nós vermelhos + 2 círculos de zona dashed |
| Environment | 0 | 6 sensores com labels flutuantes (`28 AQI`, `52dB`, `26°C`) |
| Events | 0 | 3 eventos (participam nas edges/highlights mas sem marker) |
| Total de nós | ~81 | ~130+ (com todas as layers ativas) |
| Edges | SVG overlay estático, mono-color | `L.polyline` que move com o mapa, cores alternando cyan/lime |
| Dots animados | 1 dot/edge, SVG, color único | Halo (r=5) + Core (r=2) por edge, cores `#7AE7FF`/`#A2D729` |
| Hover highlight | Não existe | Dashed polylines nas conexões ao hoverar qualquer nó |
| Tooltip | Nome + layer badge | Ícone swatch + nome + badge + descrição (2 linhas) |

---

## Ordem de Execução

1. Criar `src/data/jurere-map.json` (Step 1) — independente, pode ser feito primeiro
2. Atualizar `src/index.css` (Step 2) — substituir/adicionar classes city-graph
3. Atualizar `backend/lib/cityGraphBuilder.js` (Step 4) — adicionar STATIC_ENTITIES, SESSION_TO_CITIZEN, STATIC_EDGES, e reescrever buildCityGraphPayload
4. Reescrever `src/components/CityGraph/CityGraphMap.jsx` (Step 3) — o arquivo mais crítico
5. Confirmar `HomePage.jsx` (Step 5) — verificação rápida

**Testar com:**
- [ ] Mapa carrega com fundo escuro teal
- [ ] Linhas de rua cyan/lime visíveis sobre o mapa base
- [ ] Grid animado e scanline visíveis
- [ ] Todos os 7 layer toggles filtram nós corretamente
- [ ] ~130 nós distribuídos pelo mapa com cores por layer
- [ ] Edges com dots duplos fluindo entre os nós (cyan e lime alternados)
- [ ] Hover sobre um nó → highlights dashed nas suas conexões
- [ ] Clicar num nó → EntityDetailPanel com lista de conexões
- [ ] Zoom in/out não quebra a animação dos dots
- [ ] Sensores de ambiente mostram label flutuante (`26°C`, `52dB`, etc.)
- [ ] Zonas de safety aparecem como círculos dashed vermelhos
