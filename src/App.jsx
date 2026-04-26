import { useState, lazy, Suspense } from 'react';
import './App.css';

// Lazy-load all onboarding screens — they are large and only used once on first visit
const LoginScreen        = lazy(() => import('./components/LoginScreen'));
const ConnectAgentScreen = lazy(() => import('./components/ConnectAgentScreen'));
const SyncScreen         = lazy(() => import('./components/SyncScreen'));
const MainPortal         = lazy(() => import('./components/MainPortal'));

// Minimal full-screen skeleton shown while chunks load
const FullScreenLoader = () => (
  <div style={{
    minHeight: '100vh',
    background: 'var(--bg-dark)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <div style={{
      width: 40, height: 40,
      border: '2px solid rgba(56,189,248,0.2)',
      borderTopColor: 'var(--accent-cyan)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  </div>
);

function App() {
  const [appState, setAppState] = useState(() => {
    return localStorage.getItem('ipeXchangeState') || 'login';
  });

  const handleSetAppState = (newState) => {
    if (newState === 'portal') {
      localStorage.setItem('ipeXchangeState', 'portal');
    }
    if (newState === 'login') {
      localStorage.removeItem('ipeXchangeState');
    }
    setAppState(newState);
  };

  return (
    <Suspense fallback={<FullScreenLoader />}>
      {appState === 'login' && (
        <div className="app-layout">
          <main className="main-content">
            <LoginScreen onLogin={() => handleSetAppState('sync')} />
          </main>
        </div>
      )}
      {appState === 'sync' && (
        <div className="app-layout">
          <main className="main-content">
            <SyncScreen onComplete={() => handleSetAppState('portal')} />
          </main>
        </div>
      )}
      {appState === 'portal' && <MainPortal />}
    </Suspense>
  );
}

export default App;
