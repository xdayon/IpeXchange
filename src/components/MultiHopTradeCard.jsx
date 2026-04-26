import React, { useState } from 'react';
import { ArrowRight, ArrowDown, Repeat, CheckCircle2, Zap, User, Lock, Activity } from 'lucide-react';
import DataBadge from './DataBadge';

const MultiHopTradeCard = ({ cycle }) => {
  const [status, setStatus] = useState('pending'); // pending, signing, executed

  const handleSign = () => {
    setStatus('signing');
    setTimeout(() => {
      setStatus('executed');
    }, 2500);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: -50, right: -50, opacity: 0.05, transform: 'rotate(15deg)' }}>
        <Repeat size={200} color="#38BDF8" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, position: 'relative', zIndex: 1 }}>
        <div>
          <h4 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Zap size={18} color="#B4F44A" /> AI Circular Trade Match
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Opportunity found via Ipê Hub (Match Score: {cycle.matchScore}%)</p>
        </div>
        <span className="badge" style={{ background: 'rgba(180,244,74,0.08)', color: '#B4F44A', borderColor: 'rgba(180,244,74,0.2)', padding: '4px 12px', fontSize: 12 }}>
          {cycle.nodes.length}-Step Skill Cycle
        </span>
      </div>

      <div className="cycle-container" style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.15)', borderRadius: 16, padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
        
        {cycle.nodes.map((node, index) => {
          const nextNode = cycle.nodes[(index + 1) % cycle.nodes.length];
          const isYou = index === 0;

          return (
            <div key={index} style={{ position: 'relative', paddingBottom: index === cycle.nodes.length - 1 ? 0 : 24 }}>
              
              {/* Connection line */}
              {index !== cycle.nodes.length - 1 && (
                <div style={{ position: 'absolute', left: 24, top: 40, bottom: 0, width: 2, background: 'linear-gradient(to bottom, rgba(56,189,248,0.4), rgba(56,189,248,0.1))' }} />
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {/* Node Avatar */}
                <div style={{ width: 48, height: 48, borderRadius: 24, background: isYou ? 'rgba(180,244,74,0.15)' : 'rgba(255,255,255,0.05)', border: `2px solid ${isYou ? '#B4F44A' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {node.avatar ? (
                    <img src={node.avatar} alt={node.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={20} color={isYou ? '#B4F44A' : '#aaa'} />
                  )}
                </div>

                {/* Node Content */}
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: isYou ? '#B4F44A' : '#fff' }}>{node.user}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.05)' }}>
                      {node.tier || 'Resident'} · {node.rep} Ipê Rep
                    </span>
                    {!isYou && <DataBadge isMock={node.is_mock} />}
                    {isYou && <DataBadge isMock={false} />}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', padding: '8px 12px', borderRadius: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      Delivers to <strong style={{ color: '#fff' }}>{nextNode.user}</strong>:
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#38BDF8' }}>{node.item}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Cycle Closing Feedback */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(180,244,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #B4F44A' }}>
            <CheckCircle2 size={16} color="#B4F44A" />
          </div>
          <p style={{ fontSize: 14 }}>
            You close the cycle and receive <strong style={{ color: '#B4F44A' }}>{cycle.nodes[cycle.nodes.length - 1].item}</strong>.
          </p>
        </div>

      </div>

      {/* Action Footer */}
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
          <Lock size={14} /> Multi-signature Smart Contract
        </div>

        {status === 'pending' && (
          <button 
            onClick={handleSign}
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #38BDF8, #818CF8)', border: 'none', borderRadius: 100, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Sign P2P Cycle <ArrowRight size={16} />
          </button>
        )}

        {status === 'signing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 100, color: '#F59E0B', fontSize: 14, fontWeight: 700 }}>
            <Activity size={16} className="spin-animation" />
            Awaiting signatures (1/3)
          </div>
        )}

        {status === 'executed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100, color: '#22c55e', fontSize: 14, fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              Executed via IpêDAORail
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', marginRight: 12 }}>
              Settled on Rootstock (RBTC)
            </span>
          </div>
        )}
      </div>

    </div>
  );
};

export default MultiHopTradeCard;
