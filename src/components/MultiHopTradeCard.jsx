import React, { useState } from 'react';
import { ArrowRight, Repeat, CheckCircle2, Zap, User, Lock, Activity, Package, DollarSign, Layers, Store } from 'lucide-react';
import DataBadge from './DataBadge';

// Format price for display
const fmtPrice = (p) => {
  if (!p || p === 0) return null;
  return `$${Number(p).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Value balance color
const balanceColor = (ratio) => {
  if (!ratio) return '#888';
  if (ratio >= 85) return '#B4F44A';
  if (ratio >= 70) return '#38BDF8';
  return '#F59E0B';
};

// Hop count badge color
const hopColor = (hops) => {
  if (hops >= 5) return { bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.3)', color: '#818CF8' };
  if (hops === 4) return { bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.25)', color: '#38BDF8' };
  return { bg: 'rgba(180,244,74,0.08)', border: 'rgba(180,244,74,0.2)', color: '#B4F44A' };
};

// Combo tooltip: additional items to reach value balance
const ComboTag = ({ combo }) => {
  if (!combo || combo.length === 0) return null;
  return (
    <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
      <p style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        📦 Value Bundle
      </p>
      {combo.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: i < combo.length - 1 ? 2 : 0 }}>
          <span>{item.qty > 1 ? `${item.qty}× ` : ''}{item.name}</span>
          <span style={{ color: '#F59E0B', fontWeight: 600 }}>{fmtPrice(item.price * (item.qty || 1))}</span>
        </div>
      ))}
    </div>
  );
};

const MultiHopTradeCard = ({ cycle }) => {
  const [status, setStatus] = useState('pending');

  const hops = cycle.hops || cycle.nodes?.length || 3;
  const hopStyle = hopColor(hops);
  const valueColor = balanceColor(cycle.valueRatio);

  const handleSign = () => {
    setStatus('signing');
    setTimeout(() => setStatus('executed'), 2500);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: -50, right: -50, opacity: 0.04, transform: 'rotate(15deg)' }}>
        <Repeat size={200} color="#38BDF8" />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h4 style={{ fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Zap size={17} color="#B4F44A" /> AI Circular Trade Match
          </h4>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Match Score: <strong style={{ color: '#fff' }}>{cycle.matchScore}%</strong>
            {cycle.valueRatio && (
              <> · Value Balance: <strong style={{ color: valueColor }}>{cycle.valueRatio}%</strong></>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Hop count badge */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: hopStyle.bg, border: `1px solid ${hopStyle.border}`, color: hopStyle.color }}>
            <Layers size={12} /> {hops}-Hop Cycle
          </span>
          {/* Value balance badge */}
          {cycle.valueRatio && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: `${valueColor}10`, border: `1px solid ${valueColor}30`, color: valueColor }}>
              <DollarSign size={12} /> {cycle.valueRatio >= 85 ? 'Balanced' : cycle.valueRatio >= 70 ? 'Fair' : 'Review'}
            </span>
          )}
        </div>
      </div>

      {/* Node chain */}
      <div className="cycle-container" style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.15)', borderRadius: 16, padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>

        {cycle.nodes.map((node, index) => {
          const nextNode = cycle.nodes[(index + 1) % cycle.nodes.length];
          const isYou = index === 0;
          const isStore = node.sourceType === 'store_product';
          const isLongCycle = cycle.nodes.length > 3;

          return (
            <div key={index} style={{ position: 'relative', paddingBottom: index === cycle.nodes.length - 1 ? 0 : (isLongCycle ? 14 : 24) }}>

              {/* Connector line */}
              {index !== cycle.nodes.length - 1 && (
                <div style={{ position: 'absolute', left: 24, top: 52, bottom: 0, width: 2, background: 'linear-gradient(to bottom, rgba(56,189,248,0.4), rgba(56,189,248,0.05))' }} />
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {/* Avatar */}
                <div style={{ width: 48, height: 48, borderRadius: 24, background: isYou ? 'rgba(180,244,74,0.15)' : 'rgba(255,255,255,0.05)', border: `2px solid ${isYou ? '#B4F44A' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                  {node.avatar ? (
                    <img src={node.avatar} alt={node.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={20} color={isYou ? '#B4F44A' : '#aaa'} />
                  )}
                  {/* Store indicator dot */}
                  {isStore && (
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: '#38BDF8', border: '2px solid #0a0a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Store size={8} color="#fff" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingTop: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isYou ? '#B4F44A' : '#fff' }}>{node.user}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.05)' }}>
                      {node.tier || 'Resident'} · {node.rep} Ipê Rep
                    </span>
                    {!isYou && <DataBadge isMock={node.is_mock} />}
                    {isYou && <DataBadge isMock={false} />}
                    {isStore && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#38BDF8', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(56,189,248,0.2)' }}>
                        <Store size={9} style={{ display: 'inline', marginRight: 3 }} />Store
                      </span>
                    )}
                  </div>

                  {/* Offer box */}
                  <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', padding: '8px 12px', borderRadius: 10, marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        Delivers to <strong style={{ color: '#fff' }}>{nextNode.user}</strong>:
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#38BDF8' }}>{node.item}</span>
                      {node.price && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#B4F44A', marginLeft: 'auto', background: 'rgba(180,244,74,0.08)', padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(180,244,74,0.2)' }}>
                          {fmtPrice(node.price)}
                        </span>
                      )}
                    </div>
                    {/* Combo items if present */}
                    <ComboTag combo={node.combo} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Cycle close */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(180,244,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #B4F44A' }}>
            <CheckCircle2 size={16} color="#B4F44A" />
          </div>
          <p style={{ fontSize: 13 }}>
            You close the cycle and receive <strong style={{ color: '#B4F44A' }}>{cycle.nodes[cycle.nodes.length - 1].item}</strong>.
            {cycle.nodes[cycle.nodes.length - 1].price && (
              <span style={{ color: 'var(--text-secondary)' }}> · Market value: <strong style={{ color: '#B4F44A' }}>{fmtPrice(cycle.nodes[cycle.nodes.length - 1].price)}</strong></span>
            )}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
            <Lock size={13} /> Multi-sig Smart Contract
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
            <Package size={13} /> {hops} participants
          </span>
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
            Awaiting signatures (1/{hops})
          </div>
        )}

        {status === 'executed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100, color: '#22c55e', fontSize: 14, fontWeight: 700 }}>
              <CheckCircle2 size={16} /> Executed via IpêDAORail
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
