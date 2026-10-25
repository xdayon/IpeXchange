import { ArrowRight } from 'lucide-react';
import { useRadar } from '../cycles/useRadar.js';
import LoopRadar from '../cycles/LoopRadar.jsx';

export default function YourLoops({ onOpen }) {
  const { radar } = useRadar(true);
  const stats = radar?.stats;
  const hasRadar = radar?.nodes?.length > 1;

  return (
    <button className="your-loops glass-panel pressable" onClick={onOpen} aria-label="Open your loops">
      <div className="your-loops__radar">
        {hasRadar ? <LoopRadar radar={radar} mini /> : <div className="your-loops__placeholder" aria-hidden="true" />}
      </div>
      <div className="your-loops__copy">
        <h2>Your loops</h2>
        <p>
          <strong>{stats?.open_loops ?? 0}</strong> open
          <span aria-hidden="true"> / </span>
          <strong>{stats?.completed_loops ?? 0}</strong> completed
        </p>
        <p className="your-loops__sub">
          {stats ? `${stats.offers} Offers and ${stats.interests} Interests working for you` : 'Nexum is watching for matches'}
        </p>
        <span className="your-loops__go">See your radar <ArrowRight size={16} aria-hidden="true" /></span>
      </div>
    </button>
  );
}
