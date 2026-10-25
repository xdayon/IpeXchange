import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPinOff } from 'lucide-react';
import { fetchMapPoints } from '../../api/map.js';
import { useShareArea } from './useShareArea.js';
import {
  DEFAULT_CENTER, DEFAULT_ZOOM, MAP_STYLE_URL, boundsOf, cssColor, formatArea, toFeatureCollection,
} from './mapGeo.js';
import './map.css';

function addLayers(map, data) {
  const lime = cssColor('--accent-lime', '#B4F44A');
  const cyan = cssColor('--accent-cyan', '#38BDF8');
  const dark = cssColor('--bg-dark', '#080C14');
  map.addSource('intents', { type: 'geojson', data, cluster: true, clusterRadius: 48, clusterMaxZoom: 13 });
  map.addLayer({
    id: 'clusters', type: 'circle', source: 'intents', filter: ['has', 'point_count'],
    paint: {
      'circle-color': cssColor('--accent-purple', '#A855F7'),
      'circle-radius': ['step', ['get', 'point_count'], 16, 5, 22, 20, 28],
      'circle-opacity': 0.85, 'circle-stroke-width': 3, 'circle-stroke-color': dark,
    },
  });
  map.addLayer({
    id: 'cluster-count', type: 'symbol', source: 'intents', filter: ['has', 'point_count'],
    layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 13 },
    paint: { 'text-color': cssColor('--text-primary', '#F0F4FF') },
  });
  map.addLayer({
    id: 'points', type: 'circle', source: 'intents', filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': ['match', ['get', 'direction'], 'offer', lime, cyan],
      'circle-radius': 9, 'circle-stroke-width': 3, 'circle-stroke-color': dark,
    },
  });
}

export default function MapView({ user, isAuthenticated, login, refresh, onSelectIntent }) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const [points, setPoints] = useState(null);
  const [mapError, setMapError] = useState(null);
  const { share, remove, status, error } = useShareArea(() => refresh?.());
  const onSelectRef = useRef(onSelectIntent);

  useEffect(() => { onSelectRef.current = onSelectIntent; }, [onSelectIntent]);

  useEffect(() => {
    let cancelled = false;
    fetchMapPoints()
      .then((data) => { if (!cancelled) setPoints(data.points ?? []); })
      .catch(() => { if (!cancelled) setPoints([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (points === null || !container.current) return undefined;
    let map;
    let disposed = false;
    Promise.all([
      import('maplibre-gl'),
      import('maplibre-gl/dist/maplibre-gl.css'),
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'),
    ]).then(([mod, , worker]) => {
      if (disposed) return;
      const maplibregl = mod.default ?? mod;
      maplibregl.setWorkerUrl(worker.default);
      map = new maplibregl.Map({
        container: container.current, style: MAP_STYLE_URL, center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.on('error', (event) => { if (event?.error?.status === 404 || !map.isStyleLoaded()) setMapError('The map could not load.'); });
      map.on('load', () => {
        addLayers(map, toFeatureCollection(points));
        const bounds = boundsOf(points);
        if (bounds && points.length > 1) map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 0 });
        map.on('click', 'clusters', async (event) => {
          const feature = map.queryRenderedFeatures(event.point, { layers: ['clusters'] })[0];
          const zoom = await map.getSource('intents').getClusterExpansionZoom(feature.properties.cluster_id);
          map.easeTo({ center: feature.geometry.coordinates, zoom });
        });
        map.on('click', 'points', (event) => {
          const id = event.features?.[0]?.properties?.id;
          if (id) onSelectRef.current?.({ id });
        });
        for (const layer of ['clusters', 'points']) {
          map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
        }
      });
    }).catch(() => setMapError('The map could not load.'));
    return () => { disposed = true; map?.remove(); mapRef.current = null; };
  }, [points]);

  const area = user?.location ? formatArea(user.location.lat, user.location.lng, user.location.label) : null;

  return (
    <section className="map-view" aria-label="Map of Interests and Offers">
      <div className="map-view__canvas-wrap">
        <div ref={container} className="map-view__canvas" />
        <div className="map-view__legend glass-panel" aria-hidden="true">
          <span><i className="dot dot--lime" /> Offers</span>
          <span><i className="dot dot--cyan" /> Interests</span>
        </div>
        {points !== null && points.length === 0 && !mapError && (
          <p className="map-view__empty glass-panel">No one has shared an area yet. Be the first.</p>
        )}
        {mapError && <p className="map-view__empty glass-panel" role="alert">{mapError}</p>}
      </div>

      <div className="map-view__share glass-panel">
        <p className="map-view__privacy">
          Your area is rounded to about 1 km and shown publicly on the map. Your exact position is never stored.
        </p>
        {isAuthenticated ? (
          <div className="map-view__share-row">
            <button className="btn btn--lime" onClick={share} disabled={status === 'working'}>
              <LocateFixed size={16} /> {area ? 'Update my area' : 'Share my area'}
            </button>
            {area && (
              <button className="btn btn--ghost" onClick={remove} disabled={status === 'working'}>
                <MapPinOff size={16} /> Remove
              </button>
            )}
          </div>
        ) : (
          <button className="btn btn--lime" onClick={() => login?.()}>Log in to share my area</button>
        )}
        {area && <p className="map-view__area">Sharing area near {area}</p>}
        {error && <p className="map-view__error" role="alert">{error}</p>}
      </div>
    </section>
  );
}
