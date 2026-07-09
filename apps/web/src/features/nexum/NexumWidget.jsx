import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import NexumOrb from './NexumOrb.jsx';
import NexumChat from './NexumChat.jsx';
import { useTelegram } from '../../shared/hooks/useTelegram.js';

// Floating Nexum launcher, mounted once at the app root. Keeps the chat
// mounted after first open so the conversation survives navigation while
// the panel itself is hidden with CSS.
export default function NexumWidget({ isAuthenticated, login, onMarket, visible, aboveBottomNav }) {
  const { isTMA } = useTelegram();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [orbState, setOrbState] = useState('idle');
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 720px)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 720px)');
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const sheet = !wide || isTMA;

  const openPanel = () => { setOpen(true); setHasOpened(true); };
  const closePanel = () => setOpen(false);
  const handleMarket = () => { closePanel(); onMarket?.(); };

  const launcherBottom = aboveBottomNav
    ? 'calc(var(--bottomnav-height) + 20px + env(safe-area-inset-bottom, 0px))'
    : 'calc(20px + env(safe-area-inset-bottom, 0px))';

  return (
    <>
      {visible && !open && (
        <button
          className="nexum-widget-launcher pressable"
          style={{ bottom: launcherBottom }}
          onClick={openPanel}
          title="Talk to Nexum"
        >
          <NexumOrb state="idle" size={54} />
        </button>
      )}

      {hasOpened && (
        <>
          {open && !sheet && <div className="nexum-widget-backdrop" onClick={closePanel} />}
          <div
            className={`nexum-widget-panel ${sheet ? 'nexum-widget-panel--sheet' : 'nexum-widget-panel--anchored'} ${open ? 'nexum-widget-panel--open' : 'nexum-widget-panel--closed'}`}
          >
            <div className="nexum-widget-header">
              {open
                ? <NexumOrb state={orbState} size={40} />
                : <span style={{ width: 40, height: 40, display: 'block' }} />}
              <span className="nexum-widget-title">Nexum</span>
              <button className="nexum-widget-close pressable" onClick={closePanel} aria-label="Close Nexum">
                <X size={18} />
              </button>
            </div>
            <div className="nexum-widget-body">
              <NexumChat
                isAuthenticated={isAuthenticated}
                login={login}
                onMarket={handleMarket}
                variant="widget"
                onOrbState={setOrbState}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
