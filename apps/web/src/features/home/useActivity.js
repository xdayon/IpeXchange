import { useEffect, useState } from 'react';
import { fetchActivity } from '../../api/activity.js';

export function useActivity() {
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchActivity()
      .then((data) => { if (!cancelled) setActivity(data); })
      .catch(() => { if (!cancelled) setActivity({ events: [], stats: null }); });
    return () => { cancelled = true; };
  }, []);

  return activity;
}

// Counts up from zero to the target once, easing out. Static when motion is reduced.
export function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const end = Number(target) || 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || end === 0) {
      const id = requestAnimationFrame(() => setValue(end));
      return () => cancelAnimationFrame(id);
    }
    let raf;
    const startedAt = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - startedAt) / duration);
      setValue(Math.round(end * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
