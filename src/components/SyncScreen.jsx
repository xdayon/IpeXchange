import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Database, Zap } from 'lucide-react';
import personalAgentImg from '../assets/agent_bot.svg';
import xchangeCoreImg from '../assets/xchange_core.png';

const PACKETS = [
  { label: 'ZKP proof generated', color: '#B4F44A', delay: 0.2 },
  { label: 'Preferences encrypted', color: '#38BDF8', delay: 0.6 },
  { label: 'Intent graph loaded', color: '#818CF8', delay: 1.0 },
  { label: 'City graph synced', color: '#B4F44A', delay: 1.4 },
];

const SyncScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [visiblePackets, setVisiblePackets] = useState([]);

  useEffect(() => {
    // Reveal packets one by one
    PACKETS.forEach((p, i) => {
      setTimeout(() => {
        setVisiblePackets(prev => [...prev, i]);
      }, p.delay * 1000 + 400);
    });

    // Progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 2.5;
      });
    }, 100);

    // Transition after 4s
    const done = setTimeout(onComplete, 4200);
    return () => { clearInterval(interval); clearTimeout(done); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="onboarding-screen">
      <div className="sync-wrapper text-center">
        <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>
          Syncing <span className="text-gradient-cyan">encrypted graph</span>
        </h2>
        <p className="hero-subtitle" style={{ marginBottom: '48px' }}>
          Your agent is establishing a ZKP-secured channel with Xchange Core.
        </p>

        {/* Agents visual */}
        <div className="agents-sync-visual">
          <div className="agent-node">
            <img src={personalAgentImg} alt="Personal Agent" className="agent-image small floating-animation" />
            <p>Personal Agent</p>
          </div>

          <div className="sync-channel">
            <div className="channel-line"></div>
            {PACKETS.map((p, i) => (
              <div
                key={i}
                className={`data-packet ${visiblePackets.includes(i) ? 'visible' : ''}`}
                style={{ '--delay': `${p.delay}s`, '--color': p.color }}
              >
                <Zap size={12} />
                <span>{p.label}</span>
              </div>
            ))}
          </div>

          <div className="agent-node">
            <img src={xchangeCoreImg} alt="Xchange Core" className="agent-image small floating-animation" style={{ animationDelay: '1s' }} />
            <p>Xchange Core</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar-track">
          <div 
            className="progress-bar-fill" 
            style={{ 
              width: `${Math.min(progress, 100)}%`,
              boxShadow: progress > 0 ? '0 0 15px rgba(56, 189, 248, 0.4)' : 'none'
            }}
          ></div>
        </div>
        <p className="progress-label" style={{ opacity: progress > 0 ? 1 : 0, transition: 'opacity 0.3s' }}>
          <ShieldCheck size={14} className="inline mr-1" /> 
          <span style={{ fontWeight: 600 }}>Zero-Knowledge Proofs active</span>
          <span style={{ margin: '0 8px', opacity: 0.3 }}>·</span>
          <span className={progress >= 100 ? 'text-lime' : ''}>{Math.round(Math.min(progress, 100))}%</span>
        </p>
      </div>
    </div>
  );
};

export default SyncScreen;
