import { useEffect, useState } from 'react';
import CycleRing from '../cycles/CycleRing.jsx';

const NAMES = ['Ana', 'Leo', 'You'];
const CAPTIONS = [
  'Ana gives a bicycle to Leo',
  'Leo gives guitar lessons to you',
  'You give design help to Ana',
];

export default function HowLoops() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % CAPTIONS.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="how-loops glass-panel" aria-labelledby="how-loops-title">
      <h2 id="how-loops-title">How loops work</h2>
      <div className="how-loops__ring">
        <CycleRing count={3} names={NAMES} activeEdge={active} />
      </div>
      <p className="how-loops__caption" aria-live="polite">{CAPTIONS[active]}</p>
      <p className="how-loops__sum">Everyone gives one thing and gets one thing. No money needed.</p>
    </section>
  );
}
