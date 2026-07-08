import { Repeat } from 'lucide-react';
import { Field } from './ui.jsx';
import { inputStyle, haptic } from './helpers.js';

const KIND_FIELD_DEFS = {
  good: ['condition', 'brand'],
  service: ['duration', 'format', 'isContinuous'],
  digital: ['access'],
  knowledge: ['duration', 'format', 'level', 'isContinuous'],
};

const SELECTS = {
  condition: {
    label: 'Condition',
    options: [['new', 'New'], ['used', 'Used'], ['refurbished', 'Refurbished']],
  },
  format: {
    label: 'Format',
    options: [['in_person', 'In person'], ['online', 'Online'], ['hybrid', 'Hybrid']],
  },
  access: {
    label: 'Access',
    options: [['one_time', 'One-time access'], ['lifetime', 'Lifetime access']],
  },
  level: {
    label: 'Level',
    options: [['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']],
  },
};

const TEXTS = {
  brand: { label: 'Brand', placeholder: 'e.g. Trek, Apple, handmade' },
  duration: { label: 'Duration', placeholder: 'e.g. 1 hour per session' },
};

function ContinuousToggle({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => { haptic('light'); onChange(!value); }}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
        padding: '14px 16px', marginBottom: 20, borderRadius: 'var(--radius-md)',
        border: `1px solid ${value ? 'rgba(180,244,74,0.4)' : 'var(--border-color)'}`,
        background: value ? 'rgba(180,244,74,0.08)' : 'var(--bg-card)',
        cursor: 'pointer', fontFamily: 'var(--font-sans)',
      }}
    >
      <Repeat size={18} style={{ color: value ? 'var(--accent-lime)' : 'var(--text-secondary)', flexShrink: 0 }} />
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Keep it active after a trade closes
        </span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>
          For standing offers like recurring services or mentoring
        </span>
      </span>
      <span style={{
        width: 40, height: 22, borderRadius: 'var(--radius-full)', flexShrink: 0, position: 'relative',
        background: value ? 'var(--accent-lime)' : 'rgba(255,255,255,0.12)', transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 21 : 3, width: 16, height: 16,
          borderRadius: '50%', background: value ? 'var(--bg-dark)' : 'var(--text-primary)',
          transition: 'left 0.2s',
        }} />
      </span>
    </button>
  );
}

export default function StepIntentKindFields({ kind, form, onChange }) {
  const fields = KIND_FIELD_DEFS[kind];
  if (!fields) return null;

  return (
    <>
      {fields.map((field) => {
        if (field === 'isContinuous') {
          return <ContinuousToggle key={field} value={form.isContinuous}
            onChange={(v) => onChange('isContinuous', v)} />;
        }
        if (SELECTS[field]) {
          const { label, options } = SELECTS[field];
          return (
            <Field key={field} label={label} hint="optional">
              <select style={inputStyle} value={form[field]}
                onChange={(e) => onChange(field, e.target.value)}>
                <option value="">Not specified</option>
                {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
            </Field>
          );
        }
        const { label, placeholder } = TEXTS[field];
        return (
          <Field key={field} label={label} hint="optional">
            <input style={inputStyle} placeholder={placeholder} maxLength={60}
              value={form[field]} onChange={(e) => onChange(field, e.target.value)} />
          </Field>
        );
      })}
    </>
  );
}
