import { useRef, useState } from 'react';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { publishDrafts } from '../../api/copilot.js';
import DraftCard from './DraftCard.jsx';
import { trackNexumEvent } from '../../api/copilot.js';

export default function DraftCards({ draft, onPublished }) {
  const [items, setItems] = useState(() => draft.drafts.map((d) => ({ ...d, included: true })));
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const editTracked = useRef(false);

  const changeItem = (index, key, value) => {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: value } : item
    )));
    if (!editTracked.current && draft.session_id) {
      editTracked.current = true;
      trackNexumEvent(draft.session_id, 'draft_edited', { field: key }).catch(() => {});
    }
  };

  const selected = items.filter((d) => d.included && d.title.trim().length >= 3);

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const result = await publishDrafts(draft.id, selected);
      onPublished(result);
    } catch (e) {
      setError(e.message || 'Could not publish. Try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Here is what Nexum heard. Adjust anything, untick what you do not want, then publish.
      </p>
      {items.map((d, i) => (
        <DraftCard
          key={i}
          draft={d}
          onToggle={() => setItems((s) => s.map((x, j) => (j === i ? { ...x, included: !x.included } : x)))}
          onChange={(key, value) => changeItem(i, key, value)}
        />
      ))}
      {error && <p style={{ fontSize: 13, color: 'var(--accent-pink)', textAlign: 'center' }}>{error}</p>}
      <button
        onClick={publish}
        disabled={publishing || selected.length === 0}
        className="pressable"
        style={{
          padding: '15px', borderRadius: 'var(--radius-md)', border: 'none',
          background: selected.length ? 'linear-gradient(135deg, var(--accent-lime), var(--accent-cyan))' : 'rgba(180,244,74,0.15)',
          color: selected.length ? 'var(--bg-dark)' : 'rgba(180,244,74,0.4)',
          fontWeight: 800, fontSize: 16, cursor: selected.length ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        {publishing ? <Loader2 size={20} className="spin" /> : (
          <><Sparkles size={18} /> Publish {selected.length} intent{selected.length === 1 ? '' : 's'}</>
        )}
      </button>
    </div>
  );
}

export function PublishedScreen({ result, onMarket }) {
  const { intents, network_preview: preview } = result;
  const hasCycles = preview?.cycle_count > 0;
  return (
    <div className="page-enter" style={{ textAlign: 'center', padding: '40px 0' }}>
      <CheckCircle2 size={52} color="var(--accent-lime)" style={{ margin: '0 auto 16px', display: 'block' }} />
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        {intents.length} intent{intents.length === 1 ? '' : 's'} <span className="text-gradient-lime">live</span>
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.5 }}>
        {hasCycles
          ? `Nexum already found ${preview.cycle_count} viable trade ${preview.cycle_count === 1 ? 'path' : 'paths'}, including a ${preview.best_hops}-way exchange.`
          : 'Nexum is crossing them against every new interest and offer in the network.'}
      </p>
      <button onClick={onMarket} style={{ padding: '13px 32px', borderRadius: 'var(--radius-md)', border: 'none',
        background: 'linear-gradient(135deg, var(--accent-lime), var(--accent-cyan))', color: 'var(--bg-dark)',
        fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
        Browse the market
      </button>
    </div>
  );
}
