import React, { useState } from 'react';
import { Home, Compass, User, Wallet, Bot, Settings, Bell, Store, TrendingUp, ChevronRight } from 'lucide-react';
import HomePage from './HomePage';
import DiscoverPage from './DiscoverPage';
import ProfilePage from './ProfilePage';
import WalletPage from './WalletPage';
import AgentPage from './AgentPage';
import StoresPage from './StoresPage';
import InvestmentsPage from './InvestmentsPage';

const NAV_TABS = [
  { id: 'home',        icon: <Home size={16} />,       label: 'Home' },
  { id: 'discover',   icon: <Compass size={16} />,     label: 'Discover' },
  { id: 'stores',     icon: <Store size={16} />,       label: 'Stores' },
  { id: 'investments',icon: <TrendingUp size={16} />,  label: 'Investments' },
];

const NAV_ICONS = [
  { id: 'profile', icon: <User size={20} />,     label: 'Profile' },
  { id: 'wallet',  icon: <Wallet size={20} />,   label: 'Wallet' },
  { id: 'agent',   icon: <Bot size={20} />,      label: 'Agent' },
  { id: 'config',  icon: <Settings size={20} />, label: 'Config' },
];

const PAGES = ['profile', 'wallet', 'agent', 'config'];

const MainPortal = () => {
  const [tab, setTab] = useState('home');
  const isPage = PAGES.includes(tab);
  const currentPage = [...NAV_TABS, ...NAV_ICONS].find(n => n.id === tab);

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <header className="navbar glass-panel">
        <div className="container flex-between nav-content">
          <div className="brand flex-center" style={{ gap: '20px' }}>
            <h1 className="logo" style={{ cursor: 'pointer' }} onClick={() => setTab('home')}>
              Ipê<span className="text-gradient-lime">Xchange</span>
            </h1>
            <nav className="nav-tabs">
              {NAV_TABS.map(t => (
                <button
                  key={t.id}
                  className={`nav-tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="nav-actions flex-center">
            <button className="btn-icon"><Bell size={20} /></button>
            {NAV_ICONS.map(n => (
              <button
                key={n.id}
                className={`btn-icon nav-icon-btn ${tab === n.id ? 'active-icon' : ''}`}
                onClick={() => setTab(n.id)}
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
          <span style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setTab('home')}>Home</span>
          <ChevronRight size={14} />
          <span>{currentPage?.label}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content" style={{ paddingTop: isPage ? '24px' : 0 }}>
        {tab === 'home'        && <HomePage />}
        {tab === 'discover'   && <DiscoverPage />}
        {tab === 'stores'     && <StoresPage />}
        {tab === 'investments'&& <InvestmentsPage />}
        {tab === 'profile'    && <ProfilePage />}
        {tab === 'wallet'     && <WalletPage />}
        {tab === 'agent'      && <AgentPage />}
        {tab === 'config'     && (
          <div className="inner-page container text-center">
            <Settings size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 16px' }} />
            <h2>Configurations</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Settings panel coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MainPortal;
