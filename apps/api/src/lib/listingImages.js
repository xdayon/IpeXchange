export const LISTING_IMAGE_BUCKET = 'listing-images';

export function listingImagePath(url, supabaseUrl, ownerId) {
  try {
    const publicBase = new URL(supabaseUrl);
    const image = new URL(url);
    const prefix = `/storage/v1/object/public/${LISTING_IMAGE_BUCKET}/`;
    if (image.origin !== publicBase.origin || !image.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(image.pathname.slice(prefix.length));
    if (!path.startsWith(`${ownerId}/`) || path.includes('..')) return null;
    return path;
  } catch {
    return null;
  }
}

export async function removeListingImage(db, { url, supabaseUrl, ownerId }) {
  const path = listingImagePath(url, supabaseUrl, ownerId);
  if (!path) return false;
  const { error } = await db.storage.from(LISTING_IMAGE_BUCKET).remove([path]);
  if (error) throw error;
  return true;
}
