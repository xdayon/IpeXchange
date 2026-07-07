import { useState, useEffect } from 'react';
import { ArrowLeft, Handshake, Check, Loader2 } from 'lucide-react';
import { fetchIntent, markInterest } from '../../api/intents.js';
import { directionInfo, kindInfo, formatPrice } from './constants.js';

const btnBase = {
  width: '100%', padding: '15px', borderRadius: 'var(--radius-md)', border: 'none',
  fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'var(--font-sans)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
};

export default function IntentDetail({ intent: initial, user, isAuthenticated, login, onBack }) {
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
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8,
        background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
        marginBottom: 24, fontFamily: 'var(--font-sans)', fontSize: 14 }}>
        <ArrowLeft size={16} /> Back
      </button>

      {intent.image_url && (
        <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 28 }}>
          <img src={intent.image_url} alt={intent.title}
            style={{ width: '100%', maxHeight: 380, objectFit: 'cover', display: 'block' }} />
        </div>
      )}

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
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{intent.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {intent.direction === 'offer' ? 'Offered by' : 'Wanted by'}{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{owner?.display_name || 'A network member'}</strong>
          </p>
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
      </div>
    </div>
  );
}
