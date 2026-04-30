// src/components/ActivityFeed.jsx
import { useEffect, useRef } from 'react';

const FEED_ICONS = {
  trade:      '⇄',
  listing:    '🏷',
  event:      '📅',
  investment: '📈',
  transfer:   '→',
};

export function ActivityFeed({ activities }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [activities.length]);

  return (
    <>
      <h4 className="feed-title">
        <span className="live-dot" />
        Live Activity in Ipê City
      </h4>
      <ul ref={listRef} className="feed-list">
        {activities.length === 0 ? (
          <li style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Waiting for activity…
          </li>
        ) : (
          activities.slice(0, 20).map(act => (
            <li key={act.id} className="feed-item">
              <span className="feed-icon" style={{ color: act.color }}>
                {FEED_ICONS[act.type] ?? '•'}
              </span>
              <span className="feed-text">{act.text}</span>
              <span className="feed-time">{act.time}</span>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
