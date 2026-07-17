
import { Check, Handshake, Megaphone } from 'lucide-react';
import { KINDS } from '../constants.js';
import { haptic } from './helpers.js';

const DIRECTION_CARDS = [
  {
    id: 'want', label: 'Interest', icon: Handshake,
    desc: 'Something you are looking for in the network',
    color: 'var(--accent-cyan)', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.35)',
  },
  {
    id: 'offer', label: 'Offer', icon: Megaphone,
    desc: 'Something you bring to the market',
    color: 'var(--accent-lime)', bg: 'rgba(180,244,74,0.1)', border: 'rgba(180,244,74,0.35)',
  },
];

export default function StepIntentType({ direction, kind, onDirection, onKind, directionLocked = false }) {
  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>What are you publishing?</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
        Interests are what you are looking for. Offers are what you bring.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
        {DIRECTION_CARDS.map((d) => {
          const active = direction === d.id;
          const Icon = d.icon;
          return (
            <button key={d.id} disabled={directionLocked} onClick={() => { haptic('medium'); onDirection(d.id); }}
              style={{
                padding: '20px 16px', borderRadius: 'var(--radius-lg)', textAlign: 'left',
                border: `1.5px solid ${active ? d.border : 'var(--border-color)'}`,
                background: active ? d.bg : 'var(--bg-card)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)', position: 'relative',
                transition: 'all 0.25s',
              }}>
              {active && (
                <span style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20,
                  borderRadius: '50%', background: d.color, display: 'flex',
                  alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={12} color="var(--bg-dark)" strokeWidth={3} />
                </span>
              )}
              <Icon size={26} style={{ color: active ? d.color : 'var(--text-secondary)', marginBottom: 10 }} />
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2,
                color: active ? d.color : 'var(--text-primary)' }}>{d.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{d.desc}</div>
            </button>
          );
        })}
      </div>

      {directionLocked && (
        <p style={{ marginTop: -16, marginBottom: 24, color: 'var(--text-secondary)', fontSize: 12 }}>
          Interest or Offer cannot be changed after publication. Other details remain editable.
        </p>
      )}

      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-secondary)',
        textTransform: 'uppercase', marginBottom: 10 }}>Type</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {KINDS.map((k) => {
          const active = kind === k.id;
          const Icon = k.icon;
          return (
            <button key={k.id} onClick={() => { haptic('light'); onKind(k.id); }}
              style={{
                padding: '14px 16px', borderRadius: 'var(--radius-md)', textAlign: 'left',
                border: `1.5px solid ${active ? 'var(--border-active)' : 'var(--border-color)'}`,
                background: active ? 'rgba(56,189,248,0.08)' : 'var(--bg-card)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
              }}>
              <Icon size={20} style={{ color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)', marginBottom: 6 }} />
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2,
                color: active ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>{k.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{k.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
