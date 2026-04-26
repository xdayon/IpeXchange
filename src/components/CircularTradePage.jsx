import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Layers } from 'lucide-react';
import MultiHopTradeCard from './MultiHopTradeCard';



const CircularTradePage = () => {
  const [cycles, setCycles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const fetchCycles = async () => {
    setIsScanning(true);
    try {
      // Hardcoded test-session-id until real auth is implemented
      const res = await fetch('https://ipexchange.onrender.com/api/cycles/test-session-id');
      if (res.ok) {
        const data = await res.json();
        setCycles(data.cycles || []);
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

  const handleScan = () => {
    fetchCycles();
  };

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
              Artificial Intelligence analyzes the entire city network to find indirect matches. Sign smart contracts to execute chain trades.
            </p>
          </div>
          <button 
            onClick={handleScan}
            disabled={isScanning}
            className="checkout-cta" 
            style={{ maxWidth: 220, background: 'linear-gradient(135deg, #818CF8, #38BDF8)' }}
          >
            <RefreshCw size={16} className={isScanning ? "spin-animation" : ""} />
            {isScanning ? 'Analyzing Graph...' : 'Search New Cycles'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} color="#38BDF8" />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800 }}>2</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Pending Cycles</p>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(180,244,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="#B4F44A" />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800 }}>98%</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Max Match Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cycle List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {cycles.length === 0 && !isScanning && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No circular trade cycles found matching your current demands and listings.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Try adding more listings or exploring other categories.</p>
          </div>
        )}
        {cycles.map(cycle => (
          <MultiHopTradeCard key={cycle.id} cycle={cycle} />
        ))}
      </div>
    </div>
  );
};

export default CircularTradePage;
