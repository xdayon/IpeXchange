import { describe, expect, it } from 'vitest';
import { edgePath, ringGeometry, targetIndex } from './ringLayout.js';

describe('loop ring layout', () => {
  it('supports 2 to 7 participants and clamps the rest', () => {
    expect(ringGeometry(1).n).toBe(2);
    expect(ringGeometry(7).n).toBe(7);
    expect(ringGeometry(12).n).toBe(7);
    expect(ringGeometry(7).nodeRadius).toBeLessThan(ringGeometry(3).nodeRadius);
  });

  it('keeps arrows from overlapping on the largest ring', () => {
    const { spacing, gap } = ringGeometry(7);
    expect(gap * 2).toBeLessThan(spacing);
  });

  it('draws a path for every size', () => {
    for (let n = 2; n <= 7; n++) {
      for (let i = 0; i < n; i++) expect(edgePath(i, (i + 1) % n, n)).toMatch(/^M [\d.]+ [\d.]+ A /);
    }
  });

  it('finds who receives each offer', () => {
    const parts = [
      { gives: { id: 'a' }, receives: { id: 'c' } },
      { gives: { id: 'b' }, receives: { id: 'a' } },
      { gives: { id: 'c' }, receives: { id: 'b' } },
    ];
    expect(parts.map((p) => targetIndex(parts, p))).toEqual([1, 2, 0]);
  });
});
