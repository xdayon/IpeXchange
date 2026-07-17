import { CONCEPT_IDS, conceptForKind } from './intentTaxonomy.js';

export const DIRECTIONS = ['want', 'offer'];
export const KINDS = ['good', 'digital', 'service', 'knowledge'];
export const STATUSES = ['active', 'fulfilled', 'archived'];
export const CONTINUOUS_KINDS = ['service', 'knowledge'];
export const TRANSACTION_MODES = ['exchange', 'buy_now', 'both'];
export const PAYMENT_TOKENS = ['usdc', 'eth', 'eurc', 'cbbtc'];

const KIND_FIELD_ENUMS = {
  condition: ['new', 'used', 'refurbished'],
  format: ['in_person', 'online', 'hybrid'],
  access: ['one_time', 'lifetime'],
  level: ['beginner', 'intermediate', 'advanced'],
};

export const KIND_FIELD_KEYS = ['condition', 'brand', 'duration', 'format', 'access', 'level'];

export const EDITABLE = [
  'title', 'description', 'kind', 'category', 'price_fiat', 'image_url', 'status',
  'is_continuous', 'concept_id', 'location_text', 'location_radius_km', 'timeframe',
  'quantity', 'currency', 'value_flexibility', 'exchange_modes', 'delivery_modes',
  'transaction_mode', 'accepted_payment_tokens',
  'attributes', 'constraints', 'field_confidence', 'expires_at', ...KIND_FIELD_KEYS,
];

export const INTENT_FIELDS =
  'id, user_id, direction, kind, title, description, category, price_fiat, image_url, ' +
  'status, source, created_at, is_continuous, condition, brand, duration, format, access, level, ' +
  'concept_id, location_text, location_radius_km, timeframe, quantity, currency, value_flexibility, ' +
  'exchange_modes, delivery_modes, transaction_mode, accepted_payment_tokens, ' +
  'attributes, constraints, field_confidence, expires_at';

export function validateTransactionFields(body) {
  const mode = body.transaction_mode ?? 'exchange';
  const tokens = body.accepted_payment_tokens ?? [];
  if (!TRANSACTION_MODES.includes(mode)) return 'Invalid transaction_mode';
  if (!Array.isArray(tokens) || tokens.some((token) => !PAYMENT_TOKENS.includes(token))) {
    return `accepted_payment_tokens must only contain: ${PAYMENT_TOKENS.join(', ')}`;
  }
  if (new Set(tokens).size !== tokens.length) return 'accepted_payment_tokens must be unique';
  if (body.direction === 'want' && mode !== 'exchange') {
    return 'Interests can only use exchange mode';
  }
  const acceptsPayment = mode === 'buy_now' || mode === 'both';
  if (acceptsPayment && !(Number(body.price_fiat) > 0)) {
    return 'Buy now offers require a positive USD price';
  }
  if (acceptsPayment && tokens.length === 0) return 'Choose at least one accepted payment token';
  if (!acceptsPayment && tokens.length > 0) return 'Exchange-only intents cannot accept payment tokens';
  return null;
}

export function validateKindFields(body) {
  for (const [field, allowed] of Object.entries(KIND_FIELD_ENUMS)) {
    const value = body[field];
    if (value != null && !allowed.includes(value)) {
      return `${field} must be one of: ${allowed.join(', ')}`;
    }
  }
  if (body.concept_id != null && !CONCEPT_IDS.includes(body.concept_id)) return 'Invalid concept_id';
  if (body.concept_id != null && body.kind != null && !conceptForKind(body.concept_id, body.kind)) {
    return 'concept_id is incompatible with kind';
  }
  if (body.location_radius_km != null
    && (!Number.isFinite(Number(body.location_radius_km)) || Number(body.location_radius_km) < 0)) {
    return 'location_radius_km must be a non-negative number';
  }
  if (body.quantity != null && (!Number.isFinite(Number(body.quantity)) || Number(body.quantity) <= 0)) {
    return 'quantity must be a positive number';
  }
  if (body.value_flexibility != null
    && !['fixed', 'flexible', 'unknown'].includes(body.value_flexibility)) {
    return 'Invalid value_flexibility';
  }
  for (const field of ['exchange_modes', 'delivery_modes']) {
    if (body[field] != null && (!Array.isArray(body[field]) || body[field].length > 4)) {
      return `${field} must be an array with up to 4 values`;
    }
  }
  return null;
}

export function validateIntentCreate(body, supabaseUrl) {
  const { direction, kind, title, price_fiat, image_url } = body;
  if (!DIRECTIONS.includes(direction)) return 'direction must be want or offer';
  if (kind != null && !KINDS.includes(kind)) return 'kind must be good, digital, service or knowledge';
  if (!title || String(title).trim().length < 3) return 'title is required (min 3 chars)';
  if (String(title).trim().length > 120) return 'title must be 120 characters or fewer';
  if (price_fiat != null && (isNaN(Number(price_fiat)) || Number(price_fiat) < 0)) {
    return 'price_fiat must be a non-negative number';
  }
  if (image_url != null && !String(image_url).startsWith(`${supabaseUrl}/storage/`)) {
    return 'Invalid image URL';
  }
  return validateKindFields(body) ?? validateTransactionFields(body);
}

export function validateIntentPatch(patch, supabaseUrl) {
  if (patch.status && !STATUSES.includes(patch.status)) return 'Invalid status';
  if (patch.kind != null && !KINDS.includes(patch.kind)) return 'Invalid kind';
  if (patch.title != null && String(patch.title).trim().length < 3) {
    return 'title is required (min 3 chars)';
  }
  if (patch.title != null && String(patch.title).trim().length > 120) {
    return 'title must be 120 characters or fewer';
  }
  if (patch.price_fiat != null && (isNaN(Number(patch.price_fiat)) || Number(patch.price_fiat) < 0)) {
    return 'price_fiat must be a non-negative number';
  }
  if (patch.image_url != null && !String(patch.image_url).startsWith(`${supabaseUrl}/storage/`)) {
    return 'Invalid image URL';
  }
  if (patch.transaction_mode != null && !TRANSACTION_MODES.includes(patch.transaction_mode)) {
    return 'Invalid transaction_mode';
  }
  if (patch.accepted_payment_tokens != null && (!Array.isArray(patch.accepted_payment_tokens)
    || patch.accepted_payment_tokens.some((token) => !PAYMENT_TOKENS.includes(token)))) {
    return `accepted_payment_tokens must only contain: ${PAYMENT_TOKENS.join(', ')}`;
  }
  return validateKindFields(patch);
}

export function kindFieldValues(body) {
  const values = {};
  for (const key of KIND_FIELD_KEYS) {
    const raw = body[key];
    values[key] = raw != null && String(raw).trim() ? String(raw).trim() : null;
  }
  return values;
}
