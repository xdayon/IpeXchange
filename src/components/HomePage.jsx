import React, { useState, lazy, Suspense } from 'react';
import { MapPin, Zap, TrendingUp, Users, Store, Network, Lock, Wallet } from 'lucide-react';

// Lazy-load Leaflet so it doesn't block the initial render
const CityMap = lazy(() => import('./CityMap'));

const LIVE_FEED = [
  { icon: <Zap size={14} />, color: '#B4F44A', text: 'Nova oferta: Macbook Pro M3 — R$ 8.500', time: '2m' },
  { icon: <Users size={14} />, color: '#38BDF8', text: 'Troca: Bicicleta por Serviços Jurídicos', time: '5m' },
  { icon: <TrendingUp size={14} />, color: '#818CF8', text: 'Mel Orgânico esgotado — 4 compradores aguardam', time: '8m' },
  { icon: <MapPin size={14} />, color: '#F43F5E', text: 'Vet Dr. Sarah disponível agora — Jurerê', time: '12m' },
  { icon: <Zap size={14} />, color: '#B4F44A', text: 'Design Gráfico — aceita crypto ou troca', time: '18m' },
  { icon: <Lock size={14} />, color: '#94A3B8', text: 'Transação privada on-chain concluída via ZKP', time: '22m' },
  { icon: <Wallet size={14} />, color: '#B4F44A', text: 'Empréstimo P2P financiado na Padaria Ipê', time: '35m' },
];

const StatCard = ({ icon: Icon, color, title, value, subtext }) => (
  <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>{title}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <h4 style={{ fontSize: 24 }}>{value}</h4>
        {subtext && <span style={{ fontSize: 12, color: color }}>{subtext}</span>}
      </div>
    </div>
  </div>
);

const HomePage = () => {
  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Dashboard Top Row */}
      <div>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>
          Ipê City <span className="text-gradient-cyan">Dashboard</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <StatCard icon={TrendingUp} color="#B4F44A" title="Volume 24h" value="R$ 42.5k" subtext="+12%" />
          <StatCard icon={Users} color="#38BDF8" title="Cidadãos Ativos" value="1.240" subtext="Jurerê" />
          <StatCard icon={Store} color="#818CF8" title="Stores On-Chain" value="48" subtext="Operando" />
          <StatCard icon={Network} color="#F59E0B" title="Intents Conectados" value="156" subtext="Hoje" />
        </div>
      </div>

      {/* Main Map + Sidebar */}
      <div className="home-layout glass-panel" style={{ height: '600px', borderRadius: '24px', overflow: 'hidden' }}>
        {/* Map takes up most of the space */}
        <div className="home-map-area">
          <Suspense fallback={<div style={{ width:'100%', height:'100%', background:'#0B1421' }} />}>
            <CityMap activeCategory={null} />
          </Suspense>
        </div>

        {/* Live Activity Feed sidebar */}
        <aside className="activity-feed" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 className="feed-title" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
            <span className="live-dot" /> Atividade em Jurerê
          </h4>
          <ul className="feed-list" style={{ overflowY: 'auto', flex: 1, padding: '16px 0' }}>
            {LIVE_FEED.map((item, i) => (
              <li key={i} className="feed-item" style={{ padding: '12px 24px', borderBottom: i < LIVE_FEED.length - 1 ? '1px solid var(--border-color)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="feed-icon" style={{ color: item.color, background: `${item.color}15`, padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="feed-text" style={{ fontSize: 13, lineHeight: 1.4, display: 'block', whiteSpace: 'normal' }}>{item.text}</span>
                  <span className="feed-time" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.time} atrás</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Quick Action / Core AI Tip */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid #B4F44A' }}>
        <Zap size={24} color="#B4F44A" />
        <div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>Dica do Core</p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Há uma alta demanda por serviços de tecnologia na região de Jurerê hoje. Fale com o Core se quiser anunciar um serviço com preço premium.</p>
        </div>
      </div>

    </div>
  );
};

export default HomePage;
