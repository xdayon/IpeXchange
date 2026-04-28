import React, { useEffect, useState } from 'react';
import { Fingerprint, ArrowRight, Loader2 } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

const LoginScreen = ({ onLogin }) => {
  const { ready, authenticated, login, user } = usePrivy();
  const [showEntry, setShowEntry] = useState(false);

  useEffect(() => {
    if (ready && authenticated) {
      // Simulate a small delay for dramatic effect after Privy login completes
      const timer = setTimeout(() => {
        setShowEntry(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ready, authenticated]);

  const displayId = user?.wallet?.address 
    ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
    : user?.email?.address || 'Ipê Passport';

  return (
    <div className="onboarding-screen">
      <div className="login-container glass-panel">
        <div className="icon-wrapper">
          <Fingerprint size={64} className="text-gradient-lime" />
        </div>
        <h1 className="hero-title">Ipê<span className="text-gradient-lime">Xchange</span></h1>
        <p className="hero-subtitle">Connect your identity to enter the ecosystem.</p>

        {!ready && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="spin" style={{ margin: '0 auto 16px', color: '#B4F44A' }} />
            <p>Initializing connection...</p>
          </div>
        )}

        {ready && !authenticated && (
          <button className="btn-primary w-full pulse-btn" onClick={login} style={{ marginTop: 24 }}>
            <span>Connect Ipê Passport</span>
          </button>
        )}

        {ready && authenticated && showEntry && (
          <div style={{ animation: 'fade-in 0.5s ease-out', marginTop: 24 }}>
            <div className="passport-card">
              <div className="passport-header">
                <span className="badge">Ipê Passport Linked</span>
              </div>
              <div className="passport-details">
                <h3>{user?.email?.address ? 'Verified Email' : 'Connected Wallet'}</h3>
                <p className="wallet-address">{displayId}</p>
              </div>
            </div>
            <button className="btn-primary w-full pulse-btn" onClick={onLogin} style={{ marginTop: 24 }}>
              <span>Enter Ecosystem</span>
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
