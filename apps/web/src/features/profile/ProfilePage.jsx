
import { LogIn, LogOut, Send } from 'lucide-react';
import MyIntents from './MyIntents.jsx';

export default function ProfilePage({ user, isAuthenticated, login, logout, onNavigate, onSelectIntent }) {
  if (!isAuthenticated) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <LogIn size={36} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <p style={{ marginBottom: 8 }}>Log in to see your profile and your intents.</p>
        <button onClick={() => login?.()} style={{ marginTop: 12, padding: '12px 28px',
          borderRadius: 'var(--radius-full)', background: 'var(--accent-lime)', color: 'var(--bg-dark)',
          fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Log in
        </button>
      </div>
    );
  }

  const initials = user?.displayName?.slice(0, 2)?.toUpperCase() || '??';

  return (
    <div className="page-enter" style={{ padding: '28px 0 60px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(180,244,74,0.15))',
          border: '2px solid rgba(56,189,248,0.3)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
          {user?.avatar
            ? <img src={user.avatar} alt={initials} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{user?.displayName || 'Member'}</h1>
          {user?.telegramUsername && (
            <p style={{ fontSize: 13, color: 'var(--accent-cyan)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Send size={12} /> @{user.telegramUsername}
            </p>
          )}
          {user?.email && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </p>
          )}
        </div>
        {logout && (
          <button onClick={logout} title="Log out" style={{ background: 'none', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer',
            padding: 10, display: 'flex', flexShrink: 0 }}>
            <LogOut size={16} />
          </button>
        )}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>My Intents</h2>
      <MyIntents onSelectIntent={onSelectIntent} />

      <button onClick={() => onNavigate('create')} style={{ marginTop: 24, width: '100%', padding: '13px',
        borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-active)',
        background: 'transparent', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: 14,
        cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
        + Publish a new intent
      </button>
    </div>
  );
}
