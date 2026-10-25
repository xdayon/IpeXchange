export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';
export const DEFAULT_CENTER = [-48.55, -27.59];
export const DEFAULT_ZOOM = 10.5;

// The server stores coordinates rounded to ~1 km (two decimals); the UI shows
// the same precision so people see exactly what is shared.
export const roundCoord = (value) => Math.round(Number(value) * 100) / 100;

export function formatArea(lat, lng, label) {
  if (label) return label;
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  return `${roundCoord(lat).toFixed(2)}, ${roundCoord(lng).toFixed(2)}`;
}

export function toFeatureCollection(points = []) {
  return {
    type: 'FeatureCollection',
    features: points
      .filter((p) => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
      .map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [Number(p.lng), Number(p.lat)] },
        properties: {
          id: p.id, direction: p.direction, kind: p.kind, title: p.title, price_fiat: p.price_fiat ?? null,
        },
      })),
  };
}

export function boundsOf(points = []) {
  const valid = points.filter((p) => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)));
  if (valid.length === 0) return null;
  const lngs = valid.map((p) => Number(p.lng));
  const lats = valid.map((p) => Number(p.lat));
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
}

export const cssColor = (name, fallback) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};
