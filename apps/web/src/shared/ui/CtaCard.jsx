import { ArrowRight } from 'lucide-react';

export default function CtaCard({ icon: Icon, title, desc, accent = 'cyan', delay = 0, onClick }) {
  return (
    <button className={`cta-card stagger-enter cta-card--${accent}`} onClick={onClick}
      style={{ '--enter-delay': `${delay}ms` }}>
      <span className="cta-card__icon"><Icon size={22} aria-hidden="true" /></span>
      <span className="cta-card__copy">
        <span className="cta-card__title">{title}</span>
        <span className="cta-card__description">{desc}</span>
      </span>
      <ArrowRight size={18} className="cta-card__arrow" aria-hidden="true" />
    </button>
  );
}
