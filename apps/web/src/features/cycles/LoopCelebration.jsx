import { useEffect } from 'react';
import { Share2, X } from 'lucide-react';
import CycleRing from './CycleRing.jsx';
import './celebration.css';

const CONFETTI = Array.from({ length: 28 }, (_, i) => i);

export default function LoopCelebration({
  hops, title, subtitle, actionLabel, onAction, onShare, onClose,
}) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="celebration" role="dialog" aria-modal="true" aria-label={title}>
      <div className="celebration__confetti" aria-hidden="true">
        {CONFETTI.map((i) => <span key={i} style={{ '--i': i, '--x': `${(i * 37) % 100}%` }} />)}
      </div>
      <button className="celebration__close" onClick={onClose} aria-label="Close"><X size={20} /></button>
      <div className="celebration__body">
        <div className="celebration__ring"><CycleRing count={hops} glow /></div>
        <h2 className="celebration__title text-gradient-lime">{title}</h2>
        <p className="celebration__subtitle">{subtitle}</p>
        <div className="celebration__actions">
          {actionLabel && <button className="btn btn--lime" onClick={onAction}>{actionLabel}</button>}
          {onShare && (
            <button className="btn btn--ghost" onClick={onShare}><Share2 size={16} /> Share</button>
          )}
        </div>
      </div>
    </div>
  );
}
