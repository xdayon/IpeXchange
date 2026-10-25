import { useCallback, useEffect, useRef, useState } from 'react';
import { Handshake, RotateCcw, Sparkles, X } from 'lucide-react';
import SwipeCard from './SwipeCard.jsx';
import LoopCelebration from '../cycles/LoopCelebration.jsx';
import { useDeck } from './useDeck.js';
import { useTelegram } from '../../shared/hooks/useTelegram.js';
import {
  cardRotation, decideSwipe, decisionForKey, flingX, stampOpacity,
} from './swipeMath.js';
import './swipe.css';

const MOVED_PX = 8;
const EXIT_MS = 240;

export default function SwipeDeck({ onSelectIntent, onNavigate, onOpenLoop }) {
  const { haptic, notify } = useTelegram();
  const deck = useDeck(true);
  const [drag, setDrag] = useState({ x: 0, active: false });
  const [leaving, setLeaving] = useState(null);
  const start = useRef(null);
  const top = deck.cards[0];

  const commit = useCallback((decision) => {
    if (!top || leaving) return;
    haptic(decision === 'accept' ? 'medium' : 'light');
    setLeaving({ id: top.id, decision });
    setTimeout(() => {
      deck.decide(top, decision);
      setLeaving(null);
      setDrag({ x: 0, active: false });
    }, EXIT_MS);
  }, [top, leaving, haptic, deck]);

  useEffect(() => {
    if (deck.celebration) notify('success');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.celebration]);

  useEffect(() => {
    const onKey = (event) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      const decision = decisionForKey(event.key);
      if (decision) { event.preventDefault(); commit(decision); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commit]);

  const onPointerDown = (event) => {
    if (leaving) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    start.current = { x: event.clientX, t: performance.now(), lastX: event.clientX, lastT: performance.now(), v: 0 };
    setDrag({ x: 0, active: true });
  };
  const onPointerMove = (event) => {
    const s = start.current;
    if (!s) return;
    const now = performance.now();
    const dt = Math.max(1, now - s.lastT);
    s.v = (event.clientX - s.lastX) / dt;
    s.lastX = event.clientX;
    s.lastT = now;
    setDrag({ x: event.clientX - s.x, active: true });
  };
  const onPointerUp = () => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const decision = decideSwipe(drag.x, s.v);
    if (decision) commit(decision);
    else {
      if (Math.abs(drag.x) < MOVED_PX && top) onSelectIntent?.({ id: top.id });
      setDrag({ x: 0, active: false });
    }
  };

  const topX = leaving ? flingX(leaving.decision) : drag.x;
  const topStyle = {
    transform: `translateX(${topX}px) rotate(${cardRotation(topX)}deg)`,
    transition: drag.active ? 'none' : `transform ${EXIT_MS}ms var(--ease-out-soft)`,
  };
  const acceptStamp = topX > 0 ? stampOpacity(topX) : 0;
  const passStamp = topX < 0 ? stampOpacity(topX) : 0;

  if (deck.loading) {
    return <div className="swipe-empty"><Sparkles className="pulse" size={32} /><p role="status">Shuffling the market...</p></div>;
  }

  return (
    <section className="swipe" aria-label="Swipe the market">
      {deck.cards.length === 0 ? (
        <div className="swipe-empty glass-panel">
          <Sparkles size={36} aria-hidden="true" />
          <h2>{deck.error ? 'Could not load the deck' : 'You are all caught up'}</h2>
          <p>{deck.error || 'Add more Offers and Interests with Nexum so it can find new matches for you.'}</p>
          {deck.error
            ? <button className="btn btn--ghost" onClick={deck.reload}>Try again</button>
            : <button className="btn btn--lime" onClick={() => onNavigate('nexum')}>Talk to Nexum</button>}
        </div>
      ) : (
        <div className="swipe-stack">
          {deck.cards.slice(0, 3).map((card, index) => (
            <article
              key={card.id}
              className={`swipe-card ${index === 0 ? 'swipe-card--top' : ''}`}
              style={index === 0 ? topStyle : { '--depth': index }}
              onPointerDown={index === 0 ? onPointerDown : undefined}
              onPointerMove={index === 0 ? onPointerMove : undefined}
              onPointerUp={index === 0 ? onPointerUp : undefined}
              onPointerCancel={index === 0 ? onPointerUp : undefined}
              aria-label={`${card.title}. Swipe right to accept, left to pass.`}
              aria-hidden={index === 0 ? undefined : true}
            >
              <SwipeCard card={card} />
              {index === 0 && (
                <>
                  <span className="swipe-stamp swipe-stamp--accept" style={{ opacity: acceptStamp }}>Accept</span>
                  <span className="swipe-stamp swipe-stamp--pass" style={{ opacity: passStamp }}>Pass</span>
                </>
              )}
            </article>
          ))}
        </div>
      )}

      {deck.cards.length > 0 && (
        <div className="swipe-actions">
          <button className="swipe-btn swipe-btn--pass pressable" onClick={() => commit('pass')} aria-label="Pass">
            <X size={28} />
          </button>
          <button className="swipe-btn swipe-btn--undo pressable" onClick={deck.undo}
            disabled={!deck.lastDecision} aria-label="Undo last decision">
            <RotateCcw size={20} />
          </button>
          <button className="swipe-btn swipe-btn--accept pressable" onClick={() => commit('accept')} aria-label="Accept">
            <Handshake size={28} />
          </button>
        </div>
      )}
      {deck.cards.length > 0 && deck.error && <p className="swipe-error" role="alert">{deck.error}</p>}
      <p className="swipe-hint">Swipe right to accept, left to pass. Arrow keys work too.</p>

      {deck.celebration && (
        <LoopCelebration
          hops={deck.celebration.hops}
          title="Loop found!"
          subtitle={`A ${deck.celebration.hops === 2 ? 'direct swap' : `${deck.celebration.hops}-person trade loop`} just closed around you.`}
          actionLabel="Review loop"
          onAction={() => { deck.dismissCelebration(); onOpenLoop(deck.celebration.id); }}
          onClose={deck.dismissCelebration}
        />
      )}
    </section>
  );
}
