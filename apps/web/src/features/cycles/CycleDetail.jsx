import { useEffect, useState } from 'react';
import { ArrowLeft, Check, X, PackageCheck, PackageOpen, Repeat, Share2, Info } from 'lucide-react';
import { fetchCycle, respondToCycle, confirmCycleStep } from '../../api/cycles.js';
import { statusInfo, myPart, loopName, matchStrength, SUPERSEDED_COPY } from './constants.js';
import { shareLoop } from './shareLoop.js';
import { formatPrice } from '../intent/constants.js';
import { useTelegram } from '../../shared/hooks/useTelegram.js';
import CycleRing from './CycleRing.jsx';
import LoopCelebration from './LoopCelebration.jsx';
import './cycles.css';

function TradeSide({ label, intent, tone }) {
  return (
    <div className="trade-side">
      <p className={`trade-side__label trade-side__label--${tone}`}>{label}</p>
      <p className="trade-side__title">{intent?.title}</p>
      {intent?.price_fiat != null && <p className="trade-side__meta">{formatPrice(intent.price_fiat)}</p>}
      {intent?.is_continuous && (
        <p className="trade-side__active"><Repeat size={11} /> Stays active</p>
      )}
    </div>
  );
}

const CELEBRATIONS = {
  accepted: { title: 'Everyone said yes!', subtitle: 'The loop is on. Coordinate delivery with the others.' },
  completed: { title: 'Loop complete!', subtitle: 'Everyone delivered and received. Tell your friends.' },
};

export default function CycleDetail({ cycleId, user, onBack }) {
  const { notify } = useTelegram();
  const [cycle, setCycle] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const [shareNote, setShareNote] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchCycle(cycleId)
      .then((data) => { if (!cancelled) setCycle(data); })
      .catch(() => { if (!cancelled) setError('Could not load this loop.'); });
    return () => { cancelled = true; };
  }, [cycleId]);

  const act = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      const next = await fn();
      if (next.status !== cycle.status && CELEBRATIONS[next.status]) {
        setCelebrate(next.status);
        notify('success');
      }
      setCycle(next);
    } catch { setError('Action failed. Reload and try again.'); }
    finally { setBusy(false); }
  };

  const share = async () => {
    const result = await shareLoop({ hops: cycle.hops, userId: user?.id }).catch(() => null);
    if (result === 'copied') setShareNote('Link copied');
  };

  if (error && !cycle) return <p className="loop-note">{error}</p>;
  if (!cycle) return <p className="loop-note">Loading loop...</p>;

  const me = myPart(cycle, user?.id);
  const info = statusInfo(cycle.status);
  const open = ['suggested', 'pending_acceptance'].includes(cycle.status);
  const waitingOthers = open && me?.acceptance === 'accepted';
  const strength = matchStrength(cycle.score);

  return (
    <div className="page-enter loop-detail">
      <button className="back-link" onClick={onBack} aria-label="Back to loops"><ArrowLeft size={15} /> Back</button>

      <div className="loop-detail__head">
        <h1>{loopName(cycle.hops)}</h1>
        <span className="status-pill" style={{ color: info.color, background: info.bg }}>{info.label}</span>
      </div>
      {strength && <p className="loop-detail__strength">Match strength {strength}</p>}
      <p className="loop-detail__hint">
        Follow the arrows to see who gives to whom. Review your part below before accepting.
      </p>

      <CycleRing participants={cycle.participants} currentUserId={user?.id} />

      {cycle.status === 'superseded' && (
        <p className="loop-banner" role="status"><Info size={16} /> {SUPERSEDED_COPY}</p>
      )}

      {me && cycle.status !== 'superseded' && (
        <div className="trade-sides">
          <TradeSide label="YOU GIVE" intent={me.gives} tone="lime" />
          <TradeSide label="YOU RECEIVE" intent={me.receives} tone="cyan" />
        </div>
      )}

      {open && me?.acceptance === 'pending' && (
        <div className="loop-actions" aria-label="Respond to this trade loop">
          <button disabled={busy} className="btn btn--lime" onClick={() => act(() => respondToCycle(cycle.id, true))}>
            <Check size={16} /> Accept loop
          </button>
          <button disabled={busy} className="btn btn--ghost" onClick={() => act(() => respondToCycle(cycle.id, false))}>
            <X size={16} /> Decline
          </button>
        </div>
      )}
      {waitingOthers && (
        <p role="status" className="loop-note loop-note--inline">
          You accepted. Waiting for the other participants to respond.
        </p>
      )}

      {cycle.status === 'accepted' && me && (
        <div className="loop-actions" aria-label="Confirm your exchange progress">
          <button disabled={busy || !!me.delivered_at} className={me.delivered_at ? 'btn btn--done-lime' : 'btn btn--lime'}
            onClick={() => act(() => confirmCycleStep(cycle.id, 'delivered'))}>
            <PackageCheck size={16} /> {me.delivered_at ? 'Delivered' : 'I delivered'}
          </button>
          <button disabled={busy || !!me.received_at} className={me.received_at ? 'btn btn--done-cyan' : 'btn btn--cyan'}
            onClick={() => act(() => confirmCycleStep(cycle.id, 'received'))}>
            <PackageOpen size={16} /> {me.received_at ? 'Received' : 'I received'}
          </button>
        </div>
      )}

      {cycle.status === 'completed' && (
        <div className="loop-done">
          <p role="status">Loop completed. Everyone delivered and received.</p>
          <button className="btn btn--ghost" onClick={share}><Share2 size={16} /> {shareNote || 'Share'}</button>
        </div>
      )}
      {cycle.status === 'cancelled' && (
        <p className="loop-note loop-note--inline">This loop was cancelled. Nexum keeps searching for new matches.</p>
      )}
      {error && <p className="loop-error">{error}</p>}

      {celebrate && (
        <LoopCelebration
          hops={cycle.hops}
          title={CELEBRATIONS[celebrate].title}
          subtitle={CELEBRATIONS[celebrate].subtitle}
          actionLabel="Done"
          onAction={() => setCelebrate(null)}
          onShare={share}
          onClose={() => setCelebrate(null)}
        />
      )}
    </div>
  );
}
