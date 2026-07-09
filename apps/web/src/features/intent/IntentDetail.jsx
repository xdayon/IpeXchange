import { useState, useEffect } from 'react';
import { ArrowLeft, Handshake, Check, Loader2, Wallet, Repeat, CheckCircle2 } from 'lucide-react';
import { fetchIntent, markInterest } from '../../api/intents.js';
import { directionInfo, kindInfo, formatPrice, kindFieldChips } from './constants.js';
import { useTelegram } from '../../shared/hooks/useTelegram.js';
import IntentCover from '../../shared/ui/IntentCover.jsx';
import PayOnChain from './PayOnChain.jsx';
import ShareButton from '../../shared/ui/ShareButton.jsx';

const PRIVY_ENABLED = Boolean(import.meta.env.VITE_PRIVY_APP_ID);

const btnBase = {
  width: '100%', padding: '15px', borderRadius: 'var(--radius-md)', border: 'none',
  fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'var(--font-sans)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
};

export default function IntentDetail({ intent: initial, user, isAuthenticated, login, onBack }) {
  const { isTMA, openLink } = useTelegram();
  const [intent, setIntent] = useState(initial);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initial?.id) fetchIntent(initial.id).then(setIntent).catch(() => {});
  }, [initial?.id]);

  if (!intent) return null;
  const dir = directionInfo(intent.direction);
  const kind = kindInfo(intent.kind);
  const price = formatPrice(intent.price_fiat);
  const owner = intent.users;
  const isOwn = user && intent.user_id === user.id;
  // Crypto checkout never runs inside the Mini App: openLink to the web app.
  const canPay = intent.direction === 'offer' && Number(intent.price_fiat) > 0 &&
    Boolean(owner?.has_wallet) && !isOwn && (isTMA || PRIVY_ENABLED);

  const handleInterest = async () => {
    if (!isAuthenticated) return login?.();
    setSending(true);
    setError(null);
    try {
      await markInterest(intent.id, message.trim() || null);
      setSent(true);
      window?.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (e) {
      setError(e.message || 'Could not send your interest. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-enter" style={{ padding: '24px 0 40px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 14 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <ShareButton url={`${window.location.origin}/l/${intent.id}`} />
      </div>

      <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 28 }}>
        <IntentCover kind={intent.kind} imageUrl={intent.image_url} alt={intent.title} height={260} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', textTransform: 'uppercase',
          letterSpacing: 0.5, background: dir.bg, color: dir.color, borderRadius: 'var(--radius-full)' }}>
          {dir.label}
        </span>
        {kind && (
          <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px',
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-full)' }}>
            {kind.label}
          </span>
        )}
        {intent.is_continuous && (
          <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px',
            background: 'rgba(180,244,74,0.08)', color: 'var(--accent-lime)',
            borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Repeat size={12} /> Stays active after trades
          </span>
        )}
        {kindFieldChips(intent).map((chip) => (
          <span key={chip} style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px',
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-full)' }}>
            {chip}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{intent.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {intent.direction === 'offer' ? 'Offered by' : 'Wanted by'}{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{owner?.display_name || 'A network member'}</strong>
          </p>
          {intent.owner_completed_trades > 0 && (
            <p style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4,
              fontSize: 12, color: 'var(--accent-lime)' }}>
              <CheckCircle2 size={13} /> {intent.owner_completed_trades}{' '}
              {intent.owner_completed_trades === 1 ? 'trade' : 'trades'} completed
            </p>
          )}
        </div>
        {price && <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--accent-lime)', whiteSpace: 'nowrap' }}>{price}</div>}
      </div>

      {intent.description && (
        <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-card)',
          border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ fontSize: 15, lineHeight: 1.7 }}>{intent.description}</p>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        {isOwn ? (
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            This is your intent. Manage it from your profile.
          </p>
        ) : sent ? (
          <div style={{ ...btnBase, background: 'rgba(180,244,74,0.12)', color: 'var(--accent-lime)', cursor: 'default' }}>
            <Check size={20} /> Interest sent. They will be notified.
          </div>
        ) : (
          <>
            {isAuthenticated && (
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={280}
                placeholder="Add a short message (optional)"
                style={{ width: '100%', minHeight: 72, marginBottom: 12, padding: '12px 16px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                  fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', resize: 'vertical' }}
              />
            )}
            <button
              onClick={handleInterest}
              disabled={sending}
              style={{ ...btnBase, background: 'var(--accent-lime)', color: 'var(--bg-dark)' }}
            >
              {sending
                ? <Loader2 size={20} className="spin" />
                : <><Handshake size={20} /> {isAuthenticated ? "I'm interested" : 'Log in to show interest'}</>}
            </button>
            {error && (
              <p style={{ marginTop: 12, fontSize: 13, color: 'var(--accent-pink)', textAlign: 'center' }}>{error}</p>
            )}
          </>
        )}

        {canPay && (
          <div style={{ marginTop: 12 }}>
            {isTMA ? (
              <button
                onClick={() => openLink(`${window.location.origin}/?intent=${intent.id}`)}
                style={{ ...btnBase, background: 'var(--accent-cyan)', color: 'var(--bg-dark)' }}
              >
                <Wallet size={20} /> Pay with crypto in your browser
              </button>
            ) : (
              <PayOnChain intent={intent} isAuthenticated={isAuthenticated} login={login} btnStyle={btnBase} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
