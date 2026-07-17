import { describe, expect, it } from 'vitest';
import { buildNexumPrompt } from '../src/lib/nexum.js';

describe('Nexum adaptive interview prompt', () => {
  it('requires contextual questions and guarded completion', () => {
    const prompt = buildNexumPrompt();
    expect(prompt).toContain('exactly ONE personalized question');
    expect(prompt).toContain('personalized question');
    expect(prompt).toContain('interview_complete=true only when both sides');
    expect(prompt).toContain('Pills are optional shortcuts');
  });

  it('includes member context, live intents, and previous state', () => {
    const prompt = buildNexumPrompt({
      name: 'Ana', intents: [{ direction: 'want', title: 'Road bike' }],
      previous: { side_status: { want: 'provided', offer: 'unknown' } },
    });
    expect(prompt).toContain("member's name is Ana");
    expect(prompt).toContain('Road bike');
    expect(prompt).toContain('Current verified interview state');
    expect(prompt).toContain('must not be duplicated');
  });
});
