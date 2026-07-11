import { useState, useRef, useEffect } from 'react';
import { Sparkles, LogIn } from 'lucide-react';
import { useInterview } from './useInterview.js';
import { useVoiceCapture } from './useVoiceCapture.js';
import { useTelegram } from '../../shared/hooks/useTelegram.js';
import DraftCards, { PublishedScreen } from './DraftCards.jsx';
import ChatInputRow from './ChatInputRow.jsx';
import InterviewProgress from './InterviewProgress.jsx';
import QuickReplies from './QuickReplies.jsx';
import LiveIntentMap from './LiveIntentMap.jsx';

export default function NexumChat({ isAuthenticated, login, onMarket, variant = 'page', onOrbState }) {
  const {
    messages, orbState, setOrbState, error, draft, send, reveal, revealing,
    userTurns, ready, pills, progress, mappedIntents, marketSignal,
    rememberPreferences, toggleMemory,
  } = useInterview();
  const { haptic } = useTelegram();
  const [input, setInput] = useState('');
  const [published, setPublished] = useState(null);
  const endRef = useRef(null);

  const busy = orbState === 'thinking' || orbState === 'speaking';
  const voice = useVoiceCapture({ send, setOrbState });

  const scrollToEnd = () => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });

  useEffect(() => {
    onOrbState?.(orbState);
  }, [orbState, onOrbState]);

  useEffect(() => {
    scrollToEnd();
  }, [messages, pills, ready]);

  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    if (!tg?.onEvent) return;
    const onViewport = () => scrollToEnd();
    tg.onEvent('viewportChanged', onViewport);
    return () => tg.offEvent('viewportChanged', onViewport);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="empty-state" style={{ marginTop: variant === 'widget' ? 40 : 80 }}>
        <LogIn size={36} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <p style={{ marginBottom: 16 }}>Log in so Nexum can interview you.</p>
        <button onClick={() => login?.()} className="pressable" style={{ padding: '12px 28px', borderRadius: 'var(--radius-full)',
          background: 'var(--accent-lime)', color: 'var(--bg-dark)', fontWeight: 700,
          border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Log in
        </button>
      </div>
    );
  }

  if (published) return <PublishedScreen result={published} onMarket={onMarket} />;

  const submitText = () => {
    if (!input.trim() || busy) return;
    send(input);
    setInput('');
  };

  const sendPill = (text) => {
    haptic('light');
    send(text);
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
      {draft ? (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <DraftCards draft={draft} onPublished={setPublished} />
        </div>
      ) : (
        <>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', padding: '8px 0' }}>
            {messages.map((m, i) => (
              <div key={i} className="nexum-msg-enter" style={{
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

          {(error || voice.micError) && (
            <p style={{ fontSize: 13, color: 'var(--accent-pink)', textAlign: 'center', margin: '8px 0' }}>
              {error || voice.micError}
            </p>
          )}

          {userTurns > 0 && <InterviewProgress progress={progress} ready={ready} />}
          <LiveIntentMap intents={mappedIntents} marketSignal={marketSignal}
            rememberPreferences={rememberPreferences} onToggleMemory={toggleMemory} />

          <QuickReplies pills={pills} busy={busy || voice.recording} onPill={sendPill} />

          {ready && (
            <div className="nexum-reveal-panel">
              <span>Your profile is ready</span>
              <p>Turn this conversation into structured market entries you can review before publishing.</p>
              <button onClick={reveal} disabled={revealing || busy} className="nexum-reveal-button pressable">
              {revealing ? (
                <>
                  <span className="nexum-reveal-spinner" />
                  Nexum is weaving your intents...
                </>
              ) : (
                <><Sparkles size={16} /> Reveal my intents</>
              )}
              </button>
            </div>
          )}

          <ChatInputRow
            input={input}
            setInput={setInput}
            submitText={submitText}
            busy={busy}
            onFocus={() => setTimeout(scrollToEnd, 250)}
            voice={voice}
          />
        </>
      )}
    </div>
  );
}
