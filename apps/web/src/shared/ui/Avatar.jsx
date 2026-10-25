export default function Avatar({ src, name, size = 36 }) {
  const initials = (name || '?').trim().slice(0, 2).toUpperCase();
  return (
    <span className="avatar" style={{ '--avatar-size': `${size}px` }} aria-hidden="true">
      {src ? <img src={src} alt="" loading="lazy" /> : initials}
    </span>
  );
}
