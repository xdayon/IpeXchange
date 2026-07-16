import { useCallback, useEffect, useRef, useState } from 'react';
import { HOME_ROUTE, routeFromLocation, routeToUrl } from '../navigation.js';

const STATE_KEY = 'ipexRoute';
const stateFor = (route, depth) => ({ [STATE_KEY]: route, ipexDepth: depth });

export function useAppHistory(initialRoute) {
  const savedState = window.history.state;
  const startingRoute = savedState?.[STATE_KEY] ?? initialRoute;
  const startingDepth = savedState?.ipexDepth ?? (initialRoute.page === 'home' ? 0 : 1);
  const [route, setRoute] = useState(startingRoute);
  const [depth, setDepth] = useState(startingDepth);
  const depthRef = useRef(startingDepth);
  const initialized = useRef(false);

  const apply = useCallback((nextRoute, nextDepth) => {
    depthRef.current = nextDepth;
    setDepth(nextDepth);
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (initialized.current) return undefined;
    initialized.current = true;
    if (window.history.state?.[STATE_KEY]) {
      // A refresh keeps the current route and its existing in-app back stack.
    } else if (initialRoute.page !== 'home') {
      window.history.replaceState(stateFor(HOME_ROUTE, 0), '', '/');
      window.history.pushState(stateFor(initialRoute, 1), '', routeToUrl(initialRoute));
    } else {
      window.history.replaceState(stateFor(initialRoute, 0), '', routeToUrl(initialRoute));
    }

    const onPopState = (event) => {
      const saved = event.state?.[STATE_KEY];
      const next = saved ?? routeFromLocation(window.location.search, window.location.pathname);
      apply(next, event.state?.ipexDepth ?? 0);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [apply, initialRoute]);

  const push = useCallback((page, data = {}) => {
    const next = { page, data };
    const nextDepth = depthRef.current + 1;
    window.history.pushState(stateFor(next, nextDepth), '', routeToUrl(next));
    apply(next, nextDepth);
  }, [apply]);

  const replace = useCallback((page, data = {}) => {
    const next = { page, data };
    window.history.replaceState(stateFor(next, depthRef.current), '', routeToUrl(next));
    apply(next, depthRef.current);
  }, [apply]);

  const pop = useCallback(() => {
    if (depthRef.current > 0) window.history.back();
  }, []);

  return { route, push, replace, pop, canBack: depth > 0 };
}
