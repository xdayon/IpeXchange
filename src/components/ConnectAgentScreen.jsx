import React, { useState } from 'react';
import { Bot, Power, Wifi, Shield, Check } from 'lucide-react';
import personalAgentImg from '../assets/personal_agent.png';

const steps = [
  { icon: <Wifi size={18} />, label: 'Discovering agent endpoint...' },
  { icon: <Shield size={18} />, label: 'Authenticating with Passport...' },
  { icon: <Check size={18} />, label: 'Agent connected!' },
];

const ConnectAgentScreen = ({ onConnect }) => {
  const [phase, setPhase] = useState('idle'); // idle | connecting | done
  const [stepIndex, setStepIndex] = useState(0);

  const handleConnect = () => {
    setPhase('connecting');
    setStepIndex(0);

    steps.forEach((_, i) => {
      setTimeout(() => {
        setStepIndex(i);
        if (i === steps.length - 1) {
          setTimeout(() => {
            setPhase('done');
            setTimeout(onConnect, 800);
          }, 900);
        }
      }, i * 900);
    });
  };

  return (
    <div className="onboarding-screen">
      <div className="agent-connect-card glass-panel">
        {/* Avatar */}
        <div className={`agent-avatar-container ${phase !== 'idle' ? 'floating-animation' : ''}`} style={{ width: 180, height: 180, margin: '0 auto 28px' }}>
          <img src={personalAgentImg} alt="Personal Agent" className="agent-image" />
          <div className={`glow-ring ${phase === 'connecting' ? 'fast-glow' : ''}`}></div>
        </div>

        <h2 className="hero-title" style={{ fontSize: '32px', marginBottom: '8px' }}>
          Your <span className="text-gradient-cyan">Personal Agent</span>
        </h2>
        <p className="hero-subtitle" style={{ marginBottom: '32px' }}>
          Your agent manages your data, intents and actions — privately, on your behalf.
        </p>

        {/* Step indicators */}
        {phase !== 'idle' && (
          <div className="connect-steps">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`connect-step ${i <= stepIndex ? 'active' : ''} ${i < stepIndex ? 'done' : ''}`}
              >
                <span className="step-icon">{i < stepIndex ? <Check size={16} /> : step.icon}</span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {phase === 'idle' && (
          <button className="btn-primary btn-large pulse-btn w-full" onClick={handleConnect}>
            <Power size={22} />
            <span>Connect your Agent</span>
          </button>
        )}

        {phase === 'connecting' && (
          <div className="connecting-indicator">
            <div className="spinner"></div>
            <span>Establishing connection...</span>
          </div>
        )}

        {phase === 'done' && (
          <div className="connecting-indicator text-gradient-lime">
            <Check size={24} />
            <span style={{ fontWeight: 700 }}>Agent online — entering Xchange</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectAgentScreen;
