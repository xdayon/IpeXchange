import { describe, expect, it, vi } from 'vitest';
import { listingImagePath, removeListingImage } from '../src/lib/listingImages.js';

const supabaseUrl = 'https://project.supabase.co';
const ownerId = '11111111-1111-4111-8111-111111111111';
const imageUrl = `${supabaseUrl}/storage/v1/object/public/listing-images/${ownerId}/photo.png`;

describe('listing image cleanup', () => {
  it('accepts only an owner path in the configured public bucket', () => {
    expect(listingImagePath(imageUrl, supabaseUrl, ownerId)).toBe(`${ownerId}/photo.png`);
    expect(listingImagePath(imageUrl, supabaseUrl, 'another-user')).toBeNull();
    expect(listingImagePath(
      `${supabaseUrl}/storage/v1/object/public/avatars/${ownerId}/photo.png`,
      supabaseUrl,
      ownerId,
    )).toBeNull();
    expect(listingImagePath('https://evil.example/photo.png', supabaseUrl, ownerId)).toBeNull();
  });

  it('deletes the exact object through the service client', async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const db = { storage: { from: vi.fn(() => ({ remove })) } };
    await expect(removeListingImage(db, { url: imageUrl, supabaseUrl, ownerId })).resolves.toBe(true);
    expect(db.storage.from).toHaveBeenCalledWith('listing-images');
    expect(remove).toHaveBeenCalledWith([`${ownerId}/photo.png`]);
  });
});
