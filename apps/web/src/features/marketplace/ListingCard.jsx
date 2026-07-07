// ── ListingCard — card individual de anúncio ────────────────────
import React from 'react';

const PAYMENT_LABELS = {
  fiat:   '💵 Fiat',
  crypto: '⛓ Crypto',
  trade:  '🔄 Trade',
  free:   '💖 Free',
};

const styles = {
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
    display: 'flex', flexDirection: 'column',
  },
  img: {
    width: '100%', height: 180,
    objectFit: 'cover',
    background: 'var(--bg-elevated)',
  },
  body: { padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  provider: { fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 },
  price: { fontSize: 15, fontWeight: 700, color: 'var(--accent-lime)' },
  title: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 },
  desc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  footer: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' },
  tags: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tag: { fontSize: 11, padding: '3px 8px', borderRadius: 'var(--radius-sm)',
    background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' },
  catTag: { fontSize: 11, padding: '3px 8px', borderRadius: 'var(--radius-sm)',
    background: 'rgba(56,189,248,0.1)', color: 'var(--accent-cyan)', fontWeight: 600 },
  btn: {
    width: '100%', padding: '10px', borderRadius: 'var(--radius-md)',
    border: 'none', background: 'var(--accent-lime)', color: '#080C14',
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
    transition: 'opacity 0.15s', fontFamily: 'var(--font-sans)',
  },
  tradeBtn: { background: '#A855F7', color: '#fff' },
  freeBtn:  { background: '#F43F5E', color: '#fff' },
};

export default function ListingCard({ listing, onClick }) {
  if (!listing?.id) return null;

  const isTradeOnly = listing.acceptedPayments?.includes('trade') &&
    !listing.acceptedPayments?.includes('fiat') &&
    !listing.acceptedPayments?.includes('crypto');
  const isFree = listing.acceptedPayments?.includes('free');

  const btnStyle = isFree
    ? { ...styles.btn, ...styles.freeBtn }
    : isTradeOnly
      ? { ...styles.btn, ...styles.tradeBtn }
      : styles.btn;

  const btnLabel = isFree ? 'Request Aid' : isTradeOnly ? '🔄 Negotiate Trade' : '⚡ Xchange';

  return (
    <article
      style={styles.card}
      onClick={() => onClick?.(listing)}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(56,189,248,0.25)';
        e.currentTarget.style.boxShadow = 'var(--shadow-cyan)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <img
        src={listing.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop'}
        alt={listing.title}
        style={styles.img}
        loading="lazy"
        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop'; }}
      />
      <div style={styles.body}>
        <div style={styles.meta}>
          <span style={styles.provider}>{listing.provider || 'Anonymous'}</span>
          <span style={styles.price}>{listing.price || 'Free'}</span>
        </div>
        <h3 style={styles.title}>{listing.title}</h3>
        <p style={styles.desc}>{listing.description}</p>
        <div style={styles.footer}>
          <div style={styles.tags}>
            {listing.category && <span style={styles.catTag}>{listing.category}</span>}
            {(listing.acceptedPayments || []).map(p => (
              <span key={p} style={styles.tag}>{PAYMENT_LABELS[p] || p}</span>
            ))}
          </div>
          <button style={btnStyle} onClick={e => { e.stopPropagation(); onClick?.(listing); }}>
            {btnLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
