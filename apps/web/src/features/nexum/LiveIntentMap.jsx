import { GitBranch, Search, Tag } from 'lucide-react';

export default function LiveIntentMap({ intents }) {
  if (!intents.length) return null;

  return (
    <div className="nexum-live-map">
      <div className="nexum-live-map__header">
        <span><GitBranch size={13} /> What Nexum understands</span>
      </div>
      {intents.slice(0, 3).map((intent, index) => (
        <div className="nexum-live-map__intent" key={intent.interview_key ?? `${intent.direction}-${index}`}>
          {intent.direction === 'want' ? <Search size={12} /> : <Tag size={12} />}
          <span>{intent.title}</span>
          <small>{intent.direction === 'want' ? 'Interest' : 'Offer'}</small>
        </div>
      ))}
      {intents.length > 3 && <small>+{intents.length - 3} more mapped</small>}
    </div>
  );
}
