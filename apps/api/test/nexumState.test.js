import { describe, expect, it } from 'vitest';
import { deriveInterviewState } from '../src/lib/nexumState.js';
import { pillsForFocus } from '../src/lib/nexumPills.js';

const usable = {
  direction: 'want', kind: 'good', title: 'Used road bike', description: 'For commuting',
  category: 'bikes', concept_id: 'mobility', confidence: 0.9,
};

describe('deterministic Nexum state', () => {
  it('requires a usable intent and both sides checked before reveal', () => {
    const incomplete = deriveInterviewState({
      intents: [usable], sides_checked: { want: true, offer: false },
    });
    expect(incomplete.ready).toBe(false);
    const ready = deriveInterviewState({
      intents: [usable], sides_checked: { want: true, offer: true },
    });
    expect(ready.ready).toBe(true);
    expect(ready.progress).toEqual({ interests: 1, offers: 0, detailed: 1 });
  });

  it('does not trust high confidence without a canonical concept', () => {
    const state = deriveInterviewState({
      intents: [{ ...usable, concept_id: 'invented' }],
      sides_checked: { want: true, offer: true },
    });
    expect(state.ready).toBe(false);
  });

  it('uses schema pills instead of arbitrary model suggestions', () => {
    expect(pillsForFocus('format', ['Maybe'])).toEqual(['Online', 'In person', 'Hybrid', 'Flexible']);
  });
});
