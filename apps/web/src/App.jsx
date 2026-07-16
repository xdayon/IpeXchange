import { lazy, Suspense, useEffect, useRef } from 'react';
import './styles/globals.css';

import Navbar from './shared/layout/Navbar.jsx';
import SplashIntro from './shared/ui/SplashIntro.jsx';
import BottomNav from './shared/layout/BottomNav.jsx';
import { useAuth } from './features/auth/useAuth.js';
import { useTelegram } from './shared/hooks/useTelegram.js';
import { confirmDmOk } from './api/me.js';
import { useNotifications } from './features/notifications/useNotifications.js';
import './features/notifications/notifications.css';
import { isUuid } from './shared/deepLinks.js';
import { routeFromLocation } from './shared/navigation.js';
import { useAppHistory } from './shared/hooks/useAppHistory.js';

const HomePage = lazy(() => import('./features/home/HomePage.jsx'));
const MarketFeed = lazy(() => import('./features/marketplace/MarketFeed.jsx'));
const IntentDetail = lazy(() => import('./features/intent/IntentDetail.jsx'));
const CreateIntentWizard = lazy(() => import('./features/intent/CreateIntentWizard.jsx'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage.jsx'));
const NexumInterview = lazy(() => import('./features/nexum/NexumInterview.jsx'));
const NexumWidget = lazy(() => import('./features/nexum/NexumWidget.jsx'));
const CyclesPage = lazy(() => import('./features/cycles/CyclesPage.jsx'));
const CycleDetail = lazy(() => import('./features/cycles/CycleDetail.jsx'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage.jsx'));
const AdminPage = lazy(() => import('./features/admin/AdminPage.jsx'));
const NotificationPage = lazy(() => import('./features/notifications/NotificationPage.jsx'));

const Loader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
    <div style={{ width: 36, height: 36, border: '2px solid rgba(56,189,248,0.2)',
      borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

// Deep link used by the Mini App's openLink checkout handoff:
// /?intent=<id> lands straight on the intent detail page.
// /l/<id> is the shareable OG-preview link served by the Worker; it lands here too.
const searchParams = new URLSearchParams(window.location.search);
const initialRoute = routeFromLocation(window.location.search, window.location.pathname);
const referralRef = searchParams.get('ref');
if (isUuid(referralRef)) {
  localStorage.setItem('ipex-ref', referralRef);
}

export default function App() {
  const { user, loading: authLoading, isAuthenticated, login, logout, refresh } = useAuth();
  const { isTMA, haptic, requestWriteAccess } = useTelegram();
  const { route, push, replace, pop, canBack } = useAppHistory(initialRoute);
  const { page, data: routeData } = route;
  const notificationCenter = useNotifications(user?.id, page === 'notifications');

  // Honor the user's configured start screen once per session.
  const startApplied = useRef(false);
  useEffect(() => {
    if (startApplied.current || !user || initialRoute.page !== 'home') return;
    startApplied.current = true;
    if (user.settings?.default_tab === 'discover') replace('discover');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const selectedIntent = routeData.intent ?? null;
  const selectedCycleId = routeData.cycleId ?? null;
  const createDirection = routeData.direction ?? null;

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
    push(dest, data);
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
      <SplashIntro />
      {showTopNav && (
        <Navbar user={user} isAuthenticated={isAuthenticated} login={login}
          onNavigate={navigate} unreadCount={notificationCenter.unreadCount} />
      )}

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
              onMarket={() => replace('discover')}
              onNexum={() => navigate('nexum')}
            />
          )}
          {page === 'nexum' && (
            <NexumInterview
              isAuthenticated={isAuthenticated}
              login={login}
              onBack={goBack}
              onMarket={() => replace('discover')}
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
              refresh={refresh}
              unreadCount={notificationCenter.unreadCount}
            />
          )}
          {page === 'notifications' && (
            <NotificationPage center={notificationCenter} onBack={goBack} onNavigate={navigate} />
          )}
          {page === 'settings' && (
            <SettingsPage user={user} logout={logout} onBack={goBack} refresh={refresh} />
          )}
          {page === 'admin' && user?.isAdmin && <AdminPage onBack={goBack} />}
        </Suspense>
      </main>

      {showBottomNav && <BottomNav page={page} onNavigate={navigate} />}

      <Suspense fallback={null}>
        <NexumWidget
          isAuthenticated={isAuthenticated}
          login={login}
          onMarket={() => replace('discover')}
          visible={page !== 'nexum'}
          aboveBottomNav={showBottomNav}
        />
      </Suspense>
    </div>
  );
}
