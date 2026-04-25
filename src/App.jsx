import { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import ConnectAgentScreen from './components/ConnectAgentScreen';
import SyncScreen from './components/SyncScreen';
import MainPortal from './components/MainPortal';
import './App.css';

function App() {
  const [appState, setAppState] = useState(() => {
    return localStorage.getItem('ipeXchangeState') || 'login';
  });

  const handleSetAppState = (newState) => {
    if (newState === 'portal') {
      localStorage.setItem('ipeXchangeState', 'portal');
    }
    setAppState(newState);
  };

  return (
    <>
      {appState === 'login' && (
        <div className="app-layout">
          <main className="main-content">
            <LoginScreen onLogin={() => handleSetAppState('connect')} />
          </main>
        </div>
      )}
      {appState === 'connect' && (
        <div className="app-layout">
          <main className="main-content">
            <ConnectAgentScreen onConnect={() => handleSetAppState('sync')} />
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
    </>
  );
}

export default App;
