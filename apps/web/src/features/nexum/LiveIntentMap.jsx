import { GitBranch, Search, Tag } from 'lucide-react';

export default function LiveIntentMap({ intents, marketSignal, rememberPreferences, onToggleMemory }) {
  if (!intents.length) return null;
  const candidates = marketSignal?.candidate_count ?? 0;

  return (
    <div className="nexum-live-map">
      <div className="nexum-live-map__header">
        <span><GitBranch size={13} /> Live intent map</span>
        {candidates > 0 && <strong>{candidates} possible connection{candidates === 1 ? '' : 's'}</strong>}
      </div>
      {intents.slice(0, 3).map((intent, index) => (
        <div className="nexum-live-map__intent" key={`${intent.direction}-${intent.title}-${index}`}>
          {intent.direction === 'want' ? <Search size={12} /> : <Tag size={12} />}
          <span>{intent.title}</span>
          <small>{intent.direction === 'want' ? 'Interest' : 'Offer'}</small>
        </div>
      ))}
      {intents.length > 3 && <small>+{intents.length - 3} more mapped</small>}
      <button className="nexum-memory-toggle" onClick={onToggleMemory}
        aria-pressed={rememberPreferences}>
        {rememberPreferences ? 'Preferences will be remembered' : 'Remember preferences next time'}
      </button>
    </div>
  );
}
