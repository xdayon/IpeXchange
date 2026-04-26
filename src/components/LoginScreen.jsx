import React, { useState } from 'react';
import { Fingerprint, ArrowRight, Loader2 } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
  const [step, setStep] = useState('idle'); // idle | loading | found

  const handleConnect = () => {
    setStep('loading');
    setTimeout(() => {
      setStep('found');
    }, 1500);
  };

  return (
    <div className="onboarding-screen">
      <div className="login-container glass-panel">
        <div className="icon-wrapper">
          <Fingerprint size={64} className="text-gradient-lime" />
        </div>
        <h1 className="hero-title">Ipê<span className="text-gradient-lime">Xchange</span></h1>
        <p className="hero-subtitle">Connect your identity to enter the ecosystem.</p>

        {step === 'idle' && (
          <button className="btn-primary w-full pulse-btn" onClick={handleConnect} style={{ marginTop: 24 }}>
            <span>Connect Ipê Passport</span>
          </button>
        )}

        {step === 'loading' && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="spin" style={{ margin: '0 auto 16px', color: '#B4F44A' }} />
            <p>Searching for local Passport...</p>
          </div>
        )}

        {step === 'found' && (
          <div style={{ animation: 'fade-in 0.5s ease-out', marginTop: 24 }}>
            <div className="passport-card">
              <div className="passport-header">
                <span className="badge">Ipê Passport Found</span>
              </div>
              <div className="passport-details">
                <h3>dayonx.ipecity.eth</h3>
                <p className="wallet-address">0x17e9...7da1</p>
              </div>
            </div>
            <button className="btn-primary w-full pulse-btn" onClick={onLogin} style={{ marginTop: 24 }}>
              <span>Authenticate & Enter</span>
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
