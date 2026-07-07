import { useState } from 'react';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { publishDrafts } from '../../api/copilot.js';
import { directionInfo, kindInfo } from '../intent/constants.js';
import { inputStyle } from '../intent/wizard/helpers.js';

function DraftCard({ draft, onChange, onToggle }) {
  const dir = directionInfo(draft.direction);
  return (
    <div style={{
      padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)',
      border: `1px solid ${draft.included ? dir.color + '55' : 'var(--border-color)'}`,
      opacity: draft.included ? 1 : 0.5, transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', textTransform: 'uppercase',
          letterSpacing: 0.5, borderRadius: 'var(--radius-full)', background: dir.bg, color: dir.color }}>
          {dir.label}
        </span>
        {draft.kind && (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{kindInfo(draft.kind)?.label}</span>
        )}
        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={draft.included} onChange={onToggle} /> Publish
        </label>
      </div>
      <input style={{ ...inputStyle, marginBottom: 10, fontWeight: 600 }} value={draft.title}
        maxLength={80} onChange={(e) => onChange('title', e.target.value)} />
      <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical', fontSize: 14 }}
        value={draft.description ?? ''} maxLength={500}
        onChange={(e) => onChange('description', e.target.value)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Value (USD, optional)</span>
        <input type="number" min="0" style={{ ...inputStyle, width: 120, padding: '8px 12px', fontSize: 14 }}
          value={draft.price_fiat ?? ''}
          onChange={(e) => onChange('price_fiat', e.target.value === '' ? null : Number(e.target.value))} />
      </div>
    </div>
  );
}

export default function DraftCards({ draft, onPublished }) {
  const [items, setItems] = useState(() => draft.drafts.map((d) => ({ ...d, included: true })));
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);

  const selected = items.filter((d) => d.included && d.title.trim().length >= 3);

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const intents = await publishDrafts(draft.id, selected);
      onPublished(intents);
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
          onChange={(key, value) => setItems((s) => s.map((x, j) => (j === i ? { ...x, [key]: value } : x)))}
        />
      ))}
      {error && <p style={{ fontSize: 13, color: 'var(--accent-pink)', textAlign: 'center' }}>{error}</p>}
      <button
        onClick={publish}
        disabled={publishing || selected.length === 0}
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

export function PublishedScreen({ intents, onMarket }) {
  return (
    <div className="page-enter" style={{ textAlign: 'center', padding: '40px 0' }}>
      <CheckCircle2 size={52} color="var(--accent-lime)" style={{ margin: '0 auto 16px', display: 'block' }} />
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        {intents.length} intent{intents.length === 1 ? '' : 's'} <span className="text-gradient-lime">live</span>
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.5 }}>
        Nexum is already crossing them against the network.
      </p>
      <button onClick={onMarket} style={{ padding: '13px 32px', borderRadius: 'var(--radius-md)', border: 'none',
        background: 'linear-gradient(135deg, var(--accent-lime), var(--accent-cyan))', color: 'var(--bg-dark)',
        fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
        Browse the market
      </button>
    </div>
  );
}
