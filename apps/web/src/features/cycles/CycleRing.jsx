// SVG ring: 2 to 7 participants on a circle, arrows showing who gives to whom.
// Pass `participants` for a real loop or `count` for an illustration.
import { RING_CENTER, RING_SIZE, edgePath, nodeAngle, pointOnRing, ringGeometry, targetIndex } from './ringLayout.js';
import './cycles.css';

const LETTERS = 'ABCDEFG';

function buildNodes(participants, count, currentUserId) {
  if (participants?.length) {
    return participants.map((p) => {
      const isMe = p.user_id === currentUserId;
      const name = isMe ? 'You' : p.users?.display_name || 'Member';
      return { id: p.id, isMe, name, initials: (p.users?.display_name || '?').slice(0, 2).toUpperCase() };
    });
  }
  return Array.from({ length: count }, (_, i) => ({
    id: i, isMe: false, name: LETTERS[i], initials: LETTERS[i],
  }));
}

export default function CycleRing({ participants, count = 3, currentUserId, activeEdge = null, names, glow = false }) {
  const nodes = buildNodes(participants, count, currentUserId);
  const n = nodes.length;
  const { radius, nodeRadius } = ringGeometry(n);
  const labels = names ?? nodes.map((node) => node.name);
  const target = (i) => (participants?.length ? targetIndex(participants, participants[i]) : (i + 1) % n);
  const uid = `ring-${n}-${glow ? 'g' : 'n'}`;

  return (
    <svg className={`cycle-ring ${glow ? 'cycle-ring--glow' : ''}`} viewBox={`-30 -10 ${RING_SIZE + 60} ${RING_SIZE + 20}`}
      role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
      <title id={`${uid}-title`}>Who gives to whom in this trade loop</title>
      <desc id={`${uid}-desc`}>Arrows connect each participant to the person receiving their Offer.</desc>
      <defs>
        <marker id={`${uid}-arrow`} markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" className="cycle-ring__arrowhead" />
        </marker>
      </defs>

      <circle className="cycle-ring__track" cx={RING_CENTER} cy={RING_CENTER} r={radius} />

      {nodes.map((node, i) => {
        const t = target(i);
        if (t < 0 || t === i) return null;
        return (
          <path key={`edge-${node.id}`} d={edgePath(i, t, n)} markerEnd={`url(#${uid}-arrow)`}
            className={`cycle-ring__edge ${activeEdge === i ? 'is-active' : ''}`} />
        );
      })}

      {nodes.map((node, i) => {
        const angle = nodeAngle(i, n);
        const { x, y } = pointOnRing(angle, radius);
        const label = pointOnRing(angle, radius + nodeRadius + 15);
        const anchor = Math.abs(Math.cos(angle)) < 0.3 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
        return (
          <g key={node.id} className={`cycle-ring__node ${node.isMe ? 'is-me' : ''} ${activeEdge === i ? 'is-active' : ''}`}>
            <circle cx={x} cy={y} r={nodeRadius} />
            <text x={x} y={y + 4.5} textAnchor="middle" className="cycle-ring__initials">{node.initials}</text>
            {(participants?.length || names) && (
              <text x={label.x} y={label.y + 4} textAnchor={anchor} className="cycle-ring__label">
                {labels[i].slice(0, 9)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
