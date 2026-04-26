import React, { useState } from 'react';
import {
  Fingerprint, ShieldCheck, Globe, Copy, LogOut, TrendingUp,
  Users, Lock, Eye, EyeOff, Star, ArrowUpRight, ArrowDownLeft,
  MapPin, Zap, Search, ChevronRight, Award, Network
} from 'lucide-react';

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const REPUTATION = {
  overall: 95,
  label: 'Elite',
  subScores: [
    { label: 'Reliability',       value: 98, color: '#B4F44A' },
    { label: 'Payment Punctuality',value: 96, color: '#38BDF8' },
    { label: 'Community Trust',   value: 92, color: '#818CF8' },
    { label: 'Dispute Resolution',value: 94, color: '#F59E0B' },
  ],
  portableCities: ['Ipê City', 'Próspera', 'Zuzalu', 'Cabin'],
  attestations: 47,
  network: 'Ethereum / EAS',
};

const ACTIVE_INTENTS = [
  { id: 'ai1', type: 'sell',   text: 'Selling Oggi B.W 8.0 electric bike — $800', status: 'active', matches: 3 },
  { id: 'ai2', type: 'seek',   text: 'Seeking investor for tech project in the city', status: 'active', matches: 1 },
  { id: 'ai3', type: 'trade',  text: 'Trade: design service for organic honey or specialty coffee', status: 'active', matches: 2 },
  { id: 'ai4', type: 'seek',   text: 'Looking for plumbing service — available this week', status: 'paused', matches: 0 },
];

const TRANSACTIONS = [
  { id: 't1', type: 'out', label: 'Physiotherapy session', counterparty: 'drsarah.ipecity.eth', amount: '$30', date: 'Apr 24', isPublic: true,  status: 'completed', proof: '0xa1b2c3' },
  { id: 't2', type: 'in',  label: 'Logo design for client',  counterparty: 'padaria.ipecity.eth',  amount: '$150', date: 'Apr 22', isPublic: false, status: 'completed', proof: '0xd4e5f6' },
  { id: 't3', type: 'out', label: 'Organic honey × 3 jars', counterparty: 'sitioipe.ipecity.eth', amount: '$25',  date: 'Apr 20', isPublic: true,  status: 'completed', proof: '0x7g8h9i' },
  { id: 't4', type: 'in',  label: 'Trade: Bicycle → Services', counterparty: 'roberto.ipecity.eth', amount: 'Trade',  date: 'Apr 18', isPublic: false, status: 'completed', proof: '0xj1k2l3' },
  { id: 't5', type: 'out', label: 'Ipê Cinema Ticket (NFT)',  counterparty: 'cinema.ipecity.eth', amount: '$10',  date: 'Apr 15', isPublic: true,  status: 'completed', proof: '0xm4n5o6' },
];

const TRUST_NETWORK = [
  {
    id: 'tn1', name: 'Carlos', ens: 'carlostech.ipecity.eth', rep: 94, mutual: true,
    txCount: 8, sharedWith: [],
    note: 'Mechanic. 8 confirmed transactions. High trust.',
  },
  {
    id: 'tn2', name: 'Marina', ens: 'marina.ipecity.eth', rep: 98, mutual: true,
    txCount: 12, sharedWith: ['carlostech.ipecity.eth'],
    note: 'Ipê Bakery. 12 transactions. High-value connection.',
  },
  {
    id: 'tn3', name: 'Roberto', ens: 'roberto.ipecity.eth', rep: 87, mutual: false,
    txCount: 0, sharedWith: ['carlostech.ipecity.eth'],
    note: 'Unknown directly — but Carlos has traded with him 3x.',
  },
  {
    id: 'tn4', name: 'Dr. Sarah', ens: 'drsarah.ipecity.eth', rep: 100, mutual: true,
    txCount: 3, sharedWith: ['marina.ipecity.eth'],
    note: 'Ipê Health Clinic. Maximum reputation.',
  },
];

const CORE_INSIGHTS = [
  { icon: TrendingUp, color: '#B4F44A', title: 'Top 4% of traders in Jurerê', desc: 'Trading volume above 96% of active users in the city this month.' },
  { icon: Award,      color: '#38BDF8', title: '47 on-chain attestations', desc: 'Each transaction generates an immutable attestation on Ethereum via EAS — your history is portable.' },
  { icon: Network,    color: '#818CF8', title: '2nd degree network: 128 people', desc: 'You are indirectly connected to 128 citizens via the Web of Trust.' },
  { icon: Zap,        color: '#F59E0B', title: 'Available credit: $2,500', desc: 'Based on your reputation score, you qualify for P2P loans on Xchange Capital.' },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const RepRing = ({ score }) => {
  const r = 54; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 95 ? '#B4F44A' : score >= 85 ? '#38BDF8' : '#F59E0B';
  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 30, fontWeight: 800, color }}>{score}</span>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 1 }}>SCORE</span>
      </div>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
    <Icon size={18} style={{ color: 'var(--accent-cyan)' }} />
    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{children}</h3>
  </div>
);

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const [txShowPrivate, setTxShowPrivate] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('ipeXchangeState');
    window.location.reload();
  };

  const visibleTx = txShowPrivate ? TRANSACTIONS : TRANSACTIONS.filter(t => t.isPublic);

  return (
    <div className="inner-page container" style={{ maxWidth: 900 }}>

      {/* ── HERO ── */}
      <div className="profile-hero" style={{ alignItems: 'flex-start', marginBottom: 40 }}>
        <div className="profile-avatar" style={{ marginTop: 4 }}>
          <Fingerprint size={56} />
          <div className="passport-badge"><ShieldCheck size={13} /> Verified</div>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 26, marginBottom: 4 }}>dayonx<span className="text-gradient-lime">.ipecity.eth</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 13, marginBottom: 12 }}>
            0x17e954b112a833ed6dad439d680df84692077da1
            <Copy size={12} style={{ display: 'inline', cursor: 'pointer', marginLeft: 6, verticalAlign: 'middle' }} />
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span className="store-tag onchain-tag">⬡ Ethereum</span>
            <span className="store-tag" style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.06)' }}>ENS Identity</span>
            <span className="store-tag" style={{ color: '#818CF8', borderColor: 'rgba(129,140,248,0.3)', background: 'rgba(129,140,248,0.06)' }}>47 Attestations</span>
            <span className="store-tag" style={{ color: '#F59E0B', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)' }}>ZKP Active</span>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 100, border: '1px solid rgba(244,63,94,0.4)', color: '#F43F5E', background: 'rgba(244,63,94,0.05)', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.05)'}>
          <LogOut size={15} /> Disconnect
        </button>
      </div>

      {/* ── REPUTATION ── */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24 }}>
        <SectionTitle icon={Award}>On-Chain Reputation</SectionTitle>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <RepRing score={REPUTATION.overall} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#B4F44A' }}>{REPUTATION.label} Member</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{REPUTATION.network}</span>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {REPUTATION.subScores.map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                    <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.value}%`, background: s.color, borderRadius: 4, boxShadow: `0 0 8px ${s.color}60` }} />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                <Globe size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
                Portable reputation across cities:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {REPUTATION.portableCities.map(city => (
                  <span key={city} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, border: '1px solid var(--border-color)', color: city === 'Ipê City' ? '#B4F44A' : 'var(--text-secondary)', background: city === 'Ipê City' ? 'rgba(180,244,74,0.06)' : 'transparent' }}>
                    {city === 'Ipê City' ? '● ' : '○ '}{city}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>
                Your EAS attestations are stored on Ethereum L1 and recognized by any city compatible with the Ipê protocol.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CORE INSIGHTS ── */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24 }}>
        <SectionTitle icon={Zap}>Core Insights</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {CORE_INSIGHTS.map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}12`, border: `1px solid ${item.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{item.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ACTIVE INTENTS ── */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24 }}>
        <SectionTitle icon={Search}>Active Searches & Offers</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ACTIVE_INTENTS.map(intent => {
            const typeColors = { sell: '#B4F44A', seek: '#38BDF8', trade: '#818CF8' };
            const typeLabels = { sell: 'Sell', seek: 'Seek', trade: 'Trade' };
            const c = typeColors[intent.type];
            return (
              <div key={intent.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: intent.status === 'paused' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', border: `1px solid ${intent.status === 'paused' ? 'var(--border-color)' : `${c}25`}`, opacity: intent.status === 'paused' ? 0.5 : 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: `${c}12`, border: `1px solid ${c}30`, color: c, whiteSpace: 'nowrap' }}>
                  {typeLabels[intent.type]}
                </span>
                <span style={{ flex: 1, fontSize: 14 }}>{intent.text}</span>
                {intent.matches > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#B4F44A', whiteSpace: 'nowrap' }}>
                    {intent.matches} match{intent.matches > 1 ? 'es' : ''}
                  </span>
                )}
                <span style={{ fontSize: 11, color: intent.status === 'active' ? '#22c55e' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  ● {intent.status === 'active' ? 'Active' : 'Paused'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TRANSACTIONS ── */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <SectionTitle icon={TrendingUp}>Latest Transactions</SectionTitle>
          <button onClick={() => setTxShowPrivate(!txShowPrivate)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border-color)', borderRadius: 100, padding: '5px 12px', cursor: 'pointer' }}>
            {txShowPrivate ? <Eye size={13} /> : <EyeOff size={13} />}
            {txShowPrivate ? 'Hide private' : 'Show private'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {visibleTx.map((tx, i) => (
            <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < visibleTx.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: tx.type === 'in' ? 'rgba(180,244,74,0.1)' : 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {tx.type === 'in'
                  ? <ArrowDownLeft size={16} style={{ color: '#B4F44A' }} />
                  : <ArrowUpRight size={16} style={{ color: '#F43F5E' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{tx.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{tx.counterparty}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: tx.type === 'in' ? '#B4F44A' : 'var(--text-primary)', marginBottom: 2 }}>
                  {tx.type === 'in' ? '+' : '-'}{tx.amount}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{tx.date}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {tx.isPublic
                  ? <Eye size={13} style={{ color: 'var(--text-secondary)' }} />
                  : <Lock size={13} style={{ color: '#818CF8' }} />}
                <span style={{ fontSize: 10, color: tx.isPublic ? 'var(--text-secondary)' : '#818CF8' }}>{tx.isPublic ? 'Pub' : 'ZKP'}</span>
              </div>
            </div>
          ))}
        </div>
        {!txShowPrivate && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 14, textAlign: 'center' }}>
            <Lock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            {TRANSACTIONS.filter(t => !t.isPublic).length} private transactions secured by ZKP — only you can reveal them.
          </p>
        )}
      </div>

      {/* ── WEB OF TRUST ── */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24 }}>
        <SectionTitle icon={Network}>Web of Trust</SectionTitle>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
          Direct and indirect connections verified on-chain via Ethereum Attestation Service (EAS).
          Transactions marked as <Lock size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> ZKP only reveal that the transaction existed, without details.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TRUST_NETWORK.map(person => {
            const repColor = person.rep >= 95 ? '#B4F44A' : person.rep >= 85 ? '#38BDF8' : '#F59E0B';
            return (
              <div key={person.id} style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${person.mutual ? 'rgba(56,189,248,0.2)' : 'var(--border-color)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users size={18} style={{ color: '#38BDF8' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{person.name}</span>
                      {person.mutual
                        ? <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38BDF8' }}>Direct</span>
                        : <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)', color: '#818CF8' }}>2nd degree</span>}
                      <span style={{ fontSize: 12, fontWeight: 700, color: repColor, marginLeft: 'auto' }}>Rep {person.rep}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{person.ens}</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10 }}>{person.note}</p>
                {person.sharedWith.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ChevronRight size={12} style={{ color: '#818CF8' }} />
                    <span style={{ fontSize: 12, color: '#818CF8' }}>
                      Via: {person.sharedWith.join(', ')} — {person.txCount === 0 ? 'indirect connection' : `${person.txCount} tx confirmed`}
                    </span>
                  </div>
                )}
                {person.mutual && person.txCount > 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    <ShieldCheck size={12} style={{ color: '#B4F44A' }} />
                    {person.txCount} transactions with on-chain attestation
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="glass-panel" style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(129,140,248,0.04)', borderColor: 'rgba(129,140,248,0.2)' }}>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <Lock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5, color: '#818CF8' }} />
            <strong style={{ color: 'var(--text-primary)' }}>Privacy in the Web of Trust:</strong> Public transactions appear with full details on the graph. Private transactions use ZKP — they prove the transaction occurred and was honored, but amounts and details remain encrypted. You control what is visible.
          </p>
        </div>
      </div>

      {/* ── PASSPORT CARD ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        <div className="glass-panel profile-card">
          <Globe size={22} style={{ color: '#38BDF8', marginBottom: 8 }} />
          <h4>Ipê Passport</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4, lineHeight: 1.6 }}>
            Decentralized identity issued by the Ipê Hub. Links your ENS to your on-chain reputation and is portable to any city in the protocol.
          </p>
          <a href="https://app.ipe.city/profile" target="_blank" rel="noreferrer" className="btn-primary" style={{ marginTop: 16, textDecoration: 'none' }}>
            View in Ipê Hub
          </a>
        </div>
        <div className="glass-panel profile-card">
          <ShieldCheck size={22} style={{ color: '#B4F44A', marginBottom: 8 }} />
          <h4>ZKP Privacy</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4, lineHeight: 1.6 }}>
            All private transactions are secured by Zero-Knowledge Proofs. Your personal agent never exposes your data to Core without your consent.
          </p>
          <span style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, color: '#B4F44A', border: '1px solid rgba(180,244,74,0.3)', background: 'rgba(180,244,74,0.08)', padding: '5px 12px', borderRadius: 100, fontSize: 13 }}>
            <ShieldCheck size={13} /> Active &amp; Healthy
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
