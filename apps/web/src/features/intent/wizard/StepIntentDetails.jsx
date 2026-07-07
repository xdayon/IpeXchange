import { useRef } from 'react';
import { Camera, X, DollarSign } from 'lucide-react';
import { Field } from './ui.jsx';
import { inputStyle, haptic } from './helpers.js';

export default function StepIntentDetails({ form, onChange, direction }) {
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file?.type?.startsWith('image/')) return;
    onChange('imageFile', file);
    onChange('imagePreview', URL.createObjectURL(file));
    haptic('light');
  };

  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
        {direction === 'offer' ? 'Describe your offer' : 'Describe your interest'}
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
        The clearer the description, the better the matches the oracle can find.
      </p>

      <Field label="Title" required hint={`${form.title.length}/80`}>
        <input
          style={inputStyle}
          placeholder={direction === 'offer' ? 'e.g. Website design and development' : 'e.g. A road bike in good condition'}
          value={form.title}
          maxLength={80}
          onChange={(e) => onChange('title', e.target.value)}
        />
      </Field>

      <Field label="Description" hint={`${form.description.length}/500`}>
        <textarea
          style={{ ...inputStyle, minHeight: 110, resize: 'vertical', lineHeight: 1.5 }}
          placeholder="Details, condition, scope, what a fair exchange looks like..."
          value={form.description}
          maxLength={500}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </Field>

      <Field label="Estimated value (USD)" hint="optional, helps balance trades">
        <div style={{ position: 'relative' }}>
          <DollarSign size={16} style={{ position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="number" min="0" step="0.01"
            style={{ ...inputStyle, paddingLeft: 40 }}
            placeholder="0.00"
            value={form.priceFiat}
            onChange={(e) => onChange('priceFiat', e.target.value)}
          />
        </div>
      </Field>

      <Field label="Photo" hint="optional, 1 image up to 5MB">
        {form.imagePreview ? (
          <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <img src={form.imagePreview} alt="preview"
              style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
            <button type="button"
              onClick={() => { onChange('imageFile', null); onChange('imagePreview', null); }}
              style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32,
                background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--text-primary)', borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            padding: '28px 24px', border: '2px dashed rgba(255,255,255,0.12)',
            borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: 'var(--bg-card)',
          }}>
            <Camera size={22} color="var(--accent-cyan)" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Take a photo or upload an image
            </span>
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
        )}
      </Field>
    </div>
  );
}
