import { useState } from 'react';
import { Check, Copy, Send } from 'lucide-react';
import { requestTelegramLink } from '../../api/me.js';

export default function TelegramLinkBanner() {
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
