import React, { useState, useEffect } from 'react';
import {
  Store, Eye, EyeOff, Zap, PauseCircle, PlayCircle,
  CheckCircle2, Plus, Package, Wrench, Gift,
  BarChart3, MessageSquare, ShieldCheck, Edit3,
  Clock, TrendingUp, ArrowLeft
} from 'lucide-react';
import { getMyListings, toggleListingStatus, markListingAsSold } from '../data/xchangeStore';

const STATUS_CONFIG = {
  active:  { color: '#22c55e', label: 'Ativo',    icon: PlayCircle  },
  paused:  { color: '#F59E0B', label: 'Pausado',  icon: PauseCircle },
  sold:    { color: '#38BDF8', label: 'Vendido',   icon: CheckCircle2 },
};

const TYPE_ICON = { Products: Package, Services: Wrench, Donations: Gift };

const PAYMENT_LABELS = { fiat: '💵 Fiat', crypto: '⛓️ Crypto', trade: '🔄 Trade', free: '💖 Free' };

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatRelative = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  return `${days} dias atrás`;
};

// ─── Empty State ──────────────────────────────────────────
const EmptyListings = () => (
  <div className="mp-empty glass-panel">
    <div className="mp-empty-icon">
      <Store size={40} color="rgba(56,189,248,0.6)" />
    </div>
    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Nenhum anúncio ainda</h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
      Crie seus primeiros anúncios para oferecer produtos, serviços ou trocas para a comunidade de Jurerê.
    </p>
    <button className="checkout-cta" style={{ marginTop: 24, maxWidth: 240, background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>
      <Plus size={16} />
      Criar Anúncio
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
            <span>Vendido</span>
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
            <span>{listing.views || 0} visualizações</span>
          </div>
          <div className="my-listing-stat">
            <MessageSquare size={13} color="var(--text-secondary)" />
            <span>{listing.inquiries || 0} interessados</span>
          </div>
          <div className="my-listing-stat">
            <Clock size={13} color="var(--text-secondary)" />
            <span>{formatRelative(listing.createdAt)}</span>
          </div>
          <div className="my-listing-stat">
            <ShieldCheck size={13} color={listing.isPublic ? '#22c55e' : 'var(--text-secondary)'} />
            <span style={{ color: listing.isPublic ? '#22c55e' : 'var(--text-secondary)' }}>
              {listing.isPublic ? 'Público' : 'Privado'}
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
              {listing.status === 'active' ? 'Pausar' : 'Ativar'}
            </button>

            {listing.category === 'Products' && (
              <button
                className="my-listing-action-btn"
                onClick={() => onMarkSold(listing.id)}
                style={{ color: '#38BDF8', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.06)' }}
              >
                <CheckCircle2 size={14} />
                Marcar como vendido
              </button>
            )}

            <button
              className="my-listing-action-btn edit"
            >
              <Edit3 size={14} />
              Editar
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
        { label: 'Anúncios ativos', value: active, color: '#22c55e' },
        { label: 'Pausados', value: paused, color: '#F59E0B' },
        { label: 'Vendidos', value: sold, color: '#38BDF8' },
        { label: 'Total de views', value: views, color: '#818CF8' },
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
  { id: 'all',    label: 'Todos'    },
  { id: 'active', label: 'Ativos'   },
  { id: 'paused', label: 'Pausados' },
  { id: 'sold',   label: 'Vendidos' },
];

// ─── Main Component ───────────────────────────────────────
const MyListingsPage = ({ onNavigate, onBack }) => {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setListings(getMyListings());
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
        Voltar à Wallet
      </button>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 28, marginBottom: 6 }}>
              Meus <span className="text-gradient-cyan">Anúncios</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
              Gerencie tudo que você oferece na rede Xchange — produtos, serviços e trocas.
            </p>
          </div>
          <button className="checkout-cta" style={{ maxWidth: 200, background: 'linear-gradient(135deg, #38BDF8, #818CF8)', fontSize: 14, padding: '12px 20px' }}>
            <Plus size={16} />
            Novo Anúncio
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
          <p>Nenhum anúncio neste status.</p>
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
            <p style={{ fontSize: 14, fontWeight: 600 }}>Dica do Core</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              Anúncios com foto de qualidade e aceite de crypto têm <strong style={{ color: '#B4F44A' }}>3.2× mais</strong> visualizações na rede. Atualize seus anúncios para maximizar alcance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListingsPage;
