import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { mockListings } from '../data/mockData';

// Center of Jurerê Internacional, Florianópolis
const JURERE_CENTER = [-27.4420, -48.5060];

const CATEGORY_COLORS = {
  Services: '#38BDF8',
  Products: '#B4F44A',
  Donations: '#F43F5E',
};

// Memoized marker list — never changes unless mockData changes
const MARKERS = mockListings.filter(l => l.isPublic && l.coordinates?.lat);

const CityMap = React.memo(({ activeCategory }) => {
  const markers = useMemo(
    () => activeCategory ? MARKERS.filter(l => l.category === activeCategory) : MARKERS,
    [activeCategory]
  );

  return (
    <div className="city-map-container" style={{ height: '100%', border: 'none', borderRadius: 0 }}>
      {/* Badge overlay */}
      <div className="map-header" style={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}>
        <span className="badge">CITY GRAPH • JURERÊ LIVE</span>
      </div>

      <MapContainer
        center={JURERE_CENTER}
        zoom={15}
        minZoom={13}
        maxZoom={17}
        zoomControl={true}
        scrollWheelZoom={false}
        dragging={true}
        preferCanvas={true}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={17}
          updateWhenIdle={true}
          updateWhenZooming={false}
          keepBuffer={1}
        />

        {markers.map(listing => {
          const color = CATEGORY_COLORS[listing.category] || '#38BDF8';
          return (
            <CircleMarker
              key={listing.id}
              center={[listing.coordinates.lat, listing.coordinates.lng]}
              radius={8}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -10]}
                className="map-node-tooltip"
              >
                {listing.nodeName}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
});

CityMap.displayName = 'CityMap';

export default CityMap;
