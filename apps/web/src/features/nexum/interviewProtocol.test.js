import { describe, expect, it } from 'vitest';
import { parseInterviewReply } from './interviewProtocol.js';

describe('Nexum interview protocol', () => {
  it('parses visible text, progress, pills and readiness', () => {
    const reply = parseInterviewReply(
      'Which format works best?\n<<PILLS: Online | In person>>\n' +
      '<<PROGRESS: interests=1 | offers=1 | detailed=1>><<READY>>',
    );
    expect(reply).toEqual({
      content: 'Which format works best?', ready: true,
      pills: ['Online', 'In person'],
      progress: { interests: 1, offers: 1, detailed: 1 },
    });
  });

  it('caps malformed model pills safely', () => {
    const reply = parseInterviewReply('Choose. <<PILLS: One | Two | Three | Four | Five>>');
    expect(reply.pills).toEqual(['One', 'Two', 'Three', 'Four']);
    expect(reply.progress).toBeNull();
  });
});
