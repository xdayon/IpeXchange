import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, ShieldCheck, Lock, Zap, CheckCircle2,
  TrendingUp, Users, Star, Clock, ExternalLink,
  ChevronRight, Sparkles, AlertCircle, BarChart3,
  Award, ArrowUpRight, Wallet, Info
} from 'lucide-react';

// ─── Mock reviewer data ───────────────────────────────────
const MOCK_REVIEWS = [
  { name: 'carlos.ipecity.eth', rep: 92, text: 'Received my return on time, excellent communication. Highly recommend!', date: '2 months ago', stars: 5 },
  { name: 'ana.ipecity.eth', rep: 88, text: 'Very solid project. The applicant\'s on-chain history was decisive for my trust.', date: '3 months ago', stars: 5 },
  { name: 'marcos.ipecity.eth', rep: 96, text: 'Second time investing. Return on time and verified projects.', date: '5 months ago', stars: 5 },
];

const MOCK_TX_HISTORY = [
  { type: 'Installment Payment', amount: '$ 375', date: 'Apr 2026', status: 'confirmed' },
  { type: 'Installment Payment', amount: '$ 375', date: 'Mar 2026', status: 'confirmed' },
  { type: 'Installment Payment', amount: '$ 375', date: 'Feb 2026', status: 'confirmed' },
  { type: 'Contract Started', amount: '$ 9,000', date: 'Jan 2026', status: 'confirmed' },
];

// ─── Yield chart (CSS-based) ──────────────────────────────
const YieldChart = ({ amount, rate }) => {
  const rateNum = parseFloat(rate?.replace(/[^\d.]/g, '')) || 4.5;
  const months = [6, 12, 18, 24, 36];
  const points = months.map(m => ({
    month: m,
    value: amount * (1 + (rateNum / 100) * (m / 12)),
  }));
  const maxVal = points[points.length - 1].value;

  return (
    <div className="yield-chart">
      <div className="yield-bars">
        {points.map((p, i) => (
          <div key={i} className="yield-bar-wrap">
            <div
              className="yield-bar"
              style={{
                height: `${(p.value / maxVal) * 100}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div className="yield-bar-tooltip">
                $ {p.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <span className="yield-month-label">{p.month}m</span>
          </div>
        ))}
      </div>
      <div className="yield-baseline" />
    </div>
  );
};

// ─── Simulator ────────────────────────────────────────────
const InvestmentSimulator = ({ opp }) => {
  const [amount, setAmount] = useState(1000);
  const rateNum = parseFloat(opp.rate?.replace(/[^\d.]/g, '')) || 4.5;

  const calc = (months) => (amount * (1 + (rateNum / 100) * (months / 12)));
  const profit12 = calc(12) - amount;

  return (
    <div className="simulator-section glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <BarChart3 size={18} color="#B4F44A" />
        <h4 style={{ fontSize: 16, fontWeight: 700 }}>Yield Simulator</h4>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Amount to invest</label>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#B4F44A' }}>
            $ {amount.toLocaleString('en-US')}
          </span>
        </div>
        <input
          type="range"
          min={500}
          max={50000}
          step={500}
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="yield-slider"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
          <span>$ 500</span>
          <span>$ 50,000</span>
        </div>
      </div>

      {/* Chart */}
      <YieldChart amount={amount} rate={opp.rate} />

      {/* Projections */}
      <div className="simulator-projections">
        {[
          { months: 6, label: '6 months' },
          { months: 12, label: '1 year' },
          { months: 24, label: '2 years' },
          { months: parseInt(opp.term) || 24, label: `${opp.term} (contract)` },
        ].filter((v, i, arr) => arr.findIndex(x => x.months === v.months) === i).map(({ months, label }) => {
          const result = calc(months);
          const gain = result - amount;
          return (
            <div key={months} className="sim-proj-card glass-panel">
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#B4F44A' }}>
                $ {result.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 3 }}>
                <ArrowUpRight size={11} />+$ {gain.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
          );
        })}
      </div>

      <div className="sim-apy-note">
        <Info size={13} color="#38BDF8" />
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          APY {opp.rate} · Network historical default rate: <strong style={{ color: '#B4F44A' }}>0.3%</strong>
        </p>
      </div>
    </div>
  );
};

// ─── Confirm Modal ────────────────────────────────────────
const ConfirmModal = ({ opp, amount, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const MOCK_TX = '0x9c4f...3aE1';

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 2400);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box glass-panel">
        {done ? (
          <div className="invest-success">
            <div className="success-glow-ring" />
            <CheckCircle2 size={48} color="#B4F44A" />
            <h3 style={{ fontSize: 22, fontWeight: 800, marginTop: 20, marginBottom: 8 }}>
              Investment <span className="text-gradient-lime">Confirmed!</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              Your contract was registered on-chain with ZKP privacy.
            </p>
            <div className="success-tx-card glass-panel" style={{ width: '100%' }}>
              <div className="success-tx-row">
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>TX Hash</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#B4F44A', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {MOCK_TX} <ExternalLink size={11} />
                </span>
              </div>
              <div className="success-tx-row" style={{ marginTop: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Invested amount</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#B4F44A' }}>
                  $ {amount.toLocaleString('en-US')}
                </span>
              </div>
              <div className="success-tx-row" style={{ marginTop: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Term</span>
                <span style={{ fontSize: 12 }}>{opp.term}</span>
              </div>
            </div>
            <div className="success-rep-boost glass-panel" style={{ marginTop: 12, width: '100%' }}>
              <Sparkles size={14} color="#B4F44A" />
              <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                +5 <strong>Reputation Score</strong> points for investing in the community!
              </p>
            </div>
            <button className="checkout-cta" style={{ marginTop: 20, width: '100%' }} onClick={onConfirm}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Confirm Investment</h3>
              <button className="btn-icon" onClick={onClose} style={{ fontSize: 18 }}>✕</button>
            </div>
            <div className="breakdown-row" style={{ marginBottom: 10 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Project</span>
              <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 200, textAlign: 'right' }}>{opp.title}</span>
            </div>
            <div className="breakdown-row" style={{ marginBottom: 10 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Amount</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#B4F44A' }}>$ {amount.toLocaleString('en-US')}</span>
            </div>
            <div className="breakdown-row" style={{ marginBottom: 10 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Rate</span>
              <span style={{ fontSize: 13 }}>{opp.rate}</span>
            </div>
            <div className="breakdown-row" style={{ marginBottom: 10 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Term</span>
              <span style={{ fontSize: 13 }}>{opp.term}</span>
            </div>
            <div className="breakdown-row" style={{ marginBottom: 16 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Collateral</span>
              <span style={{ fontSize: 13, color: '#38BDF8' }}>{opp.collateral || 'On-chain reputation'}</span>
            </div>
            <div className="checkout-warning" style={{ marginBottom: 16 }}>
              <AlertCircle size={13} color="#F59E0B" />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                P2P investments carry risk. Smart contract guarantees collateral, but returns are not guaranteed.
              </p>
            </div>
            <button className="checkout-cta" onClick={handleConfirm} disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing contract...</>
              ) : (
                <><Lock size={14} /> Sign On-Chain Contract <ChevronRight size={16} /></>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────
const InvestmentDetail = ({ opp, onBack }) => {
  const [investAmount, setInvestAmount] = useState(1000);
  const [showModal, setShowModal] = useState(false);
  const [invested, setInvested] = useState(false);
  const c = opp.typeColor || '#B4F44A';

  const rateNum = parseFloat(opp.rate?.replace(/[^\d.]/g, '')) || 4.5;

  return (
    <div className="invest-detail-layout container">
      {showModal && (
        <ConfirmModal
          opp={opp}
          amount={investAmount}
          onClose={() => setShowModal(false)}
          onConfirm={() => { setShowModal(false); setInvested(true); onBack(); }}
        />
      )}

      {/* Back button */}
      <button className="checkout-back-btn" onClick={onBack} style={{ marginBottom: 24 }}>
        <ArrowLeft size={18} />
        Back to Capital
      </button>

      <div className="invest-detail-grid">
        {/* ── LEFT COLUMN ── */}
        <div className="invest-detail-main">
          {/* Hero card */}
          <div className="invest-detail-hero glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c}18`, border: `1px solid ${c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} color={c} />
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: 1, padding: '2px 8px', borderRadius: 100, border: `1px solid ${c}30`, background: `${c}10` }}>
                  {opp.type}
                </span>
                <p style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{opp.owner}</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={15} color={opp.reputationScore >= 95 ? '#B4F44A' : '#38BDF8'} />
                <span style={{ fontWeight: 800, fontSize: 18, color: opp.reputationScore >= 95 ? '#B4F44A' : '#38BDF8' }}>
                  Rep {opp.reputationScore}
                </span>
              </div>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, lineHeight: 1.3 }}>{opp.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{opp.description}</p>

            {/* Financials row */}
            <div className="invest-financials" style={{ marginBottom: 20 }}>
              <div className="invest-stat">
                <span className="invest-stat-label">Target Amount</span>
                <span className="invest-stat-value" style={{ color: c }}>{opp.amount}</span>
              </div>
              <div className="invest-stat">
                <span className="invest-stat-label">Interest</span>
                <span className="invest-stat-value">{opp.rate}</span>
              </div>
              <div className="invest-stat">
                <span className="invest-stat-label">Term</span>
                <span className="invest-stat-value">{opp.term}</span>
              </div>
              {opp.backers && (
                <div className="invest-stat">
                  <span className="invest-stat-label">Backers</span>
                  <span className="invest-stat-value">{opp.backers}</span>
                </div>
              )}
            </div>

            {/* Progress */}
            {opp.raised !== null && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Funding in progress</span>
                  <span style={{ fontWeight: 800, color: c }}>{opp.raised}% raised</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${opp.raised}%`, background: `linear-gradient(to right, ${c}88, ${c})`, borderRadius: 8 }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                  {100 - opp.raised}% left to target — {opp.backers} active investors
                </p>
              </div>
            )}

            {/* Badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {opp.badges?.map(b => (
                <span key={b} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Lock size={9} /> {b}
                </span>
              ))}
            </div>
          </div>

          {/* Collateral & Security */}
          <div className="invest-security-section glass-panel">
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={15} color="#38BDF8" /> On-Chain Security
            </h4>
            <div className="invest-security-grid">
              {[
                { icon: ShieldCheck, color: '#B4F44A', title: 'Collateral', desc: opp.collateral || 'On-chain reputation tokens' },
                { icon: Lock, color: '#38BDF8', title: 'ZKP Privacy', desc: 'Private but verifiable financial data' },
                { icon: Zap, color: '#818CF8', title: 'Smart Contract', desc: 'Immutable contract, no middlemen' },
                { icon: TrendingUp, color: '#F59E0B', title: 'Auto Escrow', desc: 'Funds released upon verified milestones' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon size={16} color={item.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction History */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={15} color="#818CF8" /> On-Chain History
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MOCK_TX_HISTORY.map((tx, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{tx.type}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{tx.date}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#B4F44A' }}>{tx.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={15} color="#F59E0B" /> Investor Reviews
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {MOCK_REVIEWS.map((r, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #38BDF8, #818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000' }}>
                        {r.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#38BDF8' }}>{r.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Rep {r.rep}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[...Array(r.stars)].map((_, j) => <Star key={j} size={12} color="#F59E0B" fill="#F59E0B" />)}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.text}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>{r.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Sticky Sidebar) ── */}
        <div className="invest-detail-sidebar">
          {/* Simulator */}
          <InvestmentSimulator opp={opp} />

          {/* CTA */}
          <div className="invest-cta-card glass-panel">
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                How much do you want to invest?
              </label>
              <div className="invest-amount-input-wrap">
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>$</span>
                <input
                  type="number"
                  value={investAmount}
                  onChange={e => setInvestAmount(Number(e.target.value))}
                  className="invest-amount-input"
                  min={100}
                  step={100}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {[500, 1000, 5000, 10000].map(v => (
                <button
                  key={v}
                  onClick={() => setInvestAmount(v)}
                  className={`invest-preset-btn ${investAmount === v ? 'active' : ''}`}
                >
                  $ {v.toLocaleString('en-US')}
                </button>
              ))}
            </div>

            <div className="breakdown-row" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Estimated return (1 year)</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#B4F44A' }}>
                $ {(investAmount * (1 + (rateNum / 100))).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>

            <button
              className="checkout-cta"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => setShowModal(true)}
            >
              <Wallet size={16} />
              Invest Now
              <ArrowUpRight size={16} />
            </button>

            <p style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
              Protected by Smart Contract · ZKP Privacy · Auto Escrow
            </p>
          </div>

          {/* Stats sidebar */}
          <div className="invest-stats-sidebar glass-panel">
            {[
              { label: 'Network default rate', value: '0.3%', color: '#22c55e' },
              { label: 'Avg Xchange APY', value: '5.1%', color: '#B4F44A' },
              { label: 'Total network capital', value: '$ 450K', color: '#38BDF8' },
              { label: 'Verified transactions', value: '1,847', color: '#818CF8' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetail;
