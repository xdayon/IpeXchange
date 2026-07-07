
import { directionInfo, kindInfo, formatPrice } from '../intent/constants.js';

const styles = {
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
  },
  img: { width: '100%', height: 160, objectFit: 'cover', background: 'var(--bg-elevated)' },
  placeholder: {
    width: '100%', height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(56,189,248,0.06), rgba(180,244,74,0.06))',
    color: 'var(--text-secondary)',
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
      style={styles.card}
      onClick={() => onClick?.(intent)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(56,189,248,0.25)';
        e.currentTarget.style.boxShadow = 'var(--shadow-cyan)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {intent.image_url ? (
        <img src={intent.image_url} alt={intent.title} style={styles.img} loading="lazy" />
      ) : (
        <div style={styles.placeholder}>{KindIcon && <KindIcon size={28} strokeWidth={1.5} />}</div>
      )}
      <div style={styles.body}>
        <div style={styles.meta}>
          <span style={styles.badge(dir)}>{dir.label}</span>
          {price && <span style={styles.price}>{price}</span>}
        </div>
        <h3 style={styles.title}>{intent.title}</h3>
        {intent.description && <p style={styles.desc}>{intent.description}</p>}
        {kind && (
          <span style={styles.kindTag}>
            {KindIcon && <KindIcon size={12} />} {kind.label}
          </span>
        )}
      </div>
    </article>
  );
}
