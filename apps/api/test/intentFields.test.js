import { describe, expect, it } from 'vitest';
import {
  kindFieldValues,
  validateIntentCreate,
  validateIntentPatch,
  validateKindFields,
} from '../src/lib/intentFields.js';

const supabaseUrl = 'https://example.supabase.co';

describe('intent kind fields', () => {
  it('accepts supported enum values', () => {
    expect(validateKindFields({
      condition: 'used', format: 'hybrid', access: 'lifetime', level: 'advanced',
    })).toBeNull();
  });

  it('reports the first unsupported enum value', () => {
    expect(validateKindFields({ condition: 'broken' })).toBe(
      'condition must be one of: new, used, refurbished',
    );
  });

  it('trims strings and normalizes missing values to null', () => {
    expect(kindFieldValues({ brand: '  Ipe  ', duration: '', format: null })).toEqual({
      condition: null,
      brand: 'Ipe',
      duration: null,
      format: null,
      access: null,
      level: null,
    });
  });
});

describe('intent input validation', () => {
  const valid = { direction: 'offer', kind: 'good', title: 'Honey', price_fiat: 12 };

  it('accepts a valid create payload', () => {
    expect(validateIntentCreate(valid, supabaseUrl)).toBeNull();
  });

  it.each([
    [{ ...valid, direction: 'sell' }, 'direction must be want or offer'],
    [{ ...valid, kind: 'other' }, 'kind must be good, digital, service or knowledge'],
    [{ ...valid, title: ' x ' }, 'title is required (min 3 chars)'],
    [{ ...valid, title: 'x'.repeat(121) }, 'title must be 120 characters or fewer'],
    [{ ...valid, price_fiat: -1 }, 'price_fiat must be a non-negative number'],
    [{ ...valid, image_url: 'https://evil.example/image.png' }, 'Invalid image URL'],
  ])('rejects invalid create data', (input, error) => {
    expect(validateIntentCreate(input, supabaseUrl)).toBe(error);
  });

  it('validates editable status, kind, and hosted images', () => {
    expect(validateIntentPatch({ status: 'deleted' }, supabaseUrl)).toBe('Invalid status');
    expect(validateIntentPatch({ kind: 'other' }, supabaseUrl)).toBe('Invalid kind');
    expect(validateIntentPatch({ price_fiat: -1 }, supabaseUrl)).toBe(
      'price_fiat must be a non-negative number',
    );
    expect(validateIntentPatch({
      image_url: `${supabaseUrl}/storage/v1/object/public/listing-images/image.png`,
    }, supabaseUrl)).toBeNull();
  });
});
