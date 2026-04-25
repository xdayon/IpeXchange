import React from 'react';
import { Fingerprint, ArrowRight } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
  return (
    <div className="onboarding-screen">
      <div className="login-container glass-panel">
        <div className="icon-wrapper">
          <Fingerprint size={64} className="text-gradient-lime" />
        </div>
        <h1 className="hero-title">Ipê<span className="text-gradient-lime">Xchange</span></h1>
        <p className="hero-subtitle">Connect your identity to enter the ecosystem.</p>

        <div className="passport-card">
          <div className="passport-header">
            <span className="badge">Ipê Passport Found</span>
          </div>
          <div className="passport-details">
            <h3>dayonx.ipecity.eth</h3>
            <p className="wallet-address">0x17e9...7da1</p>
          </div>
        </div>

        <button className="btn-primary w-full pulse-btn" onClick={onLogin}>
          <span>Authenticate & Enter</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
