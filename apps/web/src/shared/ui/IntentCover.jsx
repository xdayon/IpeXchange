import { kindCover } from './kindCover.js';

export default function IntentCover({ kind, imageUrl, alt, height = 160 }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        style={{ width: '100%', height, objectFit: 'cover', display: 'block', background: 'var(--bg-elevated)' }}
      />
    );
  }
  const { icon: Icon, gradient, color } = kindCover(kind);
  return (
    <div
      role="img"
      aria-label={alt}
      style={{
        width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: gradient, color,
      }}
    >
      <Icon size={Math.min(40, height / 4 + 16)} strokeWidth={1.5} />
    </div>
  );
}
