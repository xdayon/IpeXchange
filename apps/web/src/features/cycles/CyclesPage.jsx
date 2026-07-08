import { Repeat, LogIn, ArrowRight } from 'lucide-react';
import { useCycles } from './useCycles.js';
import { statusInfo, myPart } from './constants.js';

function CycleCard({ cycle, userId, onSelect }) {
  const me = myPart(cycle, userId);
  const info = statusInfo(cycle.status);
  const needsMe = ['suggested', 'pending_acceptance'].includes(cycle.status) && me?.acceptance === 'pending';

  return (
    <button onClick={() => onSelect(cycle)} className="glass-panel"
      style={{ width: '100%', textAlign: 'left', padding: '16px 18px', cursor: 'pointer',
        border: needsMe ? '1px solid rgba(180,244,74,0.4)' : '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-sans)', background: 'var(--glass-bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Repeat size={16} style={{ color: 'var(--accent-cyan)' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          {cycle.hops}-way trade
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 10px',
          borderRadius: 'var(--radius-full)', color: info.color, background: info.bg }}>
          {needsMe ? 'Your response needed' : info.label}
        </span>
      </div>
      {me && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
          color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <span>
            You give <strong style={{ color: 'var(--accent-lime)' }}>{me.gives?.title}</strong>
            {me.gives?.is_continuous && (
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: 'var(--accent-lime)',
                display: 'inline-flex', alignItems: 'center', gap: 3, verticalAlign: 'middle' }}>
                <Repeat size={11} /> stays active
              </span>
            )}
          </span>
          <ArrowRight size={13} style={{ flexShrink: 0 }} />
          <span>you receive <strong style={{ color: 'var(--accent-cyan)' }}>{me.receives?.title}</strong></span>
        </div>
      )}
    </button>
  );
}

export default function CyclesPage({ user, isAuthenticated, login, onSelectCycle }) {
  const { cycles, loading } = useCycles(isAuthenticated);

  if (!isAuthenticated) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <LogIn size={36} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <p style={{ marginBottom: 8 }}>Log in to see your trade cycles.</p>
        <button onClick={() => login?.()} style={{ marginTop: 12, padding: '12px 28px',
          borderRadius: 'var(--radius-full)', background: 'var(--accent-lime)', color: 'var(--bg-dark)',
          fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Log in
        </button>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: '28px 0 60px', maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Trade cycles</h1>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 22 }}>
        Rings of 2 or 3 people where everyone gives one thing and receives another.
        Nexum suggests them whenever your intents close a loop.
      </p>

      {loading && <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Looking for your cycles...</p>}

      {!loading && cycles?.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <Repeat size={36} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p>No trade cycles yet. Publish more interests and offers so Nexum can close a ring for you.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cycles?.map((cycle) => (
          <CycleCard key={cycle.id} cycle={cycle} userId={user?.id} onSelect={onSelectCycle} />
        ))}
      </div>
    </div>
  );
}
