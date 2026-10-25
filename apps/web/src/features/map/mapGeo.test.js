import { describe, expect, it } from 'vitest';
import { boundsOf, formatArea, roundCoord, toFeatureCollection } from './mapGeo.js';

describe('map geo helpers', () => {
  it('rounds coordinates to roughly one kilometre', () => {
    expect(roundCoord(-27.59487)).toBe(-27.59);
    expect(roundCoord('-48.5551')).toBe(-48.56);
  });

  it('formats the shared area, preferring the label', () => {
    expect(formatArea(-27.5949, -48.5482)).toBe('-27.59, -48.55');
    expect(formatArea(-27.59, -48.55, 'Ipe City')).toBe('Ipe City');
    expect(formatArea(null, undefined)).toBeNull();
  });

  it('builds GeoJSON in lng/lat order and drops invalid points', () => {
    const fc = toFeatureCollection([
      { id: 'a', lat: -27.6, lng: -48.5, direction: 'offer', kind: 'good', title: 'Bike' },
      { id: 'b', lat: 'x', lng: 1 },
    ]);
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry.coordinates).toEqual([-48.5, -27.6]);
    expect(fc.features[0].properties.direction).toBe('offer');
  });

  it('computes bounds or null', () => {
    expect(boundsOf([])).toBeNull();
    expect(boundsOf([{ lat: 1, lng: 2 }, { lat: 3, lng: 0 }])).toEqual([[0, 1], [2, 3]]);
  });
});
