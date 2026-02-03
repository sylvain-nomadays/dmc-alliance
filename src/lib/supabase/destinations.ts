/**
 * Destinations data fetching from Supabase
 * Falls back to static data if Supabase data is not available
 */

import { createClient } from './server';
import { getDestinationBySlug as getStaticDestination, destinationsData, type DestinationDetail } from '@/data/destinations';

export interface SupabaseDestination {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  region: string;
  country: string;
  description_fr: string | null;
  description_en: string | null;
  image_url: string | null;
  partner_id: string | null;
  is_active: boolean;
  highlights: string[] | null;
  best_time: string | null;
  ideal_duration: string | null;
  // Video webinar fields
  video_url: string | null;
  video_title_fr: string | null;
  video_title_en: string | null;
  video_duration: string | null;
  partner?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
}

/**
 * Get destination by slug from Supabase
 * Falls back to static data image if no image_url in Supabase
 */
export async function getDestinationWithImage(slug: string): Promise<DestinationDetail | null> {
  const supabase = await createClient();

  // Get static data first - we need it in either case
  const staticData = getStaticDestination(slug);

  // If no static data, destination doesn't exist
  if (!staticData) {
    return null;
  }

  // Try to get from Supabase to override the image
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('destinations')
    .select(`
      *,
      partner:partners(id, name, slug, logo_url)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    // Return static data if Supabase fails
    return staticData;
  }

  // Merge Supabase data with static data
  // Use Supabase image_url if available, otherwise use static
  const result: DestinationDetail = {
    ...staticData,
    // Override image with Supabase URL if available
    images: {
      hero: data.image_url || staticData.images.hero,
      gallery: staticData.images.gallery,
    },
    // Use Supabase descriptions if available
    description: {
      fr: data.description_fr || staticData.description.fr,
      en: data.description_en || staticData.description.en,
    },
  };

  // Override webinarVideo with Supabase data if available
  if (data.video_url) {
    result.webinarVideo = {
      url: data.video_url,
      title: {
        fr: data.video_title_fr || 'Vidéo de présentation',
        en: data.video_title_en || 'Presentation video',
      },
      duration: data.video_duration || '',
    };
  }

  return result;
}

/**
 * Get all destinations with Supabase images
 */
export async function getAllDestinationsWithImages() {
  const supabase = await createClient();

  // Get all destinations from Supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supabaseDestinations, error } = await (supabase as any)
    .from('destinations')
    .select(`
      id,
      slug,
      name,
      name_en,
      region,
      image_url,
      is_active
    `)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching destinations from Supabase:', error);
  }

  // Create a map of Supabase destinations by slug for quick lookup
  const supabaseMap = new Map<string, SupabaseDestination>();
  if (supabaseDestinations) {
    supabaseDestinations.forEach((dest: SupabaseDestination) => {
      supabaseMap.set(dest.slug, dest);
    });
  }

  // Merge static data with Supabase images
  return destinationsData.map((staticDest) => {
    const supabaseDest = supabaseMap.get(staticDest.slug);

    return {
      ...staticDest,
      images: {
        hero: supabaseDest?.image_url || staticDest.images.hero,
        gallery: staticDest.images.gallery,
      },
    };
  });
}

/**
 * Get destinations grouped by region with Supabase images
 */
export async function getDestinationsByRegionWithImages() {
  const destinations = await getAllDestinationsWithImages();

  const grouped: Record<string, typeof destinations> = {};

  destinations.forEach((dest) => {
    if (!grouped[dest.region]) {
      grouped[dest.region] = [];
    }
    grouped[dest.region].push(dest);
  });

  return grouped;
}
