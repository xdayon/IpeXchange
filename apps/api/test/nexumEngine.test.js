import { describe, expect, it } from 'vitest';
import { composeInterviewReply, planNextStep } from '../src/lib/nexumEngine.js';

const intent = { direction: 'want', kind: 'good', title: 'Road bike', concept_id: 'mobility' };

describe('deterministic Nexum interview planner', () => {
  it('checks the missing marketplace side before asking for details', () => {
    expect(planNextStep({
      ready: false, intents: [intent], side_status: { want: 'provided', offer: 'unknown' },
    }, 1)).toBe('side_offer');
  });

  it('clarifies a vague intent before checking the other side', () => {
    expect(planNextStep({
      ready: false,
      intents: [{ ...intent, kind: 'knowledge', title: 'Learn something new' }],
      side_status: { want: 'provided', offer: 'unknown' },
    }, 1)).toBe('subject');
  });

  it('never emits a question on the review step', () => {
    const reply = composeInterviewReply({ intents: [intent] }, 'review', 'pt-BR');
    expect(reply).not.toContain('?');
    expect(reply).toContain('revisar');
  });
});
