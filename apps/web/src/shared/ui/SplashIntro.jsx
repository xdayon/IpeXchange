import { useState, useEffect, lazy, Suspense } from 'react';

const NexumOrb = lazy(() => import('../../features/nexum/NexumOrb.jsx'));

// One-time immersive intro per session: Nexum's eye wakes up, the
// wordmark fades in, then the whole veil dissolves into the app.
export default function SplashIntro() {
  const [show, setShow] = useState(() => {
    if (sessionStorage.getItem('ipex-intro')) return false;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return true;
  });

  useEffect(() => {
    if (!show) return;
    sessionStorage.setItem('ipex-intro', '1');
    const id = setTimeout(() => setShow(false), 2300);
    return () => clearTimeout(id);
  }, [show]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-dark)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'splashOut 0.5s ease 1.8s forwards', pointerEvents: 'none',
    }}>
      <Suspense fallback={null}>
        <div className="pop-in"><NexumOrb state="thinking" size={180} /></div>
      </Suspense>
      <h1 className="stagger-enter" style={{ fontSize: 28, fontWeight: 800, marginTop: 4, animationDelay: '350ms' }}>
        Ipe<span className="text-gradient-lime">Xchange</span>
      </h1>
      <p className="stagger-enter" style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6,
        letterSpacing: 1.5, textTransform: 'uppercase', animationDelay: '600ms' }}>
        The intent market of Ipe City
      </p>
    </div>
  );
}
