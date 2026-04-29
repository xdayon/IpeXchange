// src/components/CityGraph/EntityDetailPanel.jsx
import { X } from 'lucide-react';
import { LAYER_COLOR, getLayerMeta, getConnectedEntities } from '../../lib/cityGraphAdapter';

export function EntityDetailPanel({ entity, edges, entities, onClose, onSelectEntity }) {
  const layerMeta = getLayerMeta(entity.layer);
  const color = LAYER_COLOR[entity.layer] || '#38BDF8';
  const connections = getConnectedEntities(entity.id, edges, entities);

  const statusColor = entity.status === 'active' ? '#34D399'
    : entity.status === 'warning' ? '#F59E0B'
    : entity.status === 'critical' ? '#F43F5E'
    : '#94a3b8';

  return (
    <div style={{
      position: 'absolute', bottom: 24, right: 24,
      width: 300, maxHeight: 420,
      background: 'rgba(4,25,43,0.96)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${color}44`,
      borderRadius: 16,
      zIndex: 1000,
      overflow: 'hidden',
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${color}22`,
      animation: 'slide-in 0.2s ease-out',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color, background: `${color}18`, padding: '2px 8px', borderRadius: 100,
              border: `1px solid ${color}44`,
            }}>
              {layerMeta.label}
            </span>
            <h4 style={{ fontSize: 15, fontWeight: 700, margin: '8px 0 0', color: '#fff', lineHeight: 1.3 }}>
              {entity.label}
            </h4>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', borderRadius: 8, padding: 6, cursor: 'pointer', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        {entity.status && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
            <span style={{ fontSize: 11, color: statusColor, textTransform: 'capitalize' }}>{entity.status}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 16, overflowY: 'auto', maxHeight: 300 }}>
        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 12 }}>
          {entity.description}
        </p>

        {/* Commerce-specific details */}
        {entity.priceFiat !== undefined && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>
              {entity.priceFiat > 0 ? `$${entity.priceFiat}` : 'Free'}
            </span>
            {entity.acceptsTrade && (
              <span style={{ fontSize: 10, color: '#B4F44A', background: '#B4F44A18', padding: '2px 8px', borderRadius: 100, border: '1px solid #B4F44A44' }}>
                Accepts Trade
              </span>
            )}
          </div>
        )}

        {entity.provider && (
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
            by {entity.provider}
          </p>
        )}

        {/* Connections */}
        {connections.length > 0 && (
          <div>
            <h5 style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {connections.length} Connection{connections.length !== 1 ? 's' : ''}
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {connections.slice(0, 5).map(conn => {
                const connColor = LAYER_COLOR[conn.entity.layer] || '#38BDF8';
                return (
                  <button key={conn.entity.id}
                    onClick={() => onSelectEntity(conn.entity.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid rgba(255,255,255,0.06)`,
                      cursor: 'pointer', textAlign: 'left', color: '#fff',
                    }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: connColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conn.entity.label}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{conn.label || conn.relationship}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
