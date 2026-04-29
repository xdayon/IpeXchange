import React, { useState, useEffect } from 'react';
import ListingCard from './ListingCard';
import { EyeOff, Activity, RefreshCw } from 'lucide-react';
import { getSoldProductIds } from '../data/xchangeStore';
import { fetchDiscoverItems } from '../lib/api';

const CATEGORIES = ['All', 'Services', 'Products', 'Knowledge', 'Donations', 'Real Estate', 'Vehicles', 'Food & Drink', 'Events', 'Jobs'];

const SUBCATEGORIES = {
  Products:    ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Garden', 'Kitchen', 'Health'],
  Services:    ['Technology', 'Maintenance', 'Health & Wellness', 'Education', 'Creative', 'Legal', 'Transport', 'Beauty'],
  Knowledge:   ['Workshops', 'Courses', 'Mentoring', 'Language', 'Arts', 'Spirituality', 'Science'],
  Donations:   ['Clothes', 'Food', 'Furniture', 'Books', 'Other'],
  'Real Estate': ['For Sale', 'For Rent', 'Short-term', 'Land', 'Commercial'],
  Vehicles:    ['Cars', 'Motorcycles', 'Bikes', 'Boats', 'Electric', 'Parts'],
  'Food & Drink': ['Organic', 'Artisan', 'Subscriptions', 'Ready to Eat', 'Beverages'],
  Events:      ['Concerts', 'Sports', 'Workshops', 'Community', 'Markets'],
  Jobs:        ['Full-time', 'Part-time', 'Freelance', 'Remote', 'Internship'],
};

const DiscoverPage = ({ onNavigate }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSubFilter, setActiveSubFilter] = useState(null);
  const [soldIds, setSoldIds] = useState([]);
  const [showSold, setShowSold] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [listings, setListings] = useState([]);
  const [trending, setTrending] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    setSoldIds(getSoldProductIds());
    loadData({ category: activeFilter, subcategory: activeSubFilter });
  }, [activeFilter, activeSubFilter]);

  // Auto-refresh every 30s (Phase 6.1)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData({ category: activeFilter, subcategory: activeSubFilter, silent: true });
    }, 30000);
    return () => clearInterval(interval);
  }, [activeFilter, activeSubFilter]);

  const loadData = async ({ category, subcategory, silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setFetchError(null);
      const data = await fetchDiscoverItems({ category, subcategory });
      setListings(data.listings || []);
      setTrending(data.trending || []);
    } catch (err) {
      console.error('Discover fetch error:', err);
      setFetchError('Could not reach the marketplace. Try again.');
      setListings([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCategoryChange = (cat) => {
    setActiveFilter(cat);
    setActiveSubFilter(null);
  };

  const handleSubCategoryChange = (sub) => {
    setActiveSubFilter(activeSubFilter === sub ? null : sub);
  };

  // Filter: remove sold unique products unless user opts to show them
  const available = listings.filter(l => {
    const isSoldProduct = l.category === 'Products';
    if (isSoldProduct && soldIds.includes(l.id) && !showSold) return false;
    return true;
  });

  const safeListings = available.filter(l => l && l.id && l.title);

  const hiddenCount = listings.filter(l =>
    l.category === 'Products' && soldIds.includes(l.id)
  ).length;

  const handleXchange = (listing) => {
    if (onNavigate) {
      onNavigate('listing-detail', { listing });
    }
  };

  return (
    <div className="discover-layout container">
      <div className="discover-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>
              Discover <span className="text-gradient-lime">Opportunities</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              Latest offers and demands from your local network
            </p>
          </div>
          <button 
            onClick={() => loadData({ category: activeFilter, subcategory: activeSubFilter })}
            className="btn-icon" 
            style={{ color: 'var(--text-secondary)' }}
            title="Refresh listings"
          >
            <RefreshCw size={18} className={loading ? 'spin-animation' : ''} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowSold(s => !s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                  padding: '7px 14px', borderRadius: 100,
                  border: `1px solid ${showSold ? 'rgba(56,189,248,0.4)' : 'var(--border-color)'}`,
                  color: showSold ? '#38BDF8' : 'var(--text-secondary)',
                  background: showSold ? 'rgba(56,189,248,0.08)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <EyeOff size={13} />
                {showSold ? 'Hide Acquired' : `${hiddenCount} acquired`}
              </button>
            )}
            
            {/* ZKP Shield Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(180, 244, 74, 0.1)', padding: '6px 12px', borderRadius: 100, border: '1px solid rgba(180, 244, 74, 0.2)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#B4F44A', boxShadow: '0 0 8px #B4F44A' }} className="pulse-animation" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#B4F44A' }}>ZKP Shield: ON</span>
            </div>

            <div className="filter-chips">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`filter-chip ${activeFilter === cat ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory Pills */}
          {activeFilter !== 'All' && SUBCATEGORIES[activeFilter] && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {SUBCATEGORIES[activeFilter].map(sub => (
                <button
                  key={sub}
                  onClick={() => handleSubCategoryChange(sub)}
                  style={{
                    flexShrink: 0,
                    fontSize: 12,
                    padding: '6px 14px',
                    borderRadius: 100,
                    background: activeSubFilter === sub ? 'rgba(180,244,74,0.1)' : 'transparent',
                    border: `1px solid ${activeSubFilter === sub ? '#B4F44A' : 'var(--border-color)'}`,
                    color: activeSubFilter === sub ? '#B4F44A' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && listings.length === 0 ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Activity size={24} className="pulse-anim" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--accent-lime)' }} />
          Syncing with the Ipê network...
        </div>
      ) : (
        <>
          {/* Trending Section powered by AI Intents */}
          {trending.length > 0 && activeFilter === 'All' && (
            <div style={{ marginTop: '32px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                <span style={{ fontSize: 20 }}>🔥</span>
                <h3 style={{ fontSize: '18px', margin: 0 }}>Trending (AI-detected high demand)</h3>
              </div>
              <div className="listings-grid">
                {trending.map((listing) => (
                  <div key={`trend-${listing.id}`} style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute', top: -10, right: 10, zIndex: 10,
                      background: 'linear-gradient(90deg, #B4F44A, #38BDF8)',
                      color: '#000', fontSize: 11, fontWeight: 800, padding: '4px 12px',
                      borderRadius: 100, boxShadow: '0 4px 12px rgba(180, 244, 74, 0.3)'
                    }}>
                      ✨ High Demand ({listing.trendCount} searches today)
                    </div>
                    <ListingCard listing={listing} onXchange={handleXchange} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {fetchError && (
            <div style={{ padding: '24px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 12, marginBottom: 24, textAlign: 'center' }}>
              <p style={{ color: '#F43F5E', fontWeight: 600 }}>{fetchError}</p>
              <button onClick={() => loadData({ category: activeFilter, subcategory: activeSubFilter })} className="btn-secondary" style={{ marginTop: 12 }}>
                Try Again
              </button>
            </div>
          )}

          {/* Regular Grid */}
          <div style={{ marginTop: trending.length > 0 && activeFilter === 'All' ? '16px' : '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--text-secondary)' }}>
                {activeFilter === 'All' ? 'All Listings' : `${activeFilter}${activeSubFilter ? ` · ${activeSubFilter}` : ''}`}
              </h3>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{safeListings.length} found</span>
            </div>
            
            {safeListings.length > 0 ? (
              <div className="listings-grid">
                {safeListings.map(listing => {
                  const isSold = soldIds.includes(listing.id);
                  return (
                    <div key={listing.id} style={{ position: 'relative', opacity: isSold ? 0.55 : 1, transition: 'opacity 0.3s' }}>
                      {isSold && (
                        <div style={{
                          position: 'absolute', top: 10, right: 10, zIndex: 10,
                          background: 'rgba(56,189,248,0.9)', color: '#000',
                          fontSize: 11, fontWeight: 800, padding: '3px 10px',
                          borderRadius: 100, letterSpacing: 0.5
                        }}>
                          ✓ Acquired
                        </div>
                      )}
                      <ListingCard listing={listing} onXchange={!isSold ? handleXchange : undefined} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: 20 }}>
                <Activity size={40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                <p>{fetchError ? 'Unable to load listings' : 'No listings found in this category.'}</p>
                <button 
                  onClick={() => handleCategoryChange('All')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-lime)', marginTop: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DiscoverPage;
