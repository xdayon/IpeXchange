// src/components/ActivityFeed.jsx
import { useEffect, useRef } from 'react';

const ACTIVITY_ICONS = {
  trade:      '⇄',
  listing:    '🏷',
  event:      '📅',
  investment: '📈',
  transfer:   '→',
};

export function ActivityFeed({ activities }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [activities.length]);

  return (
    <div className="activity-feed-panel">
      <div className="activity-feed-header">
        <span className="pulse-dot" />
        Live Activity in Ipê City
      </div>
      <ul ref={listRef} className="activity-feed-list">
        {activities.length === 0 ? (
          <li className="activity-feed-empty">Waiting for activity…</li>
        ) : (
          activities.slice(0, 20).map(act => (
            <li key={act.id} className="activity-feed-item">
              <span className="activity-icon" style={{ color: act.color }}>
                {ACTIVITY_ICONS[act.type] ?? '•'}
              </span>
              <span className="activity-text">{act.text}</span>
              <span className="activity-time">{act.time}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
