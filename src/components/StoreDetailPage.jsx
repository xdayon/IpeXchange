import React, { useState } from 'react';
import {
  ArrowLeft, Star, MapPin, ShieldCheck, ExternalLink,
  Fingerprint, Clock, Phone, Globe, ChevronRight,
  Package, Wrench, Gift, Zap, Lock, Users, TrendingUp,
  CheckCircle2, MessageCircle, Share2, Heart
} from 'lucide-react';

// ─── Mock products/services per store ─────────────────────
const STORE_CATALOG = {
  s1: [
    { id: 'p1', name: 'Classic Sourdough Bread', type: 'Product', price: '$4', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Natural fermentation, 500g. Baked Tuesdays and Fridays.', payments: ['fiat','crypto','ipe'] },
    { id: 'p2', name: 'Specialty Arabica Coffee', type: 'Product', price: '$9', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=300&h=200', desc: '250g roasted this week, coarse or fine grind.', payments: ['fiat','crypto','trade','ipe'] },
    { id: 'p3', name: 'Weekly Organic Basket', type: 'Service', price: '$25/week', image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Weekly delivery of bread + coffee + artisan jams.', payments: ['fiat','crypto','ipe'] },
    { id: 'p4', name: 'Baking Workshop', type: 'Service', price: '$35/person', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=300&h=200', desc: '3h practical class with the chef. Groups up to 8 people.', payments: ['fiat'] },
  ],
  s2: [
    { id: 'p1', name: 'On-Chain Vehicle Diagnostic', type: 'Service', price: '$15', image: 'https://images.unsplash.com/photo-1607705703571-c5a8695f18f6?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Full report registered on-chain. Diagnostic NFT included.', payments: ['fiat','crypto','ipe'] },
    { id: 'p2', name: 'Full Electrical Review', type: 'Service', price: '$70', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Battery, charger, and electrical systems in EVs.', payments: ['fiat','crypto','ipe'] },
    { id: 'p3', name: 'Custom Paint Job', type: 'Service', price: 'Upon request', image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Premium automotive paint, special effects, and wraps.', payments: ['fiat','ipe'] },
  ],
  s3: [
    { id: 'p1', name: '4K Dolby Session Ticket', type: 'Product', price: '$8', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=300&h=200', desc: 'NFT ticket for a standard session. Seat reservation included.', payments: ['fiat','crypto','ipe'] },
    { id: 'p2', name: 'Special Event Ticket', type: 'Product', price: '$18', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Premieres, festivals, and exclusive events at the cultural hub.', payments: ['fiat','crypto','ipe'] },
    { id: 'p3', name: 'Private Room (Up to 20 people)', type: 'Service', price: '$120/night', image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Rental for private sessions, celebrations, and corporate events.', payments: ['fiat','crypto','ipe'] },
  ],
};

// Default catalog for stores without specific products
const DEFAULT_CATALOG = [
  { id: 'd1', name: 'Consultation / Service', type: 'Service', price: 'Contact us', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Get in touch for more information about this service.', payments: ['fiat','ipe'] },
  { id: 'd2', name: 'Premium Product', type: 'Product', price: 'Contact us', image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&q=80&w=300&h=200', desc: 'Exclusive product from this establishment.', payments: ['fiat','crypto','ipe'] },
];

const MOCK_REVIEWS = [
  { user: 'ana.ipecity.eth', rep: 91, stars: 5, text: 'Impeccable quality! On-chain verified transaction, super smooth process.', date: '3 days ago' },
  { user: 'lucas.ipecity.eth', rep: 88, stars: 5, text: 'Excellent service. Store reputation matches the real experience.', date: '1 week ago' },
  { user: 'carla.ipecity.eth', rep: 94, stars: 4, text: 'Great product, on-time delivery. I just missed more payment options.', date: '2 weeks ago' },
];

const PAYMENT_LABELS = { fiat: '💵 Fiat/PIX', crypto: '⛓️ Crypto', trade: '🔄 Trade', ipe: '🌳 $IPE Token', free: '💖 Free' };

// ─── Product Card ─────────────────────────────────────────
const CatalogCard = ({ item, onXchange }) => {
  return (
    <div className="catalog-card glass-panel">
      <div className="catalog-img" style={{ backgroundImage: `url(${item.image})` }}>
        <span className={`catalog-type-badge ${item.type === 'Product' ? 'product' : 'service'}`}>
          {item.type === 'Product' ? <Package size={10} /> : <Wrench size={10} />}
          {item.type}
        </span>
      </div>
      <div className="catalog-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h4 className="catalog-name">{item.name}</h4>
          <span className="catalog-price">{item.price}</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12, flex: 1 }}>{item.desc}</p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {item.payments.map(p => (
            <span key={p} className="checkout-pay-tag">{PAYMENT_LABELS[p]}</span>
          ))}
        </div>
        <button className="catalog-xchange-btn" onClick={() => onXchange && onXchange(item)}>
          <Zap size={13} />
          Xchange
        </button>
      </div>
    </div>
  );
};

// ─── Stats strip ──────────────────────────────────────────
const StoreStats = ({ store }) => (
  <div className="store-detail-stats">
    {[
      { label: 'Rating', value: `${store.rating}★`, color: '#F59E0B' },
      { label: 'Reviews', value: store.reviews, color: '#38BDF8' },
      { label: 'Rep Score', value: store.reputationScore, color: store.reputationScore >= 95 ? '#B4F44A' : '#38BDF8' },
      { label: 'Status', value: 'Open', color: '#22c55e' },
    ].map(s => (
      <div key={s.label} className="glass-panel store-stat-card">
        <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</p>
      </div>
    ))}
  </div>
);

// ─── Main ─────────────────────────────────────────────────
const StoreDetailPage = ({ store, onBack, onXchange }) => {
  const [activeTab, setActiveTab] = useState('catalog');
  const [liked, setLiked] = useState(false);
  const Icon = store.icon;
  const catalog = STORE_CATALOG[store.id] || DEFAULT_CATALOG;
  const repColor = store.reputationScore >= 95 ? '#B4F44A' : store.reputationScore >= 85 ? '#38BDF8' : '#F59E0B';

  const handleItemXchange = (item) => {
    if (onXchange) {
      onXchange({
        id: `${store.id}-${item.id}`,
        title: item.name,
        provider: store.name,
        type: item.type,
        category: item.type === 'Product' ? 'Products' : 'Services',
        acceptedPayments: item.payments,
        price: item.price,
        description: item.desc,
        image: item.image,
      });
    }
  };

  return (
    <div className="store-detail-layout container">
      {/* Back */}
      <button className="checkout-back-btn" onClick={onBack} style={{ marginBottom: 24 }}>
        <ArrowLeft size={18} />
        Back to Stores
      </button>

      {/* Hero banner */}
      <div className="store-detail-hero glass-panel">
        <div className="store-hero-banner">
          <div className="store-hero-gradient" />
          <div className="store-hero-content">
            <div className="store-hero-icon" style={{ background: store.iconBg, borderColor: `${store.iconColor}40` }}>
              <Icon size={36} style={{ color: store.iconColor }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800 }}>{store.name}</h2>
                {store.onChain && <span style={{ fontSize: 11, fontWeight: 700, color: '#B4F44A', background: 'rgba(180,244,74,0.15)', padding: '3px 9px', borderRadius: 100, border: '1px solid rgba(180,244,74,0.3)' }}>⬡ On-Chain</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#F59E0B' }}>
                  <Star size={13} fill="#F59E0B" /> {store.rating} <span style={{ color: 'var(--text-secondary)' }}>({store.reviews})</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: repColor }}>
                  <ShieldCheck size={13} /> Rep {store.reputationScore}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <MapPin size={11} /> {store.address}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-icon"
                onClick={() => setLiked(l => !l)}
                style={{ background: liked ? 'rgba(244,63,94,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: liked ? '#F43F5E' : 'var(--text-secondary)', width: 40, height: 40, borderRadius: 10 }}
              >
                <Heart size={18} fill={liked ? '#F43F5E' : 'none'} />
              </button>
              <button
                className="btn-icon"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', width: 40, height: 40, borderRadius: 10 }}
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '0 24px 24px' }}>
          <StoreStats store={store} />
        </div>
      </div>

      {/* Tags + Description */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginTop: 16 }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>{store.description}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {store.tags.map(tag => (
            <span key={tag} className="store-tag">{tag}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <Fingerprint size={13} />
            <span style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{store.owner}</span>
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
          { id: 'catalog', label: `Catalog (${catalog.length})` },
          { id: 'reviews',  label: `Reviews (${store.reviews})` },
          { id: 'about',    label: 'About & Security' },
        ].map(t => (
          <button
            key={t.id}
            className={`store-detail-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'catalog' && (
        <div className="catalog-grid">
          {catalog.map(item => (
            <CatalogCard key={item.id} item={item} onXchange={handleItemXchange} />
          ))}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
          {/* Rating summary */}
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <p style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: '#F59E0B' }}>{store.rating}</p>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', margin: '6px 0 4px' }}>
                {[1,2,3,4,5].map(i => <Star key={i} size={14} color="#F59E0B" fill={i <= Math.round(store.rating) ? '#F59E0B' : 'none'} />)}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{store.reviews} reviews</p>
            </div>
            <div style={{ flex: 1 }}>
              {[5,4,3,2,1].map(n => {
                const pct = n === 5 ? 78 : n === 4 ? 16 : n === 3 ? 4 : n === 2 ? 1 : 1;
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
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #38BDF8, #818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                    {r.user[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#38BDF8' }}>{r.user}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Rep {r.rep}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  {[...Array(r.stars)].map((_, j) => <Star key={j} size={12} color="#F59E0B" fill="#F59E0B" />)}
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.text}</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>{r.date}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'about' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={15} color="#B4F44A" /> On-Chain Security & Verification
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { icon: ShieldCheck, color: '#B4F44A', title: 'Ipê Passport / ENS', desc: `Verified owner identity: ${store.owner}` },
                { icon: Lock, color: '#38BDF8', title: 'Zodl (ZK Privacy)', desc: 'All transactions natively shielded by Zodl' },
                { icon: TrendingUp, color: '#818CF8', title: `Rep Score: ${store.reputationScore}`, desc: store.reputationScore >= 95 ? 'Elite — Top 5% of Xchange network' : 'Trusted — Verified and reliable' },
                { icon: Users, color: '#F59E0B', title: `${store.reviews} reviews`, desc: 'All reviews registered on-chain, immutable' },
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
          <p style={{ fontSize: 13, fontWeight: 600 }}>{store.name}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Rep {store.reputationScore} · {store.reviews} reviews</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="store-contact-btn">
            <MessageCircle size={15} />
            Contact
          </button>
          <button className="checkout-cta" style={{ width: 'auto', padding: '12px 24px', fontSize: 14 }}
            onClick={() => catalog[0] && handleItemXchange(catalog[0])}
          >
            <Zap size={15} />
            Xchange Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreDetailPage;
