import React, { useState, useEffect } from 'react';
import { Recycle2, Leaf, Coins, Star, ChevronRight, Send, Activity, Trash2, CheckCircle2, Clock } from 'lucide-react';
import DataBadge from './DataBadge';

const CITY_STATS = [
  { material: 'Plastic',  kg: 284.7, color: '#38BDF8', icon: '🧴' },
  { material: 'Metal',    kg: 193.2, color: '#B4F44A', icon: '🔩' },
  { material: 'Glass',    kg: 121.5, color: '#818CF8', icon: '🫙' },
  { material: 'Organic',  kg: 512.0, color: '#F59E0B', icon: '🍃' },
  { material: 'E-Waste',  kg: 47.8,  color: '#F472B6', icon: '📱' },
  { material: 'Textiles', kg: 88.3,  color: '#A78BFA', icon: '👕' },
];

const MOCK_HISTORY = [
  { id: 'r1', name: 'Broken iPhone 7', material: 'E-Waste', weight: 0.18, status: 'Rewarded', submittedAt: 'Apr 12, 2026', ipeEarned: 12.5, repEarned: 8 },
  { id: 'r2', name: 'Aluminum cans (bag)', material: 'Metal', weight: 2.3, status: 'Processing', submittedAt: 'Apr 22, 2026', ipeEarned: null, repEarned: null },
  { id: 'r3', name: 'Old winter jacket', material: 'Textiles', weight: 1.1, status: 'Rewarded', submittedAt: 'Mar 30, 2026', ipeEarned: 7.0, repEarned: 5 },
  { id: 'r4', name: 'Glass wine bottles (x6)', material: 'Glass', weight: 3.6, status: 'Pending', submittedAt: 'Apr 28, 2026', ipeEarned: null, repEarned: null },
];

const MATERIALS = ['Plastic', 'Metal', 'Glass', 'Organic', 'E-Waste', 'Textiles', 'Mixed'];

const RecyclePage = () => {
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [form, setForm] = useState({ name: '', material: 'Plastic', weight: '', description: '' });
  const [submitted, setSubmitted] = useState(false);

  const totalIpe = history.filter(h => h.status === 'Rewarded').reduce((a, h) => a + (h.ipeEarned || 0), 0);
  const totalRep = history.filter(h => h.status === 'Rewarded').reduce((a, h) => a + (h.repEarned || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.weight) return;

    const newItem = {
      id: `r-${Date.now()}`,
      name: form.name,
      material: form.material,
      weight: parseFloat(form.weight),
      status: 'Pending',
      submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ipeEarned: null,
      repEarned: null,
    };

    setHistory([newItem, ...history]);
    setForm({ name: '', material: 'Plastic', weight: '', description: '' });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Rewarded': return { bg: 'rgba(180,244,74,0.1)', color: '#B4F44A', border: 'rgba(180,244,74,0.2)', icon: <CheckCircle2 size={12} /> };
      case 'Processing': return { bg: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: 'rgba(56,189,248,0.2)', icon: <Activity size={12} /> };
      default: return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: 'rgba(245,158,11,0.2)', icon: <Clock size={12} /> };
    }
  };

  return (
    <div className="inner-page container">
      {/* Hero Section */}
      <div className="glass-panel" style={{ 
        padding: '32px', 
        marginBottom: '28px', 
        background: 'linear-gradient(135deg, rgba(10,10,26,0.8), rgba(20,20,40,0.8))',
        border: '1px solid rgba(180,244,74,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, opacity: 0.1 }}>
          <Recycle2 size={180} color="#B4F44A" />
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 32, marginBottom: 12 }}>
            Recycle <span className="text-gradient-lime">Hub</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 650, lineHeight: 1.6, marginBottom: 20 }}>
            Nothing goes to waste in Ipê City. Turn your unused items into $IPE tokens and reputation — while contributing to the city's circular economy.
          </p>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(180,244,74,0.1)', borderRadius: 100, fontSize: 13, fontWeight: 700, color: '#B4F44A', border: '1px solid rgba(180,244,74,0.2)' }}>
              ♻️ Zero Waste City
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(56,189,248,0.1)', borderRadius: 100, fontSize: 13, fontWeight: 700, color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)' }}>
              ⚡ Earn $IPE
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(167,139,250,0.1)', borderRadius: 100, fontSize: 13, fontWeight: 700, color: '#A78BFA', border: '1px solid rgba(167,139,250,0.2)' }}>
              ⭐ Boost Reputation
            </span>
          </div>
        </div>
      </div>

      {/* City Recycling Stats */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} color="var(--accent-cyan)" /> City-wide Recovery Totals
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {CITY_STATS.map(stat => (
            <div key={stat.material} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</span>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{stat.material}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.kg} <span style={{ fontSize: 12, opacity: 0.7 }}>kg</span></p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Submit Form */}
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={18} color="#B4F44A" /> Submit for Recycling
          </h3>
          <form className="glass-panel" style={{ padding: '24px' }} onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700 }}>ITEM NAME</label>
              <input 
                type="text" 
                placeholder="e.g. Old Laptop, Plastic Bottles..."
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 14 }}
                required
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700 }}>MATERIAL</label>
                <select 
                  value={form.material}
                  onChange={e => setForm({...form, material: e.target.value})}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 14 }}
                >
                  {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700 }}>EST. WEIGHT (KG)</label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="0.0"
                  value={form.weight}
                  onChange={e => setForm({...form, weight: e.target.value})}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 14 }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700 }}>DESCRIPTION (OPTIONAL)</label>
              <textarea 
                placeholder="Details about the item's condition or material..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 14, minHeight: 80, resize: 'none' }}
                maxLength={200}
              />
            </div>

            <button 
              type="submit" 
              className="checkout-cta" 
              style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #B4F44A, #38BDF8)', color: '#0a0a1a' }}
            >
              <Recycle2 size={18} /> Submit for Recycling
            </button>

            {submitted && (
              <p style={{ marginTop: 12, fontSize: 13, color: '#B4F44A', textAlign: 'center', fontWeight: 700 }}>
                ✓ Item submitted! You'll earn $IPE once processed.
              </p>
            )}
          </form>
        </div>

        {/* History List */}
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="var(--accent-cyan)" /> My Recycle History
          </h3>
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ maxHeight: 420, overflowY: 'auto', padding: '8px' }}>
              {history.map(item => {
                const style = getStatusStyle(item.status);
                return (
                  <div key={item.id} style={{ padding: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.name}</h4>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 100, color: 'var(--text-secondary)' }}>
                          {item.material}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.weight} kg</span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>· {item.submittedAt}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', 
                        borderRadius: 100, fontSize: 11, fontWeight: 700, 
                        background: style.bg, color: style.color, border: `1px solid ${style.border}`,
                        marginBottom: 4
                      }}>
                        {style.icon} {item.status}
                      </span>
                      {item.ipeEarned && (
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#B4F44A' }}>
                          +{item.ipeEarned} $IPE
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ 
            width: 56, height: 56, borderRadius: 16, 
            background: 'rgba(180,244,74,0.15)', border: '1px solid rgba(180,244,74,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(180,244,74,0.2)'
          }}>
            <Coins size={28} color="#B4F44A" />
          </div>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>$IPE Earned from Recycling</p>
            <h4 style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{totalIpe.toFixed(1)} <span style={{ fontSize: 14, color: '#B4F44A' }}>$IPE</span></h4>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Tokens earned by contributing to material recovery.</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ 
            width: 56, height: 56, borderRadius: 16, 
            background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(167,139,250,0.2)'
          }}>
            <Star size={28} color="#A78BFA" />
          </div>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>Recycling Reputation</p>
            <h4 style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{totalRep} <span style={{ fontSize: 14, color: '#A78BFA' }}>pts</span></h4>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Contributes to your Ipê City citizen tier.</p>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: 40, textAlign: 'center', paddingBottom: 40 }}>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Leaf size={14} /> Part of the Ipê City Circular Economy Initiative
        </p>
      </div>
    </div>
  );
};

export default RecyclePage;
