// src/lib/cityGraphAdapter.js

export const LAYER_META = [
  { id: 'commerce',   label: 'Stores',      color: '#B4F44A', icon: 'Store' },
  { id: 'identity',   label: 'Citizens',    color: '#38BDF8', icon: 'Users' },
  { id: 'listings',   label: 'Listings',    color: '#A78BFA', icon: 'Tag' },
  { id: 'events',     label: 'Events',      color: '#FB923C', icon: 'CalendarDays' },
  { id: 'investment', label: 'Investment',  color: '#FFC857', icon: 'TrendingUp' },
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
