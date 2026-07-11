export const CONCEPTS = [
  ['electronics', 'Electronics', 'good'], ['mobility', 'Mobility', 'good'],
  ['home_goods', 'Home goods', 'good'], ['food', 'Food and produce', 'good'],
  ['software', 'Software', 'digital'], ['digital_media', 'Digital media', 'digital'],
  ['development', 'Software development', 'service'], ['design', 'Design', 'service'],
  ['wellness', 'Health and wellness', 'service'], ['professional', 'Professional services', 'service'],
  ['education', 'Classes and education', 'knowledge'], ['mentoring', 'Mentoring', 'knowledge'],
  ['languages', 'Languages', 'knowledge'],
  ['other_good', 'Other goods', 'good'], ['other_digital', 'Other digital', 'digital'],
  ['other_service', 'Other services', 'service'], ['other_knowledge', 'Other knowledge', 'knowledge'],
];

export const CONCEPT_IDS = CONCEPTS.map(([id]) => id);

export const TAXONOMY_PROMPT = CONCEPTS
  .map(([id, label, kind]) => `${id}=${label}(${kind})`).join(', ');

export function conceptForKind(conceptId, kind) {
  const concept = CONCEPTS.find(([id]) => id === conceptId);
  if (!concept) return null;
  if (concept[2] === kind) return conceptId;
  if (['service', 'knowledge'].includes(concept[2]) && ['service', 'knowledge'].includes(kind)) {
    return conceptId;
  }
  return null;
}
