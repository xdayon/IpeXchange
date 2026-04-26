import React from 'react';

const ListingCard = ({ listing, onXchange }) => {
  const handleAction = () => {
    if (onXchange) onXchange(listing);
  };

  const getActionBtn = () => {
    if (listing.acceptedPayments.includes('free')) {
      return (
        <button className="btn-primary w-full" style={{background: '#F43F5E', color: '#fff'}} onClick={handleAction}>
          Request Aid
        </button>
      );
    }
    if (listing.acceptedPayments.includes('trade') && !listing.acceptedPayments.includes('fiat') && !listing.acceptedPayments.includes('crypto')) {
      return (
        <button className="btn-primary w-full" style={{background: '#A855F7', color: '#fff'}} onClick={handleAction}>
          Negotiate Trade
        </button>
      );
    }
    return (
      <button className="btn-primary w-full xchange-btn" onClick={handleAction}>
        ⚡ Xchange
      </button>
    );
  };

  const getPaymentIcon = (type) => {
    switch(type) {
      case 'fiat': return '💵 Fiat';
      case 'crypto': return '⛓️ Crypto';
      case 'trade': return '🔄 Trade';
      case 'free': return '💖 Free';
      default: return type;
    }
  };

  return (
    <div className="listing-card glass-panel">
      <div className="listing-img" style={{ backgroundImage: `url(${listing.image})` }}>
        <div className="listing-tags">
          <span className="tag glass-panel">{listing.category}</span>
          {!listing.isPublic && <span className="tag glass-panel private-tag">Private</span>}
        </div>
      </div>
      <div className="listing-content">
        <div className="flex-between mb-2">
          <span className="provider">{listing.provider}</span>
          <span className="price text-gradient-lime">{listing.price || 'Free'}</span>
        </div>
        <h4 className="listing-title">{listing.title}</h4>
        <p className="listing-desc">{listing.description}</p>
        
        <div className="listing-footer">
          <div className="payment-tags" style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px'}}>
            {listing.acceptedPayments.map(p => (
              <span key={p} style={{fontSize: '11px', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-secondary)'}}>
                {getPaymentIcon(p)}
              </span>
            ))}
          </div>
          {getActionBtn()}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
