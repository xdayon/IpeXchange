// ── MarketplaceGrid — página principal do marketplace ───────────
import React, { useState } from 'react';
import { RefreshCw, Activity, Plus } from 'lucide-react';
import ListingCard from './ListingCard.jsx';
import MarketplaceFilters from './MarketplaceFilters.jsx';
import { useListings } from './useListings.js';

export default function MarketplaceGrid({ onSelectListing, onNavigate, isTMA = false }) {
  const [category, setCategory]       = useState('All');
  const [subcategory, setSubcategory] = useState(null);
  const { listings, trending, loading, error, refresh } = useListings(category, subcategory);

  const safe = listings.filter(l => l?.id && l?.title);

  return (
    <div style={{ padding: '28px 0 40px' }} className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            Discover <span className="text-gradient-lime">Opportunities</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Listings from your local network · {safe.length} available
          </p>
        </div>
        <button
          id="marketplace-refresh-btn"
          onClick={() => refresh()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 8 }}
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Filters */}
      <MarketplaceFilters
        category={category} subcategory={subcategory}
        onCategory={setCategory} onSubcategory={setSubcategory}
      />

      {/* Error */}
      {error && !loading && (
        <div style={{ marginTop: 24, padding: 20, background: 'rgba(244,63,94,0.08)',
          border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius-md)',
          color: '#F43F5E', textAlign: 'center' }}>
          {error}
          <button onClick={() => refresh()} style={{ display: 'block', margin: '12px auto 0',
            background: 'none', border: '1px solid #F43F5E', borderRadius: 8,
            color: '#F43F5E', padding: '6px 16px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && safe.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
          <Activity size={28} className="pulse" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--accent-lime)' }} />
          <p>Syncing with the Ipê network...</p>
        </div>
      )}

      {/* Trending */}
      {!loading && trending.length > 0 && category === 'All' && (
        <div style={{ marginTop: 32, marginBottom: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔥 <span>Trending</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>AI-detected high demand</span>
          </h2>
          <div className="listings-grid">
            {trending.map(l => (
              <div key={`trend-${l.id}`} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: -10, right: 10, zIndex: 10,
                  background: 'linear-gradient(90deg, #B4F44A, #38BDF8)', color: '#000',
                  fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 100 }}>
                  ✨ {l.trendCount} searches today
                </div>
                <ListingCard listing={l} onClick={onSelectListing} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main grid */}
      {!loading && safe.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>
            {category === 'All' ? 'All Listings' : `${category}${subcategory ? ` · ${subcategory}` : ''}`}
          </h2>
          <div className="listings-grid">
            {safe.map(l => <ListingCard key={l.id} listing={l} onClick={onSelectListing} />)}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && safe.length === 0 && !error && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <Activity size={40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ marginBottom: 8 }}>No listings in this category.</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Be the first! Publish and let the network discover it. 🌿
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              id="discover-create-cta"
              onClick={() => onNavigate('create')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 22px', borderRadius: 'var(--radius-full)', border: 'none',
                background: 'linear-gradient(135deg, #B4F44A, #38BDF8)',
                color: '#080C14', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              <Plus size={16} /> Create listing
            </button>
            <button onClick={() => { setCategory('All'); setSubcategory(null); }}
              style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)',
                color: 'var(--text-secondary)', padding: '12px 22px', cursor: 'pointer',
                fontWeight: 500, fontFamily: 'var(--font-sans)', fontSize: 14 }}>
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* FAB — only in TMA (no bottom nav available there) */}
      {isTMA && (
        <button
          id="marketplace-fab-create"
          onClick={() => { window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'); onNavigate('create'); }}
          title="Create listing"
          style={{
            position: 'fixed',
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            right: 20,
            zIndex: 200,
            width: 60, height: 60,
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #B4F44A, #38BDF8)',
            boxShadow: '0 4px 28px rgba(180,244,74,0.5), 0 2px 8px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s',
          }}
          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Plus size={28} color="#080C14" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
