import { Repeat, LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { useCycles } from './useCycles.js';
import { useRadar } from './useRadar.js';
import LoopRadar from './LoopRadar.jsx';
import { statusInfo, myPart, loopName, matchStrength } from './constants.js';
import './cycles.css';

function CycleCard({ cycle, userId, onSelect }) {
  const me = myPart(cycle, userId);
  const info = statusInfo(cycle.status);
  const needsMe = ['suggested', 'pending_acceptance'].includes(cycle.status) && me?.acceptance === 'pending';
  const strength = matchStrength(cycle.score);
  const dim = ['superseded', 'cancelled', 'expired'].includes(cycle.status);

  return (
    <button onClick={() => onSelect(cycle)}
      className={`cycle-card glass-panel pressable ${needsMe ? 'needs-me' : ''} ${dim ? 'is-dim' : ''}`}>
      <div className="cycle-card__head">
        <Repeat size={16} aria-hidden="true" />
        <span className="cycle-card__name">{loopName(cycle.hops)}</span>
        <span className="status-pill" style={{ color: info.color, background: info.bg }}>
          {needsMe ? 'Your response needed' : info.label}
        </span>
      </div>
      {cycle.status === 'superseded' ? (
        <p className="cycle-card__line">No longer available: someone completed another loop with one of these items.</p>
      ) : me && (
        <div className="cycle-card__line">
          <span>You give <strong className="give">{me.gives?.title}</strong></span>
          <ArrowRight size={13} aria-hidden="true" />
          <span>you receive <strong className="get">{me.receives?.title}</strong></span>
        </div>
      )}
      {strength && <span className="cycle-card__strength">Match strength {strength}</span>}
    </button>
  );
}

function Stats({ stats }) {
  const items = [
    ['Open loops', stats.open_loops], ['Completed', stats.completed_loops],
    ['Offers', stats.offers], ['Interests', stats.interests],
  ];
  return (
    <dl className="radar-stats">
      {items.map(([label, value]) => (
        <div key={label}><dd>{value ?? 0}</dd><dt>{label}</dt></div>
      ))}
    </dl>
  );
}

export default function CyclesPage({ user, isAuthenticated, login, onSelectCycle, onNavigate }) {
  const { cycles, loading } = useCycles(isAuthenticated);
  const { radar } = useRadar(isAuthenticated);

  if (!isAuthenticated) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <LogIn size={36} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <p style={{ marginBottom: 8 }}>Log in to see your trade loops.</p>
        <button className="btn btn--lime" style={{ marginTop: 12 }} onClick={() => login?.()}>Log in</button>
      </div>
    );
  }

  const hasRadar = radar && radar.nodes?.length > 1;

  return (
    <div className="page-enter loops-page">
      <h1>Loops</h1>
      <p className="loops-page__intro">
        Nexum links people so everyone gives something they offer and receives something they want.
      </p>

      <section className="loops-radar glass-panel" aria-label="Loop radar">
        {hasRadar ? <LoopRadar radar={radar} /> : (
          <div className="loops-radar__empty">
            <Sparkles size={28} aria-hidden="true" />
            <p>Your radar lights up when Nexum finds people to trade with.</p>
            <button className="btn btn--ghost" onClick={() => onNavigate('nexum')}>Add Offers and Interests</button>
          </div>
        )}
        {radar?.stats && <Stats stats={radar.stats} />}
      </section>

      {loading && <p role="status" className="loops-page__note">Loading your trade loops...</p>}

      {!loading && cycles?.length === 0 && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <Repeat size={36} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p><strong>No trade loops yet.</strong></p>
          <p style={{ marginTop: 6, fontSize: 14 }}>Keep your Interests and Offers current. Nexum will notify you when it finds a useful exchange.</p>
        </div>
      )}

      <div className="loops-list">
        {cycles?.map((cycle) => (
          <CycleCard key={cycle.id} cycle={cycle} userId={user?.id} onSelect={onSelectCycle} />
        ))}
      </div>
    </div>
  );
}
