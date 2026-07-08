import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mic, Square, SendHorizontal, Sparkles, LogIn } from 'lucide-react';
import NexumOrb from './NexumOrb.jsx';
import { useInterview } from './useInterview.js';
import { useRecorder } from './useRecorder.js';
import { transcribeAudio } from '../../api/copilot.js';
import DraftCards, { PublishedScreen } from './DraftCards.jsx';
import { useTelegram } from '../../shared/hooks/useTelegram.js';

const iconBtn = (active) => ({
  width: 46, height: 46, borderRadius: '50%', border: 'none', flexShrink: 0,
  background: active ? 'var(--accent-pink)' : 'var(--bg-elevated)',
  color: active ? 'var(--text-primary)' : 'var(--accent-cyan)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
});

export default function NexumInterview({ isAuthenticated, login, onBack, onMarket }) {
  const { messages, orbState, setOrbState, error, draft, send, reveal, userTurns } = useInterview();
  const { recording, supported, start, stop } = useRecorder();
  const { isTMA } = useTelegram();
  const [input, setInput] = useState('');
  const [micError, setMicError] = useState(null);
  const [published, setPublished] = useState(null);
  const endRef = useRef(null);

  const scrollToEnd = () => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });

  useEffect(() => {
    scrollToEnd();
  }, [messages.length]);

  // Telegram updates --tg-viewport-stable-height when the keyboard opens;
  // re-anchor the chat to keep the latest message and the input visible.
  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    if (!tg?.onEvent) return;
    const onViewport = () => scrollToEnd();
    tg.onEvent('viewportChanged', onViewport);
    return () => tg.offEvent('viewportChanged', onViewport);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <LogIn size={36} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <p style={{ marginBottom: 16 }}>Log in so Nexum can interview you.</p>
        <button onClick={() => login?.()} style={{ padding: '12px 28px', borderRadius: 'var(--radius-full)',
          background: 'var(--accent-lime)', color: 'var(--bg-dark)', fontWeight: 700,
          border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Log in
        </button>
      </div>
    );
  }

  if (published) return <PublishedScreen intents={published} onMarket={onMarket} />;

  const submitText = () => {
    if (!input.trim()) return;
    send(input);
    setInput('');
  };

  const toggleMic = async () => {
    setMicError(null);
    if (recording) {
      setOrbState('thinking');
      const blob = await stop();
      if (!blob) return setOrbState('idle');
      try {
        const text = await transcribeAudio(blob);
        if (text) send(text);
        else setOrbState('idle');
      } catch {
        setMicError('Could not transcribe the audio. Try again or type instead.');
        setOrbState('idle');
      }
    } else if (await start()) {
      setOrbState('listening');
    } else {
      setMicError('Microphone unavailable. Check your browser permissions.');
    }
  };

  // Fixed height (Telegram stable viewport inside the Mini App) so the
  // message list scrolls internally and the input stays above the keyboard.
  const chatHeight = isTMA
    ? 'calc(var(--tg-viewport-stable-height, 100dvh) - 24px)'
    : 'calc(100dvh - var(--navbar-height) - 48px)';

  return (
    <div className="page-enter" style={{ padding: '16px 0', maxWidth: 560, margin: '0 auto', width: '100%',
      display: 'flex', flexDirection: 'column',
      ...(draft ? { minHeight: 'calc(100dvh - 140px)' } : { height: chatHeight }) }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
        background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
        fontFamily: 'var(--font-sans)', fontSize: 14 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
        <NexumOrb state={orbState} size={150} />
        <p style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: -8 }}>
          Nexum
        </p>
      </div>

      {draft ? (
        <DraftCards draft={draft} onPublished={setPublished} />
      ) : (
        <>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', padding: '8px 0' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%', padding: '11px 15px', fontSize: 14.5, lineHeight: 1.55,
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? 'rgba(56,189,248,0.12)' : 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}>
                {m.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {(error || micError) && (
            <p style={{ fontSize: 13, color: 'var(--accent-pink)', textAlign: 'center', margin: '8px 0' }}>{error || micError}</p>
          )}

          {userTurns >= 2 && (
            <button onClick={reveal} disabled={orbState === 'thinking'} style={{
              margin: '10px 0', padding: '13px', borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(180,244,74,0.4)', background: 'rgba(180,244,74,0.08)',
              color: 'var(--accent-lime)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Sparkles size={16} /> Reveal my intents
            </button>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
            {supported && (
              <button onClick={toggleMic} style={iconBtn(recording)} title={recording ? 'Stop recording' : 'Speak to Nexum'}>
                {recording ? <Square size={18} /> : <Mic size={20} />}
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitText()}
              onFocus={() => setTimeout(scrollToEnd, 250)}
              placeholder={recording ? 'Listening...' : 'Answer Nexum...'}
              disabled={recording || orbState === 'thinking'}
              style={{ flex: 1, padding: '13px 16px', background: 'var(--bg-card)',
                border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)',
                color: 'var(--text-primary)', fontSize: 15, fontFamily: 'var(--font-sans)', outline: 'none' }}
            />
            <button onClick={submitText} disabled={!input.trim() || orbState === 'thinking'} style={iconBtn(false)} title="Send">
              <SendHorizontal size={19} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
