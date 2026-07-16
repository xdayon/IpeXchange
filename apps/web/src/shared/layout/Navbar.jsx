
import { Bell, LogIn } from 'lucide-react';

const styles = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    height: 'var(--navbar-height)',
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex', alignItems: 'center',
    padding: '0 20px',
    justifyContent: 'space-between',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  logoMark: { width: 32, height: 32, borderRadius: 10 },
  logoText: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' },
  actions: { display: 'flex', alignItems: 'center', gap: 12 },
  publishBtn: {
    padding: '8px 18px', borderRadius: 'var(--radius-full)',
    background: 'var(--accent-lime)', color: 'var(--bg-dark)',
    border: 'none', fontWeight: 700, fontSize: 13,
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  loginBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 'var(--radius-full)',
    background: 'transparent', color: 'var(--text-primary)',
    border: '1px solid var(--border-color)', fontWeight: 600, fontSize: 13,
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(56,189,248,0.15)',
    border: '1px solid rgba(56,189,248,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)',
    cursor: 'pointer', overflow: 'hidden',
  },
};

export default function Navbar({ user, isAuthenticated, login, onNavigate, unreadCount = 0 }) {
  const initials = user?.displayName?.slice(0, 1)?.toUpperCase() || '?';

  return (
    <nav style={styles.nav}>
      <div style={styles.logo} onClick={() => onNavigate('home')} role="button" tabIndex={0}>
        <img src="/logo.png" alt="IpeXchange" style={styles.logoMark} />
        <span style={styles.logoText}>IpeXchange</span>
      </div>

      <div style={styles.actions}>
        <button className="pressable" style={styles.publishBtn} onClick={() => onNavigate('create')}>
          + Publish
        </button>
        {isAuthenticated ? (
          <>
            <button className="notification-nav-button pressable" onClick={() => onNavigate('notifications')}
              aria-label={`Notifications, ${unreadCount} unread`}>
              <Bell size={17} />
              {unreadCount > 0 && <span className="notification-badge">{Math.min(unreadCount, 99)}</span>}
            </button>
            <div className="pressable" style={styles.avatar} onClick={() => onNavigate('profile')}
              role="button" tabIndex={0} title={user?.displayName || 'Profile'}>
              {user?.avatar
                ? <img src={user.avatar} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>
          </>
        ) : (
          <button className="pressable" style={styles.loginBtn} onClick={() => login?.()}>
            <LogIn size={14} /> Log in
          </button>
        )}
      </div>
    </nav>
  );
}
