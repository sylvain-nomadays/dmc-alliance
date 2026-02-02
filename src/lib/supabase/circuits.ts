/**
 * Circuits data fetching from Supabase
 * Falls back to static data if Supabase data is not available
 */

import { createClient } from './server';
import { getCircuitBySlug as getStaticCircuit, circuits as staticCircuits, type Circuit } from '@/data/circuits';

export interface SupabaseCircuit {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  image_url: string | null;
  gallery_urls: string[] | null;
  status: string;
  partner_id: string | null;
  destination_id: string | null;
}

/**
 * Get circuit by slug with Supabase image
 * Falls back to static data if not in Supabase
 */
export async function getCircuitWithImage(slug: string): Promise<Circuit | null> {
  const supabase = await createClient();

  // Get static data first
  const staticData = getStaticCircuit(slug);

  if (!staticData) {
    return null;
  }

  // Try to get from Supabase to override the image
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('circuits')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return staticData;
  }

  // Merge with static data, using Supabase images if available
  return {
    ...staticData,
    images: {
      main: data.image_url || staticData.images.main,
      gallery: data.gallery_urls?.length > 0 ? data.gallery_urls : staticData.images.gallery,
    },
  };
}

/**
 * Get all circuits with Supabase images
 */
export async function getAllCircuitsWithImages(): Promise<Circuit[]> {
  const supabase = await createClient();

  // Get all circuits from Supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supabaseCircuits, error } = await (supabase as any)
    .from('circuits')
    .select(`
      id,
      slug,
      image_url,
      gallery_urls
    `)
    .eq('status', 'published')
    .order('departure_date');

  if (error) {
    console.error('Error fetching circuits from Supabase:', error);
  }

  // Create a map for quick lookup
  const supabaseMap = new Map<string, SupabaseCircuit>();
  if (supabaseCircuits) {
    supabaseCircuits.forEach((circuit: SupabaseCircuit) => {
      supabaseMap.set(circuit.slug, circuit);
    });
  }

  // Merge static data with Supabase images
  return staticCircuits.map((staticCircuit) => {
    const supabaseCircuit = supabaseMap.get(staticCircuit.slug);

    return {
      ...staticCircuit,
      images: {
        main: supabaseCircuit?.image_url || staticCircuit.images.main,
        gallery: supabaseCircuit?.gallery_urls?.length
          ? supabaseCircuit.gallery_urls
          : staticCircuit.images.gallery,
      },
    };
  });
}
