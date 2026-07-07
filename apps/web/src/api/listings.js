// ── Listings API ─────────────────────────────────────────────────
import { apiFetch } from './index.js';

export async function fetchListings({ category, subcategory, tags } = {}) {
  const p = new URLSearchParams();
  if (category && category !== 'All') p.set('category', category);
  if (subcategory) p.set('subcategory', subcategory);
  if (tags?.length) p.set('tags', tags.join(','));
  const qs = p.toString() ? `?${p}` : '';
  return apiFetch(`/discover${qs}`).catch(() => ({ listings: [], trending: [], hotIntents: [] }));
}

export async function createListing(payload) {
  return apiFetch('/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadListingImage(file, sessionId) {
  const form = new FormData();
  form.append('image', file);
  form.append('sessionId', sessionId);
  const res = await fetch(`${(import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')}/api/listings/upload-image`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function fetchMyListings(userId) {
  if (!userId) return [];
  return apiFetch(`/listings/mine?user_id=${encodeURIComponent(userId)}`).then(d => d.listings || []).catch(() => []);
}
