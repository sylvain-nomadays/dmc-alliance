import { createClient } from './server';

export interface SiteSettings {
  id?: string;
  section: string;
  site_logo_url: string | null;
  site_logo_dark_url: string | null;
  site_footer_logo_url: string | null;
  site_favicon_url: string | null;
  site_favicon_dark_url: string | null;
  site_title_fr: string | null;
  site_title_en: string | null;
  site_description_fr: string | null;
  site_description_en: string | null;
  site_og_image_url: string | null;
  // Contact information
  contact_email: string | null;
  contact_phone: string | null;
  contact_address_fr: string | null;
  contact_address_en: string | null;
  // Social links
  social_linkedin: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  social_youtube: string | null;
}

const defaultSettings: SiteSettings = {
  section: 'global',
  site_logo_url: null,
  site_logo_dark_url: null,
  site_footer_logo_url: null,
  site_favicon_url: null,
  site_favicon_dark_url: null,
  site_title_fr: 'The DMC Alliance',
  site_title_en: 'The DMC Alliance',
  site_description_fr: null,
  site_description_en: null,
  site_og_image_url: null,
  // Contact information
  contact_email: null,
  contact_phone: null,
  contact_address_fr: null,
  contact_address_en: null,
  // Social links
  social_linkedin: null,
  social_instagram: null,
  social_facebook: null,
  social_twitter: null,
  social_youtube: null,
};

/**
 * Fetch site settings from Supabase
 * Returns default settings if not found
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('site_settings')
      .select('*')
      .eq('section', 'global')
      .single();

    if (error) {
      // Table might not exist yet or no data
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return defaultSettings;
      }
      console.error('Error fetching site settings:', error);
      return defaultSettings;
    }

    return { ...defaultSettings, ...data };
  } catch (error) {
    console.error('Error in getSiteSettings:', error);
    return defaultSettings;
  }
}

/**
 * Get the logo URL based on theme preference
 * Falls back to default logo if not set
 */
export function getLogoUrl(settings: SiteSettings, isDark: boolean = false): string {
  if (isDark && settings.site_logo_dark_url) {
    return settings.site_logo_dark_url;
  }
  return settings.site_logo_url || '/images/logo-dmc-alliance.svg';
}

/**
 * Get the favicon URL
 * Falls back to default favicon if not set
 */
export function getFaviconUrl(settings: SiteSettings, isDark: boolean = false): string {
  if (isDark && settings.site_favicon_dark_url) {
    return settings.site_favicon_dark_url;
  }
  return settings.site_favicon_url || '/favicon.ico';
}

/**
 * Get site title based on locale
 */
export function getSiteTitle(settings: SiteSettings, locale: string): string {
  if (locale === 'en' && settings.site_title_en) {
    return settings.site_title_en;
  }
  return settings.site_title_fr || 'The DMC Alliance';
}

/**
 * Get site description based on locale
 */
export function getSiteDescription(settings: SiteSettings, locale: string): string | null {
  if (locale === 'en') {
    return settings.site_description_en;
  }
  return settings.site_description_fr;
}

/**
 * Get the footer logo URL
 * Falls back to default white logo if not set
 */
export function getFooterLogoUrl(settings: SiteSettings): string {
  return settings.site_footer_logo_url || '/images/logo-dmc-alliance-white.svg';
}

/**
 * Get contact email
 */
export function getContactEmail(settings: SiteSettings): string {
  return settings.contact_email || 'contact@dmc-alliance.org';
}

/**
 * Get contact phone
 */
export function getContactPhone(settings: SiteSettings): string {
  return settings.contact_phone || '+33 1 23 45 67 89';
}

/**
 * Get contact address based on locale
 */
export function getContactAddress(settings: SiteSettings, locale: string): string {
  if (locale === 'en' && settings.contact_address_en) {
    return settings.contact_address_en;
  }
  return settings.contact_address_fr || '123 Rue du Voyage, 75001 Paris, France';
}

/**
 * Get social links (returns only non-null values)
 */
export function getSocialLinks(settings: SiteSettings): Record<string, string> {
  const links: Record<string, string> = {};
  if (settings.social_linkedin) links.linkedin = settings.social_linkedin;
  if (settings.social_instagram) links.instagram = settings.social_instagram;
  if (settings.social_facebook) links.facebook = settings.social_facebook;
  if (settings.social_twitter) links.twitter = settings.social_twitter;
  if (settings.social_youtube) links.youtube = settings.social_youtube;
  return links;
}
