import { CONTINUOUS_KINDS, KIND_FIELD_KEYS, KINDS } from './intentFields.js';
import { conceptForKind } from './intentTaxonomy.js';

const ENUMS = {
  condition: ['new', 'used', 'refurbished'],
  format: ['in_person', 'online', 'hybrid'],
  access: ['one_time', 'lifetime'],
  level: ['beginner', 'intermediate', 'advanced'],
};

const cleanText = (value, max) => {
  const text = value == null ? '' : String(value).trim();
  return text ? text.slice(0, max) : null;
};

export function normalizeCopilotDraft(draft) {
  const kind = KINDS.includes(draft?.kind) ? draft.kind : null;
  const normalized = {
    direction: ['want', 'offer'].includes(draft?.direction) ? draft.direction : null,
    kind,
    title: cleanText(draft?.title, 80),
    description: cleanText(draft?.description, 4000),
    category: cleanText(draft?.category, 40)?.toLowerCase() ?? null,
    price_fiat: draft?.price_fiat != null && Number.isFinite(Number(draft.price_fiat))
      && Number(draft.price_fiat) >= 0 ? Number(draft.price_fiat) : null,
    is_continuous: CONTINUOUS_KINDS.includes(kind) && draft?.is_continuous === true,
    concept_id: conceptForKind(draft?.concept_id, kind),
    location_text: cleanText(draft?.location_text, 120),
    timeframe: cleanText(draft?.timeframe, 80),
    currency: cleanText(draft?.currency, 3)?.toUpperCase() ?? null,
    value_flexibility: ['fixed', 'flexible', 'unknown'].includes(draft?.value_flexibility)
      ? draft.value_flexibility : null,
    location_radius_km: validPositive(draft?.location_radius_km, true),
    quantity: validPositive(draft?.quantity),
    exchange_modes: cleanList(draft?.exchange_modes),
    delivery_modes: cleanList(draft?.delivery_modes),
    attributes: objectOrEmpty(draft?.attributes),
    constraints: objectOrEmpty(draft?.constraints),
    field_confidence: objectOrEmpty(draft?.field_confidence),
  };

  for (const key of KIND_FIELD_KEYS) {
    const value = cleanText(draft?.[key], 60);
    normalized[key] = ENUMS[key] && !ENUMS[key].includes(value) ? null : value;
  }
  return normalized;
}

function validPositive(value, allowZero = false) {
  const number = Number(value);
  return value != null && Number.isFinite(number) && (allowZero ? number >= 0 : number > 0)
    ? number : null;
}

const cleanList = (value) => Array.isArray(value)
  ? value.map((item) => cleanText(item, 30)).filter(Boolean).slice(0, 4) : [];

const objectOrEmpty = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export function normalizeDraftForReview(draft) {
  const normalized = normalizeCopilotDraft(draft);
  const missing = Array.isArray(draft?.missing_fields) ? draft.missing_fields : [];
  return {
    ...normalized,
    missing_fields: missing
      .filter((field) => ['price_fiat', 'timeframe', 'location_text', ...KIND_FIELD_KEYS].includes(field))
      .filter((field, index, all) => all.indexOf(field) === index),
  };
}

export function intentEmbeddingText(intent) {
  const attributes = [
    intent.direction === 'want' ? 'Looking for' : 'Offering',
    intent.kind, intent.category, intent.condition, intent.brand, intent.duration,
    intent.format, intent.access, intent.level,
    intent.concept_id, intent.location_text, intent.timeframe,
    ...(intent.exchange_modes ?? []), ...(intent.delivery_modes ?? []),
    intent.is_continuous ? 'recurring or continuously available' : null,
  ].filter(Boolean).join(' | ');
  return `${intent.title}\n${intent.description ?? ''}\n${attributes}`.slice(0, 8000);
}
