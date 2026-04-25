import React, { useState } from 'react';
import { CreditCard, Bitcoin, Wallet, Link, Check } from 'lucide-react';

const FIAT = [
  { id: 'pix', label: 'PIX', desc: 'Transferência instantânea BR', color: '#00B894' },
  { id: 'card', label: 'Credit / Debit', desc: 'Visa, Mastercard, Elo', color: '#38BDF8' },
];
const CRYPTO = [
  { id: 'metamask', label: 'MetaMask', desc: 'Browser wallet', color: '#F6851B' },
  { id: 'walletconnect', label: 'WalletConnect', desc: 'Any mobile wallet', color: '#3B99FC' },
  { id: 'coinbase', label: 'Coinbase Wallet', desc: 'Coinbase ecosystem', color: '#0052FF' },
];

const WalletPage = () => {
  const [connected, setConnected] = useState({});

  const toggle = (id) => setConnected(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="inner-page container">
      <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>
        <span className="text-gradient-cyan">Wallet</span> Hub
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Connect payment methods — fiat or crypto.</p>

      <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', letterSpacing: '1px', marginBottom: '12px' }}>FIAT PAYMENTS</h4>
      <div className="wallet-grid">
        {FIAT.map(w => (
          <div key={w.id} className="glass-panel wallet-card">
            <div className="wallet-icon" style={{ background: `${w.color}22`, color: w.color }}>
              <CreditCard size={24} />
            </div>
            <div className="wallet-info">
              <h4>{w.label}</h4>
              <p>{w.desc}</p>
            </div>
            <button
              className={connected[w.id] ? 'btn-connected' : 'btn-primary'}
              style={{ padding: '8px 16px', fontSize: '14px' }}
              onClick={() => toggle(w.id)}
            >
              {connected[w.id] ? <><Check size={14} /> Connected</> : <><Link size={14} /> Connect</>}
            </button>
          </div>
        ))}
      </div>

      <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', letterSpacing: '1px', margin: '28px 0 12px' }}>CRYPTO WALLETS</h4>
      <div className="wallet-grid">
        {CRYPTO.map(w => (
          <div key={w.id} className="glass-panel wallet-card">
            <div className="wallet-icon" style={{ background: `${w.color}22`, color: w.color }}>
              <Bitcoin size={24} />
            </div>
            <div className="wallet-info">
              <h4>{w.label}</h4>
              <p>{w.desc}</p>
            </div>
            <button
              className={connected[w.id] ? 'btn-connected' : 'btn-primary'}
              style={{ padding: '8px 16px', fontSize: '14px' }}
              onClick={() => toggle(w.id)}
            >
              {connected[w.id] ? <><Check size={14} /> Connected</> : <><Link size={14} /> Connect</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WalletPage;
