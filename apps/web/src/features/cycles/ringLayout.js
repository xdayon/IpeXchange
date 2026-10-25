export const RING_SIZE = 300;
export const RING_CENTER = RING_SIZE / 2;

// Geometry for a ring of 2 to 7 participants.
export function ringGeometry(count) {
  const n = Math.max(2, Math.min(7, count));
  const radius = n > 4 ? 98 : 88;
  const nodeRadius = n > 5 ? 19 : 23;
  const spacing = (2 * Math.PI) / n;
  const gap = Math.min(0.36, spacing * 0.3) + (nodeRadius / radius) * 0.55;
  return { n, radius, nodeRadius, spacing, gap };
}

export const nodeAngle = (index, count) => (2 * Math.PI * index) / count - Math.PI / 2;

export function pointOnRing(angle, radius) {
  return {
    x: RING_CENTER + radius * Math.cos(angle),
    y: RING_CENTER + radius * Math.sin(angle),
  };
}

// Arc from one node to the next one it gives to, trimmed so arrows stop at the node edge.
export function edgePath(fromIndex, toIndex, count) {
  const { radius, gap } = ringGeometry(count);
  const forward = (toIndex - fromIndex + count) % count;
  const a0 = nodeAngle(fromIndex, count) + gap;
  const a1 = nodeAngle(fromIndex, count) + (forward * 2 * Math.PI) / count - gap;
  const from = pointOnRing(a0, radius);
  const to = pointOnRing(a1, radius);
  const sweep = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} A ${radius} ${radius} 0 ${sweep} 1 ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

// Index of the participant who receives what participant `p` gives.
export const targetIndex = (participants, p) =>
  participants.findIndex((q) => q.receives?.id === p.gives?.id);
