import { useState, useEffect } from 'react';
import { fetchMyStats } from '../../api/me.js';

const STATS = [
  { key: 'active_intents', label: 'Active intents', color: 'var(--accent-cyan)' },
  { key: 'fulfilled_intents', label: 'Fulfilled', color: 'var(--accent-lime)' },
  { key: 'interests_received', label: 'Interests received', color: 'var(--accent-indigo)' },
  { key: 'payments_received', label: 'Payments received', color: 'var(--accent-amber)' },
  { key: 'completed_trades', label: 'Trades completed', color: 'var(--accent-lime)' },
];

export default function ProfileStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchMyStats().then(setStats).catch(() => setStats({}));
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: 10, marginBottom: 24 }}>
      {STATS.map((s) => (
        <div key={s.key} style={{ padding: '14px 16px', background: 'var(--bg-card)',
          border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>
            {stats ? (stats[s.key] ?? 0) : '-'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2,
            textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
