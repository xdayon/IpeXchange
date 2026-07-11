import { normalizeDraftForReview } from './copilotDrafts.js';
import { conceptForKind } from './intentTaxonomy.js';

export function normalizeInterviewIntent(intent) {
  const draft = normalizeDraftForReview(intent);
  draft.concept_id = conceptForKind(intent?.concept_id, draft.kind);
  draft.confidence = Math.max(0, Math.min(1, Number(intent?.confidence) || 0));
  return draft;
}

export function deriveInterviewState(output, previous = {}) {
  const intents = (Array.isArray(output?.intents) ? output.intents : [])
    .map(normalizeInterviewIntent)
    .filter((intent) => intent.direction && intent.kind && intent.title?.length >= 3)
    .slice(0, 10);
  const checked = {
    want: previous.sides_checked?.want === true || output?.sides_checked?.want === true,
    offer: previous.sides_checked?.offer === true || output?.sides_checked?.offer === true,
  };
  const usable = intents.filter((intent) => intent.confidence >= 0.65 && intent.concept_id);
  return {
    intents,
    sides_checked: checked,
    focus_field: String(output?.focus_field ?? '').slice(0, 40) || null,
    ready: usable.length > 0 && checked.want && checked.offer,
    progress: {
      interests: intents.filter((intent) => intent.direction === 'want').length,
      offers: intents.filter((intent) => intent.direction === 'offer').length,
      detailed: usable.length,
    },
  };
}

export function signalIntent(state) {
  return [...(state.intents ?? [])].sort((a, b) => b.confidence - a.confidence)[0] ?? null;
}
