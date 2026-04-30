// src/components/CityGraph/CityGraphMap.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import jurereMap from '../../data/jurere-map.json';
import { fetchCityGraphData } from '../../lib/api';
import { LAYER_META } from '../../lib/cityGraphAdapter';
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

export default function CityGraphMap({ onRegisterSimEdge, onEntitiesLoad }) {
  // ── Leaflet refs ──────────────────────────────────────────────────────────
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const layerGroupsRef = useRef(new Map());
  const edgeLayerRef = useRef(null);
  const simLayerRef = useRef(null);
  const edgeHighlightLayerRef = useRef(null);
  const overlayLayerRef = useRef(null);

  // ── Animation refs ────────────────────────────────────────────────────────
  const animDotsRef = useRef([]);
  const simDotsRef = useRef([]);
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
  const stopAnimRef = useRef(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  });

  const startAnimRef = useRef(() => {
    stopAnimRef.current();
    const now = performance.now();
    if (animBaseTimeRef.current === 0) animBaseTimeRef.current = now;
    if (animPausedAtRef.current != null) {
      animPausedTotalRef.current += now - animPausedAtRef.current;
      animPausedAtRef.current = null;
    }
    const tick = () => {
      const currentNow = performance.now();
      const elapsed = currentNow - animBaseTimeRef.current - animPausedTotalRef.current;
      
      // Animate static dots
      for (const dot of animDotsRef.current) {
        const progress = ((elapsed + dot.offsetMs) % dot.durationMs) / dot.durationMs;
        dot.marker.setLatLng(interpolatePath(dot.path, progress));
      }

      // Animate sim dots
      for (const dot of simDotsRef.current) {
        const age = currentNow - dot.startedAt;
        if (age >= dot.durationMs) {
          dot.marker.remove();
          continue;
        }
        const progress = age / dot.durationMs;
        dot.marker.setLatLng(interpolatePath(dot.path, progress));
      }
      simDotsRef.current = simDotsRef.current.filter(
        d => currentNow - d.startedAt < d.durationMs
      );

      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  });

  // ── SimEngine Callbacks ───────────────────────────────────────────────────
  const handleSimEdge = useCallback(({ source, target, color, durationMs }) => {
    const simLayer = simLayerRef.current;
    if (!simLayer || !mapRef.current) return;
    if (!activeLayersRef.current.has(source.layer)) return;
    if (!activeLayersRef.current.has(target.layer)) return;

    const from = { lat: source.location.lat, lng: source.location.lon };
    const to = { lat: target.location.lat, lng: target.location.lon };
    const path = sampleBezier(from, to);

    const halo = L.circleMarker(path[0], {
      radius: 6, stroke: false, fillOpacity: 0.9,
      fillColor: color + '33', interactive: false, bubblingMouseEvents: false,
    }).addTo(simLayer);

    const core = L.circleMarker(path[0], {
      radius: 2.5, stroke: false, fillOpacity: 1,
      fillColor: color, interactive: false, bubblingMouseEvents: false,
    }).addTo(simLayer);

    const startedAt = performance.now();
    simDotsRef.current.push(
      { marker: halo, path, durationMs, startedAt },
      { marker: core, path, durationMs, startedAt },
    );
  }, []);



  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCityGraphData().then(data => {
      setEntities(data.entities || []);
      setEdges(data.edges || []);
      if (onEntitiesLoad) onEntitiesLoad(data.entities || []);
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

    edgeLayerRef.current = L.layerGroup().addTo(map);
    simLayerRef.current = L.layerGroup().addTo(map);
    overlayLayerRef.current = L.layerGroup().addTo(map);
    edgeHighlightLayerRef.current = L.layerGroup().addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    map.on('zoomstart', () => {
      if (animPausedAtRef.current != null) return;
      animPausedAtRef.current = performance.now();
      stopAnimRef.current();
    });
    map.on('zoomend', () => {
      startAnimRef.current();
    });

    // Register the handleSimEdge callback for external SimEngine
    if (onRegisterSimEdge) {
      onRegisterSimEdge(handleSimEdge);
    }

    mapRef.current = map;

    return () => {
      stopAnimRef.current();
      map.remove();
      mapRef.current = null;
    };
  }, [handleSimEdge, onRegisterSimEdge]);

  // ── Draw functions ────────────────────────────────────────────────────────

  function drawOverlays() {
    const overlayLayer = overlayLayerRef.current;
    if (!overlayLayer) return;
    overlayLayer.clearLayers();
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

    for (const { path, hash } of edgesWithPaths) {
      if (hash % 3 === 0) continue;
      const isAqua = hash % 2 === 0;
      const durationMs = (4.5 + (hash % 11) * 0.5) * 1000;
      const offsetMs = (hash % 16) * 500;

      const halo = L.circleMarker(path[0], {
        radius: 5, stroke: false, fillOpacity: 1,
        fillColor: isAqua ? 'rgba(122,231,255,0.12)' : 'rgba(162,215,41,0.10)',
        interactive: false, bubblingMouseEvents: false,
      }).addTo(edgeLayer);

      const core = L.circleMarker(path[0], {
        radius: 2, stroke: false, fillOpacity: 1,
        fillColor: isAqua ? 'rgba(122,231,255,0.55)' : 'rgba(162,215,41,0.45)',
        interactive: false, bubblingMouseEvents: false,
      }).addTo(edgeLayer);

      animDotsRef.current.push(
        { marker: halo, path, durationMs, offsetMs },
        { marker: core, path, durationMs, offsetMs }
      );
    }

    if (animDotsRef.current.length > 0 || simDotsRef.current.length > 0) {
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
        if (entity.isSafetyZone || entity.layer === 'environment') continue;
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
        const marker = L.marker([entity.location.lat, entity.location.lon], { icon, zIndexOffset: isVenue ? 1000 : 0 });
        marker.on('click', () => setSelectedId(prev => prev === entity.id ? null : entity.id));
        marker.on('mouseover', () => setHoveredId(entity.id));
        marker.on('mouseout', () => setHoveredId(null));
        marker.bindTooltip(tooltipHtml(entity, layerMeta.color, layerMeta.label), { className: 'city-graph-tooltip', direction: 'top', offset: [0, -(size / 2 + 4)] });
        marker.addTo(group);
        markersRef.current.set(entity.id, marker);
      }
      group.addTo(map);
    }
  }

  // ── SEPARATED EFFECTS ──────────────────────────────────────────────────────
  
  // Effect 1: Markers
  useEffect(() => {
    if (!mapRef.current) return;
    drawMarkers();
  }, [entities, activeLayers, selectedId]);

  // Effect 2: Edges + Overlays + SimEngine Update
  useEffect(() => {
    if (!mapRef.current || !edgeLayerRef.current) return;
    drawEdges();
    drawOverlays();
  }, [entities, edges, activeLayers]);

  // Effect 3: Highlights
  useEffect(() => {
    if (!edgeHighlightLayerRef.current) return;
    drawHighlights();
  }, [selectedId, hoveredId]);

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
