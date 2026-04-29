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
        <div className="icon-wrapper" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(145deg, #080C14 0%, #0B1421 35%, #0d1f2d 65%, #0a1a1a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(56,189,248,0.35), 0 0 24px rgba(56,189,248,0.15), 0 8px 32px rgba(0,0,0,0.6)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 20% 20%, rgba(56,189,248,0.22) 0%, rgba(0,180,140,0.08) 40%, transparent 70%)',
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
              background: 'linear-gradient(to top, rgba(56,189,248,0.07) 0%, transparent 100%)',
            }} />
            <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'relative', zIndex: 1 }}>
              <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
              <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
              <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
              <path d="M2 12a10 10 0 0 1 18-6" />
              <path d="M2 16h.01" />
              <path d="M21.8 16c.2-2 .131-5.354 0-6" />
              <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
              <path d="M8.65 22c.21-.66.45-1.32.57-2" />
              <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
            </svg>
          </div>
        </div>
        <h1 className="hero-title">
          <img src="/logo.png" alt="IpêXchange" style={{ height: '36px', width: '36px', borderRadius: '8px', verticalAlign: 'middle', marginRight: '10px' }} />
          <span>Ipê<span className="text-gradient-lime">Xchange</span></span>
        </h1>
        <p className="hero-subtitle">Connect your identity to enter the ecosystem.</p>

        {!ready && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="spin" style={{ margin: '0 auto 16px', color: '#B4F44A' }} />
            <p>Initializing connection...</p>
          </div>
        )}

        {ready && !authenticated && (
          <>
            <button className="btn-primary w-full pulse-btn" onClick={login} style={{ marginTop: 24 }}>
              <span>Connect Ipê Passport</span>
            </button>
            <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            </div>
            <button 
              className="btn-secondary w-full" 
              onClick={() => {
                localStorage.setItem('ipeXchange_demoSession', 'jean-hansen-demo-session');
                onLogin();
              }}
              style={{ padding: '12px', fontSize: 14 }}
            >
              🚀 Enter as Guest (Demo Mode)
            </button>
          </>
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
