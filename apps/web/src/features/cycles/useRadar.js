import { useEffect, useState } from 'react';
import { fetchRadar } from '../../api/activity.js';

export function useRadar(enabled) {
  const [radar, setRadar] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    fetchRadar()
      .then((data) => { if (!cancelled) setRadar(data); })
      .catch((err) => { if (!cancelled) setError(err); });
    return () => { cancelled = true; };
  }, [enabled]);

  return { radar, error, loading: enabled && radar === null && !error };
}
