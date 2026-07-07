import { useState, useEffect, useCallback } from 'react';
import { fetchMarket } from '../../api/intents.js';

export function useMarket({ direction, kind, q }) {
  const [intents, setIntents] = useState(null);
  const [mode, setMode] = useState('recent');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchMarket({ direction, kind, q })
      .then((data) => {
        if (cancelled) return;
        setIntents(data.intents ?? []);
        setMode(data.mode ?? 'recent');
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setIntents([]);
        setError('Could not reach the market.');
      });
    return () => { cancelled = true; };
  }, [direction, kind, q, reloadKey]);

  const refresh = useCallback(() => {
    setIntents(null);
    setReloadKey((k) => k + 1);
  }, []);

  return { intents: intents ?? [], mode, loading: intents == null, error, refresh };
}
