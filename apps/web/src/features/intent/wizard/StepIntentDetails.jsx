import { useRef, useState } from 'react';
import { Camera, X, DollarSign, ShoppingBag, Repeat2, Split } from 'lucide-react';
import { Field } from './ui.jsx';
import { inputStyle, haptic } from './helpers.js';
import StepIntentKindFields from './StepIntentKindFields.jsx';

const TRANSACTION_OPTIONS = [
  { id: 'exchange', label: 'Exchange only', desc: 'Receive trade proposals and group trade matches.', icon: Repeat2 },
  { id: 'buy_now', label: 'Buy now', desc: 'Sell at a fixed USD price through Base.', icon: ShoppingBag },
  { id: 'both', label: 'Both', desc: 'Accept direct purchases and exchange proposals.', icon: Split },
];

const PAYMENT_TOKENS = [
  { id: 'usdc', label: 'USDC', hint: 'Recommended' },
  { id: 'eth', label: 'ETH' },
  { id: 'eurc', label: 'EURC' },
  { id: 'cbbtc', label: 'cbBTC' },
];

export default function StepIntentDetails({ form, onChange, direction }) {
  const fileRef = useRef(null);
  const [imageError, setImageError] = useState(null);

  const handleFile = (file) => {
    if (!file?.type?.startsWith('image/')) {
      setImageError('Choose a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Images must be 5MB or smaller.');
      return;
    }
    setImageError(null);
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

      {direction === 'offer' && (
        <Field label="How can people get this?" required>
          <div style={{ display: 'grid', gap: 10 }}>
            {TRANSACTION_OPTIONS.map(({ id, label, desc, icon: Icon }) => (
              <button type="button" key={id} onClick={() => onChange('transactionMode', id)}
                aria-pressed={form.transactionMode === id}
                style={{ padding: 14, borderRadius: 'var(--radius-md)', textAlign: 'left', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', display: 'flex', gap: 12, alignItems: 'center',
                  color: 'var(--text-primary)', background: form.transactionMode === id
                    ? 'rgba(180,244,74,0.08)' : 'var(--bg-card)',
                  border: `1px solid ${form.transactionMode === id ? 'var(--border-active)' : 'var(--border-color)'}` }}>
                <Icon size={19} color={form.transactionMode === id ? 'var(--accent-lime)' : 'var(--text-secondary)'} />
                <span><strong style={{ display: 'block', fontSize: 14 }}>{label}</strong>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</span></span>
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label={form.transactionMode !== 'exchange' && direction === 'offer'
        ? 'Buy now price (USD)' : 'Estimated exchange value (USD)'}
        required={form.transactionMode !== 'exchange' && direction === 'offer'}
        hint={form.transactionMode === 'exchange' || direction !== 'offer' ? 'optional, helps balance trades' : 'fixed checkout price'}>
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

      {direction === 'offer' && form.transactionMode !== 'exchange' && (
        <Field label="Accepted payment tokens" required hint="USDC is the simplest USD-priced option">
          <div className="filter-chips" style={{ marginBottom: 10 }}>
            {PAYMENT_TOKENS.map((token) => {
              const active = form.acceptedPaymentTokens.includes(token.id);
              return (
                <button type="button" key={token.id} className={`filter-chip ${active ? 'active' : ''}`}
                  aria-pressed={active} onClick={() => onChange('acceptedPaymentTokens', active
                    ? form.acceptedPaymentTokens.filter((id) => id !== token.id)
                    : [...form.acceptedPaymentTokens, token.id])}>
                  {token.label}{token.hint ? ` (${token.hint})` : ''}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            Funds go directly to your verified payout wallet. IpeXchange never holds them.
            Publishing is blocked if your payout wallet is not ready.
          </p>
        </Field>
      )}

      <Field label="Photo" hint="optional, 1 image up to 5MB">
        {imageError && (
          <p style={{ color: 'var(--accent-pink)', fontSize: 13, marginBottom: 10 }}>{imageError}</p>
        )}
        {form.imagePreview ? (
          <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <img src={form.imagePreview} alt="preview"
              style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
            <button type="button"
              aria-label="Remove photo"
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

      <StepIntentKindFields kind={form.kind} form={form} onChange={onChange} />
    </div>
  );
}
