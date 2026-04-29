import React, { useState, useEffect } from 'react';
import { Store, Coffee, Wrench, Film, ShoppingBag, Heart, Leaf, ShieldCheck, Star, MapPin, ExternalLink, Fingerprint, RefreshCw } from 'lucide-react';

const ICON_MAP = {
  Coffee, Wrench, Film, ShoppingBag, Heart, Leaf, ShieldCheck,
};

const CATEGORIES = ['All', 'Food & Drink', 'Services', 'Health', 'Commerce', 'Entertainment'];

// Fallback hardcoded stores (shown while API loads or if DB not set up)
const FALLBACK_STORES = [
  { id: 'a1000000-0000-0000-0000-000000000001', name: 'Ipê Bakery',         category: 'Food & Drink',  icon_key: 'Coffee',      icon_color: '#F59E0B', icon_bg: 'rgba(245,158,11,0.12)',   owner_ens: 'marina.ipecity.eth',     address: 'Av. dos Búzios, 210 – Ipê City',     rating: 4.9, review_count: 142, tags: ['Artisan Bread','Organic','Specialty Coffee'], reputation_score: 98, on_chain: true,  description: 'Artisan bakery with 100% organic ingredients. Accepts crypto and trade.' },
  { id: 'a1000000-0000-0000-0000-000000000002', name: 'Ipê City Motors',    category: 'Services',      icon_key: 'Wrench',      icon_color: '#38BDF8', icon_bg: 'rgba(56,189,248,0.12)',   owner_ens: 'carlostech.ipecity.eth', address: 'Rua das Gaivotas, 48 – Ipê City',    rating: 4.7, review_count: 89,  tags: ['Mechanic','EVs','Customization'],           reputation_score: 94, on_chain: true,  description: 'Workshop specialized in electric vehicles and customization. On-chain diagnostic reports.' },
  { id: 'a1000000-0000-0000-0000-000000000003', name: 'Ipê Cinema',         category: 'Entertainment', icon_key: 'Film',        icon_color: '#818CF8', icon_bg: 'rgba(129,140,248,0.12)', owner_ens: 'ipehub.ipecity.eth',     address: 'Av. das Rendeiras, 1500 – Ipê City', rating: 4.8, review_count: 317, tags: ['4K Dolby','Events','Art & Culture'],        reputation_score: 99, on_chain: true,  description: 'Community cinema with 4K Dolby Atmos. NFT tickets.' },
  { id: 'a1000000-0000-0000-0000-000000000004', name: 'Organic Market',     category: 'Commerce',      icon_key: 'Leaf',        icon_color: '#B4F44A', icon_bg: 'rgba(180,244,74,0.10)',   owner_ens: 'sitioipe.ipecity.eth',   address: 'Rua das Ostras, 32 – Ipê City',       rating: 4.9, review_count: 205, tags: ['Produce','Bulk','Delivery'],                reputation_score: 97, on_chain: true,  description: 'Local organic products with blockchain traceability.' },
  { id: 'a1000000-0000-0000-0000-000000000005', name: 'Ipê Health Clinic',  category: 'Health',        icon_key: 'Heart',       icon_color: '#F43F5E', icon_bg: 'rgba(244,63,94,0.10)',    owner_ens: 'drsarah.ipecity.eth',    address: 'Av. dos Dourados, 78 – Ipê City',    rating: 5.0, review_count: 61,  tags: ['General Clinic','Physiotherapy','Nutrition'],reputation_score:100, on_chain: true,  description: 'Digital health records secured on-chain.' },
  { id: 'a1000000-0000-0000-0000-000000000006', name: 'Studio Creative',    category: 'Services',      icon_key: 'ShoppingBag', icon_color: '#F472B6', icon_bg: 'rgba(244,114,182,0.10)', owner_ens: 'designhaus.ipecity.eth', address: 'Av. dos Búzios, 840 – Ipê City',     rating: 4.6, review_count: 43,  tags: ['Graphic Design','Branding','Web3 Assets'],  reputation_score: 89, on_chain: false, description: 'Design specialized in Web3 visual identity, NFTs and branding.' },
  { id: 'a1000000-0000-0000-0000-000000000007', name: 'Ipê City Surf Shop', category: 'Commerce',      icon_key: 'ShoppingBag', icon_color: '#10B981', icon_bg: 'rgba(16,185,129,0.12)',   owner_ens: 'surfpoint.ipecity.eth',  address: 'Av. dos Búzios, 1200 – Ipê City',   rating: 4.8, review_count: 156, tags: ['Surf Gear','Rental','Clothing'],             reputation_score: 96, on_chain: true,  description: 'Everything for your surf. Boards, accessories and the best beachwear brands.' },
  { id: 'a1000000-0000-0000-0000-000000000008', name: 'Wine & Cheese Ipê',  category: 'Food & Drink',  icon_key: 'Coffee',      icon_color: '#9333EA', icon_bg: 'rgba(147,51,234,0.12)',   owner_ens: 'vinicius.ipecity.eth',   address: 'Rua das Amoras, 15 – Ipê City',      rating: 4.9, review_count: 74,  tags: ['Wines','Cheese','Tasting'],                 reputation_score: 95, on_chain: true,  description: 'Exclusive selection of national and imported wines, paired with artisan cheeses.' },
  { id: 'a1000000-0000-0000-0000-000000000009', name: 'Ipê Tech Store',     category: 'Commerce',      icon_key: 'ShieldCheck', icon_color: '#38BDF8', icon_bg: 'rgba(56,189,248,0.12)',   owner_ens: 'alexm.ipecity.eth',      address: 'Open Shopping Ipê City',             rating: 4.7, review_count: 210, tags: ['Gadgets','Hardware Wallets','Setup'],        reputation_score: 93, on_chain: true,  description: 'Your tech store in Ipê City. Focused on hardware for Web3 enthusiasts.' },
  { id: 'a1000000-0000-0000-0000-000000000010', name: 'Bio Market',         category: 'Health',        icon_key: 'Leaf',        icon_color: '#10B981', icon_bg: 'rgba(16,185,129,0.10)',   owner_ens: 'carla.ipecity.eth',      address: 'Av. das Rendeiras, 450',             rating: 4.8, review_count: 92,  tags: ['Supplements','Gluten Free','Vegan'],         reputation_score: 94, on_chain: true,  description: 'Healthy food and natural supplementation for high performance.' },
];

let API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
if (API_URL.startsWith('http') && !API_URL.endsWith('/api')) API_URL += '/api';

const repColor = (s) => s >= 95 ? '#B4F44A' : s >= 85 ? '#38BDF8' : '#F59E0B';
const repLabel = (s) => s >= 95 ? 'Elite' : s >= 85 ? 'Trusted' : 'Verified';

const StoreCard = ({ store, onView }) => {
  const Icon = ICON_MAP[store.icon_key] || Store;
  const c = repColor(store.reputation_score);
  return (
    <div className="glass-panel store-card">
      <div className="store-card-header">
        <div className="store-icon-wrap" style={{ background: store.icon_bg }}>
          <Icon size={28} style={{ color: store.icon_color }} />
        </div>
        <div className="store-card-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <h3 className="store-name">{store.name}</h3>
            <ShieldCheck size={14} style={{ color: '#B4F44A' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Star size={12} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{store.rating}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>({store.review_count})</span>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 700, border: `1px solid ${c}40`, background: `${c}10`, color: c, whiteSpace: 'nowrap' }}>
          <ShieldCheck size={10} /> {repLabel(store.reputation_score)} {store.reputation_score}
        </span>
      </div>

      <p className="store-description">{store.description}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <MapPin size={11} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{store.address}</span>
      </div>

      <div className="store-tags">
        {(store.tags || []).map(tag => <span key={tag} className="store-tag">{tag}</span>)}
        {store.on_chain && <span className="store-tag onchain-tag">⬡ On-Chain</span>}
      </div>

      <div className="store-card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Fingerprint size={12} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{store.owner_ens}</span>
        </div>
        <button
          onClick={() => onView && onView(store)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 100, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(56,189,248,0.08)'}
        >
          <ExternalLink size={13} /> View Store
        </button>
      </div>
    </div>
  );
};

const StoresPage = ({ onNavigate }) => {
  const [cat, setCat] = useState('All');
  const [stores, setStores] = useState(FALLBACK_STORES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch(`${API_URL}/stores`);
        if (res.ok) {
          const data = await res.json();
          if (data.stores && data.stores.length > 0) {
            setStores(data.stores);
          }
          // If API returns empty, fallback stays
        }
      } catch (err) {
        console.warn('Stores API unavailable, using local fallback');
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  const filtered = cat === 'All' ? stores : stores.filter(s => s.category === cat);

  const handleView = (store) => {
    if (onNavigate) onNavigate('store-detail', { store });
  };

  return (
    <div className="inner-page container">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 28, marginBottom: 6 }}>Ipê City <span className="text-gradient-lime">Stores</span></h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Verified physical establishments — all linked to the owner's Ipê Passport.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {loading && <RefreshCw size={14} style={{ color: 'var(--text-secondary)', animation: 'spin 1s linear infinite' }} />}
            <span className="badge" style={{ background: 'rgba(180,244,74,0.08)', borderColor: 'rgba(180,244,74,0.25)', color: '#B4F44A', display: 'flex', alignItems: 'center', gap: 5 }}><ShieldCheck size={12} /> Reputation Score</span>
            <span className="badge" style={{ background: 'rgba(56,189,248,0.08)', borderColor: 'rgba(56,189,248,0.25)', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 5 }}>⬡ On-Chain</span>
          </div>
        </div>
        <div className="filter-chips">
          {CATEGORIES.map(c => (
            <button key={c} className={`filter-chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="stores-grid">
        {filtered.map(store => <StoreCard key={store.id} store={store} onView={handleView} />)}
      </div>

      <div className="glass-panel" style={{ marginTop: 28, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Store size={26} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Want to register your business?</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Establishments with an Ipê Passport list products automatically in the City Graph and become available to the Xchange Core.</p>
        </div>
        <button className="btn-primary" style={{ flexShrink: 0 }}>Register Store</button>
      </div>
    </div>
  );
};

export default StoresPage;
