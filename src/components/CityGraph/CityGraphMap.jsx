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
