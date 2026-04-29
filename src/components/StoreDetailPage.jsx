import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Star, MapPin, ShieldCheck, ExternalLink,
  Fingerprint, Clock, Phone, Globe, Zap, Lock, Users, TrendingUp,
  CheckCircle2, MessageCircle, Share2, Heart, Package, Wrench, RefreshCw, Store
} from 'lucide-react';

let API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
if (API_URL.startsWith('http') && !API_URL.endsWith('/api')) API_URL += '/api';

// ─── Fallback catalogs (used if API is unavailable) ────────
const FALLBACK_CATALOG = {
  'a1000000-0000-0000-0000-000000000001': [
    { id: 'p1', name: 'Classic Sourdough Bread',   type: 'Product', price_fiat: 4,   price: '$4',        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Natural fermentation, 500g. Baked Tuesdays and Fridays.',             payments: ['fiat','crypto','ipe'],       accepts_trade: false },
    { id: 'p2', name: 'Specialty Arabica Coffee',   type: 'Product', price_fiat: 9,   price: '$9',        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=300&h=200', desc: '250g roasted this week, coarse or fine grind.',                      payments: ['fiat','crypto','trade','ipe'], accepts_trade: true  },
    { id: 'p3', name: 'Weekly Organic Basket',      type: 'Service', price_fiat: 25,  price: '$25/week',  image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Weekly delivery of bread + coffee + artisan jams.',                 payments: ['fiat','crypto','ipe'],       accepts_trade: false },
    { id: 'p4', name: 'Baking Workshop',            type: 'Service', price_fiat: 35,  price: '$35/person',image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=300&h=200', desc: '3h practical class with the chef. Groups up to 8 people.',          payments: ['fiat','trade'],             accepts_trade: true  },
  ],
  'a1000000-0000-0000-0000-000000000002': [
    { id: 'p1', name: 'On-Chain Vehicle Diagnostic',type: 'Service', price_fiat: 15,  price: '$15',       image: 'https://images.unsplash.com/photo-1607705703571-c5a8695f18f6?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Full report registered on-chain. Diagnostic NFT included.',          payments: ['fiat','crypto','ipe'],       accepts_trade: false },
    { id: 'p2', name: 'Full Electrical Review',     type: 'Service', price_fiat: 70,  price: '$70',       image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Battery, charger, and electrical systems in EVs.',                  payments: ['fiat','crypto','trade','ipe'], accepts_trade: true  },
    { id: 'p3', name: 'Custom Paint Job',           type: 'Service', price_fiat: 350, price: 'Upon request',image:'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=300&h=200',desc: 'Premium automotive paint, special effects, and wraps.',             payments: ['fiat','trade','ipe'],        accepts_trade: true  },
  ],
  'a1000000-0000-0000-0000-000000000003': [
    { id: 'p1', name: '4K Dolby Session Ticket',    type: 'Product', price_fiat: 8,   price: '$8',        image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=300&h=200', desc: 'NFT ticket for a standard session. Seat reservation included.',     payments: ['fiat','crypto','ipe'],       accepts_trade: false },
    { id: 'p2', name: 'Special Event Ticket',       type: 'Product', price_fiat: 18,  price: '$18',       image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Premieres, festivals, and exclusive events at the cultural hub.',   payments: ['fiat','crypto','trade','ipe'], accepts_trade: true  },
    { id: 'p3', name: 'Private Room (Up to 20)',    type: 'Service', price_fiat: 120, price: '$120/night',image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Rental for private sessions, celebrations, and corporate events.',  payments: ['fiat','crypto','trade','ipe'], accepts_trade: true  },
  ],
};

const DEFAULT_CATALOG = [
  { id: 'd1', name: 'Consultation / Service', type: 'Service', price_fiat: 0, price: 'Contact us', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Get in touch for more information.', payments: ['fiat','ipe'], accepts_trade: false },
  { id: 'd2', name: 'Premium Product',        type: 'Product', price_fiat: 0, price: 'Contact us', image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Exclusive product from this establishment.',  payments: ['fiat','crypto','ipe'], accepts_trade: false },
];

const MOCK_REVIEWS = [
  { user: 'ana.ipecity.eth',   rep: 91, stars: 5, text: 'Impeccable quality! On-chain verified, super smooth process.', date: '3 days ago' },
  { user: 'lucas.ipecity.eth', rep: 88, stars: 5, text: 'Excellent service. Store reputation matches the real experience.', date: '1 week ago' },
  { user: 'carla.ipecity.eth', rep: 94, stars: 4, text: 'Great product, on-time delivery. Missed more payment options.', date: '2 weeks ago' },
];

const PAYMENT_LABELS = { fiat: '💵 Fiat/PIX', crypto: '⛓️ Crypto', trade: '🔄 Trade', ipe: '🌳 $IPE Token', free: '💖 Free' };

// ─── Catalog Card ─────────────────────────────────────────
const CatalogCard = ({ item, onXchange }) => (
  <div className="catalog-card glass-panel">
    <div className="catalog-img" style={{ backgroundImage: `url(${item.image || item.image_url})` }}>
      <span className={`catalog-type-badge ${item.type === 'Product' ? 'product' : 'service'}`}>
        {item.type === 'Product' ? <Package size={10} /> : <Wrench size={10} />}
        {item.type}
      </span>
      {item.accepts_trade && (
        <span style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 10, fontWeight: 700, color: '#38BDF8', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', padding: '2px 7px', borderRadius: 100 }}>
          🔄 Trade OK
        </span>
      )}
    </div>
    <div className="catalog-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <h4 className="catalog-name">{item.name}</h4>
        <span className="catalog-price">{item.price || item.price_label || (item.price_fiat > 0 ? `$${item.price_fiat}` : 'Free')}</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12, flex: 1 }}>{item.desc || item.description}</p>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
        {(item.payments || []).map(p => (
          <span key={p} className="checkout-pay-tag">{PAYMENT_LABELS[p]}</span>
        ))}
      </div>
      <button className="catalog-xchange-btn" onClick={() => onXchange && onXchange(item)}>
        <Zap size={13} /> Xchange
      </button>
    </div>
  </div>
);

// ─── Stats strip ──────────────────────────────────────────
const StoreStats = ({ store }) => (
  <div className="store-detail-stats">
    {[
      { label: 'Rating',    value: `${store.rating}★`,          color: '#F59E0B' },
      { label: 'Reviews',   value: store.review_count || store.reviews, color: '#38BDF8' },
      { label: 'Rep Score', value: store.reputation_score || store.reputationScore, color: (store.reputation_score || store.reputationScore) >= 95 ? '#B4F44A' : '#38BDF8' },
      { label: 'Status',    value: 'Open',                       color: '#22c55e' },
    ].map(s => (
      <div key={s.label} className="glass-panel store-stat-card">
        <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</p>
      </div>
    ))}
  </div>
);

// ─── Main ─────────────────────────────────────────────────
const StoreDetailPage = ({ store, storeId, onBack, onXchange }) => {
  const [resolvedStore, setResolvedStore] = useState(store || null);
  const [activeTab, setActiveTab] = useState('catalog');
  const [liked, setLiked] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Resolve store object if only storeId is provided
  useEffect(() => {
    if (!resolvedStore && storeId) {
      fetch(`${API_URL}/stores`)
        .then(r => r.json())
        .then(data => {
          const found = (data.stores || []).find(s => s.id === storeId);
          if (found) setResolvedStore(found);
        })
        .catch(() => {});
    }
  }, [storeId, resolvedStore]);

  if (!resolvedStore) {
    return (
      <div className="store-detail-layout container flex-center" style={{ minHeight: '60vh' }}>
        <RefreshCw size={32} className="spin-animation" style={{ color: 'var(--accent-cyan)' }} />
      </div>
    );
  }

  const repScore = resolvedStore.reputation_score || resolvedStore.reputationScore || 80;
  const repColor = repScore >= 95 ? '#B4F44A' : repScore >= 85 ? '#38BDF8' : '#F59E0B';
  const reviewCount = resolvedStore.review_count || resolvedStore.reviews || 0;

  // Fetch products from API, fallback to hardcoded
  useEffect(() => {
    if (!resolvedStore.id) return;
    const loadCatalog = async () => {
      try {
        const res = await fetch(`${API_URL}/stores/${resolvedStore.id}/products`);
        if (res.ok) {
          const data = await res.json();
          if (data.products && data.products.length > 0) {
            setCatalog(data.products);
            return;
          }
        }
      } catch (err) {
        console.warn('Store products API unavailable, using fallback');
      }
      // Fallback
      setCatalog(FALLBACK_CATALOG[resolvedStore.id] || DEFAULT_CATALOG);
      setLoadingCatalog(false);
    };
    loadCatalog().finally(() => setLoadingCatalog(false));
  }, [resolvedStore.id]);

  const displayCatalog = catalog || FALLBACK_CATALOG[resolvedStore.id] || DEFAULT_CATALOG;

  const handleItemXchange = (item) => {
    if (onXchange) {
      onXchange({
        id: `${resolvedStore.id}-${item.id}`,
        title: item.name,
        provider: resolvedStore.name,
        type: item.type,
        category: item.type === 'Product' ? 'Products' : 'Services',
        acceptedPayments: item.payments || ['fiat'],
        price: item.price || item.price_label || (item.price_fiat > 0 ? `$${item.price_fiat}` : 'Free'),
        price_fiat: item.price_fiat,
        description: item.desc || item.description,
        image: item.image || item.image_url,
        sourceType: 'store_product',
        storeId: resolvedStore.id,
      });
    }
  };

  // Resolve icon: from icon_key string or icon component
  const IconComponent = resolvedStore.icon || Store;

  return (
    <div className="store-detail-layout container">
      <button className="checkout-back-btn" onClick={onBack} style={{ marginBottom: 24 }}>
        <ArrowLeft size={18} /> Back to Stores
      </button>

      {/* Hero */}
      <div className="store-detail-hero glass-panel">
        <div className="store-hero-banner">
          <div className="store-hero-gradient" />
          <div className="store-hero-content">
            <div className="store-hero-icon" style={{ background: resolvedStore.icon_bg || resolvedStore.iconBg, borderColor: `${resolvedStore.icon_color || resolvedStore.iconColor}40` }}>
              <IconComponent size={36} style={{ color: resolvedStore.icon_color || resolvedStore.iconColor }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800 }}>{resolvedStore.name}</h2>
                {resolvedStore.on_chain && <span style={{ fontSize: 11, fontWeight: 700, color: '#B4F44A', background: 'rgba(180,244,74,0.15)', padding: '3px 9px', borderRadius: 100, border: '1px solid rgba(180,244,74,0.3)' }}>⬡ On-Chain</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#F59E0B' }}>
                  <Star size={13} fill="#F59E0B" /> {resolvedStore.rating} <span style={{ color: 'var(--text-secondary)' }}>({reviewCount})</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: repColor }}>
                  <ShieldCheck size={13} /> Rep {repScore}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <MapPin size={11} /> {resolvedStore.address}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icon" onClick={() => setLiked(l => !l)} style={{ background: liked ? 'rgba(244,63,94,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: liked ? '#F43F5E' : 'var(--text-secondary)', width: 40, height: 40, borderRadius: 10 }}>
                <Heart size={18} fill={liked ? '#F43F5E' : 'none'} />
              </button>
              <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', width: 40, height: 40, borderRadius: 10 }}>
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <StoreStats store={resolvedStore} />
        </div>
      </div>

      {/* Description + tags */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginTop: 16 }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>{resolvedStore.description}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {(resolvedStore.tags || []).map(tag => <span key={tag} className="store-tag">{tag}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <Fingerprint size={13} />
            <span style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{resolvedStore.owner_ens || resolvedStore.owner}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#22c55e' }}>
            <Clock size={13} /> Mon–Sat: 8am–8pm
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Globe size={13} /> Site / Socials
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Phone size={13} /> Contact
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="store-detail-tabs">
        {[
          { id: 'catalog', label: loadingCatalog ? 'Catalog (…)' : `Catalog (${displayCatalog.length})` },
          { id: 'reviews', label: `Reviews (${reviewCount})` },
          { id: 'about',   label: 'About & Security' },
        ].map(t => (
          <button key={t.id} className={`store-detail-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Catalog tab */}
      {activeTab === 'catalog' && (
        loadingCatalog ? (
          <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={20} className="spin-animation" style={{ margin: '0 auto 12px', display: 'block' }} />
            Loading products…
          </div>
        ) : (
          <div className="catalog-grid">
            {displayCatalog.map(item => (
              <CatalogCard key={item.id} item={item} onXchange={handleItemXchange} />
            ))}
          </div>
        )
      )}

      {/* Reviews tab */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <p style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: '#F59E0B' }}>{resolvedStore.rating}</p>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', margin: '6px 0 4px' }}>
                {[1,2,3,4,5].map(i => <Star key={i} size={14} color="#F59E0B" fill={i <= Math.round(resolvedStore.rating) ? '#F59E0B' : 'none'} />)}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{reviewCount} reviews</p>
            </div>
            <div style={{ flex: 1 }}>
              {[5,4,3,2,1].map(n => {
                const pct = n===5?78:n===4?16:n===3?4:n===2?1:1;
                return (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 8 }}>{n}</span>
                    <Star size={10} color="#F59E0B" fill="#F59E0B" />
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#F59E0B', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 26, textAlign: 'right' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          {MOCK_REVIEWS.map((r, i) => (
            <div key={i} className="glass-panel" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #38BDF8, #818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#000' }}>
                    {r.user[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#38BDF8' }}>{r.user}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Rep {r.rep}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(r.stars)].map((_,j) => <Star key={j} size={12} color="#F59E0B" fill="#F59E0B" />)}
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.text}</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>{r.date}</p>
            </div>
          ))}
        </div>
      )}

      {/* About & Security tab */}
      {activeTab === 'about' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={15} color="#B4F44A" /> On-Chain Security & Verification
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { icon: ShieldCheck, color: '#B4F44A', title: 'Ipê Passport / ENS', desc: `Verified owner: ${resolvedStore.owner_ens || resolvedStore.owner}` },
                { icon: Lock,        color: '#38BDF8', title: 'Zodl (ZK Privacy)',   desc: 'All transactions natively shielded by Zodl' },
                { icon: TrendingUp,  color: '#818CF8', title: `Rep Score: ${repScore}`, desc: repScore >= 95 ? 'Elite — Top 5% of Xchange network' : 'Trusted — Verified and reliable' },
                { icon: Users,       color: '#F59E0B', title: `${reviewCount} reviews`, desc: 'All reviews registered on-chain, immutable' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon size={16} color={item.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '20px 24px' }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={15} color="#38BDF8" /> Accepted Payment Methods
            </h4>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['fiat','crypto','trade'].map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
                  <CheckCircle2 size={14} color="#22c55e" />
                  <span style={{ fontSize: 13 }}>{PAYMENT_LABELS[p]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky CTA */}
      <div className="store-detail-cta-bar glass-panel">
        <div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>{resolvedStore.name}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Rep {repScore} · {reviewCount} reviews</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="store-contact-btn"><MessageCircle size={15} /> Contact</button>
          <button className="checkout-cta" style={{ width: 'auto', padding: '12px 24px', fontSize: 14 }}
            onClick={() => displayCatalog[0] && handleItemXchange(displayCatalog[0])}>
            <Zap size={15} /> Xchange Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreDetailPage;
