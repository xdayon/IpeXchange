// src/components/TreasuryPage.jsx
import React, { useState } from 'react';
import {
  TrendingUp, Zap, BarChart3, Globe, ArrowUpRight,
  ShieldCheck, Users, Store, Briefcase, Gift, BookOpen, Repeat
} from 'lucide-react';

// ─── Mock Treasury Data ──────────────────────────────────────────────────────

const TREASURY_BALANCE = 847_520;   // $IPE
const TAX_RATE         = '1%';
const TOTAL_TX         = 84_752;    // cumulative transactions (balance / avg tx = 847k / ~$10 avg fee)

const REVENUE_SOURCES = [
  { id: 'jobs',        label: 'Jobs & Freelance',      pct: 22, amount: 186_454, color: '#B4F44A', icon: Briefcase },
  { id: 'investments', label: 'Investments & Grants',  pct: 15, amount: 127_128, color: '#FFC857', icon: TrendingUp },
  { id: 'tech',        label: 'Tech Services',         pct: 17, amount: 144_078, color: '#38BDF8', icon: Zap },
  { id: 'products',    label: 'Physical Products',     pct: 12, amount: 101_702, color: '#818CF8', icon: Store },
  { id: 'knowledge',   label: 'Knowledge & Education', pct: 14, amount: 118_653, color: '#F472B6', icon: BookOpen },
  { id: 'commerce',    label: 'Store Commerce',        pct: 12, amount: 101_702, color: '#FB923C', icon: Store },
  { id: 'donations',   label: 'Donations & Circular',  pct:  8, amount:  67_802, color: '#34D399', icon: Gift },
];

const MONTHLY_COLLECTION = [
  { month: 'Oct', amount: 48_200 },
  { month: 'Nov', amount: 62_400 },
  { month: 'Dec', amount: 71_800 },
  { month: 'Jan', amount: 89_300 },
  { month: 'Feb', amount: 104_600 },
  { month: 'Mar', amount: 128_900 },
  { month: 'Apr', amount: 147_520 },
];

const TOP_CONTRIBUTORS = [
  { name: 'Ipê Bakery',          category: 'Food & Drink',  contribution: 12_840, pct: 1.52 },
  { name: 'AI Haus',             category: 'Venue',         contribution: 10_200, pct: 1.20 },
  { name: 'Tech Services Pool',  category: 'Services',      contribution: 9_440,  pct: 1.11 },
  { name: 'Ipê Health Clinic',   category: 'Health',        contribution: 7_980,  pct: 0.94 },
  { name: 'Grants Program',      category: 'Investment',    contribution: 7_200,  pct: 0.85 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const fmt = (n) => n.toLocaleString('en-US');

const StatBox = ({ icon: Icon, color, label, value, sub }) => (
  <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 46, height: 46, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={22} style={{ color }} />
    </div>
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: color, marginTop: 2 }}>{sub}</p>}
    </div>
  </div>
);

// CSS-only horizontal bar chart for revenue sources
const RevenueBar = ({ source, maxPct }) => {
  const Icon = source.icon;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${source.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} style={{ color: source.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
          <span style={{ fontWeight: 600 }}>{source.label}</span>
          <span style={{ color: source.color, fontWeight: 700 }}>{source.pct}% · {fmt(source.amount)} $IPE</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(source.pct / maxPct) * 100}%`,
            background: `linear-gradient(to right, ${source.color}80, ${source.color})`,
            borderRadius: 4,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>
    </div>
  );
};

// CSS-only vertical bar chart for monthly collection
const MonthlyChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.amount));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, paddingBottom: 24, position: 'relative' }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const heightPct = (d.amount / maxVal) * 100;
        return (
          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%', borderRadius: '4px 4px 0 0',
              height: `${heightPct}%`,
              background: isLast
                ? 'linear-gradient(to top, #B4F44A80, #B4F44A)'
                : 'rgba(255,255,255,0.08)',
              border: isLast ? '1px solid rgba(180,244,74,0.4)' : 'none',
              minHeight: 4,
              position: 'relative',
            }}>
              {isLast && (
                <span style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: '#B4F44A', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {fmt(d.amount)}
                </span>
              )}
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{d.month}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

const TreasuryPage = () => {
  const [activeSource, setActiveSource] = useState(null);
  const maxPct = Math.max(...REVENUE_SOURCES.map(s => s.pct));

  return (
    <div className="inner-page container" style={{ maxWidth: 960 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#B4F44A', boxShadow: '0 0 8px #B4F44A', animation: 'fast-pulse 1.5s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#B4F44A', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live · Transparent</span>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Ipê City <span className="text-gradient-lime">Treasury</span>
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 560, lineHeight: 1.6 }}>
          Every Xchange transaction contributes 1% to the DAO Treasury. These funds are governed collectively by Ipê City citizens and allocated through on-chain proposals.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatBox icon={Zap}        color="#B4F44A" label="Total Treasury Balance" value={`${fmt(TREASURY_BALANCE)} $IPE`} sub="+17.4% this month" />
        <StatBox icon={BarChart3}  color="#38BDF8" label="All-Time Transactions"  value={fmt(TOTAL_TX)}                  sub="contributing to treasury" />
        <StatBox icon={Users}      color="#818CF8" label="Active Contributors"    value="1,240"                           sub="Ipê City citizens" />
        <StatBox icon={ShieldCheck}color="#FFC857" label="Tax Rate (1% / tx)"     value={TAX_RATE}                       sub="Auto-collected on-chain" />
      </div>

      {/* Two-column: Revenue breakdown + Monthly chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Revenue by source */}
        <div className="glass-panel" style={{ padding: '28px 32px' }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Revenue by Source</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {REVENUE_SOURCES.map(s => (
              <RevenueBar key={s.id} source={s} maxPct={maxPct} />
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 16 }}>
            Based on {fmt(TOTAL_TX)} total transactions collected since launch.
          </p>
        </div>

        {/* Monthly collection + top contributors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" style={{ padding: '28px 32px' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Monthly Collection ($IPE)</h4>
            <MonthlyChart data={MONTHLY_COLLECTION} />
          </div>

          <div className="glass-panel" style={{ padding: '24px 28px' }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Top Contributors</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TOP_CONTRIBUTORS.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', width: 16 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.category}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#B4F44A' }}>{fmt(c.contribution)} $IPE</p>
                    <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{c.pct}% of total</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24 }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>How the Treasury Works</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { icon: Repeat,      color: '#38BDF8', title: 'Automatic Collection', desc: 'Every Xchange transaction has 1% automatically routed to the DAO Treasury smart contract. No intermediaries.' },
            { icon: ShieldCheck, color: '#B4F44A', title: 'On-Chain Transparency', desc: 'All treasury balances and transactions are public and verifiable on-chain. Anyone can audit at any time.' },
            { icon: Globe,       color: '#818CF8', title: 'Citizen Governance',    desc: 'Any citizen with Rep Score > 10 can create spending proposals. Decisions are made via token-weighted voting.' },
            { icon: ArrowUpRight,color: '#FFC857', title: 'Protocol Revenue',      desc: 'A portion of treasury revenue is allocated to public goods, city infrastructure, and grants each quarter.' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{item.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Governance CTA */}
      <div className="glass-panel" style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 24, borderLeft: '4px solid #B4F44A' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Want to participate in treasury decisions?</h4>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            To access detailed treasury data, participate in votes, and create budget allocation proposals, visit <strong style={{ color: 'white' }}>Ipêconomics</strong> — the city's governance platform for public finance.
          </p>
        </div>
        <a
          href="https://app.ipe.city/economics"
          target="_blank"
          rel="noreferrer"
          className="btn-primary"
          style={{ textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
        >
          <ArrowUpRight size={16} /> Open Ipêconomics
        </a>
      </div>

    </div>
  );
};

export default TreasuryPage;
