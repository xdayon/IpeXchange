import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Layers, Zap, DollarSign, GitBranch } from 'lucide-react';
import MultiHopTradeCard from './MultiHopTradeCard';

let API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
if (API_URL.startsWith('http') && !API_URL.endsWith('/api')) API_URL += '/api';

const CircularTradePage = ({ onNavigate }) => {
  const [cycles, setCycles]       = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [filter, setFilter]       = useState('all'); // all | 3 | 4 | 5

  const fetchCycles = async () => {
    setIsScanning(true);
    try {
      const sessionId = localStorage.getItem('ipeCoreSessionId') || 'test-session-id';
      const res = await fetch(`${API_URL}/cycles/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        const fetched = data.cycles || [];

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

  useEffect(() => { fetchCycles(); }, []);

  const bestScore = cycles.length > 0
    ? Math.max(...cycles.map(c => parseFloat(c.matchScore) || 0))
    : 0;

  const bestBalance = cycles.length > 0
    ? Math.max(...cycles.map(c => parseFloat(c.valueRatio) || 0))
    : 0;

  // Filter by hop count
  const filtered = filter === 'all'
    ? cycles
    : cycles.filter(c => (c.hops || c.nodes?.length || 3) === parseInt(filter));

  const hopCounts = [...new Set(cycles.map(c => c.hops || c.nodes?.length || 3))].sort();

  return (
    <div className="inner-page container">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 28, marginBottom: 6 }}>
              Multi-hop <span className="text-gradient-cyan">Trades</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 600 }}>
              AI finds balanced circular trades across users and stores — 3 to 5 participants, value-matched within 30%.
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

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} color="#38BDF8" />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800 }}>{isScanning ? '…' : cycles.length}</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Cycles Found</p>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(180,244,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} color="#B4F44A" />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800 }}>{isScanning ? '…' : cycles.length > 0 ? `${bestScore}%` : '—'}</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Best Match</p>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(180,244,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="#B4F44A" />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800 }}>{isScanning ? '…' : cycles.length > 0 ? `${bestBalance}%` : '—'}</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Value Balance</p>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitBranch size={18} color="#818CF8" />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800 }}>{isScanning ? '…' : hopCounts.length > 0 ? `${Math.min(...hopCounts)}–${Math.max(...hopCounts)}` : '—'}</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Hop Range</p>
            </div>
          </div>
        </div>

        {/* Hop filter chips */}
        {!isScanning && cycles.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilter('all')}
              style={{ padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: filter === 'all' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === 'all' ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.1)'}`, color: filter === 'all' ? '#38BDF8' : 'var(--text-secondary)' }}
            >
              All Cycles
            </button>
            {hopCounts.map(h => (
              <button
                key={h}
                onClick={() => setFilter(String(h))}
                style={{ padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: filter === String(h) ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filter === String(h) ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.1)'}`, color: filter === String(h) ? '#818CF8' : 'var(--text-secondary)' }}
              >
                {h}-Hop
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cycles list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {isScanning && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Activity size={24} className="pulse-anim" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--accent-cyan)' }} />
            Analyzing city trade graph for 3 to 5-hop balanced cycles...
          </div>
        )}
        {!isScanning && filtered.length === 0 && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No {filter !== 'all' ? `${filter}-hop ` : ''}circular trade cycles found.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Try adding more listings or searching again.</p>
          </div>
        )}
        {!isScanning && filtered.map(cycle => (
          <MultiHopTradeCard key={cycle.id} cycle={cycle} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
};

export default CircularTradePage;
