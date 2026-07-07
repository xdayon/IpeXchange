// ── Navbar ──────────────────────────────────────────────────────
import React from 'react';

const styles = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    height: 'var(--navbar-height)',
    background: 'rgba(8, 12, 20, 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex', alignItems: 'center',
    padding: '0 20px',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    textDecoration: 'none', cursor: 'pointer',
  },
  logoMark: {
    width: 32, height: 32, borderRadius: 10,
    background: 'linear-gradient(135deg, #B4F44A, #38BDF8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, fontWeight: 800, color: '#080C14',
  },
  logoText: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' },
  actions: { display: 'flex', alignItems: 'center', gap: 12 },
  listBtn: {
    padding: '8px 18px', borderRadius: 'var(--radius-full)',
    background: 'var(--accent-lime)', color: '#080C14',
    border: 'none', fontWeight: 700, fontSize: 13,
    cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: 'var(--font-sans)',
  },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(56,189,248,0.15)',
    border: '1px solid rgba(56,189,248,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)',
    cursor: 'pointer',
  },
};

export default function Navbar({ onNavigate, user }) {
  const initials = user?.displayName?.slice(0, 1)?.toUpperCase() || '?';

  return (
    <nav style={styles.nav}>
      <div style={styles.logo} onClick={() => onNavigate('discover')} role="button" tabIndex={0}>
        <div style={styles.logoMark}>𝕀</div>
        <span style={styles.logoText}>IpêXchange</span>
      </div>

      <div style={styles.actions}>
        <button
          id="nav-list-btn"
          style={styles.listBtn}
          onClick={() => onNavigate('create')}
          onMouseOver={e => e.target.style.transform = 'scale(1.04)'}
          onMouseOut={e => e.target.style.transform = 'scale(1)'}
        >
          + List Item
        </button>
        <div
          id="nav-profile-btn"
          style={styles.avatar}
          onClick={() => onNavigate('profile')}
          role="button" tabIndex={0}
          title={user?.displayName || 'Profile'}
        >
          {user?.avatar
            ? <img src={user.avatar} alt={initials} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : initials}
        </div>
      </div>
    </nav>
  );
}
