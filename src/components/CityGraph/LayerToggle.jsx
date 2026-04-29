// src/components/CityGraph/LayerToggle.jsx
import { Eye, EyeOff, Users, Cpu, Vote, Store, ShieldAlert, Leaf, CalendarDays } from 'lucide-react';
import { LAYER_META } from '../../lib/cityGraphAdapter';

const ICONS = { Users, Cpu, Vote, Store, ShieldAlert, Leaf, CalendarDays };

export function LayerToggle({ activeLayers, onToggle, onToggleAll, entityCount }) {
  const allActive = activeLayers.size >= LAYER_META.length;

  return (
    <div style={{
      background: 'rgba(4,25,43,0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 40,
    }}>
      {/* Entity count */}
      {entityCount > 0 && (
        <div style={{ fontSize: 9, color: '#38BDF8', textAlign: 'center', fontWeight: 700, letterSpacing: '0.05em', paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {entityCount} nodes
        </div>
      )}

      {/* Toggle all */}
      <button
        onClick={onToggleAll}
        title={allActive ? 'Show fewer' : 'Show all layers'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 6, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
          cursor: 'pointer', marginBottom: 2,
        }}>
        {allActive ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>

      {/* Per-layer buttons */}
      {LAYER_META.map(layer => {
        const Icon = ICONS[layer.icon] || Store;
        const isActive = activeLayers.has(layer.id);
        return (
          <button
            key={layer.id}
            onClick={() => onToggle(layer.id)}
            title={layer.label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 6, borderRadius: 8,
              border: `1px solid ${isActive ? layer.color + '55' : 'rgba(255,255,255,0.06)'}`,
              background: isActive ? `${layer.color}18` : 'transparent',
              color: isActive ? layer.color : '#475569',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
            <Icon size={12} />
          </button>
        );
      })}
    </div>
  );
}
