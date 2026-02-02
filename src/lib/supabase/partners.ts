/**
 * Partners data fetching from Supabase
 * Falls back to static data if Supabase data is not available
 */

import { createClient } from './server';
import { partners as staticPartners, type Partner } from '@/data/partners';

export interface SupabasePartner {
  id: string;
  slug: string;
  name: string;
  tier: 'premium' | 'classic';
  logo_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  description_fr: string | null;
  description_en: string | null;
  specialties: string[] | null;
  has_gir: boolean;
  is_active: boolean;
}

/**
 * Get partner by slug with Supabase image
 * Falls back to static data if not in Supabase
 */
export async function getPartnerWithImage(slug: string): Promise<Partner | null> {
  const supabase = await createClient();

  // Get static data first
  const staticData = staticPartners.find(p => p.slug === slug);

  if (!staticData) {
    return null;
  }

  // Try to get from Supabase to override the image
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('partners')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return staticData;
  }

  // Merge with static data, using Supabase logo if available
  return {
    ...staticData,
    logo: data.logo_url || staticData.logo,
    description: {
      fr: data.description_fr || staticData.description.fr,
      en: data.description_en || staticData.description.en,
    },
  };
}

/**
 * Get all partners with Supabase images
 */
export async function getAllPartnersWithImages(): Promise<Partner[]> {
  const supabase = await createClient();

  // Get all partners from Supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supabasePartners, error } = await (supabase as any)
    .from('partners')
    .select(`
      id,
      slug,
      name,
      logo_url,
      description_fr,
      description_en,
      is_active
    `)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching partners from Supabase:', error);
  }

  // Create a map for quick lookup
  const supabaseMap = new Map<string, SupabasePartner>();
  if (supabasePartners) {
    supabasePartners.forEach((partner: SupabasePartner) => {
      supabaseMap.set(partner.slug, partner);
    });
  }

  // Merge static data with Supabase images
  return staticPartners.map((staticPartner) => {
    const supabasePartner = supabaseMap.get(staticPartner.slug);

    return {
      ...staticPartner,
      logo: supabasePartner?.logo_url || staticPartner.logo,
      description: {
        fr: supabasePartner?.description_fr || staticPartner.description.fr,
        en: supabasePartner?.description_en || staticPartner.description.en,
      },
    };
  });
}
