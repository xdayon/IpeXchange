import React, { useState, lazy, Suspense } from 'react';
import { MessageCircle, MapPin, Zap, TrendingUp, Users } from 'lucide-react';
import ChatDrawer from './ChatDrawer';

// Lazy-load Leaflet so it doesn't block the initial render
const CityMap = lazy(() => import('./CityMap'));


const LIVE_FEED = [
  { icon: <Zap size={14} />, color: '#B4F44A', text: 'Nova oferta: Macbook Pro M3 — R$ 8.500', time: '2m' },
  { icon: <Users size={14} />, color: '#38BDF8', text: 'Troca: Bicicleta por Serviços Jurídicos', time: '5m' },
  { icon: <TrendingUp size={14} />, color: '#818CF8', text: 'Mel Orgânico esgotado — 4 compradores aguardam', time: '8m' },
  { icon: <MapPin size={14} />, color: '#F43F5E', text: 'Vet Dr. Sarah disponível agora — Jurerê', time: '12m' },
  { icon: <Zap size={14} />, color: '#B4F44A', text: 'Design Gráfico — aceita crypto ou troca', time: '18m' },
];

const HomePage = () => {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '24px' }}>
      <div className="home-layout glass-panel" style={{ height: '700px', borderRadius: '24px', overflow: 'hidden' }}>
        {/* Map takes up most of the space */}
        <div className="home-map-area">
          <Suspense fallback={<div style={{ width:'100%', height:'100%', background:'#0B1421' }} />}>
            <CityMap activeCategory={null} />
          </Suspense>

          {/* Floating Chat FAB */}
          <button
            id="chat-fab-btn"
            className="chat-fab"
            onClick={() => setChatOpen(true)}
          >
            <div className="fab-glow-ring" />
            <MessageCircle size={28} />
            <span>Chat com o Core</span>
          </button>
        </div>

        {/* Live Activity Feed sidebar */}
        <aside className="activity-feed">
          <h4 className="feed-title">
            <span className="live-dot" /> Atividade em Jurerê
          </h4>
          <ul className="feed-list">
            {LIVE_FEED.map((item, i) => (
              <li key={i} className="feed-item">
                <span className="feed-icon" style={{ color: item.color }}>{item.icon}</span>
                <span className="feed-text">{item.text}</span>
                <span className="feed-time">{item.time}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default HomePage;
