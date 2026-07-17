import { describe, expect, it } from 'vitest';
import { finalizeNexumTurn } from '../src/lib/nexumEngine.js';

const context = {
  messages: [{ role: 'user', content: 'Quero uma bicicleta usada para ir ao trabalho.' }],
  previous: {}, turnCount: 1, signal: null,
};

const bike = {
  interview_key: 'want-1', direction: 'want', kind: 'good', title: 'Used commuter bicycle',
  description: 'A bicycle for commuting to work.', concept_id: 'mobility', condition: 'used',
  confidence: 0.9,
};

describe('adaptive Nexum interview response', () => {
  it('keeps the model-authored personalized question and contextual pills', () => {
    const result = finalizeNexumTurn({
      reply: 'Uma bicicleta usada para o trajeto diário faz sentido. Que estilo combina mais com seu percurso?',
      language: 'pt-BR', focus_field: 'bike_style',
      suggested_pills: ['Urbana', 'Speed', 'Mountain bike'],
      side_status: { want: 'provided', offer: 'unknown' }, intents: [bike],
      interview_complete: false,
    }, context);
    expect(result.reply).toContain('bicicleta usada');
    expect(result.pills).toEqual(['Urbana', 'Speed', 'Mountain bike']);
    expect(result.state.ready).toBe(false);
  });

  it('does not trust premature completion without both sides explored', () => {
    const result = finalizeNexumTurn({
      reply: 'Seu interesse está mapeado.', language: 'pt-BR', suggested_pills: [],
      side_status: { want: 'provided', offer: 'unknown' }, intents: [bike],
      interview_complete: true,
    }, context);
    expect(result.state.ready).toBe(false);
    expect(result.reply).toContain('oferecer');
    expect(result.reply).toContain('?');
  });

  it('closes only after a detailed intent and both sides are resolved', () => {
    const result = finalizeNexumTurn({
      reply: 'Mapeei sua bicicleta usada e registrei que você não tem uma oferta agora. Revise os detalhes antes de publicar.',
      language: 'pt-BR', suggested_pills: ['A', 'B'],
      side_status: { want: 'provided', offer: 'declined' }, intents: [bike],
      interview_complete: true,
    }, { ...context, turnCount: 3 });
    expect(result.state.ready).toBe(true);
    expect(result.pills).toEqual([]);
    expect(result.reply).not.toContain('?');
  });
});
