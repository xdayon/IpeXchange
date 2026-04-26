import React, { useState } from 'react';
import { Home, Compass, User, Wallet, Bot, Settings, Bell, Store, TrendingUp, ChevronRight, MessageCircle, ShoppingBag, Repeat, Sparkles } from 'lucide-react';
import HomePage from './HomePage';
import DiscoverPage from './DiscoverPage';
import ProfilePage from './ProfilePage';
import WalletPage from './WalletPage';
import AgentPage from './AgentPage';
import StoresPage from './StoresPage';
import InvestmentsPage from './InvestmentsPage';
import NotificationsPage from './NotificationsPage';
import ConfigPage from './ConfigPage';
import ChatDrawer from './ChatDrawer';
import XchangeCheckout from './XchangeCheckout';
import InvestmentDetail from './InvestmentDetail';
import MyPurchasesPage from './MyPurchasesPage';
import MyListingsPage from './MyListingsPage';
import StoreDetailPage from './StoreDetailPage';
import CircularTradePage from './CircularTradePage';

const NAV_TABS = [
  { id: 'home',        icon: <Home size={16} />,       label: 'Home' },
  { id: 'discover',   icon: <Compass size={16} />,     label: 'Discover' },
  { id: 'stores',     icon: <Store size={16} />,       label: 'Stores' },
  { id: 'investments',icon: <TrendingUp size={16} />,  label: 'Investments' },
];

const NAV_ICONS = [
  { id: 'profile',       icon: <User size={20} />,     label: 'Profile' },
  { id: 'wallet',        icon: <Wallet size={20} />,   label: 'Wallet' },
  { id: 'agent',         icon: <Bot size={20} />,      label: 'Agent' },
  { id: 'circular',      icon: <Repeat size={20} />,   label: 'Cycles' },
  { id: 'config',        icon: <Settings size={20} />, label: 'Config' },
];

const PAGES = ['profile', 'wallet', 'agent', 'circular', 'config', 'notifications'];
const OVERLAY_PAGES = ['checkout', 'investment-detail', 'my-purchases', 'my-listings', 'store-detail'];

const MainPortal = () => {
  const [tab, setTab] = useState('home');
  const [navParams, setNavParams] = useState(null);
  const [prevTab, setPrevTab] = useState('home');
  const [chatOpen, setChatOpen] = useState(false);

  const isPage = PAGES.includes(tab);
  const isOverlay = OVERLAY_PAGES.includes(tab);
  const currentPage = [...NAV_TABS, ...NAV_ICONS].find(n => n.id === tab);

  const handleNavigate = (newTab, params = null) => {
    if (!OVERLAY_PAGES.includes(newTab)) {
      setPrevTab(newTab);
    } else {
      setPrevTab(tab);
    }
    setNavParams(params);
    setTab(newTab);
  };

  const handleBack = () => {
    setTab(prevTab);
    setNavParams(null);
  };

  const handleSetTab = (newTab) => {
    setPrevTab(newTab);
    setTab(newTab);
    setNavParams(null);
  };

  return (
    <div className="app-layout">
      {/* Overlay screens (full-page, hide navbar chrome) */}
      {tab === 'checkout' && navParams?.listing && (
        <main className="main-content" style={{ paddingTop: 0 }}>
          <XchangeCheckout
            listing={navParams.listing}
            sourceTab={navParams.sourceTab || prevTab}
            onBack={handleBack}
          />
        </main>
      )}

      {tab === 'investment-detail' && navParams?.opp && (
        <main className="main-content" style={{ paddingTop: 0 }}>
          <InvestmentDetail
            opp={navParams.opp}
            onBack={handleBack}
          />
        </main>
      )}

      {tab === 'my-purchases' && (
        <main className="main-content" style={{ paddingTop: 0 }}>
          <MyPurchasesPage
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        </main>
      )}

      {tab === 'my-listings' && (
        <main className="main-content" style={{ paddingTop: 0 }}>
          <MyListingsPage
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        </main>
      )}

      {tab === 'store-detail' && navParams?.store && (
        <main className="main-content" style={{ paddingTop: 0 }}>
          <StoreDetailPage
            store={navParams.store}
            onBack={handleBack}
            onXchange={(listing) => { handleNavigate('checkout', { listing, sourceTab: 'store-detail' }); }}
          />
        </main>
      )}

      {/* Normal portal layout (hidden when overlay active) */}
      {!isOverlay && (
        <>
          {/* Top Navbar */}
          <header className="navbar glass-panel">
            <div className="container flex-between nav-content">
              <div className="brand flex-center" style={{ gap: '20px' }}>
                <h1 className="logo" style={{ cursor: 'pointer' }} onClick={() => handleSetTab('home')}>
                  Ipê<span className="text-gradient-lime">Xchange</span>
                </h1>
                <nav className="nav-tabs">
                  {NAV_TABS.map(t => (
                    <button
                      key={t.id}
                      className={`nav-tab ${tab === t.id ? 'active' : ''}`}
                      onClick={() => handleSetTab(t.id)}
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
                >
                  <Bell size={20} />
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#B4F44A', borderRadius: '50%', border: '2px solid var(--bg-card)' }} />
                </button>
                {NAV_ICONS.map(n => (
                  <button
                    key={n.id}
                    className={`btn-icon nav-icon-btn ${tab === n.id ? 'active-icon' : ''}`}
                    onClick={() => handleSetTab(n.id)}
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
              <span style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => handleSetTab('home')}>Home</span>
              <ChevronRight size={14} />
              <span>{currentPage?.label}</span>
            </div>
          )}

          {/* Main Content */}
          <main className="main-content" style={{ paddingTop: isPage ? '24px' : 0 }}>
            {tab === 'home'         && <HomePage onNavigate={handleNavigate} />}
            {tab === 'discover'     && <DiscoverPage onNavigate={handleNavigate} />}
            {tab === 'stores'       && <StoresPage onNavigate={handleNavigate} />}
            {tab === 'investments'  && <InvestmentsPage onNavigate={handleNavigate} />}
            {tab === 'profile'      && <ProfilePage />}
            {tab === 'wallet'       && <WalletPage onNavigate={handleNavigate} />}
            {tab === 'agent'        && <AgentPage />}
            {tab === 'circular'     && <CircularTradePage />}
            {tab === 'config'       && <ConfigPage />}
            {tab === 'notifications'&& <NotificationsPage />}
          </main>



          {/* Global Chat FAB */}
          <button
            id="global-chat-fab"
            className="chat-fab"
            onClick={() => setChatOpen(true)}
          >
            <div className="fab-glow-ring" />
            <MessageCircle size={28} />
            <span>Chat with Core</span>
          </button>

          {/* Global Chat Drawer */}
          <ChatDrawer
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            onNavigate={(tab, params) => { setChatOpen(false); handleNavigate(tab, params); }}
          />
        </>
      )}
    </div>
  );
};

export default MainPortal;
