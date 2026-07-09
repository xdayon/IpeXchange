
import { Home, Compass, Plus, Repeat, User } from 'lucide-react';

const TABS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'discover', icon: Compass, label: 'Market' },
  { id: 'create', fab: true },
  { id: 'cycles', icon: Repeat, label: 'Trades' },
  { id: 'profile', icon: User, label: 'Profile' },
];

const styles = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
    height: 'calc(var(--bottomnav-height) + env(safe-area-inset-bottom, 0px))',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
  fabSlot: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: 'none', cursor: 'pointer',
  },
  fab: {
    width: 52, height: 52, borderRadius: '50%',
    background: 'var(--accent-lime)', color: 'var(--bg-dark)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transform: 'translateY(-14px)',
    boxShadow: '0 4px 16px rgba(180,244,74,0.35)',
    border: '3px solid var(--bg-dark)',
  },
  label: { fontSize: 10, fontWeight: 600, letterSpacing: 0.3 },
};

export default function BottomNav({ page, onNavigate }) {
  return (
    <nav style={styles.nav} role="navigation" aria-label="Main navigation">
      {TABS.map(({ id, icon: Icon, label, fab }) =>
        fab ? (
          <button key={id} className="pressable" style={styles.fabSlot} onClick={() => onNavigate(id)} aria-label="Publish an intent">
            <span style={styles.fab}><Plus size={26} strokeWidth={2.5} /></span>
          </button>
        ) : (
          <button
            key={id}
            className="pressable"
            style={styles.tab(page === id)}
            onClick={() => onNavigate(id)}
            aria-label={label}
            aria-current={page === id ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={page === id ? 2.5 : 1.8} />
            <span style={styles.label}>{label}</span>
          </button>
        )
      )}
    </nav>
  );
}
