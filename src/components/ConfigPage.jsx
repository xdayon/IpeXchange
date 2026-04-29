import React, { useState } from 'react';
import { Sliders, RefreshCw, Database, CheckCircle2, AlertCircle, Shield, Bot, Bell, Network, Key } from 'lucide-react';
import { seedMockData } from '../lib/api';
import { useUser } from '../lib/UserContext';

const AdminDebugSection = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSeed = async () => {
    setLoading(true);
    setStatus(null);
    const result = await seedMockData();
    if (result.success) {
      setStatus({ type: 'success', text: 'Network successfully seeded with Ipê mock data.' });
    } else {
      setStatus({ type: 'error', text: result.error || 'Failed to seed network.' });
    }
    setLoading(false);
  };

  return (
    <ConfigSection title="Admin & Debug" icon={Sliders}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Force sync the local network with fresh mock listings, sessions, and circular trade cycles. 
          <strong style={{ color: 'var(--accent-lime)' }}> Safe to re-run.</strong>
        </p>
        <button 
          onClick={handleSeed}
          disabled={loading}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '12px', borderRadius: 10, background: 'rgba(180, 244, 74, 0.1)',
            border: '1px solid rgba(180, 244, 74, 0.3)', color: '#B4F44A',
            fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s'
          }}
        >
          {loading ? <RefreshCw size={18} className="spin-animation" /> : <Database size={18} />}
          {loading ? 'Seeding City Network...' : 'Seed Mock City Data'}
        </button>

        {status && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px', borderRadius: 8, 
            background: status.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${status.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: status.type === 'success' ? '#22c55e' : '#ef4444',
            fontSize: 13
          }}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.text}
          </div>
        )}
      </div>
    </ConfigSection>
  );
};

const ConfigSection = ({ title, icon: Icon, children }) => (
  <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color: 'var(--text-primary)' }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600 }}>{title}</h3>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {children}
    </div>
  </div>
);

const ToggleRow = ({ label, description, defaultChecked = false, badge }) => {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{label}</p>
          {badge && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 100, border: `1px solid ${badge.color}30`, background: `${badge.color}10`, color: badge.color }}>{badge.text}</span>}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</p>
      </div>
      <button 
        onClick={() => setChecked(!checked)}
        style={{ 
          width: 44, height: 24, borderRadius: 100, position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
          background: checked ? 'var(--accent-lime)' : 'rgba(255,255,255,0.1)', flexShrink: 0
        }}
      >
        <div style={{ 
          position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: '50%', 
          background: checked ? '#000' : '#fff', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
        }} />
      </button>
    </div>
  );
};

const SelectRow = ({ label, description, options, defaultValue }) => {
  const [value, setValue] = useState(defaultValue);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</p>
      </div>
      <select 
        value={value} onChange={e => setValue(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: 14 }}
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
};

const ConfigPage = () => {
  const { email } = useUser();
  const isAdmin = email === 'dayon.bochnia@gmail.com';

  return (
    <div className="inner-page container" style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>
          System <span className="text-gradient-cyan">Settings</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Adjust your privacy preferences, Core behavior, and Ipê network parameters.</p>
      </div>

      <ConfigSection title="Privacy & Zero-Knowledge" icon={Shield}>
        <ToggleRow 
          label="Strict ZKP Mode" 
          description="Forces the use of Zero-Knowledge Proofs for all financial interactions, with no exceptions. Total omission of public values."
          defaultChecked={true}
          badge={{ text: 'Recommended', color: '#B4F44A' }}
        />
        <ToggleRow 
          label="Web of Trust Visibility" 
          description="Allows 2nd degree contacts to see your reputation profile (only score and categories, no history)."
          defaultChecked={true}
        />
        <ToggleRow 
          label="Automatic EAS Synchronization" 
          description="Periodically sends your local proofs to the Ethereum Attestation Service."
          defaultChecked={true}
        />
      </ConfigSection>

      <ConfigSection title="Xchange Core Behavior" icon={Bot}>
        <SelectRow 
          label="Agent Proactivity Level" 
          description="Defines how aggressively Core searches for matches for your active intents."
          options={[
            { value: 'low', label: 'Conservative (Exact matches only)' },
            { value: 'medium', label: 'Balanced (Recommended)' },
            { value: 'high', label: 'Proactive (Suggests alternatives and trades)' }
          ]}
          defaultValue="medium"
        />
        <ToggleRow 
          label="Fair Pricing AI" 
          description="Allows Core to automatically suggest fair prices based on city economics when creating an intent."
          defaultChecked={true}
          badge={{ text: 'New', color: '#38BDF8' }}
        />
        <ToggleRow 
          label="Autonomous Negotiation Agent" 
          description="Allows your personal agent to negotiate values (up to 10% margin) with other agents without interrupting you."
          defaultChecked={false}
        />
      </ConfigSection>

      <ConfigSection title="Notifications & Alerts" icon={Bell}>
        <ToggleRow 
          label="High Relevance Matches" 
          description="Notifies instantly when a perfect match (100% compatibility) is found."
          defaultChecked={true}
        />
        <ToggleRow 
          label="Trust Network Alerts" 
          description="Warns when people in your Web of Trust complete transactions or improve their reputation."
          defaultChecked={false}
        />
        <SelectRow 
          label="City Digest Frequency" 
          description="Summary of economic activities and new stores in Jurerê."
          options={[
            { value: 'realtime', label: 'Real-time' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'never', label: 'Disabled' }
          ]}
          defaultValue="daily"
        />
      </ConfigSection>

      <ConfigSection title="Network & Integrations" icon={Network}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Database size={20} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>City Graph Node</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Connected to Ipê City (Latency: 12ms)</p>
            </div>
          </div>
          <button style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.1)' }}>Change Node</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Key size={20} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>Local ZKP Keys</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Securely stored in the device enclave</p>
            </div>
          </div>
          <button style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: 'rgba(244,63,94,0.1)', color: '#F43F5E', border: '1px solid rgba(244,63,94,0.3)' }}>Regenerate Keys</button>
        </div>
      </ConfigSection>

      {isAdmin && <AdminDebugSection />}
      
      <div style={{ textAlign: 'center', marginTop: 40, marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ipê Xchange Core v1.4.2 — Build 8f7a91</p>
      </div>
    </div>
  );
};

export default ConfigPage;
