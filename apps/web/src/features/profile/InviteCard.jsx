import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { fetchMyStats } from '../../api/me.js';

export default function InviteCard({ user }) {
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/?ref=${user.id}`;
  const referrals = stats?.referrals ?? 0;

  useEffect(() => {
    fetchMyStats().then(setStats).catch(() => setStats({}));
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="glass-panel" style={{ marginBottom: 24, padding: 18,
      borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Invite friends</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Share your link and grow the market.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <code style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)', background: 'var(--bg-card)',
          color: 'var(--text-primary)', fontSize: 12, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {link}
        </code>
        <button onClick={copy} title="Copy invite link" style={{ padding: '10px 14px',
          borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--accent-lime)',
          color: 'var(--bg-dark)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 7,
          flexShrink: 0 }}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        {referrals} {referrals === 1 ? 'citizen' : 'citizens'} joined with your link
      </p>
    </div>
  );
}
