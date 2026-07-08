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

export function kindFieldValues(body) {
  const values = {};
  for (const key of KIND_FIELD_KEYS) {
    const raw = body[key];
    values[key] = raw != null && String(raw).trim() ? String(raw).trim() : null;
  }
  return values;
}
