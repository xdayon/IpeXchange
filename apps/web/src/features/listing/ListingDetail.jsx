// ── ListingDetail — detalhe de um anúncio ───────────────────────
import React from 'react';
import { ArrowLeft, MapPin, Tag, RefreshCw } from 'lucide-react';

const PAYMENT_LABELS = { fiat: '💵 Cash / Fiat', crypto: '⛓ Crypto', trade: '🔄 Trade', free: '💖 Free' };

export default function ListingDetail({ listing, onBack, onCheckout, user }) {
  if (!listing) return null;

  const isFree      = listing.acceptedPayments?.includes('free');
  const isTradeOnly = listing.acceptedPayments?.includes('trade') &&
    !listing.acceptedPayments?.includes('fiat') && !listing.acceptedPayments?.includes('crypto');

  return (
    <div className="page-enter" style={{ padding: '24px 0 40px' }}>
      {/* Back */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8,
        background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
        marginBottom: 24, fontFamily: 'var(--font-sans)', fontSize: 14 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Image */}
      <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 28 }}>
        <img
          src={listing.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop'}
          alt={listing.title}
          style={{ width: '100%', maxHeight: 380, objectFit: 'cover' }}
        />
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0 24px', alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {listing.category && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px',
                background: 'rgba(56,189,248,0.1)', color: 'var(--accent-cyan)',
                borderRadius: 'var(--radius-full)' }}>
                {listing.category}
              </span>
            )}
            {listing.condition && (
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px',
                background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-full)', textTransform: 'capitalize' }}>
                {listing.condition}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{listing.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>
            Listed by <strong style={{ color: 'var(--text-primary)' }}>{listing.provider || 'Anonymous'}</strong>
          </p>
          {listing.location_label && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} /> {listing.location_label}
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-lime)' }}>
            {listing.price || 'Free'}
          </div>
          {listing.price_eth && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              ≈ {listing.price_eth} ETH
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div style={{ marginTop: 28, padding: 20, background: 'var(--bg-card)',
        border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>DESCRIPTION</h3>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-primary)' }}>{listing.description}</p>
        {listing.trade_wants && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} style={{ color: '#A855F7' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Wants in trade: <strong style={{ color: 'var(--text-primary)' }}>{listing.trade_wants}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Payment methods */}
      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(listing.acceptedPayments || []).map(p => (
          <span key={p} style={{ fontSize: 13, padding: '6px 14px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>
            {PAYMENT_LABELS[p] || p}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
        <button onClick={onBack}
          style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-md)',
            background: 'transparent', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 15 }}>
          ← Back
        </button>
        <button
          id="listing-xchange-btn"
          onClick={() => onCheckout?.(listing)}
          style={{ flex: 2, padding: '14px', borderRadius: 'var(--radius-md)', border: 'none',
            background: isFree ? '#F43F5E' : isTradeOnly ? '#A855F7' : 'var(--accent-lime)',
            color: isFree || isTradeOnly ? '#fff' : '#080C14',
            fontWeight: 800, fontSize: 16, cursor: 'pointer',
            fontFamily: 'var(--font-sans)', transition: 'opacity 0.15s' }}
          onMouseOver={e => e.target.style.opacity = '0.9'}
          onMouseOut={e => e.target.style.opacity = '1'}
        >
          {isFree ? 'Request Aid' : isTradeOnly ? '🔄 Negotiate Trade' : '⚡ Xchange Now'}
        </button>
      </div>
    </div>
  );
}
