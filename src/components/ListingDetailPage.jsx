import React from 'react';
import { 
  ArrowLeft, ShieldCheck, Zap, MapPin, Clock, 
  Package, RefreshCw, Star, Info, Share2, Heart,
  Globe, Briefcase, GraduationCap, HeartHandshake,
  Home, Car, Utensils, Calendar, Users
} from 'lucide-react';

const CATEGORY_ICONS = {
  Products: Package,
  Services: Briefcase,
  Knowledge: GraduationCap,
  Donations: HeartHandshake,
  'Real Estate': Home,
  Vehicles: Car,
  'Food & Drink': Utensils,
  Events: Calendar,
  Jobs: Users
};

const ListingDetailPage = ({ listing, onBack, onXchange }) => {
  if (!listing) return null;

  const CategoryIcon = CATEGORY_ICONS[listing.category] || Package;
  const repScore = 94; // Mocked for demo
  const txCount = 47;  // Mocked for demo

  return (
    <div className="inner-page container" style={{ maxWidth: 900, paddingBottom: 100 }}>
      {/* Header / Back */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={onBack} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100 }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-icon" style={{ color: 'var(--text-secondary)' }}><Share2 size={20} /></button>
          <button className="btn-icon" style={{ color: 'var(--text-secondary)' }}><Heart size={20} /></button>
        </div>
      </div>

      <div className="listing-detail-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 32 }}>
        {/* Main Content */}
        <div className="listing-detail-main">
          {/* Hero Image */}
          <div style={{ width: '100%', height: 450, borderRadius: 24, overflow: 'hidden', marginBottom: 32, position: 'relative', border: '1px solid var(--border-color)' }}>
            <img 
              src={listing.image} 
              alt={listing.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{ position: 'absolute', bottom: 20, left: 20, display: 'flex', gap: 10 }}>
              <span style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)' }}>
                {listing.category}
              </span>
              {listing.subcategory && (
                <span style={{ background: 'rgba(180,244,74,0.2)', backdropFilter: 'blur(8px)', color: '#B4F44A', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(180,244,74,0.3)' }}>
                  {listing.subcategory}
                </span>
              )}
            </div>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>{listing.title}</h1>
          
          <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
              <MapPin size={16} /> {listing.location_label || 'Ipê City'}
            </div>
            {listing.duration_minutes && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
                <Clock size={16} /> {listing.duration_minutes} min
              </div>
            )}
            {listing.is_remote && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-cyan)', fontSize: 14 }}>
                <Globe size={16} /> Remote Available
              </div>
            )}
            {listing.condition && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14, textTransform: 'capitalize' }}>
                <Info size={16} /> {listing.condition.replace('_', ' ')}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Description</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {listing.description}
            </p>
          </div>

          {listing.tags && listing.tags.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Tags</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {listing.tags.map(tag => (
                  <span key={tag} className="store-tag" style={{ fontSize: 13, padding: '6px 14px' }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {listing.trade_wants && (
            <div className="glass-panel" style={{ padding: 24, borderLeft: '4px solid var(--accent-purple)', background: 'rgba(168, 85, 247, 0.03)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#A855F7', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={18} /> Open to Trade
              </h3>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                The provider is looking for: <strong>{listing.trade_wants}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="listing-detail-sidebar">
          <div className="glass-panel" style={{ padding: 28, position: 'sticky', top: 24 }}>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Price</p>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-lime)' }}>{listing.price || 'Free'}</h2>
            </div>

            <div style={{ padding: '20px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${listing.provider}`} alt="avatar" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{listing.provider}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ipê City Citizen</p>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#B4F44A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={14} /> Rep Score {repScore}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{txCount} trades</span>
                </div>
                <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
                  <div style={{ height: '100%', width: `${repScore}%`, background: '#B4F44A', borderRadius: 10 }} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Accepted Payments</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {listing.acceptedPayments.map(p => (
                  <span key={p} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', textTransform: 'capitalize' }}>
                    {p === 'fiat' ? '💵 Fiat' : p === 'crypto' ? '⛓️ Crypto' : p === 'trade' ? '🔄 Trade' : '💖 Free'}
                  </span>
                ))}
              </div>
            </div>

            <button 
              className="checkout-cta" 
              style={{ width: '100%', height: 54, fontSize: 18 }}
              onClick={() => onXchange(listing)}
            >
              <Zap size={20} /> Xchange Now
            </button>
            
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ShieldCheck size={14} /> On-chain escrow active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage;
