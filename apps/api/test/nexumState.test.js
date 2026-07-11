import { describe, expect, it } from 'vitest';
import { deriveInterviewState } from '../src/lib/nexumState.js';
import { pillsForFocus } from '../src/lib/nexumPills.js';

const usable = {
  direction: 'want', kind: 'good', title: 'Used road bike', description: 'For commuting',
  category: 'bikes', concept_id: 'mobility', condition: 'used', confidence: 0.9,
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

  it('repairs common model enum synonyms before validating', () => {
    const state = deriveInterviewState({
      intents: [{ ...usable, direction: 'buy', kind: 'product' }],
      side_status: { want: 'provided', offer: 'declined' },
    });
    expect(state.intents[0]).toMatchObject({ direction: 'want', kind: 'good' });
    expect(state.ready).toBe(true);
  });

  it('preserves verified intents when a model turn omits them', () => {
    const previous = deriveInterviewState({
      intents: [usable], side_status: { want: 'provided', offer: 'unknown' },
    });
    const state = deriveInterviewState({ intents: [] }, previous, { turnCount: 2 });
    expect(state.intents).toHaveLength(1);
    expect(state.intents[0].title).toBe('Used road bike');
  });

  it('only returns localized pills for controlled questions', () => {
    expect(pillsForFocus('format', 'pt-BR')).toEqual(['Online', 'Presencial', 'Híbrido', 'Flexível']);
    expect(pillsForFocus('price_fiat', 'pt-BR')).toEqual([]);
  });
});
