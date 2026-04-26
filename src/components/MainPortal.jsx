import React, { useState, useCallback, lazy, Suspense } from 'react';
import {
  Home, Compass, Store, TrendingUp,
  User, Wallet, Bot, Settings, Bell, Repeat,
  MessageCircle, ChevronRight,
} from 'lucide-react';
import { pingHealth } from '../lib/api';

// ─── Lazy load all page components ────────────────────────────────────────────
// Pages loaded immediately (above-the-fold default view)
import HomePage from './HomePage';

// All other pages are lazy-loaded — only fetched when the user navigates there
const DiscoverPage      = lazy(() => import('./DiscoverPage'));
const StoresPage        = lazy(() => import('./StoresPage'));
const InvestmentsPage   = lazy(() => import('./InvestmentsPage'));
const ProfilePage       = lazy(() => import('./ProfilePage'));
const WalletPage        = lazy(() => import('./WalletPage'));
const AgentPage         = lazy(() => import('./AgentPage'));
const CircularTradePage = lazy(() => import('./CircularTradePage'));
const ConfigPage        = lazy(() => import('./ConfigPage'));
const NotificationsPage = lazy(() => import('./NotificationsPage'));

// Overlay / sub-pages (heaviest — always lazy)
const XchangeCheckout   = lazy(() => import('./XchangeCheckout'));
const InvestmentDetail  = lazy(() => import('./InvestmentDetail'));
const MyPurchasesPage   = lazy(() => import('./MyPurchasesPage'));
const MyListingsPage    = lazy(() => import('./MyListingsPage'));
const StoreDetailPage   = lazy(() => import('./StoreDetailPage'));

// Chat drawer — lazy since it's hidden by default
const ChatDrawer        = lazy(() => import('./ChatDrawer'));

// ─── Navigation config ────────────────────────────────────────────────────────
const NAV_TABS = [
  { id: 'home',        icon: <Home size={16} />,       label: 'Home' },
  { id: 'discover',   icon: <Compass size={16} />,     label: 'Discover' },
  { id: 'stores',     icon: <Store size={16} />,       label: 'Stores' },
  { id: 'investments',icon: <TrendingUp size={16} />,  label: 'Invest' },
];

const NAV_ICONS = [
  { id: 'profile',  icon: <User size={20} />,     label: 'Profile' },
  { id: 'wallet',   icon: <Wallet size={20} />,   label: 'Wallet' },
  { id: 'agent',    icon: <Bot size={20} />,      label: 'Agent' },
  { id: 'circular', icon: <Repeat size={20} />,   label: 'Cycles' },
  { id: 'config',   icon: <Settings size={20} />, label: 'Config' },
];

const PAGES         = ['profile', 'wallet', 'agent', 'circular', 'config', 'notifications'];
const OVERLAY_PAGES = ['checkout', 'investment-detail', 'my-purchases', 'my-listings', 'store-detail'];

// ─── Minimal page skeleton shown while lazy chunks load ───────────────────────
const PageSkeleton = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh', color: 'var(--text-secondary)', fontSize: 14,
  }}>
    <div style={{
      width: 32, height: 32,
      border: '2px solid rgba(56,189,248,0.2)',
      borderTopColor: 'var(--accent-cyan)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
const MainPortal = () => {
  const [tab, setTab]           = useState('home');
  const [navParams, setNavParams] = useState(null);
  const [prevTab, setPrevTab]   = useState('home');
  const [chatOpen, setChatOpen] = useState(false);

  // Keep backend awake (Render spins down after 15m)
  useEffect(() => {
    // Initial ping
    pingHealth();
    // Ping every 8 minutes
    const interval = setInterval(pingHealth, 8 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isPage    = PAGES.includes(tab);
  const isOverlay = OVERLAY_PAGES.includes(tab);
  const currentPage = [...NAV_TABS, ...NAV_ICONS].find(n => n.id === tab);

  // Memoised handlers — stable references avoid unnecessary child re-renders
  const handleNavigate = useCallback((newTab, params = null) => {
    setNavParams(params);
    setTab(prev => {
      if (!OVERLAY_PAGES.includes(newTab)) {
        setPrevTab(newTab);
      } else {
        setPrevTab(OVERLAY_PAGES.includes(prev) ? prevTab : prev);
      }
      return newTab;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevTab]);

  const handleBack = useCallback(() => {
    setTab(prevTab);
    setNavParams(null);
  }, [prevTab]);

  const handleSetTab = useCallback((newTab) => {
    setPrevTab(newTab);
    setTab(newTab);
    setNavParams(null);
  }, []);

  const openChat  = useCallback(() => setChatOpen(true),  []);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const chatNavigate = useCallback((t, p) => {
    setChatOpen(false);
    handleNavigate(t, p);
  }, [handleNavigate]);

  return (
    <div className="app-layout">
      {/* ── Overlay screens (full-page, hide navbar chrome) ─────────────── */}
      {tab === 'checkout' && navParams?.listing && (
        <main className="main-content" style={{ paddingTop: 0 }}>
          <Suspense fallback={<PageSkeleton />}>
            <XchangeCheckout
              listing={navParams.listing}
              sourceTab={navParams.sourceTab || prevTab}
              onBack={handleBack}
            />
          </Suspense>
        </main>
      )}

      {tab === 'investment-detail' && navParams?.opp && (
        <main className="main-content" style={{ paddingTop: 0 }}>
          <Suspense fallback={<PageSkeleton />}>
            <InvestmentDetail opp={navParams.opp} onBack={handleBack} />
          </Suspense>
        </main>
      )}

      {tab === 'my-purchases' && (
        <main className="main-content" style={{ paddingTop: 0 }}>
          <Suspense fallback={<PageSkeleton />}>
            <MyPurchasesPage onNavigate={handleNavigate} onBack={handleBack} />
          </Suspense>
        </main>
      )}

      {tab === 'my-listings' && (
        <main className="main-content" style={{ paddingTop: 0 }}>
          <Suspense fallback={<PageSkeleton />}>
            <MyListingsPage onNavigate={handleNavigate} onBack={handleBack} />
          </Suspense>
        </main>
      )}

      {tab === 'store-detail' && navParams?.store && (
        <main className="main-content" style={{ paddingTop: 0 }}>
          <Suspense fallback={<PageSkeleton />}>
            <StoreDetailPage
              store={navParams.store}
              onBack={handleBack}
              onXchange={(listing) => handleNavigate('checkout', { listing, sourceTab: 'store-detail' })}
            />
          </Suspense>
        </main>
      )}

      {/* ── Normal portal layout (hidden when overlay active) ────────────── */}
      {!isOverlay && (
        <>
          {/* Top Navbar */}
          <header className="navbar glass-panel">
            <div className="container flex-between nav-content">
              <div className="brand flex-center" style={{ gap: '20px' }}>
                <h1 className="logo" style={{ cursor: 'pointer' }} onClick={() => handleSetTab('home')}>
                  Ipê<span className="text-gradient-lime">Xchange</span>
                </h1>
                {/* Desktop nav tabs — hidden on mobile via CSS */}
                <nav className="nav-tabs" aria-label="Main navigation">
                  {NAV_TABS.map(t => (
                    <button
                      key={t.id}
                      className={`nav-tab ${tab === t.id ? 'active' : ''}`}
                      onClick={() => handleSetTab(t.id)}
                      aria-current={tab === t.id ? 'page' : undefined}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="nav-actions flex-center">
                <button
                  className={`btn-icon nav-icon-btn ${tab === 'notifications' ? 'active-icon' : ''}`}
                  onClick={() => handleSetTab('notifications')}
                  style={{ position: 'relative' }}
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 8, height: 8,
                    background: '#B4F44A',
                    borderRadius: '50%',
                    border: '2px solid var(--bg-card)',
                  }} />
                </button>
                {NAV_ICONS.map(n => (
                  <button
                    key={n.id}
                    className={`btn-icon nav-icon-btn ${tab === n.id ? 'active-icon' : ''}`}
                    onClick={() => handleSetTab(n.id)}
                    aria-label={n.label}
                    title={n.label}
                  >
                    {n.icon}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Breadcrumb for sub-pages */}
          {isPage && (
            <div className="breadcrumb container">
              <span style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => handleSetTab('home')}>
                Home
              </span>
              <ChevronRight size={14} />
              <span>{currentPage?.label}</span>
            </div>
          )}

          {/* Main Content */}
          <main className="main-content" style={{ paddingTop: isPage ? '24px' : 0 }}>
            <Suspense fallback={<PageSkeleton />}>
              {tab === 'home'          && <HomePage onNavigate={handleNavigate} />}
              {tab === 'discover'      && <DiscoverPage onNavigate={handleNavigate} />}
              {tab === 'stores'        && <StoresPage onNavigate={handleNavigate} />}
              {tab === 'investments'   && <InvestmentsPage onNavigate={handleNavigate} />}
              {tab === 'profile'       && <ProfilePage />}
              {tab === 'wallet'        && <WalletPage onNavigate={handleNavigate} />}
              {tab === 'agent'         && <AgentPage />}
              {tab === 'circular'      && <CircularTradePage />}
              {tab === 'config'        && <ConfigPage />}
              {tab === 'notifications' && <NotificationsPage />}
            </Suspense>
          </main>

          {/* ── Mobile Bottom Navigation ──────────────────────────────────── */}
          <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
            {NAV_TABS.map(t => (
              <button
                key={t.id}
                className={`mobile-bottom-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => handleSetTab(t.id)}
                aria-label={t.label}
                aria-current={tab === t.id ? 'page' : undefined}
              >
                <span className="mobile-bottom-icon">{t.icon}</span>
                <span className="mobile-bottom-label">{t.label}</span>
              </button>
            ))}
            {/* Overflow: "More" button that goes to profile */}
            <button
              className={`mobile-bottom-tab ${PAGES.includes(tab) ? 'active' : ''}`}
              onClick={() => handleSetTab('profile')}
              aria-label="More options"
            >
              <span className="mobile-bottom-icon"><User size={16} /></span>
              <span className="mobile-bottom-label">More</span>
            </button>
          </nav>

          {/* Global Chat FAB */}
          <button
            id="global-chat-fab"
            className="chat-fab"
            onClick={openChat}
            aria-label="Chat with Core AI"
          >
            <div className="fab-glow-ring" />
            <MessageCircle size={28} />
            <span className="chat-fab-label">Chat with Core</span>
          </button>

          {/* Global Chat Drawer — lazy loaded */}
          <Suspense fallback={null}>
            <ChatDrawer
              isOpen={chatOpen}
              onClose={closeChat}
              onNavigate={chatNavigate}
            />
          </Suspense>
        </>
      )}
    </div>
  );
};

export default MainPortal;
