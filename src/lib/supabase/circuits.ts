/**
 * Circuits data fetching from Supabase
 * Falls back to static data if Supabase data is not available
 */

import { unstable_noStore as noStore } from 'next/cache';
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
 * Interface for circuits from database
 * Note: Column names match actual Supabase schema
 */
export interface DbCircuit {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description_fr: string | null;
  description_en: string | null;
  highlights_fr: string[] | null;
  highlights_en: string[] | null;
  included_fr: string[] | null;
  included_en: string[] | null;
  not_included_fr: string[] | null;
  not_included_en: string[] | null;
  itinerary: Array<{
    day: number;
    title_fr: string;
    title_en?: string;
    description_fr: string;
    description_en?: string;
    meals?: { breakfast: boolean; lunch: boolean; dinner: boolean };
    accommodation?: string;
  }> | null;
  duration_days: number;
  price_from: number | null;
  difficulty_level: number | null;
  group_size_min: number | null;
  group_size_max: number | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  status: string;
  is_gir: boolean | null;
  destination_id: string | null;
  partner_id: string | null;
  // Destination uses 'name' not 'name_fr'
  destination?: {
    id: string;
    name: string;
    name_en: string | null;
    slug: string;
    region: string | null;
  } | null;
  partner?: {
    id: string;
    name: string;
    logo_url: string | null;
    slug: string;
  } | null;
  // Departures use start_date, end_date, total_seats, booked_seats, price
  departures?: Array<{
    id: string;
    start_date: string;
    end_date: string | null;
    total_seats: number | null;
    booked_seats: number | null;
    status: string | null;
    price: number | null;
  }>;
}

/**
 * Get all published GIR circuits from Supabase
 */
export async function getPublishedGirCircuits(): Promise<DbCircuit[]> {
  // Disable Next.js cache to always get fresh data
  noStore();

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('circuits')
    .select(`
      *,
      destination:destinations(id, name, name_en, slug, region),
      partner:partners(id, name, logo_url, slug),
      departures:circuit_departures(id, start_date, end_date, total_seats, booked_seats, status, price)
    `)
    .eq('status', 'published')
    .eq('is_gir', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching GIR circuits from Supabase:', error);
    return [];
  }

  console.log(`[GIR] Fetched ${data?.length || 0} circuits from Supabase:`, data?.map((c: DbCircuit) => c.slug));

  return data || [];
}

/**
 * Get a single circuit by slug from Supabase
 */
export async function getCircuitBySlugFromDb(slug: string): Promise<DbCircuit | null> {
  // Disable Next.js cache to always get fresh data
  noStore();

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('circuits')
    .select(`
      *,
      destination:destinations(id, name, name_en, slug, region),
      partner:partners(id, name, logo_url, slug),
      departures:circuit_departures(id, start_date, end_date, total_seats, booked_seats, status, price)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching circuit from Supabase:', error);
    return null;
  }

  return data;
}

/**
 * Get GIR circuits for a specific partner
 */
export async function getGirCircuitsByPartner(partnerSlug: string): Promise<DbCircuit[]> {
  noStore();

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('circuits')
    .select(`
      *,
      destination:destinations(id, name, name_en, slug, region),
      partner:partners!inner(id, name, logo_url, slug),
      departures:circuit_departures(id, start_date, end_date, total_seats, booked_seats, status, price)
    `)
    .eq('status', 'published')
    .eq('is_gir', true)
    .eq('partner.slug', partnerSlug)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching partner GIR circuits from Supabase:', error);
    return [];
  }

  return data || [];
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
