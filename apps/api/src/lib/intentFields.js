export const DIRECTIONS = ['want', 'offer'];
export const KINDS = ['good', 'digital', 'service', 'knowledge'];
export const STATUSES = ['active', 'fulfilled', 'archived'];
export const CONTINUOUS_KINDS = ['service', 'knowledge'];

const KIND_FIELD_ENUMS = {
  condition: ['new', 'used', 'refurbished'],
  format: ['in_person', 'online', 'hybrid'],
  access: ['one_time', 'lifetime'],
  level: ['beginner', 'intermediate', 'advanced'],
};

export const KIND_FIELD_KEYS = ['condition', 'brand', 'duration', 'format', 'access', 'level'];

export const EDITABLE = [
  'title', 'description', 'kind', 'category', 'price_fiat', 'image_url', 'status',
  'is_continuous', ...KIND_FIELD_KEYS,
];

export const INTENT_FIELDS =
  'id, user_id, direction, kind, title, description, category, price_fiat, image_url, ' +
  'status, source, created_at, is_continuous, condition, brand, duration, format, access, level';

export function validateKindFields(body) {
  for (const [field, allowed] of Object.entries(KIND_FIELD_ENUMS)) {
    const value = body[field];
    if (value != null && !allowed.includes(value)) {
      return `${field} must be one of: ${allowed.join(', ')}`;
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
  return validateKindFields(body);
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
