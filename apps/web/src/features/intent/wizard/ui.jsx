import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

export function ProgressBar({ step, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 99, transition: 'background 0.3s',
          background: i <= step ? 'var(--accent-lime)' : 'rgba(255,255,255,0.1)',
        }} />
      ))}
    </div>
  );
}

export function Field({ label, hint, required, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
          color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          {label}
        </label>
        {required && <span style={{ fontSize: 11, color: 'var(--accent-pink)' }}>*</span>}
        {hint && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function NavRow({ onBack, onNext, nextLabel = 'Continue', nextIcon: NextIcon = ArrowRight, disabled, loading }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
      {onBack && (
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 52, height: 52, borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)', cursor: 'pointer', flexShrink: 0,
        }}>
          <ArrowLeft size={20} color="var(--text-secondary)" />
        </button>
      )}
      <button
        onClick={onNext}
        disabled={disabled || loading}
        className="pressable"
        style={{
          flex: 1, height: 52, borderRadius: 'var(--radius-md)', border: 'none',
          background: disabled ? 'rgba(180,244,74,0.15)' : 'linear-gradient(135deg, var(--accent-lime), var(--accent-cyan))',
          color: disabled ? 'rgba(180,244,74,0.4)' : 'var(--bg-dark)',
          fontWeight: 800, fontSize: 16, cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading ? <Loader2 size={20} className="spin" /> : <><span>{nextLabel}</span>{NextIcon && <NextIcon size={18} />}</>}
      </button>
    </div>
  );
}
