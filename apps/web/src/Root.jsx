import { lazy, Suspense } from 'react';
import App from './App.jsx';
import Loader from './shared/ui/Loader.jsx';

const PrivyShell = lazy(() => import('./features/auth/PrivyShell.jsx'));

// Inside the Mini App auth is Telegram initData, so Privy is never loaded.
const isMiniApp = Boolean(window.Telegram?.WebApp?.initData);
const usePrivyShell = Boolean(import.meta.env.VITE_PRIVY_APP_ID) && !isMiniApp;

export default function Root() {
  if (!usePrivyShell) return <App />;
  return (
    <Suspense fallback={<Loader />}>
      <PrivyShell><App /></PrivyShell>
    </Suspense>
  );
}
