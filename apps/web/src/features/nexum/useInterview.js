import { useState, useCallback } from 'react';
import { interviewTurn, createDrafts } from '../../api/copilot.js';

const READY_MARK = '<<READY>>';

const GREETING =
  'I am Nexum, the trade oracle of this market. I watch every thread of it at once. ' +
  'Let us map what you are looking for first: what would you love to find here these days?';

// Interview state machine. Orb state: idle | listening | thinking | speaking.
// Nexum ends its closing turn with READY_MARK; it is stripped from display
// and flips `ready` so the UI can spotlight the reveal action.
export function useInterview() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [orbState, setOrbState] = useState('idle');
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [ready, setReady] = useState(false);

  const send = useCallback(async (text) => {
    const content = text.trim();
    if (!content) return;
    setError(null);
    const history = [...messages, { role: 'user', content }];
    setMessages(history);
    setOrbState('thinking');
    try {
      const full = await interviewTurn(history, (partial) => {
        // Hold back the READY marker (and any partial tail of it) mid-stream.
        const display = partial.split('<<')[0].trimEnd();
        if (display) {
          setOrbState('speaking');
          setMessages([...history, { role: 'assistant', content: display }]);
        }
      });
      const reply = full.split('<<')[0].trim();
      if (!reply) throw new Error('empty reply');
      setMessages([...history, { role: 'assistant', content: reply }]);
      if (full.includes(READY_MARK)) setReady(true);
      setOrbState('idle');
    } catch (e) {
      setMessages(history);
      setError(e.status === 429 ? e.message : 'Nexum lost the thread. Try again.');
      setOrbState('idle');
    }
  }, [messages]);

  const reveal = useCallback(async () => {
    const spoken = messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
    if (spoken.length < 10) {
      setError('Tell Nexum a bit more before revealing your intents.');
      return;
    }
    setError(null);
    setRevealing(true);
    setOrbState('thinking');
    try {
      const result = await createDrafts(messages);
      setDraft(result);
      setOrbState('speaking');
    } catch (e) {
      setError(e.status === 429 ? e.message : 'Could not draft your intents. Try again.');
      setOrbState('idle');
    } finally {
      setRevealing(false);
    }
  }, [messages]);

  const userTurns = messages.filter((m) => m.role === 'user').length;

  return { messages, orbState, setOrbState, error, draft, setDraft, send, reveal, revealing, userTurns, ready };
}
