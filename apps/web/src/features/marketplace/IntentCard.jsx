
import { Repeat, ShoppingBag } from 'lucide-react';
import { directionInfo, kindInfo, formatPrice } from '../intent/constants.js';
import IntentCover from '../../shared/ui/IntentCover.jsx';

const styles = {
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    position: 'relative',
    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
  },
  body: { padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badge: (info) => ({
    fontSize: 11, fontWeight: 700, padding: '3px 10px',
    borderRadius: 'var(--radius-full)', background: info.bg, color: info.color,
    textTransform: 'uppercase', letterSpacing: 0.5,
  }),
  price: { fontSize: 15, fontWeight: 700, color: 'var(--accent-lime)' },
  title: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 },
  desc: {
    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  kindTag: {
    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
    padding: '3px 8px', borderRadius: 'var(--radius-sm)',
    background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', alignSelf: 'flex-start',
  },
};

export default function IntentCard({ intent, onClick }) {
  if (!intent?.id) return null;
  const dir = directionInfo(intent.direction);
  const kind = kindInfo(intent.kind);
  const KindIcon = kind?.icon;
  const price = formatPrice(intent.price_fiat);

  return (
    <article
      className="intent-card hover-lift pressable"
      style={styles.card}
    >
      <button className="intent-card__action" onClick={() => onClick?.(intent)}
        aria-label={`View ${dir.label.toLowerCase()}: ${intent.title}`} />
      <IntentCover kind={intent.kind} imageUrl={intent.image_url} alt={intent.title} height={160} />
      <div style={styles.body}>
        <div style={styles.meta}>
          <span style={styles.badge(dir)}>{dir.label}</span>
          {price && <span style={styles.price}>{price}</span>}
        </div>
        <h3 style={styles.title}>{intent.title}</h3>
        {intent.description && <p style={styles.desc}>{intent.description}</p>}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {kind && (
            <span style={styles.kindTag}>
              {KindIcon && <KindIcon size={12} />} {kind.label}
            </span>
          )}
          {intent.is_continuous && (
            <span style={{ ...styles.kindTag, color: 'var(--accent-lime)', background: 'rgba(180,244,74,0.08)' }}>
              <Repeat size={12} /> Stays active
            </span>
          )}
          {intent.direction === 'offer' && ['buy_now', 'both'].includes(intent.transaction_mode) && (
            <span style={{ ...styles.kindTag, color: 'var(--accent-cyan)', background: 'rgba(56,189,248,0.08)' }}>
              <ShoppingBag size={12} /> {intent.transaction_mode === 'both' ? 'Buy or exchange' : 'Buy now'}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
