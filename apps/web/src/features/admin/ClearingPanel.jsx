import { useState } from 'react';
import { Eye, Loader2, Rocket } from 'lucide-react';
import { runClearing } from '../../api/admin.js';
import { loopName, matchStrength } from '../cycles/constants.js';
import CycleRing from '../cycles/CycleRing.jsx';
import { clearingSummary, toRingParticipants } from './clearingAdapter.js';
import './clearing.css';

const HOP_OPTIONS = [2, 3, 4, 5, 6, 7];

function CandidateCard({ loop }) {
  return (
    <article className="clearing-card glass-panel">
      <header>
        <strong>{loopName(loop.hops)}</strong>
        {matchStrength(loop.score) && <span className="chip chip--lime">Match strength {matchStrength(loop.score)}</span>}
      </header>
      <CycleRing participants={toRingParticipants(loop.participants)} />
      <ul>
        {loop.participants.map((p) => (
          <li key={p.user_id}>
            <b>{p.display_name || 'Member'}</b> gives <em>{p.gives_title}</em>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function ClearingPanel() {
  const [maxHops, setMaxHops] = useState(4);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const run = async (dryRun) => {
    setBusy(true);
    setError(null);
    try {
      setResult(await runClearing({ maxHops, dryRun }));
      setMode(dryRun ? 'preview' : 'published');
    } catch (err) {
      setError(err.message || 'The clearing round failed.');
    } finally {
      setBusy(false);
    }
  };

  const summary = clearingSummary(result);

  return (
    <section className="clearing" aria-labelledby="clearing-title">
      <div className="clearing__bar">
        <div>
          <h2 id="clearing-title">Clearing round</h2>
          <p>Nexum searches every open Offer and Interest for the best set of trade loops.</p>
        </div>
        <label className="clearing__select">
          Max people per loop
          <select value={maxHops} onChange={(e) => setMaxHops(Number(e.target.value))} disabled={busy}>
            {HOP_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button className="btn btn--ghost" onClick={() => run(true)} disabled={busy}>
          {busy ? <Loader2 size={16} className="spin" /> : <Eye size={16} />} Preview
        </button>
        <button className="btn btn--lime" onClick={() => run(false)} disabled={busy}>
          <Rocket size={16} /> Publish loops
        </button>
      </div>

      {error && <p className="clearing__error" role="alert">{error}</p>}

      {summary && (
        <p className="clearing__summary" role="status">
          {mode === 'published'
            ? <><strong>{summary.created}</strong> loops published to members.</>
            : <><strong>{summary.selected}</strong> loops selected from <strong>{summary.candidates}</strong> candidates. Nothing was sent yet.</>}
        </p>
      )}

      {result?.selected?.length > 0 && (
        <div className="clearing__grid">
          {result.selected.map((loop, i) => <CandidateCard key={i} loop={loop} />)}
        </div>
      )}
      {result && result.selected?.length === 0 && (
        <p className="clearing__empty">No loops found with these settings. Try allowing more people per loop.</p>
      )}
    </section>
  );
}
