// SVG ring: participants placed on a circle, arrows showing who gives to whom.
const SIZE = 260;
const R = 92;
const CENTER = SIZE / 2;

const pointAt = (angle) => ({
  x: CENTER + R * Math.cos(angle),
  y: CENTER + R * Math.sin(angle),
});

function arcPath(from, to) {
  return `M ${from.x} ${from.y} A ${R} ${R} 0 0 1 ${to.x} ${to.y}`;
}

export default function CycleRing({ participants, currentUserId }) {
  const n = participants.length;
  const angleOf = (i) => (2 * Math.PI * i) / n - Math.PI / 2;

  // Participant i gives to whoever receives their offered intent.
  const targetOf = (p) =>
    participants.findIndex((q) => q.receives?.id === p.gives?.id);

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ display: 'block', margin: '0 auto' }} aria-label="Trade ring">
      <defs>
        <marker id="ring-arrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--accent-cyan)" />
        </marker>
      </defs>

      <circle cx={CENTER} cy={CENTER} r={R} fill="none"
        stroke="var(--border-color)" strokeDasharray="3 5" />

      {participants.map((p, i) => {
        const t = targetOf(p);
        if (t < 0) return null;
        const gap = 0.34;
        const from = pointAt(angleOf(i) + gap);
        const to = pointAt(angleOf(t) - gap);
        return (
          <path key={`edge-${p.id}`} d={arcPath(from, to)} fill="none"
            stroke="var(--accent-cyan)" strokeWidth="1.6" markerEnd="url(#ring-arrow)" opacity="0.85" />
        );
      })}

      {participants.map((p, i) => {
        const { x, y } = pointAt(angleOf(i));
        const isMe = p.user_id === currentUserId;
        const name = isMe ? 'You' : p.users?.display_name || 'Member';
        const initials = (p.users?.display_name || '?').slice(0, 2).toUpperCase();
        const labelY = y > CENTER ? y + 42 : y - 32;
        return (
          <g key={p.id}>
            <circle cx={x} cy={y} r={22}
              fill={isMe ? 'rgba(180,244,74,0.15)' : 'rgba(56,189,248,0.12)'}
              stroke={isMe ? 'var(--accent-lime)' : 'var(--accent-cyan)'} strokeWidth="1.5" />
            <text x={x} y={y + 5} textAnchor="middle" fontSize="13" fontWeight="700"
              fill="var(--text-primary)" fontFamily="var(--font-sans)">
              {initials}
            </text>
            <text x={x} y={labelY} textAnchor="middle" fontSize="11" fontWeight="600"
              fill={isMe ? 'var(--accent-lime)' : 'var(--text-secondary)'} fontFamily="var(--font-sans)">
              {name.slice(0, 14)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
