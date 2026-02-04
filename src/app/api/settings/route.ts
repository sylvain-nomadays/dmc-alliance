import { NextResponse } from 'next/server';
import { getSiteSettings, getContactEmail, getContactPhone, getSocialLinks, getFooterLogoUrl } from '@/lib/supabase/site-settings';

/**
 * GET /api/settings
 * Returns public site settings (contact info, social links)
 * No authentication required as these are public values
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';

    const settings = await getSiteSettings();

    // Only return public settings
    const publicSettings = {
      contact: {
        email: getContactEmail(settings),
        phone: getContactPhone(settings),
        address_fr: settings.contact_address_fr || '123 Rue du Voyage, 75001 Paris, France',
        address_en: settings.contact_address_en || '123 Travel Street, 75001 Paris, France',
        address: locale === 'en'
          ? (settings.contact_address_en || '123 Travel Street, 75001 Paris, France')
          : (settings.contact_address_fr || '123 Rue du Voyage, 75001 Paris, France'),
      },
      social: getSocialLinks(settings),
      // Include footer logo for newsletter templates
      footerLogo: getFooterLogoUrl(settings),
    };

    return NextResponse.json(publicSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return default values on error
    return NextResponse.json({
      contact: {
        email: 'contact@dmc-alliance.org',
        phone: '+33 1 23 45 67 89',
        address_fr: '123 Rue du Voyage, 75001 Paris, France',
        address_en: '123 Travel Street, 75001 Paris, France',
        address: '123 Rue du Voyage, 75001 Paris, France',
      },
      social: {},
    });
  }
}
