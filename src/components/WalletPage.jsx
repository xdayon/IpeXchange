import React, { useState, useEffect } from 'react';
import { CreditCard, Bitcoin, Wallet, Link, Check, ShoppingBag, Store, ChevronRight, ShieldCheck, Trash2, Zap } from 'lucide-react';
import { getPurchases, getMyListings } from '../data/xchangeStore';
import { DEMO_PURCHASES, DEMO_LISTINGS } from '../data/demoProfile';
import WalletConnectModal from './WalletConnectModal';

const METHODS = [
  { id: 'pix',           group: 'fiat',   label: 'PIX',            desc: 'Instant BR transfer',           color: '#00B894', emoji: '💸' },
  { id: 'card',          group: 'fiat',   label: 'Credit/Debit Card', desc: 'Visa, Mastercard, Elo',         color: '#38BDF8', emoji: '💳' },
  { id: 'raycash',       group: 'crypto', label: 'Raycash',        desc: 'Stablecoin payments',           color: '#10B981', emoji: '💵' },
  { id: 'metamask',      group: 'crypto', label: 'MetaMask',        desc: 'Browser wallet',               color: '#F6851B', emoji: '🦊' },
  { id: 'walletconnect', group: 'crypto', label: 'WalletConnect',   desc: 'Any mobile wallet',            color: '#3B99FC', emoji: '📱' },
  { id: 'coinbase',      group: 'crypto', label: 'Coinbase Wallet', desc: 'Coinbase ecosystem',            color: '#0052FF', emoji: '🔵' },
  { id: 'tangem',        group: 'crypto', label: 'Tangem',          desc: 'Hardware Wallet NFC',          color: '#94A3B8', emoji: '🪪' },
  { id: 'yodl',          group: 'crypto', label: 'Yodl',            desc: 'Crypto Payments Gateway',      color: '#818CF8', emoji: '🪙' },
];

const MethodCard = ({ method, connected, onConnect, onDisconnect }) => {
  const c = method.color;
  return (
    <div className={`wm-card glass-panel ${connected ? 'connected' : ''}`} style={{ borderColor: connected ? `${c}40` : undefined }}>
      <div className="wm-card-icon" style={{ background: `${c}15`, border: `1px solid ${c}25` }}>
        <span style={{ fontSize: 22 }}>{method.emoji}</span>
      </div>
      <div className="wm-card-info">
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{method.label}</h4>
        {connected ? (
          <p style={{ fontSize: 12, color: '#22c55e', fontFamily: 'monospace' }}>{connected.sub}</p>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{method.desc}</p>
        )}
      </div>
      {connected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', padding: '4px 10px', borderRadius: 100 }}>
            <Check size={11} /> Connected
          </span>
          <button onClick={() => onDisconnect(method.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }} title="Disconnect">
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => onConnect(method.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 100, border: `1px solid ${c}50`, background: `${c}10`, color: c, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = `${c}22`}
          onMouseLeave={e => e.currentTarget.style.background = `${c}10`}
        >
          <Link size={13} /> Connect
        </button>
      )}
    </div>
  );
};

const WalletPage = ({ onNavigate }) => {
  const [connected, setConnected] = useState({});
  const [activeModal, setActiveModal] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const isDemo = !!localStorage.getItem('ipeXchange_demoSession');
    setPurchases(isDemo ? DEMO_PURCHASES : getPurchases());
    setListings(isDemo ? DEMO_LISTINGS : getMyListings());
  }, []);

  const handleConnected = (id, info) => setConnected(prev => ({ ...prev, [id]: info }));
  const handleDisconnect = (id) => setConnected(prev => { const n = { ...prev }; delete n[id]; return n; });

  const connectedCount = Object.keys(connected).length;
  const activeListings = listings.filter(l => l.status === 'active').length;

  const fiat   = METHODS.filter(m => m.group === 'fiat');
  const crypto = METHODS.filter(m => m.group === 'crypto');

  return (
    <div className="inner-page container">
      <h2 style={{ fontSize: 28, marginBottom: 4 }}>
        <span className="text-gradient-cyan">Wallet</span> Hub
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Manage payments, wallets, and your Xchange activity.</p>

      {/* Rep summary */}
      <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14, borderLeft: '3px solid #F59E0B' }}>
        <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>$</span>
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 13, color: 'var(--text-secondary)' }}>$IPE Balance</h4>
          <p style={{ color: '#F59E0B', fontSize: 18, fontWeight: 800, fontFamily: 'monospace' }}>2,040,000</p>
        </div>
      </div>

      {/* Quick access */}
      <div className="wallet-quick-access" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <button className="wallet-quick-card glass-panel" onClick={() => onNavigate?.('my-purchases')}>
          <div className="wallet-quick-icon" style={{ background: 'rgba(180,244,74,0.12)', border: '1px solid rgba(180,244,74,0.25)' }}>
            <ShoppingBag size={22} color="#B4F44A" />
          </div>
          <div className="wallet-quick-info">
            <h4>My Purchases</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{purchases.length > 0 ? `${purchases.length} transactions` : 'None yet'}</p>
          </div>
          <ChevronRight size={18} color="var(--text-secondary)" />
        </button>
        <button className="wallet-quick-card glass-panel" onClick={() => onNavigate?.('my-listings')}>
          <div className="wallet-quick-icon" style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)' }}>
            <Store size={22} color="#38BDF8" />
          </div>
          <div className="wallet-quick-info">
            <h4>My Listings</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{activeListings > 0 ? `${activeListings} active` : 'None active'}</p>
          </div>
          <ChevronRight size={18} color="var(--text-secondary)" />
        </button>
      </div>

      {/* Connection status bar */}
      {connectedCount > 0 && (
        <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, borderLeft: '3px solid #22c55e' }}>
          <ShieldCheck size={18} color="#22c55e" />
          <p style={{ fontSize: 13, flex: 1 }}>
            <strong>{connectedCount} method{connectedCount>1?'s':''}</strong> connected — ready for Xchange transactions.
          </p>
          <Zap size={16} color="#B4F44A" />
        </div>
      )}

      {/* Rep summary */}
      {purchases.length > 0 && (
        <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14, borderLeft: '3px solid #B4F44A' }}>
          <ShieldCheck size={18} color="#B4F44A" />
          <p style={{ fontSize: 13, flex: 1, color: 'var(--text-secondary)' }}>
            +{purchases.length * 2} pts from {purchases.length} on-chain transaction{purchases.length>1?'s':''}
          </p>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#B4F44A' }}>{95 + purchases.length * 2}</span>
        </div>
      )}

      {/* Fiat */}
      <h4 style={{ color: 'var(--text-secondary)', fontSize: 12, letterSpacing: '1px', fontWeight: 700, marginBottom: 12 }}>FIAT PAYMENTS</h4>
      <div className="wm-grid" style={{ marginBottom: 28 }}>
        {fiat.map(m => <MethodCard key={m.id} method={m} connected={connected[m.id]} onConnect={setActiveModal} onDisconnect={handleDisconnect} />)}
      </div>

      {/* Crypto */}
      <h4 style={{ color: 'var(--text-secondary)', fontSize: 12, letterSpacing: '1px', fontWeight: 700, marginBottom: 12 }}>CRYPTO WALLETS</h4>
      <div className="wm-grid">
        {crypto.map(m => <MethodCard key={m.id} method={m} connected={connected[m.id]} onConnect={setActiveModal} onDisconnect={handleDisconnect} />)}
      </div>

      {/* Modal */}
      {activeModal && (
        <WalletConnectModal
          methodId={activeModal}
          onClose={() => setActiveModal(null)}
          onConnected={handleConnected}
        />
      )}
    </div>
  );
};

export default WalletPage;
