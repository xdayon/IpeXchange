import React, { useState } from 'react';
import { Bot, Brain, Database, ShieldCheck, Settings, Activity, Power, Image as ImageIcon } from 'lucide-react';
import personalAgentImg from '../assets/personal_agent.png';
import ConnectAgentScreen from './ConnectAgentScreen';

const MEMORIES = [
  { label: 'Intent: buying macbook', tag: 'Shopping', color: '#38BDF8', time: '2h ago' },
  { label: 'Preference: crypto payment', tag: 'Finance', color: '#B4F44A', time: '1d ago' },
  { label: 'Profile: tech enthusiast', tag: 'Profile', color: '#818CF8', time: '3d ago' },
];

const AgentPage = () => {
  const [connected, setConnected] = useState(() => {
    return localStorage.getItem('ipeXchange_agentConnected') === 'true';
  });

  const handleConnect = () => {
    localStorage.setItem('ipeXchange_agentConnected', 'true');
    setConnected(true);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('ipeXchange_agentConnected');
    setConnected(false);
  };

  if (!connected) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <ConnectAgentScreen onConnect={handleConnect} inline={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="inner-page container">
      <div className="agent-status-hero" style={{ position: 'relative' }}>
        <button onClick={handleDisconnect} style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Power size={13} /> Disconnect
        </button>
        <div className="agent-avatar-container floating-animation" style={{ width: 120, height: 120 }}>
          <img src={personalAgentImg} alt="Agent" className="agent-image" />
          <div className="glow-ring"></div>
        </div>
        <div>
          <h2 style={{ fontSize: '26px' }}>Your <span className="text-gradient-cyan">Personal Agent</span></h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>dx.agent.aihaus.ipe</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span className="tag badge" style={{ color: '#B4F44A', borderColor: 'rgba(180,244,74,0.3)', background: 'rgba(180,244,74,0.08)' }}>
              <Activity size={12} style={{ display: 'inline', marginRight: 4 }} /> Online
            </span>
            <span className="tag badge" style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.08)' }}>
              <ShieldCheck size={12} style={{ display: 'inline', marginRight: 4 }} /> ZKP Active
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
          <ImageIcon size={14} /> Change Avatar
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
          <Settings size={14} /> Identity Settings
        </button>
      </div>

      {/* Stats */}
      <div className="agent-stats">
        {[
          { icon: <Brain size={22} />, label: 'Intents stored', value: '12', color: '#B4F44A' },
          { icon: <Database size={22} />, label: 'Graph entries', value: '48', color: '#38BDF8' },
          { icon: <ShieldCheck size={22} />, label: 'ZKP proofs', value: '7', color: '#818CF8' },
        ].map((s, i) => (
          <div key={i} className="glass-panel agent-stat-card">
            <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Memory log */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
        <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={18} /> Agent Memory
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MEMORIES.map((m, i) => (
            <div key={i} className="memory-item">
              <span className="memory-tag" style={{ color: m.color, borderColor: `${m.color}44` }}>{m.tag}</span>
              <span className="memory-label">{m.label}</span>
              <span className="memory-time">{m.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
