import React, { useState } from 'react';
import { TrendingUp, Users, Briefcase, ShieldCheck, Zap, Lock, Star, ChevronRight, ArrowUpRight } from 'lucide-react';

const FILTERS = ['All', 'Investment', 'Partnership', 'Jobs', 'Products', 'Services', 'Donations'];

const OPPORTUNITIES = [
  {
    id: 'i1',
    type: 'Investment',
    typeColor: '#B4F44A',
    title: 'Expansão da Padaria do Ipê',
    owner: 'marina.ipecity.eth',
    reputationScore: 98,
    amount: 'R$ 45.000',
    rate: '4.2% a.a.',
    term: '24 meses',
    raised: 68,
    collateral: 'NFT do imóvel comercial',
    backers: 14,
    description: 'Precisamos de capital para abrir uma segunda unidade na Av. das Rendeiras. Projeção de retorno baseada em 3 anos de histórico verificado on-chain.',
    badges: ['ZKP Secured', 'On-Chain Proof', 'Reputation 98'],
  },
  {
    id: 'i2',
    type: 'Partnership',
    typeColor: '#38BDF8',
    title: 'Parceiro para Oficina de Carros Customizados',
    owner: 'carlostech.ipecity.eth',
    reputationScore: 94,
    amount: 'R$ 80.000',
    rate: '50% sociedade',
    term: 'Longo prazo',
    raised: 30,
    collateral: 'Equipamentos + reputação',
    backers: 3,
    description: 'Busco sócio com capital para equipamentos de pintura e customização. Já tenho espaço físico e carteira de clientes com 89 transações verificadas on-chain.',
    badges: ['ZKP Secured', 'Smart Contract', 'Verified'],
  },
  {
    id: 'i3',
    type: 'Jobs',
    typeColor: '#818CF8',
    title: 'Web Developer – Plataforma da Cidade',
    owner: 'ipehub.ipecity.eth',
    reputationScore: 99,
    amount: '4.000 USDC/mês',
    rate: 'CLT ou PJ',
    term: 'Full-time',
    raised: 100,
    collateral: null,
    backers: 1,
    description: 'Procuramos dev React/Node.js para trabalhar no ecossistema Ipê. Salário em USDC + tokens de reputação da cidade. Trabalho híbrido em Jurerê.',
    badges: ['Crypto Payment', 'Reputation Tokens', 'Web3 Native'],
  },
  {
    id: 'i4',
    type: 'Products',
    typeColor: '#F59E0B',
    title: 'Bicicleta Elétrica Trek – Quase nova',
    owner: 'dayonx.ipecity.eth',
    reputationScore: 95,
    amount: 'R$ 6.500',
    rate: 'Troca aceita',
    term: 'Venda única',
    raised: null,
    collateral: null,
    backers: null,
    description: 'Trek FX+ com bateria full. 200km rodados. Aceito troca por serviços de design, crypto ou BRL. Histórico de transações verificado on-chain.',
    badges: ['ZKP Proof', 'Reputation 95', 'Troca Aceita'],
  },
  {
    id: 'i5',
    type: 'Services',
    typeColor: '#F472B6',
    title: 'Encanamento e Manutenção Hidráulica',
    owner: 'roberto.ipecity.eth',
    reputationScore: 87,
    amount: 'A partir de R$ 150',
    rate: 'Por serviço',
    term: 'Disponível agora',
    raised: null,
    collateral: null,
    backers: null,
    description: 'Encanador com 12 anos de experiência. 43 serviços registrados on-chain com avaliação média 4.8★. Atendo toda região de Jurerê e adjacências.',
    badges: ['Reputation 87', 'On-Chain Reviews', 'Disponível'],
  },
  {
    id: 'i6',
    type: 'Donations',
    typeColor: '#F43F5E',
    title: 'Doação: Sofá 3 lugares + Cadeiras',
    owner: 'ana.ipecity.eth',
    reputationScore: 91,
    amount: 'Grátis',
    rate: 'Doação',
    term: 'Retirada local',
    raised: null,
    collateral: null,
    backers: null,
    description: 'Mudança de casa, doando sofá retrátil 3 lugares + 4 cadeiras. Bom estado. Registro da doação on-chain para seu portfólio de reputação.',
    badges: ['Rep+ ao Doar', 'ZKP Identidade', 'Verificado'],
  },
];

const typeIcon = { Investment: TrendingUp, Partnership: Users, Jobs: Briefcase, Products: ShieldCheck, Services: Zap, Donations: Star };

const OpportunityCard = ({ opp }) => {
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
          <span className="invest-stat-label">Valor</span>
          <span className="invest-stat-value" style={{ color: c }}>{opp.amount}</span>
        </div>
        <div className="invest-stat">
          <span className="invest-stat-label">{opp.type === 'Investment' ? 'Juros' : 'Modelo'}</span>
          <span className="invest-stat-value">{opp.rate}</span>
        </div>
        <div className="invest-stat">
          <span className="invest-stat-label">Prazo</span>
          <span className="invest-stat-value">{opp.term}</span>
        </div>
        {opp.backers !== null && (
          <div className="invest-stat">
            <span className="invest-stat-label">{opp.type === 'Jobs' ? 'Vagas' : 'Apoiadores'}</span>
            <span className="invest-stat-value">{opp.backers}</span>
          </div>
        )}
      </div>

      {/* Progress bar for investments */}
      {opp.raised !== null && opp.type !== 'Jobs' && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
            <span>Captação</span>
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
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: c, background: `${c}10`, border: `1px solid ${c}30`, borderRadius: 100, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.2s' }}>
          {opp.type === 'Investment' ? 'Investir' : opp.type === 'Jobs' ? 'Candidatar' : opp.type === 'Donations' ? 'Solicitar' : 'Ver mais'}
          <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
};

const InvestmentsPage = () => {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? OPPORTUNITIES : OPPORTUNITIES.filter(o => o.type === filter);

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
              Investimentos, parcerias e oportunidades na cidade — 100% on-chain, com reputação verificada e juros baixos garantidos por smart contracts.
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
            { label: 'Capital na rede', value: 'R$ 2.3M', color: '#B4F44A' },
            { label: 'Tx on-chain', value: '1.847', color: '#38BDF8' },
            { label: 'Taxa de inadimplência', value: '0.3%', color: '#818CF8' },
            { label: 'APY médio', value: '5.1%', color: '#F59E0B' },
          ].map(stat => (
            <div key={stat.label} className="glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="filter-chips">
          {FILTERS.map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="invest-grid">
        {filtered.map(opp => <OpportunityCard key={opp.id} opp={opp} />)}
      </div>

      {/* How it works */}
      <div className="glass-panel" style={{ marginTop: 32, padding: '28px 32px' }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Como funciona a segurança on-chain</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { icon: ShieldCheck, color: '#B4F44A', title: 'Reputation Score', desc: 'Cada transação, avaliação e empréstimo pago fortalece seu score on-chain, visível por qualquer participante.' },
            { icon: Lock, color: '#38BDF8', title: 'ZKP Privacy', desc: 'Provas de conhecimento zero garantem que seus dados financeiros fiquem privados, mas verificáveis.' },
            { icon: Zap, color: '#818CF8', title: 'Smart Contracts', desc: 'Empréstimos são codificados em contratos imutáveis. Sem intermediários, sem surpresas.' },
            { icon: TrendingUp, color: '#F59E0B', title: 'Colateral On-Chain', desc: 'NFTs de imóveis, tokens de reputação e outros ativos digitais servem como garantia verificável.' },
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
