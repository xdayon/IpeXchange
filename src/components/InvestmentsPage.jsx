import React, { useState } from 'react';
import { TrendingUp, Users, Briefcase, ShieldCheck, Zap, Lock, Star, ChevronRight, ArrowUpRight } from 'lucide-react';

const FILTERS = ['All', 'Investment', 'Partnership', 'Jobs', 'Products', 'Services', 'Donations'];

const OPPORTUNITIES = [
  {
    id: 'i1',
    type: 'Investment',
    typeColor: '#B4F44A',
    title: 'Ipê Bakery Expansion',
    owner: 'marina.ipecity.eth',
    reputationScore: 98,
    amount: '$45,000',
    rate: '4.2% APY',
    term: '24 months',
    raised: 68,
    collateral: 'Commercial Property NFT',
    backers: 14,
    description: 'We need capital to open a second branch on Av. das Rendeiras. Projected return based on 3 years of on-chain verified history.',
    badges: ['ZKP Secured', 'On-Chain Proof', 'Reputation 98'],
  },
  {
    id: 'i2',
    type: 'Partnership',
    typeColor: '#38BDF8',
    title: 'Partner for Custom Car Workshop',
    owner: 'carlostech.ipecity.eth',
    reputationScore: 94,
    amount: '$80,000',
    rate: '50% equity',
    term: 'Long term',
    raised: 30,
    collateral: 'Equipment + Reputation',
    backers: 3,
    description: 'Looking for a partner with capital for painting and customization equipment. I already have the physical space and a client base with 89 on-chain verified transactions.',
    badges: ['ZKP Secured', 'Smart Contract', 'Verified'],
  },
  {
    id: 'i3',
    type: 'Jobs',
    typeColor: '#818CF8',
    title: 'Web Developer – City Platform',
    owner: 'ipehub.ipecity.eth',
    reputationScore: 99,
    amount: '4,000 USDC/month',
    rate: 'Contractor',
    term: 'Full-time',
    raised: 100,
    collateral: null,
    backers: 1,
    description: 'Looking for a React/Node.js dev to work on the Ipê ecosystem. Salary in USDC + city reputation tokens. Hybrid work in Jurerê.',
    badges: ['Crypto Payment', 'Reputation Tokens', 'Web3 Native'],
  },
  {
    id: 'i4',
    type: 'Products',
    typeColor: '#F59E0B',
    title: 'Trek Electric Bike – Like new',
    owner: 'dayonx.ipecity.eth',
    reputationScore: 95,
    amount: '$6,500',
    rate: 'Trade accepted',
    term: 'Single sale',
    raised: null,
    collateral: null,
    backers: null,
    description: 'Trek FX+ with full battery. 200km ridden. Accepting trade for design services, crypto, or Fiat. On-chain verified transaction history.',
    badges: ['ZKP Proof', 'Reputation 95', 'Trade Accepted'],
  },
  {
    id: 'i5',
    type: 'Services',
    typeColor: '#F472B6',
    title: 'Plumbing and Hydraulic Maintenance',
    owner: 'roberto.ipecity.eth',
    reputationScore: 87,
    amount: 'From $150',
    rate: 'Per service',
    term: 'Available now',
    raised: null,
    collateral: null,
    backers: null,
    description: 'Plumber with 12 years of experience. 43 on-chain registered services with a 4.8★ average rating. Serving all of Jurerê and surrounding areas.',
    badges: ['Reputation 87', 'On-Chain Reviews', 'Available'],
  },
  {
    id: 'i6',
    type: 'Donations',
    typeColor: '#F43F5E',
    title: 'Donation: 3-Seater Sofa + Chairs',
    owner: 'ana.ipecity.eth',
    reputationScore: 91,
    amount: 'Free',
    rate: 'Donation',
    term: 'Local pickup',
    raised: null,
    collateral: null,
    backers: null,
    description: 'Moving houses, donating a 3-seater retractable sofa + 4 chairs. Good condition. On-chain donation record for your reputation portfolio.',
    badges: ['Rep+ when Donating', 'ZKP Identity', 'Verified'],
  },
  {
    id: 'i7',
    type: 'Investment',
    typeColor: '#B4F44A',
    title: 'Jurerê Solar Energy Project',
    owner: 'solarpower.ipecity.eth',
    reputationScore: 97,
    amount: '$120,000',
    rate: '5.8% APY',
    term: '36 months',
    raised: 45,
    collateral: 'Photovoltaic equipment',
    backers: 28,
    description: 'Installation of a community solar plant to reduce energy costs for partner stores. Investment backed by real equipment collateral.',
    badges: ['ZKP Secured', 'Sustainable', 'Smart Contract'],
  },
  {
    id: 'i8',
    type: 'Partnership',
    typeColor: '#38BDF8',
    title: 'Co-working & Event Space Hub',
    owner: 'ipehub.ipecity.eth',
    reputationScore: 99,
    amount: '$200,000',
    rate: 'Equity share',
    term: 'Indefinite',
    raised: 85,
    collateral: '10-year lease agreement',
    backers: 12,
    description: 'We are finalizing the largest innovation hub in Jurerê. Looking for strategic partners to manage the cafe and event area.',
    badges: ['Verified Provider', 'High Return', 'Community Hub'],
  },
  {
    id: 'i9',
    type: 'Investment',
    typeColor: '#B4F44A',
    title: 'Vertical Urban Farming',
    owner: 'biofarm.ipecity.eth',
    reputationScore: 95,
    amount: '$35,000',
    rate: '4.5% APY',
    term: '18 months',
    raised: 15,
    collateral: 'Future production (Tokenized)',
    backers: 6,
    description: 'Vertical hydroponic system for large-scale microgreens production within the city. Low operational cost and high demand.',
    badges: ['Eco Friendly', 'ZKP Proof', 'High Tech'],
  },
  {
    id: 'i10',
    type: 'Services',
    typeColor: '#F472B6',
    title: 'Web3 & Smart Contracts Consulting',
    owner: 'soliditydev.ipecity.eth',
    reputationScore: 92,
    amount: '$250/hour',
    rate: 'Hourly',
    term: 'On demand',
    raised: null,
    collateral: null,
    backers: null,
    description: 'Senior developer available for contract auditing and decentralized systems architecture for your local business.',
    badges: ['Verified Expert', 'Crypto Payment', 'On-Chain Proof'],
  },
];

const typeIcon = { Investment: TrendingUp, Partnership: Users, Jobs: Briefcase, Products: ShieldCheck, Services: Zap, Donations: Star };

const OpportunityCard = ({ opp, onInvest }) => {
  const Icon = typeIcon[opp.type] || Zap;
  const c = opp.typeColor;
  return (
    <div className="glass-panel invest-card">
      <div className="invest-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c}15`, border: `1px solid ${c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={18} style={{ color: c }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: 1, padding: '2px 8px', borderRadius: 100, border: `1px solid ${c}30`, background: `${c}10` }}>
            {opp.type}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={13} style={{ color: opp.reputationScore >= 95 ? '#B4F44A' : '#38BDF8' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: opp.reputationScore >= 95 ? '#B4F44A' : '#38BDF8' }}>Rep {opp.reputationScore}</span>
        </div>
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 700, margin: '14px 0 8px', lineHeight: 1.3 }}>{opp.title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>{opp.description}</p>

      {/* Financials */}
      <div className="invest-financials">
        <div className="invest-stat">
          <span className="invest-stat-label">Amount</span>
          <span className="invest-stat-value" style={{ color: c }}>{opp.amount}</span>
        </div>
        <div className="invest-stat">
          <span className="invest-stat-label">{opp.type === 'Investment' ? 'Interest' : 'Model'}</span>
          <span className="invest-stat-value">{opp.rate}</span>
        </div>
        <div className="invest-stat">
          <span className="invest-stat-label">Term</span>
          <span className="invest-stat-value">{opp.term}</span>
        </div>
        {opp.backers !== null && (
          <div className="invest-stat">
            <span className="invest-stat-label">{opp.type === 'Jobs' ? 'Positions' : 'Backers'}</span>
            <span className="invest-stat-value">{opp.backers}</span>
          </div>
        )}
      </div>

      {/* Progress bar for investments */}
      {opp.raised !== null && opp.type !== 'Jobs' && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
            <span>Raised</span>
            <span style={{ fontWeight: 700, color: c }}>{opp.raised}%</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${opp.raised}%`, background: `linear-gradient(to right, ${c}88, ${c})`, borderRadius: 4, transition: 'width 1s ease' }} />
          </div>
        </div>
      )}

      {/* Security Badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {opp.badges.map(b => (
          <span key={b} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lock size={9} /> {b}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{opp.owner}</span>
        <button
          onClick={() => onInvest && onInvest(opp)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: c, background: `${c}10`, border: `1px solid ${c}30`, borderRadius: 100, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = `${c}25`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${c}10`; }}
        >
          {opp.type === 'Investment' ? '📈 Invest' : opp.type === 'Jobs' ? 'Apply' : opp.type === 'Donations' ? 'Request' : 'View more'}
          <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
};

const InvestmentsPage = ({ onNavigate }) => {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? OPPORTUNITIES : OPPORTUNITIES.filter(o => o.type === filter);

  const handleInvest = (opp) => {
    if (onNavigate) {
      onNavigate('investment-detail', { opp, sourceTab: 'investments' });
    }
  };

  return (
    <div className="inner-page container">
      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 28, marginBottom: 8 }}>
              Xchange <span className="text-gradient-cyan">Capital</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 560 }}>
              Investments, partnerships, and opportunities in the city — 100% on-chain, with verified reputation and low interest rates guaranteed by smart contracts.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <span className="badge" style={{ background: 'rgba(180,244,74,0.08)', borderColor: 'rgba(180,244,74,0.3)', color: '#B4F44A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={13} /> Reputation-Backed Loans
            </span>
            <span className="badge" style={{ background: 'rgba(56,189,248,0.08)', borderColor: 'rgba(56,189,248,0.3)', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={12} /> ZKP Financial Privacy
            </span>
            <span className="badge" style={{ background: 'rgba(129,140,248,0.08)', borderColor: 'rgba(129,140,248,0.3)', color: '#818CF8', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⬡ Smart Contract Secured
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Capital on network', value: '$2.3M', color: '#B4F44A' },
            { label: 'On-chain Tx', value: '1,847', color: '#38BDF8' },
            { label: 'Default rate', value: '0.3%', color: '#818CF8' },
            { label: 'Average APY', value: '5.1%', color: '#F59E0B' },
          ].map(stat => (
            <div key={stat.label} className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Artizen Banner */}
        <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(180,244,74,0.05))', padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, border: '1px solid rgba(56,189,248,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56,189,248,0.3)' }}>
              <Star size={24} color="#38BDF8" />
            </div>
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                Grants & Crowdfunding <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: '#38BDF8', color: '#000', fontWeight: 800 }}>POWERED BY ARTIZEN</span>
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400 }}>Community projects and local startups seeking funding. Support with donations or buy equity shares.</p>
            </div>
          </div>
          <button style={{ padding: '10px 20px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            Explore Grants
          </button>
        </div>

        <div className="filter-chips">
          {FILTERS.map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="invest-grid">
        {filtered.map(opp => <OpportunityCard key={opp.id} opp={opp} onInvest={handleInvest} />)}
      </div>

      {/* How it works */}
      <div className="glass-panel" style={{ marginTop: 32, padding: '28px 32px' }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>How on-chain security works</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { icon: ShieldCheck, color: '#B4F44A', title: 'Reputation Score', desc: 'Every transaction, review, and paid loan strengthens your on-chain score, visible to any participant.' },
            { icon: Lock, color: '#38BDF8', title: 'ZKP Privacy', desc: 'Zero-knowledge proofs ensure your financial data remains private, yet verifiable.' },
            { icon: Zap, color: '#818CF8', title: 'Smart Contracts', desc: 'Loans are encoded in immutable contracts. No intermediaries, no surprises.' },
            { icon: TrendingUp, color: '#F59E0B', title: 'On-Chain Collateral', desc: 'Real estate NFTs, reputation tokens, and other digital assets serve as verifiable collateral.' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvestmentsPage;
