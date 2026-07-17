import { describe, expect, it } from 'vitest';
import { deriveInterviewState } from '../src/lib/nexumState.js';
import { sanitizePills } from '../src/lib/nexumPills.js';

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
      intents: [usable], sides_checked: { want: true, offer: true }, interview_complete: true,
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
      side_status: { want: 'provided', offer: 'declined' }, interview_complete: true,
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

  it('keeps only short model pills that answer an actual question', () => {
    expect(sanitizePills(['Online', 'Presencial', 'Híbrido'], 'Qual formato funciona para as aulas?'))
      .toEqual(['Online', 'Presencial', 'Híbrido']);
    expect(sanitizePills(['Online', 'Presencial'], 'As aulas foram mapeadas.')).toEqual([]);
  });

  it('preserves an omitted keyed intent while replacing a correction', () => {
    const previous = deriveInterviewState({
      intents: [
        { ...usable, interview_key: 'want-1' },
        { ...usable, interview_key: 'offer-1', direction: 'offer', title: 'Bike repair' },
      ], side_status: { want: 'provided', offer: 'provided' },
    });
    const state = deriveInterviewState({
      intents: [{ ...usable, interview_key: 'want-1', title: 'Used urban bicycle' }],
    }, previous);
    expect(state.intents.map((intent) => intent.title)).toEqual(['Used urban bicycle', 'Bike repair']);
  });
});
