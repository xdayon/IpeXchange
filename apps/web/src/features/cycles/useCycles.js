import { useEffect, useState } from 'react';
import { fetchMyCycles } from '../../api/cycles.js';

export function useCycles(enabled) {
  const [cycles, setCycles] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchMyCycles()
      .then((data) => { if (!cancelled) setCycles(data.cycles ?? []); })
      .catch((err) => { if (!cancelled) { setError(err); setCycles([]); } });
    return () => { cancelled = true; };
  }, [enabled, reloadKey]);

  return {
    cycles,
    loading: enabled && cycles === null,
    error,
    refresh: () => { setCycles(null); setError(null); setReloadKey((k) => k + 1); },
  };
}
