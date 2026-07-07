import { useRef, useEffect } from 'react';

const CYAN = [56, 189, 248];
const LIME = [180, 244, 74];
const INDIGO = [129, 140, 248];

const STATES = {
  idle: { hue: CYAN, speed: 1.0, breath: 1.0 },
  listening: { hue: CYAN, speed: 0.5, breath: 1.6 },
  thinking: { hue: INDIGO, speed: 3.2, breath: 0.7 },
  speaking: { hue: LIME, speed: 1.4, breath: 1.2 },
};

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const lerp = (a, b, k) => a + (b - a) * k;

// Nexum's body: a breathing core with orbiting nodes (people) and threads
// (possible trades). Pure canvas, no assets. Adapted from the approved concept.
export default function NexumOrb({ state = 'idle', size = 160 }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = 320, H = 320, CX = W / 2, CY = H / 2;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const nodes = Array.from({ length: 9 }, (_, i) => ({
      r: 52 + (i % 4) * 20 + Math.random() * 8,
      a: Math.random() * Math.PI * 2,
      v: (0.002 + Math.random() * 0.0025) * (i % 2 ? 1 : -1),
      s: 1.6 + Math.random() * 1.6,
    }));
    const cur = { hue: [...CYAN], speed: 1, breath: 1 };
    let t = 0;
    let raf;

    const frame = () => {
      const target = STATES[stateRef.current] ?? STATES.idle;
      t += 1;
      cur.speed = lerp(cur.speed, target.speed, 0.04);
      cur.breath = lerp(cur.breath, target.breath, 0.04);
      for (let i = 0; i < 3; i++) cur.hue[i] = lerp(cur.hue[i], target.hue[i], 0.05);
      const hue = cur.hue.map(Math.round);

      ctx.clearRect(0, 0, W, H);

      const pos = nodes.map((n) => {
        n.a += n.v * cur.speed;
        return { x: CX + Math.cos(n.a) * n.r, y: CY + Math.sin(n.a) * n.r, s: n.s };
      });

      ctx.lineWidth = 0.8;
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const d = Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y);
          if (d < 70) {
            ctx.strokeStyle = rgba(hue, 0.22 * (1 - d / 70));
            ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke();
          }
        }
      }

      for (const p of pos) {
        ctx.fillStyle = rgba(hue, 0.85);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill();
      }

      ctx.strokeStyle = rgba(hue, 0.45);
      ctx.lineWidth = 1.2;
      for (const [r, dir] of [[36, 1], [45, -1]]) {
        const off = t * 0.004 * dir * cur.speed;
        for (let k = 0; k < 3; k++) {
          const a0 = off + (k * Math.PI * 2) / 3;
          ctx.beginPath(); ctx.arc(CX, CY, r, a0, a0 + 1.1); ctx.stroke();
        }
      }

      const breath = 1 + Math.sin(t * 0.03 * cur.breath) * 0.08 * cur.breath;
      const R = 20 * breath;
      const g = ctx.createRadialGradient(CX, CY, 2, CX, CY, R * 2.6);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.18, rgba(hue, 0.9));
      g.addColorStop(0.5, rgba(hue, 0.25));
      g.addColorStop(1, rgba(hue, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(CX, CY, R * 2.6, 0, 7); ctx.fill();

      if (!reduced) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      style={{ width: size, height: size, display: 'block' }}
      aria-label="Nexum, the trade oracle"
    />
  );
}
