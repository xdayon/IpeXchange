
import { useState } from 'react';
import { Check, Copy, LogIn, LogOut, Send } from 'lucide-react';
import { requestTelegramLink } from '../../api/me.js';
import MyIntents from './MyIntents.jsx';

function TelegramLinkBanner() {
  const [error, setError] = useState(null);
  const [command, setCommand] = useState(null);
  const [copied, setCopied] = useState(false);

  const link = async () => {
    setError(null);
    try {
      const { url, token } = await requestTelegramLink();
      setCommand(`/start ${token}`);
      setCopied(false);
      window.open(url, '_blank', 'noopener');
    } catch {
      setError('Could not create the link. Try again.');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      setError('Copy failed. Select the command manually.');
    }
  };

  return (
    <div style={{ marginBottom: 24, padding: '14px 16px', borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.06)',
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <Send size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', minWidth: 180 }}>
        Link your Telegram to get a message when someone is interested in your intents.
      </span>
      <button onClick={link} style={{ padding: '9px 18px', borderRadius: 'var(--radius-full)',
        background: 'var(--accent-cyan)', color: 'var(--bg-dark)', fontWeight: 700, fontSize: 13,
        border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
        {command ? 'Open bot again' : 'Link Telegram'}
      </button>
      {command && (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Bot did not reply? Paste this command in the bot chat:
          </span>
          <code style={{ fontSize: 12, padding: '5px 10px', borderRadius: 'var(--radius-md)',
            background: 'rgba(8,12,20,0.7)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', wordBreak: 'break-all' }}>
            {command}
          </code>
          <button onClick={copy} title="Copy command" style={{ background: 'none', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', color: copied ? 'var(--accent-lime)' : 'var(--text-secondary)',
            cursor: 'pointer', padding: 6, display: 'flex' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}
      {error && <span style={{ fontSize: 12, color: 'var(--accent-pink)', width: '100%' }}>{error}</span>}
    </div>
  );
}

export default function ProfilePage({ user, isAuthenticated, login, logout, onNavigate, onSelectIntent }) {
  if (!isAuthenticated) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <LogIn size={36} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <p style={{ marginBottom: 8 }}>Log in to see your profile and your intents.</p>
        <button onClick={() => login?.()} style={{ marginTop: 12, padding: '12px 28px',
          borderRadius: 'var(--radius-full)', background: 'var(--accent-lime)', color: 'var(--bg-dark)',
          fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Log in
        </button>
      </div>
    );
  }

  const initials = user?.displayName?.slice(0, 2)?.toUpperCase() || '??';

  return (
    <div className="page-enter" style={{ padding: '28px 0 60px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(180,244,74,0.15))',
          border: '2px solid rgba(56,189,248,0.3)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
          {user?.avatar
            ? <img src={user.avatar} alt={initials} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{user?.displayName || 'Member'}</h1>
          {user?.telegramUsername && (
            <p style={{ fontSize: 13, color: 'var(--accent-cyan)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Send size={12} /> @{user.telegramUsername}
            </p>
          )}
          {user?.email && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </p>
          )}
        </div>
        {logout && (
          <button onClick={logout} title="Log out" style={{ background: 'none', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer',
            padding: 10, display: 'flex', flexShrink: 0 }}>
            <LogOut size={16} />
          </button>
        )}
      </div>

      {!user?.telegramLinked && <TelegramLinkBanner />}

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>My Intents</h2>
      <MyIntents onSelectIntent={onSelectIntent} />

      <button onClick={() => onNavigate('create')} style={{ marginTop: 24, width: '100%', padding: '13px',
        borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-active)',
        background: 'transparent', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: 14,
        cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
        + Publish a new intent
      </button>
    </div>
  );
}
