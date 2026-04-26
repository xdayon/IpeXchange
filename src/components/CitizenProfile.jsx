import React from 'react';
import { ShieldCheck, Award, Fingerprint, Database } from 'lucide-react';

const CitizenProfile = ({ user, tier, rep, address }) => {
  const getTierColor = (t) => {
    switch (t) {
      case 'Pioneer': return '#B4F44A';
      case 'Steward': return '#38BDF8';
      case 'Resident': return '#818CF8';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="ipe-passport-card" style={{
      background: 'linear-gradient(135deg, rgba(22, 28, 40, 0.8), rgba(8, 12, 20, 0.9))',
      border: '1px solid rgba(148, 163, 184, 0.1)',
      borderRadius: '20px',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
    }}>
      {/* Decorative Background Icon */}
      <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.03 }}>
        <Fingerprint size={120} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(180, 244, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={18} color="#B4F44A" />
          </div>
          <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
            Ipê Passport
          </span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)' }}>
          On-chain Sync: Active
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: `2px solid ${getTierColor(tier)}`, padding: '3px' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user}`} alt="Avatar" style={{ width: '100%' }} />
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '2px' }}>{user}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: getTierColor(tier) }}>{tier} Tier</span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Score: {rep}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '8px' }}>
          <Database size={12} />
          <span style={{ fontFamily: 'monospace' }}>{address || '0x4f...a3e2'}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ background: 'rgba(180, 244, 74, 0.05)', border: '1px solid rgba(180, 244, 74, 0.1)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', color: '#B4F44A', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Award size={12} /> Governance Active
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenProfile;
