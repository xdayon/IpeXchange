
import { Home, Compass, PlusSquare, User } from 'lucide-react';

const TABS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'discover', icon: Compass, label: 'Market' },
  { id: 'create', icon: PlusSquare, label: 'Publish' },
  { id: 'profile', icon: User, label: 'Profile' },
];

const styles = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
    height: 'var(--bottomnav-height)',
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    borderTop: '1px solid var(--border-color)',
    display: 'flex', alignItems: 'center',
  },
  tab: (active) => ({
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 3, cursor: 'pointer', border: 'none',
    background: 'transparent', padding: '8px 0',
    color: active ? 'var(--accent-lime)' : 'var(--text-secondary)',
    transition: 'color 0.2s',
    fontFamily: 'var(--font-sans)',
  }),
  label: { fontSize: 10, fontWeight: 600, letterSpacing: 0.3 },
};

export default function BottomNav({ page, onNavigate }) {
  return (
    <nav style={styles.nav} role="navigation" aria-label="Main navigation">
      {TABS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          style={styles.tab(page === id)}
          onClick={() => onNavigate(id)}
          aria-label={label}
          aria-current={page === id ? 'page' : undefined}
        >
          <Icon size={20} strokeWidth={page === id ? 2.5 : 1.8} />
          <span style={styles.label}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
