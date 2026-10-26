import { useEffect, useState } from 'react';
import { fetchLoopReceipt } from '../../api/cycles.js';

// Loads the signed receipt of a completed loop; null until one exists.
export function useLoopReceipt(cycleId, completed) {
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (!completed) return undefined;
    let cancelled = false;
    fetchLoopReceipt(cycleId)
      .then((data) => { if (!cancelled) setReceipt(data); })
      .catch(() => { if (!cancelled) setReceipt(null); });
    return () => { cancelled = true; };
  }, [cycleId, completed]);

  return receipt;
}
