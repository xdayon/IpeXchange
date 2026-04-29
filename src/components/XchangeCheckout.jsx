import React, { useState } from 'react';
import {
  ArrowLeft, ShieldCheck, Lock, Zap, CheckCircle2,
  Copy, QrCode, ArrowRight, Star, Clock, Package,
  CreditCard, Bitcoin, RefreshCw, ChevronRight, Wallet,
  AlertCircle, Sparkles, ExternalLink
} from 'lucide-react';
import { savePurchase } from '../data/xchangeStore';
import { useUser } from '../lib/UserContext';
import { recordTransaction } from '../lib/api';

const PAYMENT_METHODS = [
  {
    id: 'fiat',
    icon: CreditCard,
    label: 'Fiat / PIX',
    sublabel: 'USD · Instant transfer',
    color: '#38BDF8',
    badge: 'Most used',
  },
  {
    id: 'crypto',
    icon: Bitcoin,
    label: 'Crypto · USDC',
    sublabel: 'On-chain · ZKP Privacy',
    color: '#B4F44A',
    badge: 'No bank fees',
  },
  {
    id: 'trade',
    icon: RefreshCw,
    label: 'Trade / Barter',
    sublabel: 'Negotiate with Core as mediator',
    color: '#A855F7',
    badge: 'Community',
  },
];

const MOCK_TX_HASH = '0x7f3a...d8c2';
const MOCK_CONTRACT = '0x4E2b...A19f';
const XCHANGE_FEE_PERCENT = 0.5;

// --- Step 1: Item Overview ---
const StepOverview = ({ listing, onNext }) => {
  const repScore = 94;
  const txCount = 47;

  return (
    <div className="checkout-step">
      {/* Item Hero */}
      <div className="checkout-item-hero glass-panel">
        <div
          className="checkout-item-img"
          style={{ backgroundImage: `url(${listing.image})` }}
        >
          <div className="checkout-item-overlay" />
          <div className="checkout-item-badges">
            <span className="checkout-badge-type">{listing.category}</span>
            {listing.acceptedPayments.includes('trade') && (
              <span className="checkout-badge-trade">🔄 Trade accepted</span>
            )}
          </div>
        </div>
        <div className="checkout-item-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p className="checkout-provider">{listing.provider}</p>
              <h2 className="checkout-title">{listing.title}</h2>
            </div>
            <div className="checkout-price-badge">
              <span className="checkout-price">{listing.price || 'Free'}</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            {listing.description}
          </p>

          {/* Seller Reputation */}
          <div className="checkout-rep-bar">
            <div className="checkout-rep-row">
              <ShieldCheck size={15} color="#B4F44A" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#B4F44A' }}>Rep Score {repScore}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 4 }}>{txCount} on-chain transactions</span>
            </div>
            <div className="checkout-rep-track">
              <div className="checkout-rep-fill" style={{ width: `${repScore}%` }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {listing.acceptedPayments.map(p => (
                <span key={p} className="checkout-pay-tag">
                  {p === 'fiat' ? '💵 Fiat' : p === 'crypto' ? '⛓️ Crypto' : p === 'trade' ? '🔄 Trade' : '💖 Free'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security row */}
      <div className="checkout-security-row">
        {[
          { icon: ShieldCheck, color: '#B4F44A', text: 'ZKP Privacy Active' },
          { icon: Lock, color: '#38BDF8', text: 'On-Chain Escrow' },
          { icon: Zap, color: '#818CF8', text: 'Smart Contract' },
        ].map(({ icon: Icon, color, text }) => (
          <div key={text} className="checkout-sec-item">
            <Icon size={14} color={color} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{text}</span>
          </div>
        ))}
      </div>

      <button className="checkout-cta" onClick={onNext}>
        <Zap size={18} />
        Continue to Payment
        <ArrowRight size={18} />
      </button>
    </div>
  );
};

// --- Step 2: Payment ---
const StepPayment = ({ listing, onNext }) => {
  const [selected, setSelected] = useState('fiat');
  const [tradeOffer, setTradeOffer] = useState('');

  const rawPrice = listing.price ? parseFloat(listing.price.replace(/[^\d.]/g, '')) || 0 : 0;
  const fee = rawPrice * 0.01;
  const total = rawPrice + fee;

  return (
    <div className="checkout-step">
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Choose payment method</h3>

      <div className="checkout-payment-options">
        {PAYMENT_METHODS.filter(m => {
          if (m.id === 'fiat' && !listing.acceptedPayments.includes('fiat')) return false;
          if (m.id === 'crypto' && !listing.acceptedPayments.includes('crypto')) return false;
          if (m.id === 'trade' && !listing.acceptedPayments.includes('trade')) return false;
          return true;
        }).map(method => {
          const Icon = method.icon;
          const isSelected = selected === method.id;
          return (
            <button
              key={method.id}
              className={`checkout-pay-option ${isSelected ? 'selected' : ''}`}
              style={{ '--method-color': method.color }}
              onClick={() => setSelected(method.id)}
            >
              <div className="pay-opt-icon" style={{ background: `${method.color}18`, border: `1px solid ${method.color}30` }}>
                <Icon size={20} color={method.color} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{method.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{method.sublabel}</p>
              </div>
              <span className="pay-opt-badge" style={{ color: method.color, background: `${method.color}15`, border: `1px solid ${method.color}25` }}>
                {method.badge}
              </span>
              <div className={`pay-opt-radio ${isSelected ? 'active' : ''}`} style={{ '--c': method.color }} />
            </button>
          );
        })}
      </div>

      {/* Crypto detail */}
      {selected === 'crypto' && (
        <div className="checkout-crypto-box glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>USDC Address (Base / Polygon)</p>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent-lime)' }}>
              <Copy size={12} /> Copy
            </button>
          </div>
          <div className="checkout-address-box">
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--accent-lime)' }}>
              0x3f9C…7B2aD
            </span>
          </div>
          <div className="checkout-qr-placeholder">
            <QrCode size={56} color="rgba(180,244,74,0.6)" />
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>QR Code generated via ZKP — disposable address</p>
          </div>
        </div>
      )}

      {/* Trade detail */}
      {selected === 'trade' && (
        <div className="checkout-trade-box glass-panel">
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>What do you offer in exchange?</p>
          <textarea
            className="checkout-trade-input"
            placeholder="E.g.: 4 hours of graphic design, 3kg of artisan coffee, English lesson..."
            value={tradeOffer}
            onChange={e => setTradeOffer(e.target.value)}
            rows={3}
          />
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
            Core will analyze the proposal and mediate negotiation between parties with ZKP.
          </p>
        </div>
      )}

      {/* Price breakdown */}
      {rawPrice > 0 && selected !== 'trade' && (
        <div className="checkout-price-breakdown glass-panel">
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Transaction Summary</h4>
          <div className="breakdown-row">
            <span>Item value</span>
            <span>{listing.price}</span>
          </div>
          <div className="breakdown-row">
            <span style={{ color: 'var(--accent-lime)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={14} /> IpêDAORail (DAO Treasury - 1%)
            </span>
            <span style={{ color: 'var(--accent-lime)' }}>
              {rawPrice > 0 ? `$ ${fee.toFixed(2)}` : '—'}
            </span>
          </div>
          <div className="breakdown-divider" />
          <div className="breakdown-row total">
            <span>Total</span>
            <span className="breakdown-total-value">
              {rawPrice > 0 ? `$ ${total.toFixed(2)}` : listing.price}
            </span>
          </div>
        </div>
      )}

      <button className="checkout-cta" onClick={() => onNext(selected)}>
        <Lock size={16} />
        Confirm Method · {selected === 'fiat' ? 'USD / Card' : selected === 'crypto' ? 'USDC On-Chain' : 'Trade / Barter'}
        <ArrowRight size={18} />
      </button>
    </div>
  );
};

// --- Step 3: Confirm ---
const StepConfirm = ({ listing, paymentMethod, onConfirm }) => {
  const { walletAddress, refreshProfile } = useUser();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('0x7f3a...d8c2');

  const handleConfirm = async () => {
    setLoading(true);
    
    // Simulate smart contract delay
    await new Promise(r => setTimeout(r, 2200));
    
    // Persist purchase to localStorage (legacy)
    const entry = savePurchase({ listing, paymentMethod });
    
    // Persist to Supabase backend
    if (walletAddress) {
      const rawPrice = listing.price ? parseFloat(listing.price.replace(/[^\d.]/g, '')) || 0 : 0;
      await recordTransaction({
        listingId: listing.id,
        buyerWallet: walletAddress,
        sellerWallet: listing.wallet_address || null,
        amountFiat: rawPrice,
        currency: 'USD',
        isTrade: paymentMethod === 'trade',
        tradeDescription: paymentMethod === 'trade' ? 'Barter negotiation' : null,
      });
      await refreshProfile(); // update user rep score and stats
    }
    
    setTxHash(entry.txHash);
    setConfirmed(true);
    setLoading(false);
  };

  if (confirmed) {
    return (
      <div className="checkout-success">
        <div className="success-glow-ring" />
        <div className="success-icon-wrap">
          <CheckCircle2 size={52} color="#B4F44A" />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginTop: 24, marginBottom: 8 }}>
          Xchange <span className="text-gradient-lime">Completed!</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 28 }}>
          Your transaction was recorded on-chain with ZKP privacy.
        </p>

        <div className="success-tx-card glass-panel">
          <div className="success-tx-row">
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>TX Hash</span>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#B4F44A', display: 'flex', alignItems: 'center', gap: 6 }}>
              {txHash} <ExternalLink size={12} />
            </span>
          </div>
          <div className="success-tx-row">
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Item</span>
            <span style={{ fontSize: 13 }}>{listing.title}</span>
          </div>
          <div className="success-tx-row">
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Payment</span>
            <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{paymentMethod}</span>
          </div>
          <div className="success-tx-row">
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Status</span>
            <span style={{ fontSize: 13, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={13} /> Confirmed on-chain
            </span>
          </div>
        </div>

        <div className="success-rep-boost glass-panel" style={{ marginTop: 16 }}>
          <Sparkles size={16} color="#B4F44A" />
          <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>
            +2 **Reputation Score** points added to your profile!
          </p>
        </div>

        <button className="checkout-cta" style={{ marginTop: 24 }} onClick={onConfirm}>
          Back to Discover
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-step">
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Confirm Xchange</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Review details before finishing. The transaction will be recorded on-chain.
      </p>

      {/* Confirm Summary */}
      <div className="checkout-confirm-summary glass-panel">
        <div className="confirm-item-row">
          <div className="confirm-item-img" style={{ backgroundImage: `url(${listing.image})` }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 15 }}>{listing.title}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{listing.provider}</p>
            <p style={{ color: '#B4F44A', fontWeight: 700, fontSize: 16, marginTop: 4 }}>{listing.price || 'Free'}</p>
          </div>
        </div>
        <div className="breakdown-divider" style={{ margin: '16px 0' }} />
        <div className="breakdown-row">
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Method</span>
          <span style={{ fontSize: 13, textTransform: 'capitalize', fontWeight: 600 }}>{paymentMethod}</span>
        </div>
        <div className="breakdown-row" style={{ marginTop: 8 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Smart Contract</span>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#38BDF8' }}>{MOCK_CONTRACT}</span>
        </div>
        <div className="breakdown-row" style={{ marginTop: 8 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Protection</span>
          <span style={{ fontSize: 12, color: '#B4F44A', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={12} /> ZKP Privacy + Escrow
          </span>
        </div>
      </div>

      <div className="checkout-warning">
        <AlertCircle size={14} color="#F59E0B" />
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          This transaction is mediated by a smart contract. Upon confirmation, values are held in escrow until verified delivery.
        </p>
      </div>

      <button className="checkout-cta confirm" onClick={handleConfirm} disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" style={{ width: 18, height: 18 }} />
            Signing transaction...
          </>
        ) : (
          <>
            <Lock size={16} />
            Finalize Xchange
            <ChevronRight size={18} />
          </>
        )}
      </button>
    </div>
  );
};

// --- Main Component ---
const XchangeCheckout = ({ listing, onBack, sourceTab }) => {
  const [step, setStep] = useState(0); // 0: overview, 1: payment, 2: confirm
  const [paymentMethod, setPaymentMethod] = useState('fiat');

  const steps = ['Details', 'Payment', 'Confirm'];

  const handlePaymentNext = (method) => {
    setPaymentMethod(method);
    setStep(2);
  };

  return (
    <div className="checkout-layout container">
      {/* Back + Header */}
      <div className="checkout-header">
        <button className="checkout-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="checkout-steps-indicator">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`step-dot ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`step-line ${i < step ? 'done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Step label */}
      <div className="checkout-step-label">
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Step {step + 1} of {steps.length}
        </p>
        <h3 style={{ fontSize: 22, fontWeight: 800 }}>
          {step === 0 && 'Item Details'}
          {step === 1 && 'Payment Method'}
          {step === 2 && 'Confirmation'}
        </h3>
      </div>

      {/* Steps */}
      {step === 0 && <StepOverview listing={listing} onNext={() => setStep(1)} />}
      {step === 1 && <StepPayment listing={listing} onNext={handlePaymentNext} />}
      {step === 2 && (
        <StepConfirm
          listing={listing}
          paymentMethod={paymentMethod}
          onConfirm={onBack}
        />
      )}
    </div>
  );
};

export default XchangeCheckout;
