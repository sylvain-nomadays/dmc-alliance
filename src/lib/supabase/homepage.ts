import { createStaticClient } from '@/lib/supabase/server';
import { getStorageUrl } from './storage';

// Types
export interface DestinationWithImage {
  name: string;
  nameEn: string;
  slug: string;
  region: string;
  image: string;
  partner: string;
}

export interface PartnerWithImage {
  id: string;
  name: string;
  slug: string;
  logo: string;
  destinations: string[];
  isPremium: boolean;
}

export interface CircuitWithImage {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  image: string;
  destination: string;
  duration: number;
  price: number;
  placesAvailable: number;
  departureDate: string;
}

// Default/fallback data
const defaultDestinations: DestinationWithImage[] = [
  { name: 'Mongolie', nameEn: 'Mongolia', slug: 'mongolie', region: 'asia', image: '/images/destinations/mongolia.jpg', partner: 'Horseback Adventure' },
  { name: 'Tanzanie', nameEn: 'Tanzania', slug: 'tanzanie', region: 'africa', image: '/images/destinations/tanzania.jpg', partner: 'Galago Expeditions' },
  { name: 'Thaïlande', nameEn: 'Thailand', slug: 'thailande', region: 'asia', image: '/images/destinations/thailand.jpg', partner: 'Sawa Discovery' },
  { name: 'Kirghizistan', nameEn: 'Kyrgyzstan', slug: 'kirghizistan', region: 'asia', image: '/images/destinations/kyrgyzstan.jpg', partner: "Kyrgyz'What ?" },
  { name: 'Costa Rica', nameEn: 'Costa Rica', slug: 'costa-rica', region: 'americas', image: '/images/destinations/costa-rica.jpg', partner: 'Morpho Evasions' },
  { name: 'Indonésie', nameEn: 'Indonesia', slug: 'indonesie', region: 'asia', image: '/images/destinations/indonesia.jpg', partner: 'Azimuth Adventure Travel' },
  { name: 'Madagascar', nameEn: 'Madagascar', slug: 'madagascar', region: 'africa', image: '/images/destinations/madagascar.jpg', partner: 'Détours Opérator' },
  { name: 'Pérou', nameEn: 'Peru', slug: 'perou', region: 'americas', image: '/images/destinations/peru.jpg', partner: 'Pasión Andina' },
];

const defaultPartners: PartnerWithImage[] = [
  { id: 'horseback-adventure', name: 'Horseback Adventure', slug: 'horseback-adventure', logo: '/images/partners/horseback-adventure.png', destinations: ['Mongolie'], isPremium: true },
  { id: 'kyrgyzwhat', name: "Kyrgyz'What ?", slug: 'kyrgyzwhat', logo: '/images/partners/kyrgyzwhat.png', destinations: ['Kirghizistan'], isPremium: true },
  { id: 'sawa-discovery', name: 'Sawa Discovery', slug: 'sawa-discovery', logo: '/images/partners/sawa-discovery.png', destinations: ['Thaïlande'], isPremium: true },
  { id: 'galago-expeditions', name: 'Galago Expeditions', slug: 'galago-expeditions', logo: '/images/partners/galago.png', destinations: ['Kenya', 'Tanzanie', 'Ouganda'], isPremium: true },
  { id: 'detours-operator', name: 'Détours Opérator', slug: 'detours-operator', logo: '/images/partners/detours.png', destinations: ['Madagascar', 'Mauritanie', 'Algérie'], isPremium: true },
  { id: 'azimuth', name: 'Azimuth Adventure Travel', slug: 'azimuth', logo: '/images/partners/azimuth.png', destinations: ['Indonésie'], isPremium: true },
];

/**
 * Get featured destinations for homepage with Supabase images
 */
export async function getFeaturedDestinations(): Promise<DestinationWithImage[]> {
  try {
    const supabase = createStaticClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('destinations')
      .select(`
        id,
        name,
        name_en,
        slug,
        region,
        image_url,
        partner:partners(name)
      `)
      .eq('is_active', true)
      .limit(8);

    if (error || !data || data.length === 0) {
      console.log('Using default destinations - Supabase error or no data:', error?.message);
      return defaultDestinations;
    }

    // Map Supabase data to component format
    return data.map((d: {
      name: string;
      name_en: string;
      slug: string;
      region: string;
      image_url: string | null;
      partner: { name: string } | null;
    }) => {
      // Find fallback from defaults
      const fallback = defaultDestinations.find(dd => dd.slug === d.slug);

      return {
        name: d.name,
        nameEn: d.name_en,
        slug: d.slug,
        region: d.region?.replace('_', '-') || 'asia',
        image: d.image_url ? getStorageUrl(d.image_url) : (fallback?.image || '/images/destinations/default.jpg'),
        partner: d.partner?.name || fallback?.partner || 'DMC Alliance',
      };
    });
  } catch (error) {
    console.error('Error fetching featured destinations:', error);
    return defaultDestinations;
  }
}

/**
 * Get featured partners for homepage with Supabase images
 */
export async function getFeaturedPartners(): Promise<PartnerWithImage[]> {
  try {
    const supabase = createStaticClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('partners')
      .select(`
        id,
        name,
        slug,
        logo_url,
        tier,
        destinations(name)
      `)
      .eq('is_active', true)
      .limit(6);

    if (error || !data || data.length === 0) {
      console.log('Using default partners - Supabase error or no data:', error?.message);
      return defaultPartners;
    }

    // Map Supabase data to component format
    return data.map((p: {
      id: string;
      name: string;
      slug: string;
      logo_url: string | null;
      tier: string;
      destinations: { name: string }[];
    }) => {
      // Find fallback from defaults
      const fallback = defaultPartners.find(dp => dp.slug === p.slug);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        logo: p.logo_url ? getStorageUrl(p.logo_url) : (fallback?.logo || '/images/partners/default.png'),
        destinations: p.destinations?.map((d: { name: string }) => d.name) || fallback?.destinations || [],
        isPremium: p.tier === 'premium',
      };
    });
  } catch (error) {
    console.error('Error fetching featured partners:', error);
    return defaultPartners;
  }
}

/**
 * Get featured GIR circuits for homepage
 * Uses is_gir=true to show GIR circuits, with is_featured as optional priority
 */
export async function getFeaturedCircuits(): Promise<CircuitWithImage[]> {
  try {
    const supabase = createStaticClient();

    // Get GIR circuits with their upcoming departures
    // Prioritize featured ones, but include all GIR circuits
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('circuits')
      .select(`
        id,
        slug,
        title,
        subtitle,
        image_url,
        duration_days,
        price_from,
        is_featured,
        destination:destinations(name),
        departures:circuit_departures(start_date, total_seats, booked_seats, status, price)
      `)
      .eq('status', 'published')
      .eq('is_gir', true)
      .order('is_featured', { ascending: false })
      .limit(3);

    if (error || !data || data.length === 0) {
      console.log('No featured circuits found:', error?.message);
      return [];
    }

    return data.map((c: {
      id: string;
      slug: string;
      title: string;
      subtitle: string;
      image_url: string | null;
      duration_days: number;
      price_from: number;
      is_featured: boolean;
      destination: { name: string } | null;
      departures: { start_date: string; total_seats: number; booked_seats: number; status: string; price: number }[];
    }) => {
      // Get next available departure
      const upcomingDepartures = (c.departures || [])
        .filter(d => d.status === 'open' && new Date(d.start_date) > new Date())
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      const nextDeparture = upcomingDepartures[0];
      const totalSeats = nextDeparture?.total_seats || 0;
      const bookedSeats = nextDeparture?.booked_seats || 0;

      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        titleEn: c.subtitle || c.title,  // Using subtitle as English title fallback
        image: c.image_url ? getStorageUrl(c.image_url) : '/images/gir/default.jpg',
        destination: c.destination?.name || 'Destination',
        duration: c.duration_days,
        price: nextDeparture?.price || c.price_from || 0,
        placesAvailable: totalSeats > 0 ? (totalSeats - bookedSeats) : -1, // -1 means "à confirmer"
        departureDate: nextDeparture?.start_date || '',
      };
    });
  } catch (error) {
    console.error('Error fetching featured circuits:', error);
    return [];
  }
}

/**
 * Homepage settings interface
 */
export interface HomepageSettingsData {
  cta_background_image: string;
  services_title_fr: string;
  services_title_en: string;
  services_subtitle_fr: string;
  services_subtitle_en: string;
  service_tailor_made: {
    title_fr: string;
    title_en: string;
    description_fr: string;
    description_en: string;
    image_url: string;
    features_fr: string[];
    features_en: string[];
  };
  service_groups: {
    title_fr: string;
    title_en: string;
    description_fr: string;
    description_en: string;
    image_url: string;
    features_fr: string[];
    features_en: string[];
  };
  service_gir: {
    title_fr: string;
    title_en: string;
    description_fr: string;
    description_en: string;
    image_url: string;
    features_fr: string[];
    features_en: string[];
  };
}

const defaultHomepageSettings: HomepageSettingsData = {
  cta_background_image: '/images/cta/collaboration.jpg',
  services_title_fr: 'Une solution pour chaque besoin',
  services_title_en: 'A solution for every need',
  services_subtitle_fr: 'Que vous cherchiez du sur-mesure, des voyages de groupe ou des départs garantis, notre réseau vous accompagne.',
  services_subtitle_en: 'Whether you\'re looking for tailor-made trips, group travel or guaranteed departures, our network supports you.',
  service_tailor_made: {
    title_fr: 'Voyages sur-mesure',
    title_en: 'Tailor-made trips',
    description_fr: 'Créez des itinéraires uniques avec nos DMC experts locaux.',
    description_en: 'Create unique itineraries with our local DMC experts.',
    image_url: '/images/services/tailor-made.jpg',
    features_fr: ['Conseil personnalisé', 'Expertise locale', 'Flexibilité totale'],
    features_en: ['Personalized advice', 'Local expertise', 'Total flexibility'],
  },
  service_groups: {
    title_fr: 'Groupes',
    title_en: 'Group travel',
    description_fr: 'Organisez des voyages de groupe avec un accompagnement dédié.',
    description_en: 'Organize group trips with dedicated support.',
    image_url: '/images/services/groups.jpg',
    features_fr: ['Tarifs négociés', 'Logistique complète', 'Accompagnement'],
    features_en: ['Negotiated rates', 'Complete logistics', 'Support'],
  },
  service_gir: {
    title_fr: 'GIR - Départs garantis',
    title_en: 'GIR - Guaranteed departures',
    description_fr: 'Rejoignez des départs garantis avec commission attractive.',
    description_en: 'Join guaranteed departures with attractive commission.',
    image_url: '/images/services/gir.jpg',
    features_fr: ['Départs confirmés', 'Commission attractive', 'Sans risque'],
    features_en: ['Confirmed departures', 'Attractive commission', 'Risk-free'],
  },
};

/**
 * Get homepage settings (CTA, services, etc.)
 */
export async function getHomepageSettings(): Promise<HomepageSettingsData> {
  try {
    const supabase = createStaticClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('homepage_settings')
      .select('cta_background_image, services_title_fr, services_title_en, services_subtitle_fr, services_subtitle_en, service_tailor_made, service_groups, service_gir')
      .eq('section', 'global')
      .single();

    if (error || !data) {
      console.log('Using default homepage settings:', error?.message);
      return defaultHomepageSettings;
    }

    return {
      cta_background_image: data.cta_background_image || defaultHomepageSettings.cta_background_image,
      services_title_fr: data.services_title_fr || defaultHomepageSettings.services_title_fr,
      services_title_en: data.services_title_en || defaultHomepageSettings.services_title_en,
      services_subtitle_fr: data.services_subtitle_fr || defaultHomepageSettings.services_subtitle_fr,
      services_subtitle_en: data.services_subtitle_en || defaultHomepageSettings.services_subtitle_en,
      service_tailor_made: data.service_tailor_made || defaultHomepageSettings.service_tailor_made,
      service_groups: data.service_groups || defaultHomepageSettings.service_groups,
      service_gir: data.service_gir || defaultHomepageSettings.service_gir,
    };
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    return defaultHomepageSettings;
  }
}

/**
 * Get hero images from homepage settings or destination images as fallback
 */
export async function getHeroImages(): Promise<string[]> {
  try {
    const supabase = createStaticClient();

    // First try to get custom hero images from homepage_settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingsData } = await (supabase as any)
      .from('homepage_settings')
      .select('hero_images')
      .single();

    if (settingsData?.hero_images && settingsData.hero_images.length > 0) {
      return settingsData.hero_images;
    }

    // Fallback: use destination images from Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: destinationsData, error } = await (supabase as any)
      .from('destinations')
      .select('image_url')
      .eq('is_active', true)
      .not('image_url', 'is', null)
      .limit(5);

    if (error || !destinationsData || destinationsData.length === 0) {
      return []; // Will use component defaults (which may not exist)
    }

    // Return the full URLs for destination images
    return destinationsData
      .filter((d: { image_url: string | null }) => d.image_url)
      .map((d: { image_url: string }) => d.image_url);
  } catch (error) {
    console.error('Error fetching hero images:', error);
    return [];
  }
}
