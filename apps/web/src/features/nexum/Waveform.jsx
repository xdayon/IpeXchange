import { useRef, useEffect } from 'react';

const SAMPLE_MS = 80;
const MAX_BARS = 40;
const BAR_W = 3;
const BAR_GAP = 2;

// Rolling amplitude bars, WhatsApp/Telegram style. Falls back to a simple
// pulsing 3-bar CSS animation when no AnalyserNode is available.
export default function Waveform({ analyser }) {
  const canvasRef = useRef(null);
  const barsRef = useRef([]);

  useEffect(() => {
    if (!analyser) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const data = new Uint8Array(analyser.fftSize);
    let raf;
    let lastSample = 0;

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const bars = barsRef.current;
      ctx.fillStyle = 'rgba(56,189,248,0.85)';
      let x = W - BAR_W;
      for (let i = bars.length - 1; i >= 0 && x > 0; i--) {
        const h = Math.max(2, bars[i] * H);
        const y = (H - h) / 2;
        const r = BAR_W / 2;
        ctx.beginPath();
        ctx.moveTo(x, y + r);
        ctx.arcTo(x, y, x + BAR_W, y, r);
        ctx.arcTo(x + BAR_W, y, x + BAR_W, y + h, r);
        ctx.arcTo(x + BAR_W, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.fill();
        x -= BAR_W + BAR_GAP;
      }
    };

    const loop = (now) => {
      if (now - lastSample >= SAMPLE_MS) {
        lastSample = now;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const bars = barsRef.current;
        bars.push(Math.min(1, rms * 3.2));
        if (bars.length > MAX_BARS) bars.shift();
      }
      draw();
      if (!reduced) raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  if (!analyser) {
    return (
      <div className="voice-pulse-bars" aria-hidden="true">
        <span /><span /><span />
      </div>
    );
  }

  return <canvas ref={canvasRef} width={160} height={34} className="voice-waveform" aria-hidden="true" />;
}
