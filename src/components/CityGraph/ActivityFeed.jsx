// src/components/CityGraph/ActivityFeed.jsx
import { useEffect, useRef } from 'react';

const ICONS = { trade:'⇄', transfer:'→', connect:'⊕', purchase:'◈', vote:'⬡' };

export function ActivityFeed({ activities }) {
  const ref = useRef(null);
  
  // Auto-scroll to latest
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [activities]);

  return (
    <div style={{
      position:'absolute', bottom:16, left:16, zIndex:600, width:240,
      background:'rgba(4,25,43,0.88)', backdropFilter:'blur(12px)',
      border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding:'7px 12px', fontSize:9, fontWeight:700, letterSpacing:'0.14em',
        textTransform:'uppercase', color:'rgba(122,231,255,0.7)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex', alignItems:'center', gap:6,
      }}>
        <span style={{ 
          width:5, height:5, borderRadius:'50%', background:'#B4F44A',
          boxShadow:'0 0 6px #B4F44A', display:'inline-block' 
        }} />
        Live Activity
      </div>

      {/* Feed list */}
      <div ref={ref} style={{ maxHeight:140, overflowY:'auto', padding:'6px 0', scrollbarWidth:'none' }}>
        {activities.length === 0 && (
          <div style={{ padding:'8px 12px', fontSize:10, color:'rgba(255,255,255,0.25)' }}>
            Waiting for activity…
          </div>
        )}
        {activities.map(act => (
          <div key={act.id} style={{
            display:'flex', alignItems:'flex-start', gap:7, padding:'4px 12px',
            animation:'fadeInUp 0.3s ease',
          }}>
            <span style={{ fontSize:10, color:act.color, flexShrink:0, marginTop:1 }}>
              {ICONS[act.type] || '·'}
            </span>
            <span style={{
              fontSize:10, color:'rgba(255,255,255,0.65)', lineHeight:1.4,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>{act.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
