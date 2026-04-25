import React from 'react';
import { Fingerprint, ShieldCheck, Globe, Copy, LogOut } from 'lucide-react';

const ProfilePage = () => {
  const handleLogout = () => {
    localStorage.removeItem('ipeXchangeState');
    window.location.reload();
  };

  return (
    <div className="inner-page container">
      <div className="profile-hero">
        <div className="profile-avatar">
          <Fingerprint size={64} />
          <div className="passport-badge">
            <ShieldCheck size={14} /> Verified
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>dayonx<span className="text-gradient-lime">.ipecity.eth</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '14px' }}>
            0x17e9...7da1 <Copy size={13} style={{ display: 'inline', cursor: 'pointer', marginLeft: 4 }} />
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <span className="tag badge" style={{ color: '#B4F44A', borderColor: 'rgba(180,244,74,0.3)', background: 'rgba(180,244,74,0.08)' }}>IDENTITY</span>
            <span className="tag badge" style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.08)' }}>ENS</span>
          </div>
        </div>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: '100px', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#F43F5E', background: 'rgba(244, 63, 94, 0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.05)'; }}
        >
          <LogOut size={16} /> Disconnect
        </button>
      </div>

      <div className="profile-grid">
        <div className="glass-panel profile-card">
          <Globe size={22} className="text-gradient-cyan" style={{ marginBottom: 8 }} />
          <h4>Ipê Passport</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
            Decentralized identity issued by the Ipê Hub. Links your ENS name to your on-chain reputation.
          </p>
          <a href="https://app.ipe.city/profile" target="_blank" rel="noreferrer" className="btn-primary" style={{ marginTop: 16, textDecoration: 'none' }}>
            View on Ipê Hub
          </a>
        </div>

        <div className="glass-panel profile-card">
          <ShieldCheck size={22} style={{ color: '#B4F44A', marginBottom: 8 }} />
          <h4>ZKP Privacy</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
            All your interactions within the Xchange are protected by Zero-Knowledge Proofs. Your data is never exposed to third parties.
          </p>
          <span className="tag badge" style={{ marginTop: 16, display: 'inline-block', color: '#B4F44A', borderColor: 'rgba(180,244,74,0.3)', background: 'rgba(180,244,74,0.08)', fontSize: 13 }}>Active &amp; Healthy</span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
