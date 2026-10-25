// Loop Radar: me at the center, partners on rings, animated arrows from giver to receiver.
import { useState } from 'react';
import { X } from 'lucide-react';
import {
  NODE_R, RADAR_CENTER, RADAR_SIZE, RING_RADII, curvedLink, layoutRadar, loopArcs, loopMemberSet, nodeDeals, openLoops,
} from './radarLayout.js';
import './radar.css';

function laneIndexer() {
  const seen = {};
  return (l) => {
    const key = `${l.source}>${l.target}`;
    seen[key] = (seen[key] ?? -1) + 1;
    return seen[key];
  };
}

function NodeSheet({ node, radar, onClose }) {
  const nameOf = (id) => radar.nodes.find((n) => n.id === id)?.label || 'Member';
  const { gives, receives } = nodeDeals(node.id, radar.links);
  const mine = node.role === 'me';
  return (
    <div className="radar-sheet glass-panel" role="dialog" aria-label={`${node.label} details`}>
      <button className="radar-sheet__close" onClick={onClose} aria-label="Close"><X size={16} /></button>
      <h3>{mine ? 'You' : node.label}</h3>
      {gives.length === 0 && receives.length === 0 && <p>No suggested swaps yet.</p>}
      {gives.length > 0 && (
        <>
          <p className="radar-sheet__label">{mine ? 'You give' : 'Gives'}</p>
          <ul>{gives.map((l) => <li key={`${l.offer_id}-${l.target}`}>{l.offer_title} <span>to {nameOf(l.target)}</span></li>)}</ul>
        </>
      )}
      {receives.length > 0 && (
        <>
          <p className="radar-sheet__label">{mine ? 'You receive' : 'Receives'}</p>
          <ul>{receives.map((l) => <li key={`${l.offer_id}-${l.source}`}>{l.offer_title} <span>from {nameOf(l.source)}</span></li>)}</ul>
        </>
      )}
    </div>
  );
}

export default function LoopRadar({ radar, mini = false }) {
  const [selected, setSelected] = useState(null);
  const positions = layoutRadar(radar.nodes);
  const inLoop = loopMemberSet(radar.loops);
  const loops = openLoops(radar.loops);
  const lane = laneIndexer();
  const selectedNode = radar.nodes.find((n) => n.id === selected);

  return (
    <div className={`radar ${mini ? 'radar--mini' : ''}`}>
      <svg className="radar__svg" viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`} role="img"
        aria-label="Radar of people you can trade with">
        <defs>
          <marker id="radar-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" className="radar__arrowhead" />
          </marker>
        </defs>
        {RING_RADII.slice(1).map((r) => (
          <circle key={r} className="radar__ring" cx={RADAR_CENTER} cy={RADAR_CENTER} r={r} />
        ))}
        {loops.map((loop, i) => (
          <circle key={loop.id} className="radar__loop" cx={RADAR_CENTER} cy={RADAR_CENTER}
            r={RING_RADII[1] + (i % 3) * 26 - 6} style={{ '--loop-delay': `${i * -3}s` }} />
        ))}
        {radar.links.map((link) => {
          const a = positions[link.source];
          const b = positions[link.target];
          if (!a || !b) return null;
          return (
            <path key={`${link.offer_id}-${link.source}-${link.target}`} d={curvedLink(a, b, lane(link))}
              className={`radar__link ${link.explicit ? 'is-explicit' : ''}`}
              markerEnd="url(#radar-arrow)" />
          );
        })}
        {loopArcs(radar.loops).map((arc) => {
          const a = positions[arc.source];
          const b = positions[arc.target];
          if (!a || !b) return null;
          return (
            <path key={arc.key} d={curvedLink(a, b, 0)} className="radar__link is-hot" markerEnd="url(#radar-arrow)" />
          );
        })}
        {radar.nodes.map((node) => {
          const p = positions[node.id];
          const me = node.role === 'me';
          return (
            <g key={node.id} className={`radar__node ${me ? 'is-me' : ''} ${inLoop.has(node.id) ? 'in-loop' : ''}`}
              tabIndex={mini ? -1 : 0} role="button" aria-label={`${me ? 'You' : node.label}: show details`}
              onClick={() => !mini && setSelected(node.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') setSelected(node.id); }}>
              <circle className="radar__halo" cx={p.x} cy={p.y} r={NODE_R + 7} />
              <circle className="radar__dot" cx={p.x} cy={p.y} r={me ? NODE_R + 3 : NODE_R} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" className="radar__initials">
                {me ? 'You' : (node.label || '?').slice(0, 2).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      {selectedNode && <NodeSheet node={selectedNode} radar={radar} onClose={() => setSelected(null)} />}
    </div>
  );
}
