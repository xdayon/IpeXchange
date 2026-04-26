import React, { useState, useEffect } from 'react';
import { Fingerprint, ArrowRight, Loader2 } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

const LoginScreen = ({ onLogin }) => {
  const { ready, authenticated, user, login } = usePrivy();
  
  // Format user display name/address based on Privy user object
  const getDisplayInfo = () => {
    if (!user) return { name: 'Ipê Citizen', address: 'Connected' };
    
    let address = '';
    let name = '';
    
    if (user.wallet?.address) {
      address = user.wallet.address;
      name = `${address.slice(0, 6)}...${address.slice(-4)}`;
    } else if (user.email?.address) {
      address = user.email.address;
      name = address.split('@')[0];
    } else {
      address = user.id;
      name = 'Ipê Citizen';
    }
    
    return { name, address };
  };

  const userInfo = getDisplayInfo();

  return (
    <div className="onboarding-screen">
      <div className="login-container glass-panel">
        <div className="icon-wrapper">
          <Fingerprint size={64} className="text-gradient-lime" />
        </div>
        <h1 className="hero-title">Ipê<span className="text-gradient-lime">Xchange</span></h1>
        <p className="hero-subtitle">Connect your identity to enter the ecosystem.</p>

        {!ready ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="spin" style={{ margin: '0 auto 16px', color: '#B4F44A' }} />
            <p>Initializing Passport Protocol...</p>
          </div>
        ) : !authenticated ? (
          <button className="btn-primary w-full pulse-btn" onClick={login} style={{ marginTop: 24 }}>
            <span>Connect Ipê Passport</span>
          </button>
        ) : (
          <div style={{ animation: 'fade-in 0.5s ease-out', marginTop: 24 }}>
            <div className="passport-card">
              <div className="passport-header">
                <span className="badge">Ipê Passport Linked</span>
              </div>
              <div className="passport-details">
                <h3 style={{ wordBreak: 'break-all' }}>{userInfo.name}</h3>
                <p className="wallet-address" style={{ wordBreak: 'break-all' }}>{userInfo.address}</p>
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
