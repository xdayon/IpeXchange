import React, { useState, useEffect } from 'react';
import ListingCard from './ListingCard';
import { EyeOff, Activity } from 'lucide-react';
import { getSoldProductIds } from '../data/xchangeStore';
import { fetchDiscoverItems } from '../lib/api';

const CATEGORIES = ['All', 'Services', 'Products', 'Donations', 'Knowledge'];

const DiscoverPage = ({ onNavigate }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [soldIds, setSoldIds] = useState([]);
  const [showSold, setShowSold] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [listings, setListings] = useState([]);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    setSoldIds(getSoldProductIds());
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchDiscoverItems();
    setListings(data.listings || []);
    setTrending(data.trending || []);
    setLoading(false);
  };

  // Filter: remove sold unique products unless user opts to show them
  const available = listings.filter(l => {
    const isSoldProduct = l.type === 'Product' || l.category === 'Products';
    if (isSoldProduct && soldIds.includes(l.id) && !showSold) return false;
    return true;
  });

  const filtered = activeFilter === 'All'
    ? available
    : available.filter(l => l.category === activeFilter);

  const hiddenCount = listings.filter(l =>
    (l.type === 'Product' || l.category === 'Products') && soldIds.includes(l.id)
  ).length;

  const handleXchange = (listing) => {
    if (onNavigate) {
      onNavigate('checkout', { listing, sourceTab: 'discover' });
    }
  };

  return (
    <div className="discover-layout container">
      <div className="discover-header">
        <div>
          <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>
            Discover <span className="text-gradient-lime">Opportunities</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Últimas ofertas e demandas da sua rede local
          </p>
        </div>
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
              {showSold ? 'Ocultar Adquiridos' : `${hiddenCount} adquirido${hiddenCount > 1 ? 's' : ''}`}
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
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Activity size={24} className="pulse-anim" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--accent-lime)' }} />
          Sincronizando com a rede Ipê...
        </div>
      ) : (
        <>
          {/* Trending Section powered by AI Intents */}
          {trending.length > 0 && activeFilter === 'All' && (
            <div style={{ marginTop: '32px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                <span style={{ fontSize: 20 }}>🔥</span>
                <h3 style={{ fontSize: '18px', margin: 0 }}>Trending (IA detectou alta demanda)</h3>
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
                      ✨ Alta Demanda ({listing.trendCount} buscas hoje)
                    </div>
                    <ListingCard listing={listing} onXchange={handleXchange} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Grid */}
          <div style={{ marginTop: trending.length > 0 && activeFilter === 'All' ? '16px' : '32px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Todas as Ofertas</h3>
            <div className="listings-grid">
              {filtered.map(listing => {
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
                        ✓ Adquirido
                      </div>
                    )}
                    <ListingCard listing={listing} onXchange={!isSold ? handleXchange : undefined} />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DiscoverPage;
