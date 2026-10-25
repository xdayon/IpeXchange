export const RADAR_SIZE = 320;
export const RADAR_CENTER = RADAR_SIZE / 2;
export const RING_RADII = [0, 70, 124];
export const NODE_R = 17;

// Me at the center, partners spread evenly on their ring (outer ring is
// staggered so nodes do not line up spokes).
export function layoutRadar(nodes = []) {
  const byRing = [[], [], []];
  for (const node of nodes) {
    const ring = node.role === 'me' ? 0 : Math.min(2, Math.max(1, Number(node.ring) || 1));
    byRing[ring].push(node);
  }
  const positions = {};
  byRing.forEach((group, ring) => {
    group.forEach((node, i) => {
      if (ring === 0) {
        positions[node.id] = { x: RADAR_CENTER, y: RADAR_CENTER, ring };
        return;
      }
      const stagger = ring === 2 ? Math.PI / Math.max(1, group.length) : 0;
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / group.length + stagger;
      positions[node.id] = {
        x: RADAR_CENTER + RING_RADII[ring] * Math.cos(angle),
        y: RADAR_CENTER + RING_RADII[ring] * Math.sin(angle),
        ring,
      };
    });
  });
  return positions;
}

// Quadratic curve from source to target, trimmed to the node edges. `lane`
// separates several links that share the same pair of nodes.
export function curvedLink(from, to, lane = 0) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const start = { x: from.x + ux * NODE_R, y: from.y + uy * NODE_R };
  const end = { x: to.x - ux * (NODE_R + 4), y: to.y - uy * (NODE_R + 4) };
  const bend = dist * (0.22 + lane * 0.12);
  const cx = (from.x + to.x) / 2 - uy * bend;
  const cy = (from.y + to.y) / 2 + ux * bend;
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

// What a tapped node gives and receives, from the link list.
export function nodeDeals(nodeId, links = []) {
  return {
    gives: links.filter((l) => l.source === nodeId),
    receives: links.filter((l) => l.target === nodeId),
  };
}

export const openLoops = (loops = []) =>
  loops.filter((l) => ['suggested', 'pending_acceptance', 'accepted'].includes(l.status));

export const loopMemberSet = (loops = []) => new Set(openLoops(loops).flatMap((l) => l.members ?? []));

// Loop flow arcs from member order: member j gives to member j+1, the last to the first.
export function loopArcs(loops = []) {
  return openLoops(loops).flatMap((loop) => {
    const members = loop.members ?? [];
    return members.map((source, j) => ({
      key: `${loop.id}-${j}`, source, target: members[(j + 1) % members.length],
    })).filter((arc) => arc.source !== arc.target);
  });
}
