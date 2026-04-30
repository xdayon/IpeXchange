// src/components/CityGraph/SimEngine.js
// Client-side simulation engine — generates continuous fake city activity
// without requiring real backend transactions.

const TEMPLATES = [
  { type: 'trade',      label: (a, b) => `Trade: ${a} ↔ ${b}`,       color: '#7AE7FF' },
  { type: 'listing',    label: (a, b) => `New offer: ${a} → ${b}`,    color: '#A78BFA' },
  { type: 'event',      label: (a, b) => `${b} confirmed ${a}`,       color: '#FB923C' },
  { type: 'investment', label: (a, b) => `${a} applied to ${b}`,      color: '#FFC857' },
  { type: 'transfer',   label: (a, b) => `Transfer: ${a} → ${b}`,     color: '#B4F44A' },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hashStr(s) {
  return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

export class SimEngine {
  /**
   * @param {object} opts
   * @param {function} opts.onSimEdge  — called with { id, source, target, color, durationMs }
   * @param {function} opts.onActivity — called with { id, text, color, type, ts }
   * @param {number}   opts.intervalMs — ms between sim events (default 3200)
   */
  constructor({ onSimEdge, onActivity, intervalMs = 3200 }) {
    this.onSimEdge = onSimEdge;
    this.onActivity = onActivity;
    this.intervalMs = intervalMs;
    this._timer = null;
    this._entities = [];
    this._tick = 0;
  }

  /**
   * Update the pool of entities the sim can pick from.
   * Should be called whenever entities change.
   */
  setEntities(entities) {
    this._entities = entities.filter(
      e => !e.isSafetyZone && e.layer !== 'environment' && e.location
    );
  }

  start() {
    if (this._timer) return;
    this._timer = setInterval(() => this._step(), this.intervalMs);
    // Fire first event quickly so the map feels alive immediately
    setTimeout(() => this._step(), 600);
    setTimeout(() => this._step(), 1600);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _step() {
    const pool = this._entities;
    if (pool.length < 2) return;
    this._tick++;

    // Pick two different random entities
    let si = Math.floor(Math.random() * pool.length);
    let ti = Math.floor(Math.random() * pool.length);
    let guard = 0;
    while (ti === si && guard++ < 10) ti = Math.floor(Math.random() * pool.length);

    const src = pool[si];
    const tgt = pool[ti];
    const tmpl = pick(TEMPLATES);
    const durationMs = 2800 + (hashStr(src.id) % 2400);

    this.onSimEdge?.({
      id: `sim-${this._tick}`,
      source: src,
      target: tgt,
      color: tmpl.color,
      durationMs,
    });

    this.onActivity?.({
      id: `act-${this._tick}`,
      text: tmpl.label(src.label, tgt.label),
      color: tmpl.color,
      type: tmpl.type,
      ts: Date.now(),
    });
  }
}
