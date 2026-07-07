// ── CheckoutModal — confirmação de compra/troca ─────────────────
import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

export default function CheckoutModal({ listing, user, onClose, onConfirm }) {
  const [step, setStep]       = useState('review'); // review | success
  const [loading, setLoading] = useState(false);

  if (!listing) return null;

  const isTrade = listing.acceptedPayments?.includes('trade') &&
    !listing.acceptedPayments?.includes('fiat');

  const handleConfirm = async () => {
    setLoading(true);
    // Privy tx will go here — for now we simulate
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setStep('success');
    onConfirm?.({ listing, user });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{ width: '100%', maxWidth: 500, background: 'var(--bg-elevated)',
        borderRadius: '24px 24px 0 0', padding: '8px 24px 40px',
        border: '1px solid var(--border-color)', borderBottom: 'none' }}>

        {/* Handle */}
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.15)',
          borderRadius: 2, margin: '12px auto 20px' }} />

        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 24,
          background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
          width: 32, height: 32, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          <X size={16} />
        </button>

        {step === 'review' && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>
              {isTrade ? '🔄 Propose Trade' : '⚡ Confirm Xchange'}
            </h2>

            <div style={{ display: 'flex', gap: 14, padding: 16, background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <img src={listing.image} alt={listing.title}
                style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>{listing.title}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>by {listing.provider}</p>
                <p style={{ color: 'var(--accent-lime)', fontWeight: 700, marginTop: 4 }}>
                  {listing.price || 'Free'}
                </p>
              </div>
            </div>

            {/* Wallet placeholder */}
            <div style={{ padding: 14, background: 'rgba(56,189,248,0.06)',
              border: '1px solid rgba(56,189,248,0.15)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>PAYING AS</p>
              <p style={{ fontWeight: 600 }}>{user?.displayName || 'Guest'}</p>
              {user?.source === 'anon' && (
                <p style={{ fontSize: 12, color: 'var(--accent-amber)', marginTop: 6 }}>
                  ⚠️ Connect a wallet to complete payment on-chain.
                </p>
              )}
            </div>

            <button id="checkout-confirm-btn" onClick={handleConfirm} disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', border: 'none',
                background: loading ? 'rgba(180,244,74,0.4)' : 'var(--accent-lime)',
                color: '#080C14', fontWeight: 800, fontSize: 16,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}>
              {loading ? 'Processing...' : isTrade ? 'Send Trade Proposal' : 'Confirm Purchase'}
            </button>
          </>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              {isTrade ? 'Trade Proposed!' : 'Xchange Complete!'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              {isTrade
                ? 'Your trade proposal has been sent. The seller will be notified.'
                : 'Your purchase is confirmed. The seller will be notified via Telegram.'}
            </p>
            <button onClick={onClose}
              style={{ padding: '14px 32px', borderRadius: 'var(--radius-md)', border: 'none',
                background: 'var(--accent-lime)', color: '#080C14', fontWeight: 800,
                cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 15 }}>
              Back to Marketplace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
