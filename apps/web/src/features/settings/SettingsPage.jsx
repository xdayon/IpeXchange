import { useState } from 'react';
import { ArrowLeft, Bell, Home, LogOut, ShieldCheck, Compass, Wallet } from 'lucide-react';
import { saveSettings } from '../../api/me.js';
import { HAPTICS_OFF_KEY } from '../../shared/hooks/useTelegram.js';

function Section({ title, icon: Icon, children }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6,
        color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon size={14} /> {title}
      </h2>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {children}
      </div>
    </section>
  );
}

function Row({ label, hint, control }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
      padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600 }}>{label}</p>
        {hint && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{hint}</p>}
      </div>
      {control}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on}
      style={{ width: 44, height: 26, borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
        background: on ? 'var(--accent-lime)' : 'rgba(255,255,255,0.12)', position: 'relative',
        transition: 'background var(--transition)', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20,
        borderRadius: '50%', background: 'var(--bg-dark)', transition: 'left var(--transition)' }} />
    </button>
  );
}

export default function SettingsPage({ user, logout, onBack, refresh }) {
  const [settings, setSettings] = useState(user?.settings ?? {});
  const [saveError, setSaveError] = useState(null);
  const val = (key, fallback = true) => settings[key] ?? fallback;

  const set = (key, value) => {
    const previous = settings[key];
    setSettings((s) => ({ ...s, [key]: value }));
    setSaveError(null);
    if (key === 'haptics') localStorage.setItem(HAPTICS_OFF_KEY, value ? '' : '1');
    saveSettings({ [key]: value }).then(() => refresh?.()).catch(() => {
      setSettings((current) => ({ ...current, [key]: previous }));
      if (key === 'haptics') localStorage.setItem(HAPTICS_OFF_KEY, previous === false ? '1' : '');
      setSaveError('Could not save this setting. Try again.');
    });
  };

  const tabBtn = (id, label, Icon) => (
    <button onClick={() => set('default_tab', id)} className={`filter-chip ${val('default_tab', 'home') === id ? 'active' : ''}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Icon size={13} /> {label}
    </button>
  );

  return (
    <div className="page-enter" style={{ padding: '24px 0 60px', maxWidth: 680, margin: '0 auto' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none',
        border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 20,
        fontFamily: 'var(--font-sans)', fontSize: 14 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Settings</h1>
      {saveError && (
        <p style={{ color: 'var(--accent-pink)', fontSize: 13, marginBottom: 16 }}>{saveError}</p>
      )}

      <Section title="Notifications" icon={Bell}>
        <Row label="Interest alerts" hint="Telegram message when someone marks interest in your intents"
          control={<Toggle on={val('notify_interest')} onChange={(v) => set('notify_interest', v)} />} />
        <Row label="Trade cycle alerts" hint="When a multi-hop trade including you is suggested or advances"
          control={<Toggle on={val('notify_cycles')} onChange={(v) => set('notify_cycles', v)} />} />
        <Row label="Payment alerts" hint="When a buyer pays one of your offers on-chain"
          control={<Toggle on={val('notify_payments')} onChange={(v) => set('notify_payments', v)} />} />
        {!user?.telegramLinked && (
          <Row label="Telegram not linked" hint="Link Telegram from your profile to receive these alerts" />
        )}
      </Section>

      <Section title="Preferences" icon={Home}>
        <Row label="Start screen" hint="Where the app opens after launch"
          control={<div style={{ display: 'flex', gap: 8 }}>{tabBtn('home', 'Home', Home)}{tabBtn('discover', 'Market', Compass)}</div>} />
        <Row label="Haptic feedback" hint="Vibration on taps inside the Telegram Mini App"
          control={<Toggle on={val('haptics')} onChange={(v) => set('haptics', v)} />} />
      </Section>

      <Section title="Wallet and security" icon={Wallet}>
        <Row label="Payout wallet"
          hint={user?.wallet
            ? `${user.wallet.slice(0, 10)}...${user.wallet.slice(-8)} on Base`
            : 'Log in with a wallet to receive on-chain payments'} />
        <Row label="Wallet ownership" hint="Payout addresses are verified against your login account before being saved"
          control={<ShieldCheck size={18} style={{ color: 'var(--accent-lime)', flexShrink: 0 }} />} />
        <Row label="Payments" hint="Direct peer-to-peer on Base (ETH or USDC). The platform never holds your funds" />
      </Section>

      <Section title="Account" icon={ShieldCheck}>
        {user?.email && <Row label="Email" hint={user.email} />}
        <Row label="Telegram" hint={user?.telegramLinked ? `Linked${user?.telegramUsername ? ` as @${user.telegramUsername}` : ''}` : 'Not linked'} />
        <Row label="Member since" hint={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'This cycle'} />
        {logout && (
          <Row label="Log out" hint="End this session on this device"
            control={
              <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 'var(--radius-md)', border: '1px solid rgba(244,63,94,0.35)', cursor: 'pointer',
                background: 'rgba(244,63,94,0.08)', color: 'var(--accent-pink)', fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--font-sans)' }}>
                <LogOut size={14} /> Log out
              </button>
            } />
        )}
      </Section>
    </div>
  );
}
