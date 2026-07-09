import { LogIn } from 'lucide-react';
import ProfileHeader from './ProfileHeader.jsx';
import ProfileStats from './ProfileStats.jsx';
import InviteCard from './InviteCard.jsx';
import TelegramLinkBanner from './TelegramLinkBanner.jsx';
import MyIntents from './MyIntents.jsx';

export default function ProfilePage({ user, isAuthenticated, login, logout, onNavigate, onSelectIntent, refresh }) {
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

  return (
    <div className="page-enter" style={{ padding: '28px 0 60px', maxWidth: 680, margin: '0 auto' }}>
      <ProfileHeader user={user} logout={logout} onNavigate={onNavigate} onSaved={refresh} />
      <ProfileStats />
      <InviteCard user={user} />
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
