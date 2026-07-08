import { ArrowRight } from 'lucide-react';

export default function CtaCard({ icon: Icon, title, desc, color, bg, border, delay = 0, onClick }) {
  return (
    <button
      className="stagger-enter"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
        padding: '20px 22px', borderRadius: 'var(--radius-lg)',
        border: `1px solid ${border}`, background: bg,
        cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'transform 0.2s',
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
    >
      <span style={{
        width: 46, height: 46, borderRadius: 'var(--radius-md)', flexShrink: 0,
        background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} style={{ color }} />
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
          {title}
        </span>
        <span style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</span>
      </span>
      <ArrowRight size={18} style={{ color, flexShrink: 0 }} />
    </button>
  );
}
