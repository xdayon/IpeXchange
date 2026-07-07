// ── CreateListingWizard — Smart 4-step listing wizard ───────────────────────
// Designed for Telegram Mini App (TMA): thumb-friendly, low-friction, web3 UX.
// Steps: 1. Category  2. Photo + Details  3. Price & Terms  4. Preview & Publish
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Camera, X, Zap, Package,
  Wrench, BookOpen, Heart, DollarSign, Repeat2,
  Gift, Check, Sparkles, Upload, ChevronRight,
  Loader2, CheckCircle2, Share2,
} from 'lucide-react';
import { createListing } from '../../api/listings.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'Products',
    label: 'Product',
    emoji: '📦',
    icon: Package,
    desc: 'Physical or digital goods',
    color: '#38BDF8',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(56,189,248,0.05))',
    border: 'rgba(56,189,248,0.3)',
  },
  {
    id: 'Services',
    label: 'Service',
    emoji: '🛠️',
    icon: Wrench,
    desc: 'Skills, tasks & freelancing',
    color: '#B4F44A',
    gradient: 'linear-gradient(135deg, rgba(180,244,74,0.15), rgba(180,244,74,0.05))',
    border: 'rgba(180,244,74,0.3)',
  },
  {
    id: 'Knowledge',
    label: 'Knowledge',
    emoji: '🧠',
    icon: BookOpen,
    desc: 'Mentoring, classes, advice',
    color: '#A855F7',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
    border: 'rgba(168,85,247,0.3)',
  },
  {
    id: 'Donations',
    label: 'Donation',
    emoji: '💝',
    icon: Heart,
    desc: 'Free stuff for the community',
    color: '#F43F5E',
    gradient: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.05))',
    border: 'rgba(244,63,94,0.3)',
  },
];

const CONDITIONS = [
  { id: 'new',       label: 'New',            emoji: '✨' },
  { id: 'like_new',  label: 'Like New',       emoji: '💎' },
  { id: 'good',      label: 'Good Condition', emoji: '👍' },
  { id: 'fair',      label: 'Fair',           emoji: '🔧' },
  { id: 'for_parts', label: 'For Parts',      emoji: '🔩' },
];

const PAYMENT_MODES = [
  { id: 'fiat',   label: 'Fixed Price',  emoji: '💵', desc: 'USD / Local Fiat' },
  { id: 'crypto', label: 'Crypto',       emoji: '⛓️',  desc: 'ETH / Base L2' },
  { id: 'trade',  label: 'Trade/Barter', emoji: '🔄', desc: 'Open trade offer' },
  { id: 'free',   label: 'Free',         emoji: '💖', desc: 'No payment needed' },
];

const QUICK_TITLES = {
  Products:   ['Used Phone', 'Laptop', 'Book', 'Jacket', 'Bicycle'],
  Services:   ['English Class', 'Graphic Design', 'Consulting', 'Photography', 'Web Development'],
  Knowledge:  ['Python Mentorship', 'Career Coaching', 'Guitar Lessons', 'Crypto Guide'],
  Donations:  ['Baby Clothes', 'Textbooks', 'Toys', 'Household Items'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const haptic = (style = 'light') =>
  window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);

const notify = (type = 'success') =>
  window?.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step, total = 4 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
      {Array.from({ length: total }, (_, i) => {
        const done    = i < step;
        const current = i === step;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                width:  current ? 24 : 8,
                height: 8,
                borderRadius: 99,
                transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                background: done
                  ? 'var(--accent-lime)'
                  : current
                  ? 'linear-gradient(90deg, #B4F44A, #38BDF8)'
                  : 'rgba(255,255,255,0.12)',
                boxShadow: current ? '0 0 10px rgba(180,244,74,0.6)' : 'none',
              }}
            />
            {i < total - 1 && (
              <div style={{
                flex: 1, height: 1,
                background: done ? 'rgba(180,244,74,0.4)' : 'rgba(255,255,255,0.07)',
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepHeader({ step, emoji, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 36, marginBottom: 8, lineHeight: 1 }}>{emoji}</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, lineHeight: 1.2 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function NavRow({ onBack, onNext, nextLabel = 'Continue', nextIcon: NextIcon = ArrowRight, disabled = false, loading = false }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <ArrowLeft size={20} color="var(--text-secondary)" />
        </button>
      )}
      <button
        onClick={onNext}
        disabled={disabled || loading}
        style={{
          flex: 1, height: 52, borderRadius: 'var(--radius-md)', border: 'none',
          background: disabled
            ? 'rgba(180,244,74,0.15)'
            : 'linear-gradient(135deg, #B4F44A, #38BDF8)',
          color: disabled ? 'rgba(180,244,74,0.4)' : '#080C14',
          fontWeight: 800, fontSize: 16, cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s', boxShadow: disabled ? 'none' : '0 4px 20px rgba(180,244,74,0.3)',
        }}
      >
        {loading ? (
          <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <>
            <span>{nextLabel}</span>
            {NextIcon && <NextIcon size={18} />}
          </>
        )}
      </button>
    </div>
  );
}

function ChipGroup({ options, value, onChange, multi = false }) {
  const selected = Array.isArray(value) ? value : [value];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const active = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            onClick={() => {
              haptic('light');
              if (multi) {
                const next = active
                  ? selected.filter(v => v !== opt.id)
                  : [...selected, opt.id];
                onChange(next);
              } else {
                onChange(opt.id);
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              border: `1px solid ${active ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
              background: active ? 'rgba(56,189,248,0.12)' : 'var(--bg-card)',
              color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontSize: 14, fontWeight: active ? 700 : 500, cursor: 'pointer',
              fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
            }}
          >
            {opt.emoji && <span style={{ fontSize: 16 }}>{opt.emoji}</span>}
            {opt.label}
            {active && <Check size={13} strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          {label}
        </label>
        {required && <span style={{ fontSize: 11, color: 'var(--accent-pink)' }}>*</span>}
        {hint && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '14px 16px',
  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
  fontSize: 16, fontFamily: 'var(--font-sans)', outline: 'none',
  transition: 'border-color 0.2s',
};

// ─── Step 1: Category ─────────────────────────────────────────────────────────

function StepCategory({ value, onChange }) {
  return (
    <div className="page-enter">
      <StepHeader
        step={1}
        emoji="🌿"
        title="What are you offering?"
        subtitle="Choose the category that best represents your listing."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {CATEGORIES.map(cat => {
          const active = value === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => { haptic('medium'); onChange(cat.id); }}
              style={{
                padding: '20px 16px', borderRadius: 'var(--radius-lg)',
                border: `1.5px solid ${active ? cat.border : 'var(--border-color)'}`,
                background: active ? cat.gradient : 'var(--bg-card)',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
                transition: 'all 0.25s',
                transform: active ? 'scale(1.03)' : 'scale(1)',
                boxShadow: active ? `0 0 0 1px ${cat.border}, 0 8px 24px rgba(0,0,0,0.3)` : 'none',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 20, height: 20, borderRadius: '50%',
                  background: cat.color, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={12} color="#080C14" strokeWidth={3} />
                </div>
              )}
              <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: active ? cat.color : 'var(--text-primary)', marginBottom: 2 }}>
                {cat.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                {cat.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Photo + Details ──────────────────────────────────────────────────

function StepDetails({ form, onChange, category }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const quickTitles = QUICK_TITLES[category] || [];
  const showCondition = category === 'Products';
  const catInfo = CATEGORIES.find(c => c.id === category);

  const handleFile = (file) => {
    if (!file?.type.startsWith('image/')) return;
    onChange('imageFile', file);
    onChange('imagePreview', URL.createObjectURL(file));
    haptic('light');
  };

  return (
    <div className="page-enter">
      <StepHeader
        step={2}
        emoji={catInfo?.emoji || '📋'}
        title="Listing details"
        subtitle="Photos and descriptions are the heart of your listing."
      />

      {/* Photo upload */}
      <div style={{ marginBottom: 20 }}>
        <Field label="Photo" hint="optional (but recommended ✨)">
          {form.imagePreview ? (
            <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <img
                src={form.imagePreview}
                alt="preview"
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
              }} />
              <button
                type="button"
                onClick={() => { onChange('imageFile', null); onChange('imagePreview', null); haptic('light'); }}
                style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', borderRadius: '50%', width: 32, height: 32,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  position: 'absolute', bottom: 10, right: 10,
                  background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', borderRadius: 'var(--radius-md)',
                  padding: '6px 12px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <Camera size={13} /> Change
              </button>
            </div>
          ) : (
            <label
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 10, padding: '32px 24px',
                border: `2px dashed ${dragging ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                background: dragging ? 'rgba(56,189,248,0.05)' : 'var(--bg-card)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'rgba(56,189,248,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Camera size={22} color="var(--accent-cyan)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                  Take a photo or upload an image
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  JPG, PNG, WEBP — up to 5MB
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files?.[0])}
              />
            </label>
          )}
        </Field>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <Field label="Title" required hint={`${form.title.length}/80`}>
          <input
            style={inputStyle}
            placeholder="e.g., iPhone 13 128GB like new"
            value={form.title}
            maxLength={80}
            onChange={e => onChange('title', e.target.value)}
            onFocus={e => { e.target.style.borderColor = 'var(--accent-cyan)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; }}
          />
        </Field>
        {/* Quick title chips */}
        {quickTitles.length > 0 && !form.title && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
              <Zap size={10} style={{ display: 'inline', marginRight: 2 }} />
              Suggestions:
            </span>
            {quickTitles.map(t => (
              <button
                key={t}
                onClick={() => { onChange('title', t); haptic('light'); }}
                style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  background: 'none', color: 'var(--text-secondary)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{ marginBottom: showCondition ? 20 : 0 }}>
        <Field label="Description" hint={`${(form.description || '').length}/500`}>
          <textarea
            style={{ ...inputStyle, minHeight: 100, resize: 'vertical', lineHeight: 1.5 }}
            placeholder="Describe your offer: condition, what's included, any unique features..."
            value={form.description}
            maxLength={500}
            onChange={e => onChange('description', e.target.value)}
            onFocus={e => { e.target.style.borderColor = 'var(--accent-cyan)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; }}
          />
        </Field>
      </div>

      {/* Condition (products only) */}
      {showCondition && (
        <Field label="Condition">
          <ChipGroup
            options={CONDITIONS}
            value={form.condition}
            onChange={v => { onChange('condition', v); }}
          />
        </Field>
      )}
    </div>
  );
}

// ─── Step 3: Price & Terms ────────────────────────────────────────────────────

function StepPricing({ form, onChange, ethPrice }) {
  const isTrade = form.paymentModes.includes('trade');
  const isFiat  = form.paymentModes.includes('fiat');
  const isCrypto = form.paymentModes.includes('crypto');
  const isFree  = form.paymentModes.includes('free');

  const handleModeToggle = (id) => {
    haptic('light');
    const current = form.paymentModes;
    if (id === 'free') {
      // free is exclusive
      onChange('paymentModes', current.includes('free') ? [] : ['free']);
      return;
    }
    // removing free if selecting something else
    const without = current.filter(v => v !== 'free');
    const next = without.includes(id)
      ? without.filter(v => v !== id)
      : [...without, id];
    onChange('paymentModes', next);
  };

  return (
    <div className="page-enter">
      <StepHeader
        step={3}
        emoji="💰"
        title="Price & terms"
        subtitle="You can accept multiple methods. The more flexible, the more interest you attract."
      />

      {/* Payment mode selector */}
      <div style={{ marginBottom: 24 }}>
        <Field label="How to accept payment" required>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
            {PAYMENT_MODES.map(mode => {
              const active = form.paymentModes.includes(mode.id);
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeToggle(mode.id)}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${active ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    background: active ? 'rgba(56,189,248,0.08)' : 'var(--bg-card)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{mode.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--accent-cyan)' : 'var(--text-primary)', marginBottom: 2 }}>
                    {mode.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{mode.desc}</div>
                  {active && (
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'none' }}>
                      <Check size={12} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      {/* Fiat price */}
      {isFiat && (
        <div style={{ marginBottom: 16 }}>
          <Field label="Price (USD)">
            <div style={{ position: 'relative' }}>
              <DollarSign size={16} style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
              }} />
              <input
                type="number" min="0" step="0.01"
                style={{ ...inputStyle, paddingLeft: 40 }}
                placeholder="0.00"
                value={form.priceFiat}
                onChange={e => onChange('priceFiat', e.target.value)}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-cyan)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; }}
              />
            </div>
          </Field>
        </div>
      )}

      {/* Crypto price */}
      {isCrypto && (
        <div style={{ marginBottom: 16 }}>
          <Field label="Price (ETH)" hint="Base L2">
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 14, color: 'var(--text-secondary)',
              }}>Ξ</span>
              <input
                type="number" min="0" step="0.00001"
                style={{ ...inputStyle, paddingLeft: 36 }}
                placeholder="0.00000"
                value={form.priceEth}
                onChange={e => onChange('priceEth', e.target.value)}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-cyan)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; }}
              />
            </div>
          </Field>
        </div>
      )}

      {/* Live conversion rate message */}
      {ethPrice && (isFiat || isCrypto) && (
        <div style={{
          marginBottom: 16, padding: '12px 14px', borderRadius: 'var(--radius-md)',
          background: 'rgba(180,244,74,0.06)', border: '1px solid rgba(180,244,74,0.18)',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)'
        }}>
          <Sparkles size={14} color="var(--accent-lime)" style={{ flexShrink: 0 }} />
          <span>
            Live rate: <strong>1 ETH = ${Number(ethPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</strong>
          </span>
        </div>
      )}

      {/* Trade wants */}
      {isTrade && (
        <div style={{ marginBottom: 16 }}>
          <Field label="What would you accept in trade?">
            <textarea
              style={{ ...inputStyle, minHeight: 80 }}
              placeholder="e.g., Laptop, audio gear, online courses, organic coffee..."
              value={form.tradeWants}
              onChange={e => onChange('tradeWants', e.target.value)}
              onFocus={e => { e.target.style.borderColor = 'var(--accent-cyan)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; }}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Preview + Publish ────────────────────────────────────────────────

function StepPreview({ form }) {
  const catInfo = CATEGORIES.find(c => c.id === form.category);

  const priceLabel = () => {
    if (form.paymentModes.includes('free')) return '💖 Free';
    const parts = [];
    if (form.priceFiat)   parts.push(`$${parseFloat(form.priceFiat).toFixed(2)}`);
    if (form.priceEth)    parts.push(`Ξ ${form.priceEth}`);
    if (form.paymentModes.includes('trade')) parts.push('🔄 Trade');
    return parts.join(' · ') || 'To be agreed';
  };

  return (
    <div className="page-enter">
      <StepHeader
        step={4}
        emoji="🚀"
        title="Ready to publish?"
        subtitle="Review your details before broadcasting to the Ipê network."
      />

      {/* Preview card */}
      <div style={{
        borderRadius: 'var(--radius-xl)',
        border: `1px solid ${catInfo?.border || 'var(--border-color)'}`,
        background: catInfo?.gradient || 'var(--bg-card)',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        marginBottom: 24,
      }}>
        {/* Image */}
        {form.imagePreview ? (
          <div style={{ position: 'relative' }}>
            <img
              src={form.imagePreview}
              alt={form.title}
              style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(8,12,20,0.8) 0%, transparent 50%)',
            }} />
          </div>
        ) : (
          <div style={{
            width: '100%', height: 120,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48,
          }}>
            {catInfo?.emoji}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '16px 20px 20px' }}>
          {/* Category badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 'var(--radius-full)',
            background: `${catInfo?.color}18`, border: `1px solid ${catInfo?.border}`,
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 12 }}>{catInfo?.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: catInfo?.color }}>{catInfo?.label}</span>
            {form.condition && form.category === 'Products' && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {CONDITIONS.find(c => c.id === form.condition)?.label}
                </span>
              </>
            )}
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
            {form.title || 'Your listing title'}
          </h3>

          {form.description && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
              {form.description.slice(0, 120)}{form.description.length > 120 ? '...' : ''}
            </p>
          )}

          {/* Price + payment tags */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#B4F44A' }}>
              {priceLabel()}
            </span>
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div style={{
        padding: '14px 16px', borderRadius: 'var(--radius-md)',
        background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <Sparkles size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Your offer will be indexed with <strong style={{ color: 'var(--accent-cyan)' }}>semantic AI</strong> and
          visible to the entire Ipê network. You can edit or pause it at any time.
        </p>
      </div>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ listing, onDiscover, onCreateAnother }) {
  useEffect(() => {
    notify('success');
  }, []);

  const shareToTelegram = () => {
    const tg = window?.Telegram?.WebApp;
    const url = `${import.meta.env.VITE_APP_URL || 'https://ipexchange.xyz'}?listing=${listing?.id}`;
    const text = `🌿 New listing on IpêXchange: *${listing?.title}*\n\nCheck it out or contact me inside the app!`;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
    }
    haptic('medium');
  };

  return (
    <div
      className="page-enter"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '40px 0',
        minHeight: '60vh', justifyContent: 'center',
      }}
    >
      {/* Success animation */}
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(180,244,74,0.2), rgba(56,189,248,0.2))',
        border: '2px solid rgba(180,244,74,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        boxShadow: '0 0 40px rgba(180,244,74,0.2)',
        animation: 'successPulse 2s ease-in-out infinite',
      }}>
        <CheckCircle2 size={48} color="#B4F44A" />
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        Listing <span className="text-gradient-lime">published!</span>
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 1.5, marginBottom: 32 }}>
        Your listing is live on the Ipê network and indexed with semantic AI. 🚀
      </p>

      {/* CTA buttons */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={shareToTelegram}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px', borderRadius: 'var(--radius-md)', border: 'none',
            background: 'linear-gradient(135deg, #B4F44A, #38BDF8)',
            color: '#080C14', fontWeight: 800, fontSize: 16,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            boxShadow: '0 4px 20px rgba(180,244,74,0.3)',
          }}
        >
          <Share2 size={18} />
          Share on Telegram
        </button>

        <button
          onClick={onDiscover}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)', color: 'var(--text-primary)',
            fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          View marketplace
        </button>

        <button
          onClick={onCreateAnother}
          style={{
            background: 'none', border: 'none',
            color: 'var(--accent-cyan)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '8px',
          }}
        >
          + Create another listing
        </button>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  category:     'Products',
  imageFile:    null,
  imagePreview: null,
  title:        '',
  description:  '',
  condition:    'good',
  paymentModes: ['fiat'],
  priceFiat:    '',
  priceEth:     '',
  tradeWants:   '',
  showOnMap:    false,
};

const STEP_LABELS = ['Category', 'Details', 'Price', 'Publish'];

export default function CreateListingWizard({ onBack, onSuccess, onDiscover, user, isTMA = false }) {
  const [step, setStep]       = useState(0);
  const [form, setFormState]  = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState(null);
  const [published, setPublished]   = useState(null);
  const [ethPrice, setEthPrice] = useState(null);
  const containerRef = useRef(null);

  // Fetch ETH-USD live price feed from Coinbase API on mount
  useEffect(() => {
    let active = true;
    const fetchEthPrice = async () => {
      try {
        const res = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot');
        if (res.ok) {
          const data = await res.json();
          const rate = parseFloat(data?.data?.amount);
          if (rate && active) {
            setEthPrice(rate);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch live ETH price:', err);
      }
    };
    fetchEthPrice();
    return () => { active = false; };
  }, []);

  const set = useCallback((key, value) => {
    setFormState(prev => {
      const next = { ...prev, [key]: value };
      // If we are changing USD price and live ETH price is available, suggest the converted ETH price
      if (key === 'priceFiat' && ethPrice) {
        const usd = parseFloat(value);
        if (!isNaN(usd) && usd > 0) {
          // Suggest ETH price up to 5 decimals for precision
          next.priceEth = (usd / ethPrice).toFixed(5);
        } else {
          next.priceEth = '';
        }
      }
      return next;
    });
  }, [ethPrice]);

  const scrollTop = () => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const goNext = () => {
    haptic('light');
    setStep(s => { const n = Math.min(s + 1, 3); scrollTop(); return n; });
  };
  const goPrev = () => {
    haptic('light');
    setStep(s => { const n = Math.max(s - 1, 0); scrollTop(); return n; });
  };

  // Validation per step
  const canProceed = () => {
    if (step === 0) return !!form.category;
    if (step === 1) return form.title.trim().length >= 2;
    if (step === 2) return form.paymentModes.length > 0;
    return true;
  };

  const handlePublish = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let imageUrl = null;

      // Upload image if exists
      if (form.imageFile) {
        const fd = new FormData();
        fd.append('image', form.imageFile);
        fd.append('sessionId', user?.id || 'anon');
        const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
        try {
          const res = await fetch(`${API}/listings/upload-image`, { method: 'POST', body: fd });
          if (res.ok) { const d = await res.json(); imageUrl = d.url; }
        } catch (_) { /* image upload is best-effort */ }
      }

      const payload = {
        sessionId: user?.id || `anon_${Date.now()}`,
        userId: user?.id || null,
        listing: {
          title:         form.title.trim(),
          description:   form.description.trim(),
          category:      form.category,
          condition:     form.condition,
          price_fiat:    form.priceFiat ? Number(form.priceFiat) : null,
          price_eth:     form.priceEth  ? Number(form.priceEth)  : null,
          accepts_trade: form.paymentModes.includes('trade'),
          trade_wants:   form.tradeWants || null,
          is_free:       form.paymentModes.includes('free'),
          payment_modes: form.paymentModes,
          location_privacy: !form.showOnMap,
          image_url:     imageUrl,
          provider_name: user?.displayName || user?.tgUser?.first_name || 'Network Member',
        },
      };

      const result = await createListing(payload);
      if (result?.listing) {
        notify('success');
        setPublished(result.listing);
        onSuccess?.(result.listing);
      } else {
        throw new Error(result?.error || 'Failed to publish. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Unexpected error. Please try again.');
      notify('error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setFormState(INITIAL_FORM);
    setStep(0);
    setPublished(null);
    setError(null);
  };

  if (published) {
    return (
      <div ref={containerRef} style={{ padding: '24px 0 48px', maxWidth: 520, margin: '0 auto' }}>
        <SuccessScreen
          listing={published}
          onDiscover={onDiscover || onBack}
          onCreateAnother={resetWizard}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ padding: '16px 0 80px', maxWidth: 520, margin: '0 auto' }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={step === 0 ? onBack : goPrev}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
          }}
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
            Step {step + 1} of 4 · {STEP_LABELS[step]}
          </div>
          <ProgressBar step={step} total={4} />
        </div>
      </div>

      {/* Step content */}
      {step === 0 && (
        <StepCategory
          value={form.category}
          onChange={v => set('category', v)}
        />
      )}
      {step === 1 && (
        <StepDetails
          form={form}
          onChange={set}
          category={form.category}
        />
      )}
      {step === 2 && (
        <StepPricing
          form={form}
          onChange={set}
          ethPrice={ethPrice}
        />
      )}
      {step === 3 && (
        <StepPreview form={form} />
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
          borderRadius: 'var(--radius-md)', color: '#F43F5E', fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Nav buttons */}
      {step < 3 ? (
        <NavRow
          onBack={step > 0 ? goPrev : null}
          onNext={goNext}
          disabled={!canProceed()}
        />
      ) : (
        <NavRow
          onBack={goPrev}
          onNext={handlePublish}
          nextLabel="Publish Now"
          nextIcon={Sparkles}
          loading={submitting}
        />
      )}

      <style>{`
        @keyframes successPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(180,244,74,0.2); }
          50% { box-shadow: 0 0 60px rgba(180,244,74,0.4), 0 0 80px rgba(56,189,248,0.2); }
        }
      `}</style>
    </div>
  );
}
