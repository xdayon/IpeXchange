import { describe, expect, it } from 'vitest';
import { buildNexumPrompt } from '../src/lib/nexum.js';

describe('Nexum interview prompt', () => {
  it('defines readiness, progress and concise interview constraints', () => {
    const prompt = buildNexumPrompt();
    expect(prompt).toContain('Aim to finish in 3-6 member turns');
    expect(prompt).toContain('<<PROGRESS: interests=N | offers=N | detailed=N>>');
    expect(prompt).toContain('Never emit READY before these conditions are met');
  });

  it('includes active intents so they are not interviewed again', () => {
    const prompt = buildNexumPrompt({
      name: 'Ana', intents: [{ direction: 'want', title: 'Road bike' }],
    });
    expect(prompt).toContain("member's name is Ana");
    expect(prompt).toContain('[INTEREST] Road bike');
    expect(prompt).toContain('Do not re-map these');
  });
});
