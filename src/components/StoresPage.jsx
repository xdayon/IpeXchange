import React, { useState } from 'react';
import { Store, Coffee, Wrench, Film, ShoppingBag, Heart, Leaf, ShieldCheck, Star, MapPin, ExternalLink, Fingerprint } from 'lucide-react';

const CATEGORIES = ['All', 'Food & Drink', 'Services', 'Health', 'Commerce', 'Entertainment'];

const STORES = [
  { id: 's1', name: 'Ipê Bakery', category: 'Food & Drink', icon: Coffee, iconColor: '#F59E0B', iconBg: 'rgba(245,158,11,0.12)', owner: 'marina.ipecity.eth', address: 'Av. dos Búzios, 210 – Jurerê Internacional', rating: 4.9, reviews: 142, tags: ['Artisan Bread', 'Organic', 'Specialty Coffee'], reputationScore: 98, onChain: true, description: 'Artisan bakery with 100% organic ingredients. Accepts crypto and trade.' },
  { id: 's2', name: 'Jurerê Motors', category: 'Services', icon: Wrench, iconColor: '#38BDF8', iconBg: 'rgba(56,189,248,0.12)', owner: 'carlostech.ipecity.eth', address: 'Rua das Gaivotas, 48 – Jurerê', rating: 4.7, reviews: 89, tags: ['Mechanic', 'EVs', 'Customization'], reputationScore: 94, onChain: true, description: 'Workshop specialized in electric vehicles and customization. On-chain diagnostic reports.' },
  { id: 's3', name: 'Ipê Cinema', category: 'Entertainment', icon: Film, iconColor: '#818CF8', iconBg: 'rgba(129,140,248,0.12)', owner: 'ipehub.ipecity.eth', address: 'Av. das Rendeiras, 1500 – Jurerê Internacional', rating: 4.8, reviews: 317, tags: ['4K Dolby', 'Events', 'Art & Culture'], reputationScore: 99, onChain: true, description: 'Community cinema with 4K Dolby Atmos. NFT tickets.' },
  { id: 's4', name: 'Organic Market', category: 'Commerce', icon: Leaf, iconColor: '#B4F44A', iconBg: 'rgba(180,244,74,0.10)', owner: 'sitioipe.ipecity.eth', address: 'Rua das Ostras, 32 – Jurerê', rating: 4.9, reviews: 205, tags: ['Produce', 'Bulk', 'Delivery'], reputationScore: 97, onChain: true, description: 'Local organic products with blockchain traceability.' },
  { id: 's5', name: 'Ipê Health Clinic', category: 'Health', icon: Heart, iconColor: '#F43F5E', iconBg: 'rgba(244,63,94,0.10)', owner: 'drsarah.ipecity.eth', address: 'Av. dos Dourados, 78 – Jurerê Internacional', rating: 5.0, reviews: 61, tags: ['General Clinic', 'Physiotherapy', 'Nutrition'], reputationScore: 100, onChain: true, description: 'Digital health records secured on-chain.' },
  { id: 's6', name: 'Studio Creative', category: 'Services', icon: ShoppingBag, iconColor: '#F472B6', iconBg: 'rgba(244,114,182,0.10)', owner: 'designhaus.ipecity.eth', address: 'Av. dos Búzios, 840 – Jurerê Internacional', rating: 4.6, reviews: 43, tags: ['Graphic Design', 'Branding', 'Web3 Assets'], reputationScore: 89, onChain: false, description: 'Design specialized in Web3 visual identity, NFTs and branding.' },
  { id: 's7', name: 'Jurerê Surf Shop', category: 'Commerce', icon: ShoppingBag, iconColor: '#10B981', iconBg: 'rgba(16,185,129,0.12)', owner: 'surfpoint.ipecity.eth', address: 'Av. dos Búzios, 1200 – Jurerê', rating: 4.8, reviews: 156, tags: ['Surf Gear', 'Rental', 'Clothing'], reputationScore: 96, onChain: true, description: 'Everything for your surf. Boards, accessories and the best beachwear brands.' },
  { id: 's8', name: 'Wine & Cheese Ipê', category: 'Food & Drink', icon: Coffee, iconColor: '#9333EA', iconBg: 'rgba(147,51,234,0.12)', owner: 'vinicius.ipecity.eth', address: 'Rua das Amoras, 15 – Jurerê Internacional', rating: 4.9, reviews: 74, tags: ['Wines', 'Cheese', 'Tasting'], reputationScore: 95, onChain: true, description: 'Exclusive selection of national and imported wines, paired with artisan cheeses.' },
  { id: 's9', name: 'Ipê Tech Store', category: 'Commerce', icon: ShieldCheck, iconColor: '#38BDF8', iconBg: 'rgba(56,189,248,0.12)', owner: 'alexm.ipecity.eth', address: 'Open Shopping Jurerê', rating: 4.7, reviews: 210, tags: ['Gadgets', 'Hardware Wallets', 'Setup'], reputationScore: 93, onChain: true, description: 'Your tech store in Jurerê. Focused on hardware for Web3 enthusiasts.' },
  { id: 's10', name: 'Bio Market', category: 'Health', icon: Leaf, iconColor: '#10B981', iconBg: 'rgba(16,185,129,0.10)', owner: 'carla.ipecity.eth', address: 'Av. das Rendeiras, 450', rating: 4.8, reviews: 92, tags: ['Supplements', 'Gluten Free', 'Vegan'], reputationScore: 94, onChain: true, description: 'Healthy food and natural supplementation for high performance.' },
];

const repColor = (s) => s >= 95 ? '#B4F44A' : s >= 85 ? '#38BDF8' : '#F59E0B';
const repLabel = (s) => s >= 95 ? 'Elite' : s >= 85 ? 'Trusted' : 'Verified';

const StoreCard = ({ store, onView }) => {
  const Icon = store.icon;
  const c = repColor(store.reputationScore);
  return (
    <div className="glass-panel store-card">
      <div className="store-card-header">
        <div className="store-icon-wrap" style={{ background: store.iconBg }}>
          <Icon size={28} style={{ color: store.iconColor }} />
        </div>
        <div className="store-card-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <h3 className="store-name">{store.name}</h3>
            <ShieldCheck size={14} style={{ color: '#B4F44A' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Star size={12} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{store.rating}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>({store.reviews})</span>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 700, border: `1px solid ${c}40`, background: `${c}10`, color: c, whiteSpace: 'nowrap' }}>
          <ShieldCheck size={10} /> {repLabel(store.reputationScore)} {store.reputationScore}
        </span>
      </div>

      <p className="store-description">{store.description}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <MapPin size={11} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{store.address}</span>
      </div>

      <div className="store-tags">
        {store.tags.map(tag => <span key={tag} className="store-tag">{tag}</span>)}
        {store.onChain && <span className="store-tag onchain-tag">⬡ On-Chain</span>}
      </div>

      <div className="store-card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Fingerprint size={12} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{store.owner}</span>
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
  const filtered = cat === 'All' ? STORES : STORES.filter(s => s.category === cat);

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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
