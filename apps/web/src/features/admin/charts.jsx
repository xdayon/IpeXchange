// Small SVG/HTML chart primitives for the admin dashboard. Values are
// always printed in text tokens; series color only marks identity.

export function StatTile({ label, value, sub, color = 'var(--accent-cyan)' }) {
  return (
    <div style={{ padding: '16px 18px', background: 'var(--bg-card)',
      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, marginTop: 2, color, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

// Horizontal breakdown: label + thin bar + value, direct-labeled per row.
export function BarList({ items, color = 'var(--accent-cyan)' }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No data yet.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.label}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{item.value}</span>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ height: '100%', borderRadius: 4, width: `${(item.value / max) * 100}%`,
              background: item.color ?? color, transition: 'width var(--transition-slow)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Single-series vertical bars (monthly volume), 4px rounded data ends.
export function MonthBars({ items, color = 'var(--accent-lime)', height = 140, format = (v) => v }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
        {items.map((item) => (
          <div key={item.label} title={`${item.label}: ${format(item.value)}`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
            <div style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 3 : 1)}%`,
              background: item.value > 0 ? color : 'rgba(255,255,255,0.06)',
              borderRadius: '4px 4px 0 0' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        {items.map((item, i) => (
          <span key={item.label} style={{ flex: 1, fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>
            {i % 2 === 0 ? item.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

// Donut with a 2px surface gap between segments and a center headline.
export function Donut({ items, centerLabel, size = 150 }) {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  const r = 56;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
        {total > 0 && items.filter((i) => i.value > 0).map((item) => {
          const frac = item.value / total;
          const seg = (
            <circle key={item.label} cx="70" cy="70" r={r} fill="none" stroke={item.color}
              strokeWidth="16" strokeDasharray={`${Math.max(frac * c - 2, 0.5)} ${c}`}
              strokeDashoffset={-offset} transform="rotate(-90 70 70)" />
          );
          offset += frac * c;
          return seg;
        })}
        <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text-primary)">{total}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="9" fill="var(--text-muted)">{centerLabel}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => (
          <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: item.color }} />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.label}</span>
            <strong style={{ color: 'var(--text-primary)' }}>{item.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Panel({ title, children, span }) {
  return (
    <div style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)', gridColumn: span ? '1 / -1' : undefined, minWidth: 0 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</h3>
      {children}
    </div>
  );
}
