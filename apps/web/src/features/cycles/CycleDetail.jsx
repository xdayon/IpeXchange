import { useEffect, useState } from 'react';
import { ArrowLeft, Check, X, PackageCheck, PackageOpen, Repeat } from 'lucide-react';
import { fetchCycle, respondToCycle, confirmCycleStep } from '../../api/cycles.js';
import { statusInfo, myPart } from './constants.js';
import { formatPrice } from '../intent/constants.js';
import CycleRing from './CycleRing.jsx';

const btn = (bg, color, outline) => ({
  flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-full)', fontSize: 14,
  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  background: bg, color, border: outline ? '1px solid var(--border-color)' : 'none',
});

function TradeSide({ label, intent, color }) {
  return (
    <div style={{ flex: 1, minWidth: 140, padding: '12px 14px', borderRadius: 'var(--radius-md)',
      background: 'rgba(148,163,184,0.06)', border: '1px solid var(--border-color)' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 0.5, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600 }}>{intent?.title}</p>
      {intent?.price_fiat != null && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{formatPrice(intent.price_fiat)}</p>
      )}
      {intent?.is_continuous && (
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-lime)', marginTop: 4,
          display: 'flex', alignItems: 'center', gap: 4 }}>
          <Repeat size={11} /> Stays active
        </p>
      )}
    </div>
  );
}

export default function CycleDetail({ cycleId, user, onBack }) {
  const [cycle, setCycle] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchCycle(cycleId)
      .then((data) => { if (!cancelled) setCycle(data); })
      .catch(() => { if (!cancelled) setError('Could not load this cycle.'); });
    return () => { cancelled = true; };
  }, [cycleId]);

  const act = async (fn) => {
    setBusy(true);
    setError(null);
    try { setCycle(await fn()); }
    catch { setError('Action failed. Reload and try again.'); }
    finally { setBusy(false); }
  };

  if (error && !cycle) return <p style={{ marginTop: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>{error}</p>;
  if (!cycle) return <p style={{ marginTop: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading cycle...</p>;

  const me = myPart(cycle, user?.id);
  const info = statusInfo(cycle.status);
  const open = ['suggested', 'pending_acceptance'].includes(cycle.status);
  const waitingOthers = open && me?.acceptance === 'accepted';

  return (
    <div className="page-enter" style={{ padding: '20px 0 60px', maxWidth: 560, margin: '0 auto' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none',
        border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
        fontFamily: 'var(--font-sans)', marginBottom: 14, padding: 0 }}>
        <ArrowLeft size={15} /> Back
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>{cycle.hops}-way trade</h1>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px',
          borderRadius: 'var(--radius-full)', color: info.color, background: info.bg }}>
          {info.label}
        </span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
        Match strength {Math.round((cycle.min_similarity ?? 0) * 100)}%
        {cycle.value_ratio != null && ` - value balance ${Math.round(cycle.value_ratio * 100)}%`}
      </p>

      <CycleRing participants={cycle.participants} currentUserId={user?.id} />

      {me && (
        <div style={{ display: 'flex', gap: 10, margin: '18px 0', flexWrap: 'wrap' }}>
          <TradeSide label="YOU GIVE" intent={me.gives} color="var(--accent-lime)" />
          <TradeSide label="YOU RECEIVE" intent={me.receives} color="var(--accent-cyan)" />
        </div>
      )}

      {open && me?.acceptance === 'pending' && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button disabled={busy} style={btn('var(--accent-lime)', 'var(--bg-dark)')}
            onClick={() => act(() => respondToCycle(cycle.id, true))}>
            <Check size={16} /> Accept trade
          </button>
          <button disabled={busy} style={btn('transparent', 'var(--text-secondary)', true)}
            onClick={() => act(() => respondToCycle(cycle.id, false))}>
            <X size={16} /> Decline
          </button>
        </div>
      )}
      {waitingOthers && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
          You accepted. Waiting for the other participants to respond.
        </p>
      )}

      {cycle.status === 'accepted' && me && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button disabled={busy || !!me.delivered_at}
            style={btn(me.delivered_at ? 'rgba(180,244,74,0.12)' : 'var(--accent-lime)',
              me.delivered_at ? 'var(--accent-lime)' : 'var(--bg-dark)')}
            onClick={() => act(() => confirmCycleStep(cycle.id, 'delivered'))}>
            <PackageCheck size={16} /> {me.delivered_at ? 'Delivered' : 'I delivered'}
          </button>
          <button disabled={busy || !!me.received_at}
            style={btn(me.received_at ? 'rgba(56,189,248,0.12)' : 'var(--accent-cyan)',
              me.received_at ? 'var(--accent-cyan)' : 'var(--bg-dark)')}
            onClick={() => act(() => confirmCycleStep(cycle.id, 'received'))}>
            <PackageOpen size={16} /> {me.received_at ? 'Received' : 'I received'}
          </button>
        </div>
      )}

      {cycle.status === 'completed' && (
        <p style={{ fontSize: 13, color: 'var(--accent-lime)', textAlign: 'center', fontWeight: 600 }}>
          Trade completed. Everyone delivered and received.
        </p>
      )}
      {cycle.status === 'cancelled' && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
          This cycle was cancelled. Nexum keeps searching for new matches.
        </p>
      )}
      {error && <p style={{ fontSize: 12, color: 'var(--accent-pink)', textAlign: 'center', marginTop: 10 }}>{error}</p>}
    </div>
  );
}
