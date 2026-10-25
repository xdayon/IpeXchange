import { describe, expect, it } from 'vitest';
import {
  RADAR_CENTER, RADAR_SIZE, RING_RADII, curvedLink, layoutRadar, loopMemberSet, nodeDeals,
} from './radarLayout.js';

const nodes = [
  { id: 'me', role: 'me', ring: 0 },
  { id: 'a', role: 'partner', ring: 1 },
  { id: 'b', role: 'partner', ring: 1 },
  { id: 'c', role: 'partner', ring: 2 },
];

describe('loop radar layout', () => {
  it('puts me at the center and partners on their rings', () => {
    const pos = layoutRadar(nodes);
    expect(pos.me).toMatchObject({ x: RADAR_CENTER, y: RADAR_CENTER });
    for (const id of ['a', 'b']) {
      expect(Math.hypot(pos[id].x - RADAR_CENTER, pos[id].y - RADAR_CENTER)).toBeCloseTo(RING_RADII[1]);
    }
    expect(Math.hypot(pos.c.x - RADAR_CENTER, pos.c.y - RADAR_CENTER)).toBeCloseTo(RING_RADII[2]);
  });

  it('keeps every node inside the canvas', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `n${i}`, role: 'partner', ring: i % 2 + 1 }));
    for (const p of Object.values(layoutRadar(many))) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(RADAR_SIZE);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(RADAR_SIZE);
    }
  });

  it('draws opposite curves for opposite directions', () => {
    const a = { x: 100, y: 160 };
    const b = { x: 220, y: 160 };
    const ab = curvedLink(a, b).match(/Q ([\d.]+) ([\d.]+)/);
    const ba = curvedLink(b, a).match(/Q ([\d.]+) ([\d.]+)/);
    expect(Number(ab[2])).not.toBe(Number(ba[2]));
  });

  it('splits a node into what it gives and receives', () => {
    const links = [{ source: 'a', target: 'me' }, { source: 'me', target: 'a' }, { source: 'b', target: 'c' }];
    const deals = nodeDeals('a', links);
    expect(deals.gives).toHaveLength(1);
    expect(deals.receives).toHaveLength(1);
  });

  it('collects members of open loops only', () => {
    const set = loopMemberSet([
      { status: 'pending_acceptance', members: ['me', 'a'] },
      { status: 'completed', members: ['b'] },
    ]);
    expect([...set].sort()).toEqual(['a', 'me']);
  });
});
