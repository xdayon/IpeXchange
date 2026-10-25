import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { useCountUp } from './useActivity.js';
import { tickerEvents, timeAgo } from './activityText.js';

function Counter({ label, value }) {
  const shown = useCountUp(value);
  return (
    <div className="pulse-counter">
      <strong>{shown.toLocaleString('en-US')}</strong>
      <span>{label}</span>
    </div>
  );
}

function Ticker({ events }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (events.length < 2) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % events.length), 3800);
    return () => clearInterval(id);
  }, [events.length]);

  if (events.length === 0) return null;
  const event = events[index % events.length];
  return (
    <p className="pulse-ticker" aria-live="polite">
      <Radio size={14} aria-hidden="true" />
      <span key={`${event.at}-${index}`} className="pulse-ticker__text">
        {event.text} <small>{timeAgo(event.at)}</small>
      </span>
    </p>
  );
}

export default function PulseStats({ activity }) {
  const stats = activity?.stats;
  const events = tickerEvents(activity?.events);
  if (!stats && events.length === 0) return null;

  return (
    <section className="pulse glass-panel" aria-label="Live activity">
      {stats && (
        <div className="pulse-counters">
          <Counter label="Members" value={stats.members} />
          <Counter label="Live Offers and Interests" value={stats.active_intents} />
          <Counter label="Open loops" value={stats.open_loops} />
          <Counter label="Loops completed" value={stats.completed_loops} />
        </div>
      )}
      <Ticker events={events} />
    </section>
  );
}
