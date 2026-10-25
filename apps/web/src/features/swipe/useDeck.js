import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDeck, swipeIntent, undoSwipe } from '../../api/deck.js';

// Holds the swipe queue. Decisions are optimistic: the card leaves first and
// the server answer may add a celebration for freshly closed loops.
export function useDeck(enabled) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [lastDecision, setLastDecision] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    fetchDeck(20)
      .then((data) => { if (!cancelled) { setCards(data.cards ?? []); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err.message || 'Could not load the deck.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [enabled, reloadKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const decide = useCallback(async (card, decision) => {
    setCards((list) => list.filter((c) => c.id !== card.id));
    setLastDecision({ card, decision });
    try {
      const res = await swipeIntent(card.id, decision);
      if (res.new_loops?.length) setCelebration(res.new_loops[0]);
    } catch (err) {
      setCards((list) => [card, ...list]);
      setLastDecision(null);
      setError(err.message || 'Could not save that decision.');
    }
  }, []);

  const undo = useCallback(async () => {
    if (!lastDecision || busy.current) return;
    busy.current = true;
    const { card } = lastDecision;
    try {
      await undoSwipe(card.id);
      setCards((list) => [card, ...list]);
      setLastDecision(null);
    } catch (err) {
      setError(err.message || 'Could not undo.');
    } finally {
      busy.current = false;
    }
  }, [lastDecision]);

  return {
    cards, loading, error, celebration, lastDecision,
    decide, undo, reload, dismissCelebration: () => setCelebration(null),
  };
}
