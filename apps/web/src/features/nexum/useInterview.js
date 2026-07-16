import { useState, useCallback, useEffect, useRef } from 'react';
import {
  interviewTurn, createDrafts, trackNexumEvent,
} from '../../api/copilot.js';

const GREETING =
  'I am Nexum, the trade oracle of this market. I watch every thread of it at once. ' +
  'Let us map what you are looking for first: what would you love to find here these days?';

// Interview state machine. Orb state: idle | listening | thinking | speaking.
// Nexum ends its closing turn with READY_MARK; it is stripped from display
// and flips `ready` so the UI can spotlight the reveal action.
export function useInterview() {
  const [sessionId] = useState(() => globalThis.crypto.randomUUID());
  const openedTracked = useRef(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [orbState, setOrbState] = useState('idle');
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [ready, setReady] = useState(false);
  const [canReveal, setCanReveal] = useState(false);
  const [pills, setPills] = useState([]);
  const [progress, setProgress] = useState({ interests: 0, offers: 0, detailed: 0 });
  const [mappedIntents, setMappedIntents] = useState([]);

  useEffect(() => {
    if (openedTracked.current) return;
    openedTracked.current = true;
    trackNexumEvent(sessionId, 'opened').catch(() => {});
  }, [sessionId]);

  const send = useCallback(async (text) => {
    const content = text.trim();
    if (!content) return;
    setError(null);
    setPills([]);
    const history = [...messages, { role: 'user', content }];
    setMessages(history);
    setOrbState('thinking');
    try {
      const reply = await interviewTurn(sessionId, history);
      if (!reply.reply) throw new Error('empty reply');
      setOrbState('speaking');
      setMessages([...history, { role: 'assistant', content: reply.reply }]);
      setReady(reply.state.ready);
      setCanReveal(reply.state.can_reveal ?? reply.state.ready);
      setPills(reply.pills ?? []);
      setProgress(reply.state.progress);
      setMappedIntents(reply.state.intents ?? []);
      if (history.filter((message) => message.role === 'user').length === 1) {
        trackNexumEvent(sessionId, 'first_answer').catch(() => {});
      }
      setOrbState('idle');
    } catch (e) {
      setMessages(history);
      setError(e.status === 429 ? e.message : 'Nexum lost the thread. Try again.');
      setOrbState('idle');
    }
  }, [messages, sessionId]);

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
      const result = await createDrafts(messages, sessionId);
      setDraft(result);
      setOrbState('speaking');
    } catch (e) {
      setError(e.status === 429 ? e.message : 'Could not draft your intents. Try again.');
      setOrbState('idle');
    } finally {
      setRevealing(false);
    }
  }, [messages, sessionId]);

  const userTurns = messages.filter((m) => m.role === 'user').length;

  return {
    messages, orbState, setOrbState, error, draft, setDraft, send, reveal,
    revealing, userTurns, ready, canReveal, pills, progress,
    mappedIntents, sessionId,
  };
}
