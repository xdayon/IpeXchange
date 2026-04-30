import React, { useState, useEffect, lazy, Suspense, useRef, useCallback } from 'react';
import { MapPin, Zap, TrendingUp, Users, Store, Network, Lock, Wallet, AlertTriangle, X, Tag, CalendarDays } from 'lucide-react';
import { mockDemands } from '../data/mockData';
import { fetchDiscoverItems } from '../lib/api';
import { SimEngine } from './CityGraph/SimEngine';
import { ActivityFeed } from './ActivityFeed';

// Lazy-load Leaflet so it doesn't block the initial render
const CityGraphMap = lazy(() => import('./CityGraph/CityGraphMap'));

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
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [activities, setActivities] = useState([]);
  const simEdgeCallbackRef = useRef(null);
  const simEngineRef = useRef(null);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchDiscoverItems({})
      .then(data => {
        if (cancelled) return;
        setListings(data.listings || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!listings?.length) return;
    const initialItems = listings.slice(0, 5).map(l => ({
      id: `real-${l.id}`,
      text: `New listing: ${l.title}`,
      color: '#A78BFA',
      type: 'listing',
      time: '5m',
      ts: Date.now() - 300000,
    }));
    setActivities(initialItems);
  }, [listings]);

  useEffect(() => {
    const sim = new SimEngine({
      onSimEdge: (edge) => {
        if (simEdgeCallbackRef.current) simEdgeCallbackRef.current(edge);
      },
      onActivity: (act) => {
        setActivities(prev => [act, ...prev].slice(0, 20));
      },
    });
    simEngineRef.current = sim;
    sim.start();
    return () => sim.stop();
  }, []);

  const handleEntitiesLoad = useCallback((entities) => {
    if (simEngineRef.current) {
      simEngineRef.current.setEntities(entities);
    }
  }, []);

  const todaysSeed = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const shuffled = [...mockDemands].sort((a, b) =>
    (a.id + todaysSeed).localeCompare(b.id + todaysSeed)
  );
  const visibleDemands = shuffled.slice(0, 4);

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Dashboard Top Row */}
      <div>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>
          Ipê City <span className="text-gradient-cyan">Marketplace</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <StatCard icon={TrendingUp} color="#B4F44A" title="Volume 24h" value="$8.2k" subtext="+12%" />
          <StatCard icon={Users} color="#38BDF8" title="Active Citizens" value="1,240" subtext="Ipê City" />
          <StatCard icon={Store} color="#818CF8" title="On-Chain Stores" value="48" subtext="Operating" />
          <StatCard icon={Network} color="#F59E0B" title="Connected Intents" value="156" subtext="Today" />
        </div>
      </div>

      {/* Main Map + Sidebar */}
      <div className="home-layout glass-panel" style={{ height: '600px', borderRadius: '24px', overflow: 'hidden' }}>
        {/* Map takes up most of the space */}
        <div className="home-map-area">
          <Suspense fallback={<div style={{ width:'100%', height:'100%', background:'#0B1421' }} />}>
            <CityGraphMap 
              onRegisterSimEdge={(fn) => { simEdgeCallbackRef.current = fn; }} 
              onEntitiesLoad={handleEntitiesLoad}
            />
          </Suspense>
        </div>

        {/* Live Activity Feed sidebar */}
        <aside className="activity-feed">
          <ActivityFeed activities={activities} />
        </aside>
      </div>

      {/* Village Demands Panel */}
      <div>
        <h3 style={{ fontSize: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={20} color="#F43F5E" /> Village Demands (Gaps)
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8, fontWeight: 400 }}>
            · Last analyzed {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {visibleDemands.map(demand => (
            <div 
              key={demand.id} 
              className="glass-panel" 
              style={{ padding: '16px', borderLeft: demand.urgency === 'High' ? '3px solid #F43F5E' : demand.urgency === 'Medium' ? '3px solid #F59E0B' : '3px solid #38BDF8', cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => setSelectedDemand(demand)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>{demand.title}</h4>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{demand.category}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{demand.tags.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demand Modal */}
      {selectedDemand && (
        <div className="modal-overlay" onClick={() => setSelectedDemand(null)}>
          <div className="modal-box glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', marginBottom: 8, display: 'inline-block' }}>
                  {selectedDemand.category} · {selectedDemand.urgency} Urgency
                </span>
                <h3 style={{ fontSize: 22, fontWeight: 800 }}>{selectedDemand.title}</h3>
              </div>
              <button className="btn-icon" onClick={() => setSelectedDemand(null)}><X size={20} /></button>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Detailed Description</h4>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{selectedDemand.description}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Required Tags</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedDemand.tags.map(tag => (
                  <span key={tag} className="store-tag">{tag}</span>
                ))}
              </div>
            </div>

            <button className="checkout-cta" style={{ width: '100%' }} onClick={() => setSelectedDemand(null)}>
              <Zap size={16} /> I Can Supply This
            </button>
          </div>
        </div>
      )}

      {/* Quick Action / Core AI Tip */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid #B4F44A' }}>
        <Zap size={24} color="#B4F44A" />
        <div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>Core Tip</p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>High demand for tech services in Ipê City today. Chat with Core to list a service at a premium price.</p>
        </div>
      </div>

    </div>
  );
};

export default HomePage;
