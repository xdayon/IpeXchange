import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { X } from 'lucide-react';
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
  const [selectedNode, setSelectedNode] = useState(null);

  const markers = useMemo(
    () => activeCategory ? MARKERS.filter(l => l.category === activeCategory) : MARKERS,
    [activeCategory]
  );

  return (
    <div className="city-map-container" style={{ height: '100%', border: 'none', borderRadius: 0, position: 'relative' }}>
      {/* Badge overlay */}
      <div className="map-header" style={{ position: 'absolute', top: 16, left: 60, zIndex: 1000 }}>
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
        style={{ width: '100%', height: '100%', zIndex: 1 }}
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
              eventHandlers={{
                click: () => setSelectedNode(listing)
              }}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: selectedNode?.id === listing.id ? 1 : 0.85,
                weight: selectedNode?.id === listing.id ? 4 : 2,
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

      {/* Node Info Overlay */}
      {selectedNode && (
        <div style={{ position: 'absolute', top: 16, right: 16, width: 280, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, zIndex: 1000, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'slide-in 0.2s ease-out' }}>
          {selectedNode.image && (
            <div style={{ width: '100%', height: 120, backgroundImage: `url(${selectedNode.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          )}
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0, paddingRight: 24 }}>{selectedNode.title}</h4>
              <button onClick={() => setSelectedNode(null)} style={{ position: 'absolute', top: selectedNode.image ? 12 : 12, right: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
            
            <p style={{ fontSize: 12, color: CATEGORY_COLORS[selectedNode.category], fontWeight: 600, marginBottom: 8 }}>
              {selectedNode.category.toUpperCase()} • {selectedNode.nodeName}
            </p>
            
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
              {selectedNode.description}
            </p>
            
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>By {selectedNode.provider}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedNode.price}</p>
              </div>
              <button style={{ padding: '6px 12px', background: CATEGORY_COLORS[selectedNode.category], color: '#000', border: 'none', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CityMap.displayName = 'CityMap';

export default CityMap;
