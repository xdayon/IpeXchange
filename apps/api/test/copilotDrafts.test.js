import { describe, expect, it } from 'vitest';
import {
  intentEmbeddingText, normalizeCopilotDraft, normalizeCopilotDrafts, normalizeDraftForReview,
} from '../src/lib/copilotDrafts.js';

describe('copilot draft normalization', () => {
  it('preserves valid structured matching fields', () => {
    expect(normalizeCopilotDraft({
      direction: 'offer', kind: 'service', title: '  Product coaching  ',
      description: ' Weekly sessions ', category: ' Business ', price_fiat: '150',
      duration: '1 hour', format: 'online', is_continuous: true,
    })).toMatchObject({
      direction: 'offer', kind: 'service', title: 'Product coaching',
      category: 'business', price_fiat: 150, duration: '1 hour',
      format: 'online', is_continuous: true,
    });
  });

  it('rejects invalid enum and numeric model output', () => {
    const draft = normalizeCopilotDraft({
      direction: 'sell', kind: 'service', title: 'Consulting',
      format: 'phone', price_fiat: -5,
    });
    expect(draft.direction).toBeNull();
    expect(draft.format).toBeNull();
    expect(draft.price_fiat).toBeNull();
  });

  it('caps persisted publish fields and drops invalid drafts', () => {
    const drafts = normalizeCopilotDrafts([
      { direction: 'offer', title: '  Valid offer  ', description: 'x'.repeat(4100) },
      { direction: 'invalid', title: 'Untrusted draft' },
    ]);

    expect(drafts).toHaveLength(1);
    expect(drafts[0].title).toBe('Valid offer');
    expect(drafts[0].description).toHaveLength(4000);
  });

  it('requires an array and limits one publication to ten drafts', () => {
    expect(normalizeCopilotDrafts(null)).toBeNull();
    expect(normalizeCopilotDrafts(Array.from({ length: 12 }, (_, index) => ({
      direction: 'want', title: `Interest ${index}`,
    })))).toHaveLength(10);
  });

  it('limits review hints to fields the review can edit', () => {
    const draft = normalizeDraftForReview({
      direction: 'want', kind: 'good', title: 'Road bike',
      missing_fields: ['condition', 'location', 'condition'],
    });
    expect(draft.missing_fields).toEqual(['condition']);
  });

  it('builds an embedding document with matching attributes', () => {
    expect(intentEmbeddingText({
      direction: 'want', title: 'Spanish lessons', kind: 'knowledge',
      format: 'in_person', level: 'beginner', is_continuous: true,
    })).toContain('Looking for | knowledge | in_person | beginner | recurring');
  });
});
