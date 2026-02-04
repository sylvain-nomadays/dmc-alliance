import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { getAllDestinationsWithImages } from '@/lib/supabase/destinations-list';
import { DestinationsPageClient } from '@/components/destinations/DestinationsPageClient';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

// Types
type Props = {
  params: Promise<{ locale: string }>;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'destinations' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      locale: locale,
      type: 'website',
    },
  };
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function DestinationsPage({ params }: Props) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Fetch destinations with images from Supabase
  const destinations = await getAllDestinationsWithImages();

  // Get translations
  const t = await getTranslations({ locale, namespace: 'destinations' });

  const translations = {
    title: t('title'),
    subtitle: t('subtitle'),
    searchPlaceholder: t('searchPlaceholder'),
    noDestinations: t('noDestinations'),
    tryChangingFilters: t('tryChangingFilters'),
    ourGlobalNetwork: t('ourGlobalNetwork'),
    globalNetworkDescription: t('globalNetworkDescription'),
    clickToDiscover: t('clickToDiscover'),
    cantFindDestination: t('cantFindDestination'),
    cantFindDescription: t('cantFindDescription'),
    contactUs: t('contactUs'),
    all: t('all'),
    regions: {
      asia: t('regions.asia'),
      africa: t('regions.africa'),
      europe: t('regions.europe'),
      americas: t('regions.americas'),
      'middle-east': t('regions.middle-east'),
    },
  };

  return (
    <DestinationsPageClient
      locale={locale}
      destinations={destinations}
      translations={translations}
    />
  );
}
