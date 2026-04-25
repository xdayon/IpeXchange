import React from 'react';
import { Bot, Brain, Database, ShieldCheck, Settings, Activity } from 'lucide-react';
import personalAgentImg from '../assets/personal_agent.png';

const MEMORIES = [
  { label: 'Intent: comprar macbook', tag: 'Shopping', color: '#38BDF8', time: '2h ago' },
  { label: 'Preferência: pagamento crypto', tag: 'Finance', color: '#B4F44A', time: '1d ago' },
  { label: 'Perfil: entusiasta de tecnologia', tag: 'Profile', color: '#818CF8', time: '3d ago' },
];

const AgentPage = () => (
  <div className="inner-page container">
    <div className="agent-status-hero">
      <div className="agent-avatar-container floating-animation" style={{ width: 120, height: 120 }}>
        <img src={personalAgentImg} alt="Agent" className="agent-image" />
        <div className="glow-ring"></div>
      </div>
      <div>
        <h2 style={{ fontSize: '26px' }}>Your <span className="text-gradient-cyan">Personal Agent</span></h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>dayonx-agent.ipecity.eth</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <span className="tag badge" style={{ color: '#B4F44A', borderColor: 'rgba(180,244,74,0.3)', background: 'rgba(180,244,74,0.08)' }}>
            <Activity size={12} style={{ display: 'inline', marginRight: 4 }} /> Online
          </span>
          <span className="tag badge" style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.08)' }}>
            <ShieldCheck size={12} style={{ display: 'inline', marginRight: 4 }} /> ZKP Active
          </span>
        </div>
      </div>
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

export default AgentPage;
