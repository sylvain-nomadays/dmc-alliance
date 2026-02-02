/**
 * Supabase Storage Helper
 * Utilities for working with Supabase Storage URLs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const STORAGE_BUCKET = 'media';

/**
 * Get the public URL for a file in Supabase Storage
 * @param path - The path to the file (e.g., 'destinations/image.jpg')
 * @returns The full public URL
 */
export function getStorageUrl(path: string): string {
  if (!path) return '';

  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's a local path (starts with /), return as-is
  if (path.startsWith('/')) {
    return path;
  }

  // Build Supabase Storage URL
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

/**
 * Check if a path is a Supabase Storage path
 */
export function isStoragePath(path: string): boolean {
  return !path.startsWith('/') && !path.startsWith('http');
}

/**
 * Get storage path from a full Supabase URL
 */
export function getPathFromStorageUrl(url: string): string | null {
  if (!SUPABASE_URL) return null;

  const prefix = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/`;
  if (url.startsWith(prefix)) {
    return url.slice(prefix.length);
  }
  return null;
}

/**
 * Default hero images - can be overridden by admin settings
 */
export const defaultHeroImages = [
  'homepage/hero-1.jpg',
  'homepage/hero-2.jpg',
  'homepage/hero-3.jpg',
  'homepage/hero-4.jpg',
  'homepage/hero-5.jpg',
];

/**
 * Get hero images URLs (from Supabase or fallback to local)
 */
export function getHeroImageUrls(customImages?: string[]): string[] {
  const images = customImages && customImages.length > 0
    ? customImages
    : defaultHeroImages;

  return images.map(img => getStorageUrl(img));
}
