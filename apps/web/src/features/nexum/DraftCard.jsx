import { ArrowLeftRight, Lightbulb } from 'lucide-react';
import { DIRECTIONS, KINDS, directionInfo } from '../intent/constants.js';
import { inputStyle } from '../intent/wizard/helpers.js';
import DraftStructuredFields from './DraftStructuredFields.jsx';

const HINT_LABELS = {
  price_fiat: 'a value in USD',
  condition: 'the condition',
  brand: 'the brand',
  duration: 'the duration',
  format: 'the format',
  access: 'the access type',
  level: 'the experience level',
  timeframe: 'a timeframe',
  location_text: 'a location',
};

export default function DraftCard({ draft, onChange, onToggle }) {
  const dir = directionInfo(draft.direction);
  const other = DIRECTIONS.find((d) => d.id !== draft.direction);
  const hints = (draft.missing_fields ?? [])
    .filter((field) => draft[field] == null)
    .map((f) => HINT_LABELS[f] ?? f.replace(/_/g, ' '));

  return (
    <div style={{
      padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)',
      border: `1px solid ${draft.included ? dir.color + '55' : 'var(--border-color)'}`,
      opacity: draft.included ? 1 : 0.5, transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={() => onChange('direction', other.id)} title={`Switch to ${other.label}`}
          className="pressable"
          style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', textTransform: 'uppercase',
            letterSpacing: 0.5, borderRadius: 'var(--radius-full)', background: dir.bg, color: dir.color,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            fontFamily: 'var(--font-sans)' }}>
          {dir.label} <ArrowLeftRight size={11} />
        </button>
        <select value={draft.kind ?? ''} onChange={(e) => onChange('kind', e.target.value || null)}
          style={{ ...inputStyle, width: 'auto', padding: '4px 8px', fontSize: 12,
            color: 'var(--text-secondary)' }}>
          <option value="">Kind...</option>
          {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
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
      <DraftStructuredFields draft={draft} onChange={onChange} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <input placeholder="Category" maxLength={40}
          style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 14 }}
          value={draft.category ?? ''}
          onChange={(e) => onChange('category', e.target.value || null)} />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>Trade value (USD)</span>
        <input type="number" min="0" style={{ ...inputStyle, width: 110, padding: '8px 12px', fontSize: 14 }}
          value={draft.price_fiat ?? ''}
          onChange={(e) => onChange('price_fiat', e.target.value === '' ? null : Number(e.target.value))} />
      </div>
      {hints.length > 0 && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
          color: 'var(--text-secondary)', marginTop: 10 }}>
          <Lightbulb size={13} style={{ flexShrink: 0 }} />
          Nexum suggests adding {hints.join(', ')}.
        </p>
      )}
    </div>
  );
}
