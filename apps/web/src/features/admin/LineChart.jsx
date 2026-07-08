// Multi-series SVG line chart: 2px lines, recessive grid, crosshair
// tooltip on hover. Identity comes from the legend plus fixed hue order,
// never from color alone.
import { useState, useRef } from 'react';

const W = 600;
const PAD = { top: 10, right: 10, bottom: 22, left: 34 };

export default function LineChart({ series, labels, height = 190 }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const n = labels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const iw = W - PAD.left - PAD.right;
  const ih = height - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => PAD.top + ih - (v / max) * ih;
  const path = (values) => values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / iw) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
        {series.map((s) => (
          <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
            <span style={{ width: 10, height: 3, borderRadius: 2, background: s.color }} /> {s.name}
          </span>
        ))}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', display: 'block' }}
        onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(max * t)} y2={y(max * t)}
              stroke="var(--border-color)" strokeWidth="1" />
            <text x={PAD.left - 6} y={y(max * t) + 3} textAnchor="end"
              fontSize="10" fill="var(--text-muted)">{Math.round(max * t)}</text>
          </g>
        ))}
        {[0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
          <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
            {labels[i]}
          </text>
        ))}
        {hover != null && (
          <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + ih}
            stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="3 3" />
        )}
        {series.map((s) => (
          <path key={s.name} d={path(s.values)} fill="none" stroke={s.color}
            strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {hover != null && series.map((s) => (
          <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r="4"
            fill={s.color} stroke="var(--bg-card)" strokeWidth="2" />
        ))}
      </svg>
      {hover != null && (
        <div style={{ position: 'absolute', top: 24, left: `${(x(hover) / W) * 100}%`,
          transform: `translateX(${hover > n / 2 ? '-105%' : '8px'})`, pointerEvents: 'none',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)', padding: '8px 10px', boxShadow: 'var(--shadow-md)', zIndex: 5 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{labels[hover]}</div>
          {series.map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
              color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
              {s.name}: <strong style={{ color: 'var(--text-primary)' }}>{s.values[hover]}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
