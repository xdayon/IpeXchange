import { useRef, useEffect } from 'react';

const CYAN = [56, 189, 248];
const LIME = [180, 244, 74];
const INDIGO = [129, 140, 248];

const STATES = {
  idle: { hue: CYAN, speed: 1.0, breath: 1.0, gaze: 0.5 },
  listening: { hue: CYAN, speed: 0.5, breath: 1.6, gaze: 0.15 },
  thinking: { hue: INDIGO, speed: 3.0, breath: 0.7, gaze: 1.6 },
  speaking: { hue: LIME, speed: 1.4, breath: 1.2, gaze: 0.7 },
};

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const lerp = (a, b, k) => a + (b - a) * k;

// Nexum's body: an oracular eye at the heart of the trade graph.
// Orbiting nodes are people, threads are possible trades; the iris
// wanders as if reading them, blinking now and then. Pure canvas.
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

    const nodes = Array.from({ length: 10 }, (_, i) => ({
      r: 58 + (i % 4) * 20 + Math.random() * 8,
      a: Math.random() * Math.PI * 2,
      v: (0.002 + Math.random() * 0.0025) * (i % 2 ? 1 : -1),
      s: 1.5 + Math.random() * 1.6,
    }));
    const motes = Array.from({ length: 14 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 40 + Math.random() * 110,
      v: 0.12 + Math.random() * 0.3,
    }));
    const cur = { hue: [...CYAN], speed: 1, breath: 1, gaze: 0.5 };
    let t = 0;
    let raf;
    let blinkAt = 160 + Math.random() * 260;

    const frame = () => {
      const target = STATES[stateRef.current] ?? STATES.idle;
      t += 1;
      cur.speed = lerp(cur.speed, target.speed, 0.04);
      cur.breath = lerp(cur.breath, target.breath, 0.04);
      cur.gaze = lerp(cur.gaze, target.gaze, 0.04);
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
            ctx.strokeStyle = rgba(hue, 0.2 * (1 - d / 70));
            ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke();
          }
        }
      }
      for (const p of pos) {
        ctx.fillStyle = rgba(hue, 0.8);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill();
      }

      // Dust drifting toward the eye, like intents being read.
      for (const m of motes) {
        m.r -= m.v * cur.speed * 0.4;
        if (m.r < 34) { m.r = 130 + Math.random() * 30; m.a = Math.random() * Math.PI * 2; }
        const fade = Math.min(1, (m.r - 34) / 40);
        ctx.fillStyle = rgba(hue, 0.35 * fade);
        ctx.beginPath(); ctx.arc(CX + Math.cos(m.a) * m.r, CY + Math.sin(m.a) * m.r, 1, 0, 7); ctx.fill();
      }

      // Rune rings: broken arcs and ticks slowly counter-rotating.
      ctx.strokeStyle = rgba(hue, 0.4);
      ctx.lineWidth = 1.2;
      for (const [r, dir, n] of [[44, 1, 3], [54, -1, 5]]) {
        const off = t * 0.003 * dir * cur.speed;
        for (let k = 0; k < n; k++) {
          const a0 = off + (k * Math.PI * 2) / n;
          ctx.beginPath(); ctx.arc(CX, CY, r, a0, a0 + (n === 3 ? 1.3 : 0.5)); ctx.stroke();
        }
      }
      ctx.lineWidth = 1;
      for (let k = 0; k < 12; k++) {
        const a0 = -t * 0.0012 * cur.speed + (k * Math.PI) / 6;
        ctx.strokeStyle = rgba(hue, 0.22);
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(a0) * 62, CY + Math.sin(a0) * 62);
        ctx.lineTo(CX + Math.cos(a0) * (62 + (k % 3 ? 3 : 6)), CY + Math.sin(a0) * (62 + (k % 3 ? 3 : 6)));
        ctx.stroke();
      }

      // The eye. Blink is a fast lid sweep; the iris wanders with the gaze.
      if (t > blinkAt) blinkAt = t + 180 + Math.random() * 300;
      const sinceBlink = blinkAt - t;
      const lid = sinceBlink < 14 ? Math.abs(sinceBlink - 7) / 7 : 1;
      const breath = 1 + Math.sin(t * 0.03 * cur.breath) * 0.07 * cur.breath;
      const gx = Math.sin(t * 0.011 * cur.gaze) * 7;
      const gy = Math.cos(t * 0.017 * cur.gaze) * 4;

      const halo = ctx.createRadialGradient(CX, CY, 4, CX, CY, 58 * breath);
      halo.addColorStop(0, rgba(hue, 0.32));
      halo.addColorStop(1, rgba(hue, 0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(CX, CY, 58 * breath, 0, 7); ctx.fill();

      ctx.save();
      ctx.translate(CX, CY);
      ctx.scale(1, Math.max(0.06, lid));
      const sclera = ctx.createRadialGradient(0, 0, 2, 0, 0, 30 * breath);
      sclera.addColorStop(0, rgba(hue, 0.5));
      sclera.addColorStop(0.75, rgba(hue, 0.12));
      sclera.addColorStop(1, rgba(hue, 0));
      ctx.fillStyle = sclera;
      ctx.beginPath(); ctx.ellipse(0, 0, 32 * breath, 20 * breath, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = rgba(hue, 0.55);
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(0, 0, 32 * breath, 20 * breath, 0, 0, 7); ctx.stroke();

      const iris = ctx.createRadialGradient(gx, gy, 1, gx, gy, 13);
      iris.addColorStop(0, 'rgba(255,255,255,0.95)');
      iris.addColorStop(0.3, rgba(hue, 0.95));
      iris.addColorStop(1, rgba(hue, 0.1));
      ctx.fillStyle = iris;
      ctx.beginPath(); ctx.arc(gx, gy, 11, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(8,12,20,0.85)';
      ctx.beginPath(); ctx.arc(gx, gy, 4 + Math.sin(t * 0.05) * 0.6, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(gx - 3, gy - 3, 1.4, 0, 7); ctx.fill();
      ctx.restore();

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
