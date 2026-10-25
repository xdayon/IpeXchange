import { describe, expect, it } from 'vitest';
import {
  cardRotation, decideSwipe, decisionForKey, MAX_ROTATION, SWIPE_THRESHOLD, stampOpacity,
} from './swipeMath.js';

describe('swipe gesture math', () => {
  it('decides on distance past the threshold', () => {
    expect(decideSwipe(SWIPE_THRESHOLD)).toBe('accept');
    expect(decideSwipe(-SWIPE_THRESHOLD - 1)).toBe('pass');
    expect(decideSwipe(SWIPE_THRESHOLD - 1)).toBeNull();
  });

  it('accepts a quick fling that did not travel far', () => {
    expect(decideSwipe(60, 0.9)).toBe('accept');
    expect(decideSwipe(-60, -0.9)).toBe('pass');
    expect(decideSwipe(10, 2)).toBeNull();
    expect(decideSwipe(60, -0.9)).toBeNull();
  });

  it('clamps rotation and stamp opacity', () => {
    expect(cardRotation(10000)).toBe(MAX_ROTATION);
    expect(cardRotation(-10000)).toBe(-MAX_ROTATION);
    expect(cardRotation(0)).toBe(0);
    expect(stampOpacity(SWIPE_THRESHOLD * 3)).toBe(1);
    expect(stampOpacity(SWIPE_THRESHOLD / 2)).toBeCloseTo(0.5);
  });

  it('maps arrow keys to decisions', () => {
    expect(decisionForKey('ArrowRight')).toBe('accept');
    expect(decisionForKey('ArrowLeft')).toBe('pass');
    expect(decisionForKey('Enter')).toBeNull();
  });
});
