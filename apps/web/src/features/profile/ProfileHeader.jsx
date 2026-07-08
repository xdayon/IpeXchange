import { useState, useRef } from 'react';
import { Camera, Check, Copy, Loader2, LogOut, Pencil, Send, Settings, ShieldCheck, Wallet, X } from 'lucide-react';
import { updateProfile } from '../../api/me.js';
import { uploadImage } from '../../api/intents.js';

const iconBtn = {
  background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
  color: 'var(--text-secondary)', cursor: 'pointer', padding: 10, display: 'flex', flexShrink: 0,
};

const input = {
  width: '100%', padding: '10px 14px', background: 'var(--bg-card)', outline: 'none',
  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)',
};

export default function ProfileHeader({ user, logout, onNavigate, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);
  const initials = user?.displayName?.slice(0, 2)?.toUpperCase() || '??';

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await updateProfile({ display_name: name.trim(), bio: bio.trim() });
      setEditing(false);
      onSaved?.();
    } catch (e) {
      setError(e.message || 'Could not save your profile.');
    } finally {
      setBusy(false);
    }
  };

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await uploadImage(file);
      await updateProfile({ avatar_url: url });
      onSaved?.();
    } catch (err) {
      setError(err.message || 'Could not update your photo.');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const copyWallet = async () => {
    try {
      await navigator.clipboard.writeText(user.wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <button onClick={() => fileRef.current?.click()} title="Change photo" disabled={busy}
          style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0, position: 'relative',
            background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(180,244,74,0.15))',
            border: '2px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24, fontWeight: 800, cursor: 'pointer',
            color: 'var(--text-primary)', padding: 0, overflow: 'hidden' }}>
          {user?.avatar
            ? <img src={user.avatar} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
          <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px 0',
            background: 'rgba(8,12,20,0.75)', display: 'flex', justifyContent: 'center' }}>
            {busy ? <Loader2 size={12} className="spin" /> : <Camera size={12} />}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={pickAvatar} style={{ display: 'none' }} />

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

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEditing((v) => !v)} title="Edit profile" style={iconBtn}>
            {editing ? <X size={16} /> : <Pencil size={16} />}
          </button>
          <button onClick={() => onNavigate('settings')} title="Settings" style={iconBtn}>
            <Settings size={16} />
          </button>
          {user?.isAdmin && (
            <button onClick={() => onNavigate('admin')} title="Admin dashboard"
              style={{ ...iconBtn, color: 'var(--accent-lime)', borderColor: 'rgba(180,244,74,0.3)' }}>
              <ShieldCheck size={16} />
            </button>
          )}
          {logout && (
            <button onClick={logout} title="Log out" style={iconBtn}><LogOut size={16} /></button>
          )}
        </div>
      </div>

      {!editing && user?.bio && (
        <p style={{ marginTop: 14, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{user.bio}</p>
      )}

      {user?.wallet && (
        <button onClick={copyWallet} title="Copy wallet address"
          style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px',
            borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', cursor: 'pointer',
            background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          <Wallet size={13} /> {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
          {copied ? <Check size={13} style={{ color: 'var(--accent-lime)' }} /> : <Copy size={13} />}
        </button>
      )}

      {editing && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={input} value={name} maxLength={40} placeholder="Display name"
            onChange={(e) => setName(e.target.value)} />
          <textarea style={{ ...input, minHeight: 72, resize: 'vertical' }} value={bio} maxLength={280}
            placeholder="A short bio: what you do, what you bring to the market" onChange={(e) => setBio(e.target.value)} />
          <button onClick={save} disabled={busy || name.trim().length < 2}
            style={{ padding: '11px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
              background: 'var(--accent-lime)', color: 'var(--bg-dark)', fontWeight: 700, fontSize: 14,
              fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {busy ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Save profile
          </button>
        </div>
      )}
      {error && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--accent-pink)' }}>{error}</p>}
    </div>
  );
}
