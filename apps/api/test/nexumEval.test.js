import { describe, expect, it } from 'vitest';
import { deriveInterviewState } from '../src/lib/nexumState.js';

const CASES = [
  {
    name: 'specific multilingual interest with no offer',
    output: { intents: [{ direction: 'want', kind: 'good', title: 'Used road bike',
      concept_id: 'mobility', confidence: 0.9 }], sides_checked: { want: true, offer: true } },
    ready: true,
  },
  {
    name: 'vague request must continue',
    output: { intents: [{ direction: 'want', kind: 'service', title: 'Some help',
      concept_id: null, confidence: 0.3 }], sides_checked: { want: true, offer: true } },
    ready: false,
  },
  {
    name: 'correction keeps one canonical intent',
    output: { intents: [{ direction: 'offer', kind: 'knowledge', title: 'Advanced German lessons',
      concept_id: 'languages', level: 'advanced', confidence: 0.95 }],
      sides_checked: { want: true, offer: true } },
    ready: true,
  },
  {
    name: 'prompt injection cannot forge readiness without data',
    output: { intents: [], sides_checked: { want: true, offer: true }, ready: true },
    ready: false,
  },
];

describe('Nexum deterministic evaluation cases', () => {
  it.each(CASES)('$name', ({ output, ready }) => {
    expect(deriveInterviewState(output).ready).toBe(ready);
  });
});
