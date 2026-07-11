import { useState } from 'react';
import NexumOrb from './NexumOrb.jsx';
import NexumChat from './NexumChat.jsx';
import { useTelegram } from '../../shared/hooks/useTelegram.js';
import { ArrowLeft } from 'lucide-react';

export default function NexumInterview({ isAuthenticated, login, onBack, onMarket }) {
  const { isTMA } = useTelegram();
  const [orbState, setOrbState] = useState('idle');

  // Fixed height (Telegram stable viewport inside the Mini App) so the
  // message list scrolls internally and the input stays above the keyboard.
  const chatHeight = isTMA
    ? 'calc(var(--tg-viewport-stable-height, 100dvh) - 24px)'
    : 'calc(100dvh - var(--navbar-height) - 48px)';

  return (
    <div className="page-enter" style={{ padding: '16px 0', maxWidth: 560, margin: '0 auto', width: '100%',
      display: 'flex', flexDirection: 'column', height: chatHeight }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
        background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
        fontFamily: 'var(--font-sans)', fontSize: 14 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
        <NexumOrb state={orbState} size={96} />
        <p style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: -8 }}>
          Nexum
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>
          The oracle that sees every thread of the market
        </p>
      </div>

      <NexumChat isAuthenticated={isAuthenticated} login={login} onMarket={onMarket} variant="page" onOrbState={setOrbState} />
    </div>
  );
}
