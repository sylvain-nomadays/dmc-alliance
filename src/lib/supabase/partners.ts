/**
 * Partners data fetching from Supabase
 * Falls back to static data if Supabase data is not available
 */

import { createStaticClient } from './server';
import { partners as staticPartners, type Partner } from '@/data/partners';
import { getPartnerProfile } from '@/data/partners-profiles';

// Video type from admin
export interface PartnerVideo {
  id: string;
  url: string;
  title_fr: string;
  title_en: string;
  is_featured: boolean;
  order: number;
}

export interface SupabasePartner {
  id: string;
  slug: string;
  name: string;
  tier: 'premium' | 'classic';
  logo_url: string | null;
  cover_image_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  description_fr: string | null;
  description_en: string | null;
  story_fr: string | null;
  story_en: string | null;
  mission_fr: string | null;
  mission_en: string | null;
  specialties: string[] | null;
  certifications: string[] | null;
  languages: string[] | null;
  founded_year: number | null;
  team_size: number | null;
  videos: PartnerVideo[] | null;
  has_gir: boolean;
  is_active: boolean;
}

// Team member from Supabase
export interface TeamMember {
  id: string;
  partner_id: string;
  name: string;
  role_fr: string | null;
  role_en: string | null;
  bio_fr: string | null;
  bio_en: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  display_order: number;
  is_visible: boolean;
}

// Testimonial from Supabase
export interface Testimonial {
  id: string;
  partner_id: string;
  content_fr: string;
  content_en: string | null;
  author_name: string;
  author_company: string | null;
  author_role: string | null;
  is_visible: boolean;
}

// Extended partner with profile data from Supabase
export interface PartnerWithProfile extends Partner {
  supabaseId?: string;
  coverImage?: string;
  story?: { fr: string; en: string };
  mission?: { fr: string; en: string };
  certifications?: string[];
  languages?: string[];
  foundedYear?: number;
  teamSize?: number;
  videos?: PartnerVideo[];
  teamMembers?: TeamMember[];
  testimonials?: Testimonial[];
}

/**
 * Get partner by slug with Supabase data (logo, videos, story, mission, etc.)
 * Falls back to static data if not in Supabase
 */
export async function getPartnerWithImage(slug: string): Promise<Partner | null> {
  const supabase = createStaticClient();

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
 * Get partner with full profile data from Supabase (including videos, story, team, testimonials)
 * This is used on the partner detail page
 */
export async function getPartnerWithFullProfile(slug: string): Promise<PartnerWithProfile | null> {
  const supabase = createStaticClient();

  // Get static data if available
  const staticData = staticPartners.find(p => p.slug === slug);
  const staticProfile = staticData ? getPartnerProfile(staticData.id) : null;

  // Try to get from Supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('partners')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    if (!staticData) {
      return null;
    }
    // Return static data with static profile if Supabase fails
    return {
      ...staticData,
      ...(staticProfile && {
        story: staticProfile.story,
        mission: staticProfile.mission,
        teamSize: staticProfile.teamSize,
      }),
    };
  }

  const supabaseData = data as SupabasePartner;

  // Get team members from Supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: teamData } = await (supabase as any)
    .from('team_members')
    .select('*')
    .eq('partner_id', supabaseData.id)
    .eq('is_visible', true)
    .order('display_order');

  // Get testimonials from Supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: testimonialData } = await (supabase as any)
    .from('testimonials')
    .select('*')
    .eq('partner_id', supabaseData.id)
    .eq('is_visible', true);

  // Build base partner data: use static data if available, otherwise construct from DB
  const basePartner: Partner = staticData ?? {
    id: supabaseData.id,
    name: supabaseData.name,
    slug: supabaseData.slug,
    tier: supabaseData.tier,
    destinations: [],
    website: supabaseData.website || '',
    logo: supabaseData.logo_url || undefined,
    description: {
      fr: supabaseData.description_fr || '',
      en: supabaseData.description_en || '',
    },
    specialties: supabaseData.specialties || [],
    hasGir: supabaseData.has_gir,
  };

  // If no static data, fetch destinations from DB
  if (!staticData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: destData } = await (supabase as any)
      .from('destinations')
      .select('name_fr, name_en, slug, country_code, region')
      .eq('partner_id', supabaseData.id)
      .eq('is_active', true);

    if (destData?.length) {
      basePartner.destinations = destData.map((d: { name_fr: string; name_en: string; slug: string; country_code: string; region: string }) => ({
        name: d.name_fr,
        nameEn: d.name_en,
        slug: d.slug,
        code: d.country_code,
        region: d.region as Partner['destinations'][0]['region'],
      }));
    }
  }

  // Merge with static data
  const result: PartnerWithProfile = {
    ...basePartner,
    supabaseId: supabaseData.id,
    logo: supabaseData.logo_url || basePartner.logo,
    coverImage: supabaseData.cover_image_url || undefined,
    description: {
      fr: supabaseData.description_fr || basePartner.description.fr,
      en: supabaseData.description_en || basePartner.description.en,
    },
  };

  // Add story if available from Supabase, otherwise use static
  if (supabaseData.story_fr || staticProfile?.story) {
    result.story = {
      fr: supabaseData.story_fr || staticProfile?.story?.fr || '',
      en: supabaseData.story_en || staticProfile?.story?.en || '',
    };
  }

  // Add mission if available from Supabase, otherwise use static
  if (supabaseData.mission_fr || staticProfile?.mission) {
    result.mission = {
      fr: supabaseData.mission_fr || staticProfile?.mission?.fr || '',
      en: supabaseData.mission_en || staticProfile?.mission?.en || '',
    };
  }

  // Add other profile data
  if (supabaseData.certifications?.length || staticProfile?.certifications?.length) {
    result.certifications = supabaseData.certifications || staticProfile?.certifications;
  }

  if (supabaseData.languages?.length) {
    result.languages = supabaseData.languages;
  }

  if (supabaseData.founded_year) {
    result.foundedYear = supabaseData.founded_year;
  }

  if (supabaseData.team_size || staticProfile?.teamSize) {
    result.teamSize = supabaseData.team_size || staticProfile?.teamSize;
  }

  // Add videos from Supabase
  if (supabaseData.videos?.length) {
    result.videos = supabaseData.videos;
  }

  // Add team members from Supabase
  if (teamData?.length) {
    result.teamMembers = teamData;
  }

  // Add testimonials from Supabase
  if (testimonialData?.length) {
    result.testimonials = testimonialData;
  }

  return result;
}

/**
 * Get team members for a partner by partner ID (Supabase UUID)
 */
export async function getPartnerTeamMembers(partnerId: string): Promise<TeamMember[]> {
  const supabase = createStaticClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('team_members')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('is_visible', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }

  return data || [];
}

/**
 * Get testimonials for a partner by partner ID (Supabase UUID)
 */
export async function getPartnerTestimonials(partnerId: string): Promise<Testimonial[]> {
  const supabase = createStaticClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('testimonials')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('is_visible', true);

  if (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all partners with Supabase images
 */
export async function getAllPartnersWithImages(): Promise<Partner[]> {
  const supabase = createStaticClient();

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
