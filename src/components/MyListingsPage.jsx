import React, { useState, useEffect } from 'react';
import {
  Store, Eye, EyeOff, Zap, PauseCircle, PlayCircle,
  CheckCircle2, Plus, Package, Wrench, Gift,
  BarChart3, MessageSquare, ShieldCheck, Edit3,
  Clock, TrendingUp, ArrowLeft
} from 'lucide-react';
import { getMyListings, toggleListingStatus, markListingAsSold } from '../data/xchangeStore';
import { DEMO_LISTINGS } from '../data/demoProfile';

const STATUS_CONFIG = {
  active:  { color: '#22c55e', label: 'Active',  icon: PlayCircle  },
  paused:  { color: '#F59E0B', label: 'Paused',  icon: PauseCircle },
  sold:    { color: '#38BDF8', label: 'Sold',    icon: CheckCircle2 },
};

const TYPE_ICON = { Products: Package, Services: Wrench, Donations: Gift };

const PAYMENT_LABELS = { fiat: '💵 Fiat', crypto: '⛓️ Crypto', trade: '🔄 Trade', free: '💖 Free' };

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatRelative = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

// ─── Empty State ──────────────────────────────────────────
const EmptyListings = () => (
  <div className="mp-empty glass-panel">
    <div className="mp-empty-icon">
      <Store size={40} color="rgba(56,189,248,0.6)" />
    </div>
    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No listings yet</h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
      Create your first listings to offer products, services, or trades to the Ipê City community.
    </p>
    <button className="checkout-cta" style={{ marginTop: 24, maxWidth: 240, background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>
      <Plus size={16} />
      Create Listing
    </button>
  </div>
);

// ─── Listing Card ─────────────────────────────────────────
const MyListingCard = ({ listing, onToggle, onMarkSold }) => {
  const StatusConf = STATUS_CONFIG[listing.status] || STATUS_CONFIG.active;
  const StatusIcon = StatusConf.icon;
  const TypeIcon = TYPE_ICON[listing.category] || Package;
  const isSold = listing.status === 'sold';

  return (
    <div className={`my-listing-card glass-panel ${isSold ? 'sold' : ''}`}>
      {/* Image */}
      <div className="my-listing-img" style={{ backgroundImage: `url(${listing.image})` }}>
        {isSold && (
          <div className="sold-overlay">
            <CheckCircle2 size={28} color="#38BDF8" />
            <span>Sold</span>
          </div>
        )}
        <div className="my-listing-category-badge">
          <TypeIcon size={11} />
          <span>{listing.category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="my-listing-content">
        <div className="my-listing-header">
          <div>
            <h4 className="my-listing-title">{listing.title}</h4>
            <p className="my-listing-price">{listing.price || 'Free'}</p>
          </div>
          <span
            className="my-listing-status-badge"
            style={{ color: StatusConf.color, background: `${StatusConf.color}12`, border: `1px solid ${StatusConf.color}28` }}
          >
            <StatusIcon size={11} />
            {StatusConf.label}
          </span>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
          {listing.description}
        </p>

        {/* Payment tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {listing.acceptedPayments.map(p => (
            <span key={p} className="checkout-pay-tag">{PAYMENT_LABELS[p]}</span>
          ))}
        </div>

        {/* Stats */}
        <div className="my-listing-stats">
          <div className="my-listing-stat">
            <Eye size={13} color="var(--text-secondary)" />
            <span>{listing.views || 0} views</span>
          </div>
          <div className="my-listing-stat">
            <MessageSquare size={13} color="var(--text-secondary)" />
            <span>{listing.inquiries || 0} interested</span>
          </div>
          <div className="my-listing-stat">
            <Clock size={13} color="var(--text-secondary)" />
            <span>{formatRelative(listing.createdAt)}</span>
          </div>
          <div className="my-listing-stat">
            <ShieldCheck size={13} color={listing.isPublic ? '#22c55e' : 'var(--text-secondary)'} />
            <span style={{ color: listing.isPublic ? '#22c55e' : 'var(--text-secondary)' }}>
              {listing.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
        </div>

        {/* Actions */}
        {!isSold && (
          <div className="my-listing-actions">
            <button
              className="my-listing-action-btn"
              onClick={() => onToggle(listing.id)}
              style={{
                color: listing.status === 'active' ? '#F59E0B' : '#22c55e',
                borderColor: listing.status === 'active' ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)',
                background: listing.status === 'active' ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.06)',
              }}
            >
              {listing.status === 'active' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
              {listing.status === 'active' ? 'Pause' : 'Activate'}
            </button>

            {listing.category === 'Products' && (
              <button
                className="my-listing-action-btn"
                onClick={() => onMarkSold(listing.id)}
                style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.06)' }}
              >
                <CheckCircle2 size={14} />
                Mark as sold
              </button>
            )}

            <button className="my-listing-action-btn edit">
              <Edit3 size={14} />
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Stats Header ─────────────────────────────────────────
const ListingsStats = ({ listings }) => {
  const active = listings.filter(l => l.status === 'active').length;
  const paused = listings.filter(l => l.status === 'paused').length;
  const sold   = listings.filter(l => l.status === 'sold').length;
  const views  = listings.reduce((acc, l) => acc + (l.views || 0), 0);

  return (
    <div className="mp-stats-bar">
      {[
        { label: 'Active listings', value: active, color: '#22c55e' },
        { label: 'Paused',          value: paused, color: '#F59E0B' },
        { label: 'Sold',            value: sold,   color: '#38BDF8' },
        { label: 'Total views',     value: views,  color: '#818CF8' },
      ].map(s => (
        <div key={s.label} className="glass-panel mp-stat-card">
          <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Filter Tabs ──────────────────────────────────────────
const FILTERS = [
  { id: 'all',    label: 'All'    },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'sold',   label: 'Sold'   },
];

// ─── Main Component ───────────────────────────────────────
const MyListingsPage = ({ onNavigate, onBack }) => {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const isDemo = !!localStorage.getItem('ipeXchange_demoSession');
    setListings(isDemo ? DEMO_LISTINGS : getMyListings());
  }, []);

  const filtered = filter === 'all'
    ? listings
    : listings.filter(l => l.status === filter);

  const handleToggle = (id) => {
    const updated = toggleListingStatus(id);
    setListings(updated);
  };

  const handleMarkSold = (id) => {
    const updated = markListingAsSold(id);
    setListings(updated);
  };

  return (
    <div className="inner-page container">
      {/* Back Button */}
      <button className="checkout-back-btn" onClick={onBack} style={{ marginBottom: 24 }}>
        <ArrowLeft size={18} />
        Back to Wallet
      </button>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 28, marginBottom: 6 }}>
              My <span className="text-gradient-cyan">Listings</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
              Manage everything you offer on the Xchange network — products, services, and trades.
            </p>
          </div>
          <button className="checkout-cta" style={{ maxWidth: 200, background: 'linear-gradient(135deg, #38BDF8, #818CF8)', fontSize: 14, padding: '12px 20px' }}>
            <Plus size={16} />
            New Listing
          </button>
        </div>

        {listings.length > 0 && <ListingsStats listings={listings} />}

        <div className="filter-chips" style={{ marginTop: 20 }}>
          {FILTERS.map(f => (
            <button key={f.id} className={`filter-chip ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {listings.length === 0 ? (
        <EmptyListings />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <Store size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>No listings with this status.</p>
        </div>
      ) : (
        <div className="my-listings-grid">
          {filtered.map(l => (
            <MyListingCard
              key={l.id}
              listing={l}
              onToggle={handleToggle}
              onMarkSold={handleMarkSold}
            />
          ))}
        </div>
      )}

      {/* Performance tip */}
      {listings.length > 0 && (
        <div className="glass-panel" style={{ marginTop: 32, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid #38BDF8' }}>
          <TrendingUp size={22} color="#38BDF8" />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600 }}>Core Tip</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              Listings with quality photos and crypto acceptance get <strong style={{ color: '#B4F44A' }}>3.2× more</strong> views in the network. Update your listings to maximize reach.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListingsPage;
