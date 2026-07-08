
import { Sparkles, Repeat } from 'lucide-react';
import { directionInfo, kindInfo, formatPrice, kindFieldChips } from '../constants.js';
import IntentCover from '../../../shared/ui/IntentCover.jsx';

export default function StepIntentReview({ form }) {
  const dir = directionInfo(form.direction);
  const kind = kindInfo(form.kind);
  const price = formatPrice(form.priceFiat ? Number(form.priceFiat) : null);
  const chips = kindFieldChips(form);

  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Ready to publish?</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
        Review before broadcasting to the Ipe network.
      </p>

      <div style={{
        borderRadius: 'var(--radius-xl)', border: `1px solid ${dir.color}40`,
        background: 'var(--bg-card)', overflow: 'hidden', marginBottom: 24,
      }}>
        <IntentCover kind={form.kind} imageUrl={form.imagePreview} alt={form.title} height={200} />
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', textTransform: 'uppercase',
              letterSpacing: 0.5, borderRadius: 'var(--radius-full)', background: dir.bg, color: dir.color }}>
              {dir.label}
            </span>
            {kind && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px',
                borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-secondary)' }}>
                {kind.label}
              </span>
            )}
            {form.isContinuous && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px',
                borderRadius: 'var(--radius-full)', background: 'rgba(180,244,74,0.08)',
                color: 'var(--accent-lime)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Repeat size={11} /> Stays active after trades
              </span>
            )}
            {chips.map((chip) => (
              <span key={chip} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px',
                borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-secondary)' }}>
                {chip}
              </span>
            ))}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
            {form.title || 'Your intent title'}
          </h3>
          {form.description && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
              {form.description.slice(0, 140)}{form.description.length > 140 ? '...' : ''}
            </p>
          )}
          {price && <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-lime)' }}>{price}</span>}
        </div>
      </div>

      <div style={{
        padding: '14px 16px', borderRadius: 'var(--radius-md)',
        background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <Sparkles size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Your intent is indexed semantically and crossed against the whole network,
          including multi-party trade cycles. You can edit or archive it anytime.
        </p>
      </div>
    </div>
  );
}
