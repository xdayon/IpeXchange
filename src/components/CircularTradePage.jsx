import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Layers, Zap } from 'lucide-react';
import MultiHopTradeCard from './MultiHopTradeCard';

let API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
if (API_URL.startsWith('http') && !API_URL.endsWith('/api')) {
  API_URL += '/api';
}

const CircularTradePage = () => {
  const [cycles, setCycles]       = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const fetchCycles = async () => {
    setIsScanning(true);
    try {
      // Use the user's real session; fall back to the seeded demo session for new users
      const sessionId = localStorage.getItem('ipeCoreSessionId') || 'test-session-id';
      const res = await fetch(`${API_URL}/cycles/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        const fetched = data.cycles || [];

        // If no semantic cycles found for this session, also fetch the demo session cycles
        if (fetched.length === 0) {
          const demoRes = await fetch(`${API_URL}/cycles/test-session-id`);
          if (demoRes.ok) {
            const demoData = await demoRes.json();
            setCycles(demoData.cycles || []);
          } else {
            setCycles([]);
          }
        } else {
          setCycles(fetched);
        }
      }
    } catch (err) {
      console.error('Error fetching cycles:', err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const bestScore = cycles.length > 0
    ? Math.max(...cycles.map(c => parseFloat(c.matchScore) || 0))
    : 0;

  return (
    <div className="inner-page container">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 28, marginBottom: 6 }}>
              Multi-hop <span className="text-gradient-cyan">Trades</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 600 }}>
              AI analyzes the entire city network to find indirect matches. Sign smart contracts to execute chain trades.
            </p>
          </div>
          <button
            onClick={fetchCycles}
            disabled={isScanning}
            className="checkout-cta"
            style={{ maxWidth: 220, background: 'linear-gradient(135deg, #818CF8, #38BDF8)' }}
          >
            <RefreshCw size={16} className={isScanning ? 'spin-animation' : ''} />
            {isScanning ? 'Analyzing graph...' : 'Search New Cycles'}
          </button>
        </div>

        {/* Stats — dynamic from real data */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} color="#38BDF8" />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800 }}>{isScanning ? '…' : cycles.length}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cycles Found</p>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(180,244,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="#B4F44A" />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800 }}>{isScanning ? '…' : cycles.length > 0 ? `${bestScore}%` : '—'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Best Match Score</p>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#818CF8" />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800 }}>pgvector</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Semantic Engine</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cycle List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {isScanning && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Activity size={24} className="pulse-anim" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--accent-cyan)' }} />
            Analyzing the city trade graph...
          </div>
        )}
        {!isScanning && cycles.length === 0 && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No circular trade cycles found matching your current listings and demands.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Try adding more listings or exploring other categories.</p>
          </div>
        )}
        {!isScanning && cycles.map(cycle => (
          <MultiHopTradeCard key={cycle.id} cycle={cycle} />
        ))}
      </div>
    </div>
  );
};

export default CircularTradePage;
