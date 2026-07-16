import { normalizeDraftForReview } from './copilotDrafts.js';
import { conceptForKind } from './intentTaxonomy.js';

const DIRECTION_ALIASES = {
  want: 'want', buy: 'want', need: 'want', seek: 'want', looking_for: 'want', request: 'want',
  offer: 'offer', sell: 'offer', provide: 'offer', teach: 'offer', give: 'offer',
};

const KIND_ALIASES = {
  good: 'good', goods: 'good', product: 'good', item: 'good', physical: 'good',
  digital: 'digital', software: 'digital', file: 'digital',
  service: 'service', services: 'service', work: 'service',
  knowledge: 'knowledge', class: 'knowledge', course: 'knowledge', lesson: 'knowledge',
};

const SIDE_VALUES = new Set(['unknown', 'provided', 'declined']);

const canonical = (value, aliases) => aliases[String(value ?? '').trim().toLowerCase()] ?? value;

export function normalizeInterviewIntent(intent) {
  const canonicalIntent = {
    ...intent,
    direction: canonical(intent?.direction, DIRECTION_ALIASES),
    kind: canonical(intent?.kind, KIND_ALIASES),
  };
  const draft = normalizeDraftForReview(canonicalIntent);
  draft.concept_id = conceptForKind(canonicalIntent.concept_id, draft.kind);
  draft.confidence = Math.max(0, Math.min(1, Number(intent?.confidence) || 0));
  return draft;
}

function previousSideStatus(previous, side) {
  const explicit = previous.side_status?.[side];
  if (SIDE_VALUES.has(explicit)) return explicit;
  return previous.sides_checked?.[side] === true ? 'declined' : 'unknown';
}

function sideStatus(output, previous, side, intents) {
  if (intents.some((intent) => intent.direction === side)) return 'provided';
  const incoming = output?.side_status?.[side];
  if (SIDE_VALUES.has(incoming) && incoming !== 'unknown') return incoming;
  if (output?.sides_checked?.[side] === true) return 'declined';
  return previousSideStatus(previous, side);
}

export function hasMatchDetail(intent) {
  if (intent.kind === 'good') {
    return Boolean(intent.condition || intent.brand || intent.location_text || intent.timeframe || intent.price_fiat);
  }
  if (['service', 'knowledge'].includes(intent.kind)) {
    return Boolean(intent.format || intent.level || intent.duration || intent.location_text || intent.timeframe);
  }
  return Boolean(intent.access || intent.timeframe || intent.price_fiat);
}

export function deriveInterviewState(output, previous = {}, { turnCount = 1 } = {}) {
  const incoming = (Array.isArray(output?.intents) ? output.intents : [])
    .map(normalizeInterviewIntent)
    .filter((intent) => intent.direction && intent.kind && intent.title?.length >= 3)
    .slice(0, 10);
  // A malformed or incomplete model turn must never erase already verified facts.
  const intents = incoming.length ? incoming : (previous.intents ?? []).map(normalizeInterviewIntent);
  const side_status = {
    want: sideStatus(output, previous, 'want', intents),
    offer: sideStatus(output, previous, 'offer', intents),
  };
  const checked = {
    want: side_status.want !== 'unknown',
    offer: side_status.offer !== 'unknown',
  };
  const usable = intents.filter((intent) => intent.concept_id);
  const sidesComplete = checked.want && checked.offer;
  const detailed = usable.filter(hasMatchDetail);
  const ready = usable.length > 0 && sidesComplete && (detailed.length > 0 || turnCount >= 3);

  return {
    intents,
    side_status,
    sides_checked: checked,
    focus_field: null,
    ready,
    can_reveal: usable.length > 0 && (ready || turnCount >= 2),
    progress: {
      interests: intents.filter((intent) => intent.direction === 'want').length,
      offers: intents.filter((intent) => intent.direction === 'offer').length,
      detailed: detailed.length,
    },
  };
}

export function signalIntent(state) {
  return [...(state.intents ?? [])].sort((a, b) => b.confidence - a.confidence)[0] ?? null;
}
