import { lazy, Suspense, useState } from 'react';
import { Layers, LayoutGrid, Map as MapIcon, LogIn } from 'lucide-react';
import MarketFeed from '../marketplace/MarketFeed.jsx';
import Loader from '../../shared/ui/Loader.jsx';
import './discover.css';

const SwipeDeck = lazy(() => import('../swipe/SwipeDeck.jsx'));
const MapView = lazy(() => import('../map/MapView.jsx'));

const MODES = [
  { id: 'swipe', label: 'Swipe', icon: Layers },
  { id: 'browse', label: 'Browse', icon: LayoutGrid },
  { id: 'map', label: 'Map', icon: MapIcon },
];

export default function DiscoverHub({
  user, isAuthenticated, login, refresh, initialMode, onSelectIntent, onNavigate, isTMA,
}) {
  const [mode, setMode] = useState(initialMode ?? (isAuthenticated ? 'swipe' : 'browse'));

  return (
    <div className="discover page-enter">
      <div className="segmented" role="tablist" aria-label="Discover mode">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={mode === id}
            className={`segmented__item ${mode === id ? 'is-active' : ''}`} onClick={() => setMode(id)}>
            <Icon size={16} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      <Suspense fallback={<Loader />}>
        {mode === 'swipe' && (isAuthenticated ? (
          <SwipeDeck onSelectIntent={onSelectIntent} onNavigate={onNavigate}
            onOpenLoop={(cycleId) => onNavigate('cycle-detail', { cycleId })} />
        ) : (
          <div className="discover__gate glass-panel">
            <Layers size={34} aria-hidden="true" />
            <h2>Swipe needs an account</h2>
            <p>Log in so Nexum can show you matches and find loops around you.</p>
            <button className="btn btn--lime" onClick={() => login?.()}>
              <LogIn size={16} /> Log in
            </button>
            <button className="btn btn--ghost" onClick={() => setMode('browse')}>Browse instead</button>
          </div>
        ))}
        {mode === 'browse' && (
          <MarketFeed onSelectIntent={onSelectIntent} onNavigate={onNavigate} isTMA={isTMA} embedded />
        )}
        {mode === 'map' && (
          <MapView user={user} isAuthenticated={isAuthenticated} login={login} refresh={refresh}
            onSelectIntent={onSelectIntent} />
        )}
      </Suspense>
    </div>
  );
}
