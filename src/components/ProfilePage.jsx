import React, { useState, useEffect } from 'react';
import {
  Fingerprint, ShieldCheck, Globe, Copy, LogOut, TrendingUp,
  Users, Lock, Eye, EyeOff, Star, ArrowUpRight, ArrowDownLeft,
  Zap, Search, ChevronRight, Award, Network, Loader2, Sparkles,
  Package, ShoppingBag
} from 'lucide-react';
import { useUser } from '../lib/UserContext';
import { fetchUserTransactions } from '../lib/api';

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const RepRing = ({ score }) => {
  const r = 54; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#B4F44A' : score >= 50 ? '#38BDF8' : score > 0 ? '#F59E0B' : 'rgba(255,255,255,0.1)';
  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: score > 0 ? `drop-shadow(0 0 8px ${color})` : 'none', transition: 'stroke-dasharray 1s ease' }} />
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

// ─── NEW USER EMPTY STATE ─────────────────────────────────────────────────────

const EmptyReputation = () => (
  <div style={{
    textAlign: 'center', padding: '32px 20px',
    background: 'rgba(180,244,74,0.03)',
    border: '1px dashed rgba(180,244,74,0.2)',
    borderRadius: 16,
  }}>
    <Sparkles size={36} style={{ color: '#B4F44A', margin: '0 auto 16px' }} />
    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Build Your On-Chain Reputation</h4>
    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto' }}>
      Every trade, purchase and listing you complete in the city earns you reputation points.
      Start exploring the Discover page to make your first Xchange!
    </p>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
      {[
        { icon: ShoppingBag, text: 'Buy or trade an item', pts: '+2 pts' },
        { icon: Package,     text: 'Publish a listing',   pts: '+1 pt'  },
        { icon: Users,       text: 'Get rated 5 stars',   pts: '+5 pts' },
      ].map(item => (
        <div key={item.text} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          padding: '12px 16px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
          minWidth: 110,
        }}>
          <item.icon size={20} style={{ color: '#B4F44A' }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>{item.text}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#B4F44A' }}>{item.pts}</span>
        </div>
      ))}
    </div>
  </div>
);

const EmptyTransactions = () => (
  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
    <TrendingUp size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
    <p style={{ fontSize: 14 }}>No transactions yet.</p>
    <p style={{ fontSize: 12, marginTop: 4 }}>Complete your first Xchange to see your history here.</p>
  </div>
);

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { xchangeUser, walletAddress, shortWallet, displayName, email, loading, logout } = useUser();
  const [txShowPrivate, setTxShowPrivate] = useState(false);
  const [transactions, setTransactions]   = useState([]);
  const [txLoading, setTxLoading]         = useState(false);

  // Fetch real transactions once we have a wallet
  useEffect(() => {
    if (!walletAddress) return;
    setTxLoading(true);
    fetchUserTransactions(walletAddress, 10)
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setTxLoading(false));
  }, [walletAddress]);

  // Copy wallet address to clipboard
  const handleCopy = () => {
    if (walletAddress) navigator.clipboard.writeText(walletAddress).catch(() => {});
  };

  const repScore     = xchangeUser?.rep_score    ?? xchangeUser?.ipe_rep_score ?? 0;
  const totalTx      = xchangeUser?.total_tx     ?? 0;
  const listingCount = xchangeUser?.listing_count ?? 0;
  const repLabel     = repScore >= 80 ? 'Elite' : repScore >= 50 ? 'Trusted' : repScore > 0 ? 'Rising' : 'New Member';

  // For display: wallet or email identifier
  const heroName   = email ? email.split('@')[0] : shortWallet || displayName;
  const fullId     = walletAddress || email || '—';
  const isNewUser  = repScore === 0 && totalTx === 0;

  const visibleTx = txShowPrivate
    ? transactions
    : transactions.filter(t => !t.is_private);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, color: 'var(--text-secondary)' }}>
        <Loader2 size={24} className="spin" style={{ color: '#B4F44A' }} />
        <span>Loading your profile...</span>
      </div>
    );
  }

  return (
    <div className="inner-page container" style={{ maxWidth: 900 }}>

      {/* ── HERO ── */}
      <div className="profile-hero" style={{ alignItems: 'flex-start', marginBottom: 40 }}>
        <div className="profile-avatar" style={{ marginTop: 4 }}>
          <Fingerprint size={56} />
          {repScore > 0 && <div className="passport-badge"><ShieldCheck size={13} /> Verified</div>}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 26, marginBottom: 4 }}>
            {heroName}
            <span className="text-gradient-lime">.ipecity.eth</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 13, marginBottom: 12 }}>
            {fullId}
            {walletAddress && (
              <Copy size={12} onClick={handleCopy}
                style={{ display: 'inline', cursor: 'pointer', marginLeft: 6, verticalAlign: 'middle' }}
                title="Copy address" />
            )}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span className="store-tag onchain-tag">⬡ Ethereum</span>
            {email && (
              <span className="store-tag" style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.06)' }}>
                ✉ Email Verified
              </span>
            )}
            {walletAddress && (
              <span className="store-tag" style={{ color: '#818CF8', borderColor: 'rgba(129,140,248,0.3)', background: 'rgba(129,140,248,0.06)' }}>
                {totalTx} Transactions
              </span>
            )}
            {repScore > 0 && (
              <span className="store-tag" style={{ color: '#F59E0B', borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)' }}>
                Rep {repScore}
              </span>
            )}
          </div>
        </div>
        <button onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 100, border: '1px solid rgba(244,63,94,0.4)', color: '#F43F5E', background: 'rgba(244,63,94,0.05)', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.05)'}>
          <LogOut size={15} /> Disconnect
        </button>
      </div>

      {/* ── REPUTATION ── */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24 }}>
        <SectionTitle icon={Award}>On-Chain Reputation</SectionTitle>

        {isNewUser ? (
          <EmptyReputation />
        ) : (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <RepRing score={repScore} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#B4F44A' }}>{repLabel} Member</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ethereum / EAS</span>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                {[
                  { label: 'Completed Trades', value: Math.min(100, totalTx * 2), color: '#B4F44A' },
                  { label: 'Active Listings',  value: Math.min(100, listingCount * 10), color: '#38BDF8' },
                  { label: 'Community Trust',  value: repScore, color: '#818CF8' },
                ].map(s => (
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
                  {['Ipê City', 'Próspera', 'Zuzalu', 'Cabin'].map(city => (
                    <span key={city} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, border: '1px solid var(--border-color)', color: city === 'Ipê City' ? '#B4F44A' : 'var(--text-secondary)', background: city === 'Ipê City' ? 'rgba(180,244,74,0.06)' : 'transparent' }}>
                      {city === 'Ipê City' ? '● ' : '○ '}{city}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CORE INSIGHTS ── */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24 }}>
        <SectionTitle icon={Zap}>Activity Summary</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            {
              icon: TrendingUp, color: '#B4F44A',
              title: `${totalTx} Xchanges`,
              desc: totalTx === 0 ? 'No transactions yet. Make your first trade!' : `You have completed ${totalTx} transaction${totalTx > 1 ? 's' : ''} on the platform.`,
            },
            {
              icon: Package, color: '#38BDF8',
              title: `${listingCount} Active Listings`,
              desc: listingCount === 0 ? 'You have not listed anything yet. Start selling or trading!' : `You currently have ${listingCount} active listing${listingCount > 1 ? 's' : ''} in the marketplace.`,
            },
            {
              icon: Award, color: '#818CF8',
              title: `Rep Score: ${repScore}`,
              desc: repScore === 0 ? 'Complete trades to earn reputation points and unlock more features.' : `Your reputation grows with every honest trade. Keep going!`,
            },
            {
              icon: Network, color: '#F59E0B',
              title: 'Web of Trust',
              desc: 'Build direct connections with people you trade with to grow your network.',
            },
          ].map(item => (
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

      {/* ── TRANSACTIONS ── */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <SectionTitle icon={TrendingUp}>Latest Transactions</SectionTitle>
          {transactions.length > 0 && (
            <button onClick={() => setTxShowPrivate(!txShowPrivate)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border-color)', borderRadius: 100, padding: '5px 12px', cursor: 'pointer' }}>
              {txShowPrivate ? <Eye size={13} /> : <EyeOff size={13} />}
              {txShowPrivate ? 'Hide private' : 'Show all'}
            </button>
          )}
        </div>

        {txLoading ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Loader2 size={20} className="spin" style={{ color: '#B4F44A', margin: '0 auto' }} />
          </div>
        ) : visibleTx.length === 0 ? (
          <EmptyTransactions />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {visibleTx.map((tx, i) => {
              const isIn   = tx.direction === 'in';
              const label  = tx.listing?.title || tx.trade_description || 'Transaction';
              const amount = tx.amount_fiat  ? `$${tx.amount_fiat}` : tx.is_trade ? 'Trade' : '—';
              const date   = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const counter = tx.counterparty
                ? `${tx.counterparty.slice(0, 8)}...${tx.counterparty.slice(-4)}`
                : 'Anonymous';
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: i < visibleTx.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: isIn ? 'rgba(180,244,74,0.1)' : 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isIn
                      ? <ArrowDownLeft size={16} style={{ color: '#B4F44A' }} />
                      : <ArrowUpRight  size={16} style={{ color: '#F43F5E' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{counter}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: isIn ? '#B4F44A' : 'var(--text-primary)', marginBottom: 2 }}>
                      {isIn ? '+' : '-'}{amount}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PASSPORT CARD ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        <div className="glass-panel profile-card">
          <Globe size={22} style={{ color: '#38BDF8', marginBottom: 8 }} />
          <h4>Ipê Passport</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4, lineHeight: 1.6 }}>
            Decentralized identity issued by the Ipê Hub. Links your wallet to your on-chain reputation and is portable to any city in the protocol.
          </p>
          <a href="https://app.ipe.city/profile" target="_blank" rel="noreferrer" className="btn-primary" style={{ marginTop: 16, textDecoration: 'none' }}>
            View in Ipê Hub
          </a>
        </div>
        <div className="glass-panel profile-card">
          <ShieldCheck size={22} style={{ color: '#B4F44A', marginBottom: 8 }} />
          <h4>ZKP Privacy</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4, lineHeight: 1.6 }}>
            Your private transactions are secured by Zero-Knowledge Proofs. Only you can reveal the details — everything else stays encrypted.
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
