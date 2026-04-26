import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, ShieldCheck, ExternalLink, Clock,
  Package, Wrench, Gift, ChevronRight, ArrowUpRight,
  RefreshCw, CheckCircle2, Zap, Filter, Eye, ArrowLeft
} from 'lucide-react';
import { getPurchases, clearPurchases } from '../data/xchangeStore';

const STATUS_CONFIG = {
  confirmed: { color: '#22c55e', label: 'Confirmado', icon: CheckCircle2 },
  pending:   { color: '#F59E0B', label: 'Pendente',   icon: Clock },
  disputed:  { color: '#F43F5E', label: 'Em disputa', icon: RefreshCw },
};

const TYPE_ICON = {
  Products: Package,
  Services: Wrench,
  Donations: Gift,
};

const PAYMENT_LABELS = {
  fiat: '💵 PIX / Fiat',
  crypto: '⛓️ USDC On-Chain',
  ipe: '🌳 $IPE Token',
  trade: '🔄 Trade',
};

const FILTERS = ['Todos', 'Products', 'Services', 'Donations'];

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── Empty State ──────────────────────────────────────────
const EmptyPurchases = ({ onDiscover }) => (
  <div className="mp-empty glass-panel">
    <div className="mp-empty-icon">
      <ShoppingBag size={40} color="rgba(180,244,74,0.6)" />
    </div>
    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Nenhuma compra ainda</h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
      Suas transações Xchange aparecerão aqui com TX hash, detalhes de pagamento e reputação acumulada.
    </p>
    <button className="checkout-cta" style={{ marginTop: 24, maxWidth: 280 }} onClick={onDiscover}>
      <Zap size={16} />
      Explorar Discover
    </button>
  </div>
);

// ─── Purchase Card ────────────────────────────────────────
const PurchaseCard = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const { listing, paymentMethod, txHash, date, status } = entry;
  const StatusConf = STATUS_CONFIG[status] || STATUS_CONFIG.confirmed;
  const StatusIcon = StatusConf.icon;
  const TypeIcon = TYPE_ICON[listing.category] || Package;

  return (
    <div className={`mp-card glass-panel ${expanded ? 'expanded' : ''}`}>
      {/* Main row */}
      <div className="mp-card-main" onClick={() => setExpanded(e => !e)}>
        {/* Image */}
        <div
          className="mp-card-img"
          style={{ backgroundImage: `url(${listing.image})` }}
        >
          <div className="mp-card-type-badge">
            <TypeIcon size={12} />
          </div>
        </div>

        {/* Info */}
        <div className="mp-card-info">
          <div className="mp-card-top">
            <div>
              <p className="mp-card-provider">{listing.provider}</p>
              <h4 className="mp-card-title">{listing.title}</h4>
            </div>
            <div className="mp-card-price-col">
              <span className="mp-card-price">{listing.price || 'Free'}</span>
              <span className="mp-card-payment">{PAYMENT_LABELS[paymentMethod] || paymentMethod}</span>
            </div>
          </div>

          <div className="mp-card-meta">
            <span className="mp-status-badge" style={{ color: StatusConf.color, background: `${StatusConf.color}15`, border: `1px solid ${StatusConf.color}30` }}>
              <StatusIcon size={11} />
              {StatusConf.label}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> {formatDate(date)}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 4 }}>
              {txHash} <ExternalLink size={10} />
            </span>
          </div>
        </div>

        {/* Expand chevron */}
        <ChevronRight size={18} color="var(--text-secondary)" style={{ flexShrink: 0, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mp-card-detail">
          <div className="breakdown-divider" style={{ margin: '0 0 16px' }} />

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            {listing.description}
          </p>

          <div className="mp-detail-grid">
            <div className="mp-detail-row">
              <span className="mp-detail-label">Categoria</span>
              <span className="mp-detail-value">{listing.category}</span>
            </div>
            <div className="mp-detail-row">
              <span className="mp-detail-label">Método de pagamento</span>
              <span className="mp-detail-value">{PAYMENT_LABELS[paymentMethod] || paymentMethod}</span>
            </div>
            <div className="mp-detail-row">
              <span className="mp-detail-label">TX Hash on-chain</span>
              <span className="mp-detail-value" style={{ fontFamily: 'monospace', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 4 }}>
                {txHash} <ExternalLink size={11} />
              </span>
            </div>
            <div className="mp-detail-row">
              <span className="mp-detail-label">Privacidade Zodl ZK</span>
              <span className="mp-detail-value" style={{ color: '#B4F44A', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={12} /> Transação blindada nativamente
              </span>
            </div>
            {listing.type === 'Product' && (
              <div className="mp-detail-row">
                <span className="mp-detail-label">Disponibilidade</span>
                <span className="mp-detail-value" style={{ color: '#F43F5E' }}>
                  Produto removido do Discover
                </span>
              </div>
            )}
            {listing.type === 'Service' && (
              <div className="mp-detail-row">
                <span className="mp-detail-label">Disponibilidade</span>
                <span className="mp-detail-value" style={{ color: '#22c55e' }}>
                  Serviço continua ativo no Discover
                </span>
              </div>
            )}
          </div>

          <div className="mp-rep-note">
            <Zap size={13} color="#B4F44A" />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Esta transação contribuiu com <strong style={{ color: '#B4F44A' }}>+2 pontos</strong> ao seu Reputation Score on-chain.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Stats Bar ────────────────────────────────────────────
const StatsBar = ({ purchases }) => {
  const total = purchases.length;
  const products = purchases.filter(p => p.listing.category === 'Products').length;
  const services = purchases.filter(p => p.listing.category === 'Services').length;
  const repGained = total * 2;

  return (
    <div className="mp-stats-bar">
      {[
        { label: 'Total de compras', value: total, color: '#B4F44A' },
        { label: 'Produtos adquiridos', value: products, color: '#38BDF8' },
        { label: 'Serviços contratados', value: services, color: '#818CF8' },
        { label: 'Rep acumulado', value: `+${repGained}`, color: '#F59E0B' },
      ].map(s => (
        <div key={s.label} className="glass-panel mp-stat-card">
          <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────
const MyPurchasesPage = ({ onNavigate, onBack }) => {
  const [purchases, setPurchases] = useState([]);
  const [filter, setFilter] = useState('Todos');

  useEffect(() => {
    setPurchases(getPurchases());
  }, []);

  const filtered = filter === 'Todos'
    ? purchases
    : purchases.filter(p => p.listing.category === filter);

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
              Minhas <span className="text-gradient-lime">Compras</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
              Histórico completo das suas transações Xchange — tudo registrado on-chain.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge" style={{ background: 'rgba(180,244,74,0.08)', borderColor: 'rgba(180,244,74,0.3)', color: '#B4F44A', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
              <ShieldCheck size={13} /> Shielded by Zodl ZK
            </span>
            <span className="badge" style={{ background: 'rgba(56,189,248,0.08)', borderColor: 'rgba(56,189,248,0.3)', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
              <ShieldCheck size={13} /> Ipê Passport Verified
            </span>
          </div>
        </div>

        {purchases.length > 0 && <StatsBar purchases={purchases} />}

        {purchases.length > 0 && (
          <div className="filter-chips" style={{ marginTop: 20 }}>
            {FILTERS.map(f => (
              <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {purchases.length === 0 ? (
        <EmptyPurchases onDiscover={() => onNavigate?.('discover')} />
      ) : (
        <div className="mp-list">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
              <Filter size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p>Nenhuma compra nesta categoria.</p>
            </div>
          ) : (
            filtered.map(entry => <PurchaseCard key={entry.id} entry={entry} />)
          )}
        </div>
      )}

      {/* How it works */}
      <div className="glass-panel" style={{ marginTop: 40, padding: '24px 28px' }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Como funciona o registro on-chain</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: ShieldCheck, color: '#B4F44A', title: 'Zodl ZK Privacy', desc: 'Transações blindadas pelo Zodl sem expor dados pessoais.' },
            { icon: ShieldCheck, color: '#38BDF8', title: 'Ipê Passport', desc: 'Vendedores identificados e verificados pelo ENS nativo.' },
            { icon: Package, color: '#818CF8', title: 'Produto único = Sold', desc: 'Produtos comprados são removidos do Discover.' },
            { icon: Zap, color: '#F59E0B', title: 'Rep Score', desc: 'Cada compra concluída aumenta seu Reputation Score on-chain.' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
    </div>
  );
};

export default MyPurchasesPage;
