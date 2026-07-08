import { useState, useCallback } from 'react';
import { interviewTurn, createDrafts } from '../../api/copilot.js';

const GREETING =
  'I am Nexum, the trade oracle of this market. I watch every thread of it at once. ' +
  'Let us map what you are looking for first: what would you love to find here these days?';

// Interview state machine. Orb state: idle | listening | thinking | speaking.
export function useInterview() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [orbState, setOrbState] = useState('idle');
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(null);
  const [revealing, setRevealing] = useState(false);

  const send = useCallback(async (text) => {
    const content = text.trim();
    if (!content) return;
    setError(null);
    const history = [...messages, { role: 'user', content }];
    setMessages(history);
    setOrbState('thinking');
    try {
      const reply = await interviewTurn(history);
      setMessages([...history, { role: 'assistant', content: reply }]);
      setOrbState('speaking');
      setTimeout(() => setOrbState('idle'), 2500);
    } catch (e) {
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
      const result = await createDrafts(spoken);
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

  return { messages, orbState, setOrbState, error, draft, setDraft, send, reveal, revealing, userTurns };
}
