import { inputStyle } from '../intent/wizard/helpers.js';

const SELECTS = {
  condition: [['', 'Condition'], ['new', 'New'], ['used', 'Used'], ['refurbished', 'Refurbished']],
  format: [['', 'Format'], ['in_person', 'In person'], ['online', 'Online'], ['hybrid', 'Hybrid']],
  access: [['', 'Access'], ['one_time', 'One-time'], ['lifetime', 'Lifetime']],
  level: [['', 'Level'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']],
};

const KIND_FIELDS = {
  good: ['condition', 'brand'],
  service: ['duration', 'format'],
  digital: ['access'],
  knowledge: ['duration', 'format', 'level'],
};

export default function DraftStructuredFields({ draft, onChange }) {
  const fields = KIND_FIELDS[draft.kind] ?? [];
  if (!fields.length) return null;

  return (
    <div className="nexum-draft-fields">
      {fields.map((field) => SELECTS[field] ? (
        <select key={field} value={draft[field] ?? ''}
          onChange={(event) => onChange(field, event.target.value || null)}
          style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }}>
          {SELECTS[field].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      ) : (
        <input key={field} value={draft[field] ?? ''} maxLength={60}
          placeholder={field === 'brand' ? 'Brand' : 'Duration'}
          onChange={(event) => onChange(field, event.target.value || null)}
          style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }} />
      ))}
      {['service', 'knowledge'].includes(draft.kind) && (
        <label className="nexum-continuous-field">
          <input type="checkbox" checked={draft.is_continuous === true}
            onChange={(event) => onChange('is_continuous', event.target.checked)} />
          Keep active after a match
        </label>
      )}
      <input value={draft.location_text ?? ''} maxLength={120} placeholder="Location or remote"
        onChange={(event) => onChange('location_text', event.target.value || null)}
        style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }} />
      <input value={draft.timeframe ?? ''} maxLength={80} placeholder="Timeframe"
        onChange={(event) => onChange('timeframe', event.target.value || null)}
        style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }} />
      <select value={draft.exchange_modes?.[0] ?? ''}
        onChange={(event) => onChange('exchange_modes', event.target.value ? [event.target.value] : [])}
        style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }}>
        <option value="">Exchange preference</option>
        <option value="trade">Trade</option><option value="cash">Buy or sell</option>
        <option value="giveaway">Give away</option><option value="flexible">Flexible</option>
      </select>
    </div>
  );
}
