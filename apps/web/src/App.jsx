import { useState, lazy, Suspense, useEffect } from 'react';
import './styles/globals.css';

import Navbar from './shared/layout/Navbar.jsx';
import BottomNav from './shared/layout/BottomNav.jsx';
import { useAuth } from './features/auth/useAuth.js';
import { useTelegram } from './shared/hooks/useTelegram.js';
import { confirmDmOk } from './api/me.js';

const HomePage = lazy(() => import('./features/home/HomePage.jsx'));
const MarketFeed = lazy(() => import('./features/marketplace/MarketFeed.jsx'));
const IntentDetail = lazy(() => import('./features/intent/IntentDetail.jsx'));
const CreateIntentWizard = lazy(() => import('./features/intent/CreateIntentWizard.jsx'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage.jsx'));
const NexumInterview = lazy(() => import('./features/nexum/NexumInterview.jsx'));
const CyclesPage = lazy(() => import('./features/cycles/CyclesPage.jsx'));
const CycleDetail = lazy(() => import('./features/cycles/CycleDetail.jsx'));

const Loader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
    <div style={{ width: 36, height: 36, border: '2px solid rgba(56,189,248,0.2)',
      borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

// History stack for the Telegram BackButton
function useHistory(initial = 'home') {
  const [stack, setStack] = useState([initial]);
  const page = stack[stack.length - 1];
  const push = (p) => setStack((s) => [...s, p]);
  const pop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const reset = (p) => setStack([p]);
  const canBack = stack.length > 1;
  return { page, push, pop, reset, canBack };
}

export default function App() {
  const { user, loading: authLoading, isAuthenticated, login, logout } = useAuth();
  const { isTMA, haptic, requestWriteAccess } = useTelegram();
  const { page, push, pop, reset, canBack } = useHistory('home');

  const [selectedIntent, setSelectedIntent] = useState(null);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [createDirection, setCreateDirection] = useState(null);

  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    if (!tg || !isTMA) return;
    if (canBack) {
      tg.BackButton.show();
      tg.BackButton.onClick(pop);
    } else {
      tg.BackButton.hide();
    }
    return () => tg.BackButton.offClick(pop);
  }, [isTMA, canBack, pop]);

  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    tg?.setHeaderColor?.('#080C14');
    tg?.setBackgroundColor?.('#080C14');
  }, []);

  // Inside the Mini App, ask once for DM permission so the bot can notify.
  useEffect(() => {
    if (!isTMA || !user || user.telegramDmOk) return;
    requestWriteAccess().then((granted) => {
      if (granted) confirmDmOk().catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTMA, user?.id, user?.telegramDmOk]);

  const navigate = (dest, data = {}) => {
    haptic('light');
    if (dest === 'intent-detail' && data.intent) setSelectedIntent(data.intent);
    if (dest === 'cycle-detail' && data.cycleId) setSelectedCycleId(data.cycleId);
    if (dest === 'create') setCreateDirection(data.direction ?? null);
    if (['home', 'discover', 'cycles', 'profile'].includes(dest)) { setSelectedIntent(null); reset(dest); return; }
    push(dest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => { haptic('light'); pop(); };
  const openIntent = (intent) => navigate('intent-detail', { intent });

  if (authLoading) return <Loader />;

  // Top navbar is web-only (Telegram provides its own header chrome).
  // BottomNav shows on root tabs; stacked pages rely on back affordances.
  const showTopNav = !isTMA;
  const showBottomNav = ['home', 'discover', 'cycles', 'profile'].includes(page);

  const contentStyle = {
    flex: 1,
    paddingTop: showTopNav ? 'var(--navbar-height)' : 0,
    paddingBottom: showBottomNav
      ? 'calc(var(--bottomnav-height) + env(safe-area-inset-bottom, 0px))'
      : 'env(safe-area-inset-bottom, 16px)',
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
    paddingLeft: 16,
    paddingRight: 16,
  };

  return (
    <div className="app-root">
      {showTopNav && <Navbar user={user} isAuthenticated={isAuthenticated} login={login} onNavigate={navigate} />}

      <main style={contentStyle}>
        <Suspense fallback={<Loader />}>
          {page === 'home' && (
            <HomePage user={user} isAuthenticated={isAuthenticated} login={login} onNavigate={navigate} />
          )}
          {page === 'discover' && (
            <MarketFeed onSelectIntent={openIntent} onNavigate={navigate} isTMA={isTMA} />
          )}
          {page === 'intent-detail' && selectedIntent && (
            <IntentDetail
              intent={selectedIntent}
              user={user}
              isAuthenticated={isAuthenticated}
              login={login}
              onBack={goBack}
            />
          )}
          {page === 'create' && (
            <CreateIntentWizard
              isAuthenticated={isAuthenticated}
              login={login}
              initialDirection={createDirection}
              onBack={goBack}
              onMarket={() => reset('discover')}
              onNexum={() => navigate('nexum')}
            />
          )}
          {page === 'nexum' && (
            <NexumInterview
              isAuthenticated={isAuthenticated}
              login={login}
              onBack={goBack}
              onMarket={() => reset('discover')}
            />
          )}
          {page === 'cycles' && (
            <CyclesPage
              user={user}
              isAuthenticated={isAuthenticated}
              login={login}
              onSelectCycle={(cycle) => navigate('cycle-detail', { cycleId: cycle.id })}
            />
          )}
          {page === 'cycle-detail' && selectedCycleId && (
            <CycleDetail cycleId={selectedCycleId} user={user} onBack={goBack} />
          )}
          {page === 'profile' && (
            <ProfilePage
              user={user}
              isAuthenticated={isAuthenticated}
              login={login}
              logout={logout}
              onNavigate={navigate}
              onSelectIntent={openIntent}
            />
          )}
        </Suspense>
      </main>

      {showBottomNav && <BottomNav page={page} onNavigate={navigate} />}
    </div>
  );
}
