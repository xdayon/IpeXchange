import { describe, expect, it } from 'vitest';
import { loopShareText, telegramShareUrl } from './shareLoop.js';
import { loopName, matchStrength } from './constants.js';

describe('loop sharing and labels', () => {
  it('encodes the Telegram share link', () => {
    const link = telegramShareUrl('https://x.test/?ref=1', 'a b');
    expect(link).toBe('https://t.me/share/url?url=https%3A%2F%2Fx.test%2F%3Fref%3D1&text=a%20b');
  });

  it('words direct swaps and bigger loops differently', () => {
    expect(loopShareText(2)).toContain('direct swap');
    expect(loopShareText(5)).toContain('5-person trade loop');
    expect(loopName(2)).toBe('Direct swap');
    expect(loopName(4)).toBe('4-person trade loop');
  });

  it('formats match strength as a percentage', () => {
    expect(matchStrength(0.874)).toBe('87%');
    expect(matchStrength(1.4)).toBe('100%');
    expect(matchStrength(null)).toBeNull();
    expect(matchStrength(undefined)).toBeNull();
  });
});
