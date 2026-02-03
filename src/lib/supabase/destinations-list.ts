import { createStaticClient } from '@/lib/supabase/server';
import { getStorageUrl } from './storage';
import { getAllDestinations as getStaticDestinations, getPartnerByDestination } from '@/data/partners';

export interface DestinationListItem {
  slug: string;
  name: string;
  nameEn: string;
  region: string;
  image: string;
  partnerName?: string;
  hasGir?: boolean;
}

/**
 * Get all destinations with images from Supabase, merged with static data
 * Uses static client (no cookies) for static generation compatibility
 */
export async function getAllDestinationsWithImages(): Promise<DestinationListItem[]> {
  // Get static destinations as base
  const staticDestinations = getStaticDestinations();

  try {
    const supabase = createStaticClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('destinations')
      .select(`
        slug,
        name,
        name_en,
        region,
        image_url,
        partner:partners(name, has_gir)
      `)
      .eq('is_active', true);

    if (error) {
      console.error('[destinations-list] Error fetching destinations:', error);
      throw error;
    }

    // Create a map of Supabase data by slug for quick lookup
    const supabaseMap = new Map<string, {
      image_url: string | null;
      name?: string;
      name_en?: string;
      region?: string;
      partner?: { name: string; has_gir: boolean } | null;
    }>();

    if (data) {
      for (const d of data) {
        supabaseMap.set(d.slug, {
          image_url: d.image_url,
          name: d.name,  // French name is in 'name' column
          name_en: d.name_en,
          region: d.region,
          partner: d.partner,
        });
      }
    }

    // Merge static destinations with Supabase images
    return staticDestinations.map((staticDest) => {
      const supabaseData = supabaseMap.get(staticDest.slug);
      const staticPartner = getPartnerByDestination(staticDest.slug);

      // Determine image: Supabase image_url > fallback to static path
      let image = `/images/destinations/${staticDest.slug}.jpg`;
      if (supabaseData?.image_url) {
        image = getStorageUrl(supabaseData.image_url);
      }

      return {
        slug: staticDest.slug,
        name: supabaseData?.name || staticDest.name,
        nameEn: supabaseData?.name_en || staticDest.nameEn,
        region: supabaseData?.region?.replace('_', '-') || staticDest.region,
        image,
        partnerName: supabaseData?.partner?.name || staticPartner?.name,
        hasGir: supabaseData?.partner?.has_gir || staticPartner?.hasGir || false,
      };
    });
  } catch (error) {
    console.error('Error in getAllDestinationsWithImages:', error);

    // Fallback: return static destinations with default images
    return staticDestinations.map((d) => {
      const partner = getPartnerByDestination(d.slug);
      return {
        slug: d.slug,
        name: d.name,
        nameEn: d.nameEn,
        region: d.region,
        image: `/images/destinations/${d.slug}.jpg`,
        partnerName: partner?.name,
        hasGir: partner?.hasGir || false,
      };
    });
  }
}
