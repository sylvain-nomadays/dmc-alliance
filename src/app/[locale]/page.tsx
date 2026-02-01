import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';

// Components
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { DestinationsSection } from '@/components/home/DestinationsSection';
import { GirSection } from '@/components/home/GirSection';
import { PartnersSection } from '@/components/home/PartnersSection';
import { CtaSection } from '@/components/home/CtaSection';

// Types
type Props = {
  params: Promise<{ locale: string }>;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: locale,
      type: 'website',
    },
  };
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Get translations for each section
  const tHero = await getTranslations({ locale, namespace: 'home.hero' });
  const tStats = await getTranslations({ locale, namespace: 'home.stats' });
  const tServices = await getTranslations({ locale, namespace: 'home.services' });
  const tDestinations = await getTranslations({ locale, namespace: 'home.destinations' });
  const tGir = await getTranslations({ locale, namespace: 'home.gir' });
  const tPartners = await getTranslations({ locale, namespace: 'home.partners' });
  const tCta = await getTranslations({ locale, namespace: 'home.cta' });
  const tRegions = await getTranslations({ locale, namespace: 'destinations.regions' });

  return (
    <>
      {/* Hero Section */}
      <HeroSection
        locale={locale}
        translations={{
          title: tHero('title'),
          subtitle: tHero('subtitle'),
          cta: tHero('cta'),
          ctaSecondary: tHero('ctaSecondary'),
        }}
      />

      {/* Stats Section */}
      <StatsSection
        locale={locale}
        translations={{
          destinations: tStats('destinations'),
          partners: tStats('partners'),
          years: tStats('years'),
          travelers: tStats('travelers'),
        }}
      />

      {/* Services Section */}
      <ServicesSection
        locale={locale}
        translations={{
          title: tServices('title'),
          subtitle: tServices('subtitle'),
          tailorMade: {
            title: tServices('tailorMade.title'),
            description: tServices('tailorMade.description'),
            features: [
              tServices('tailorMade.features.0'),
              tServices('tailorMade.features.1'),
              tServices('tailorMade.features.2'),
            ],
          },
          groups: {
            title: tServices('groups.title'),
            description: tServices('groups.description'),
            features: [
              tServices('groups.features.0'),
              tServices('groups.features.1'),
              tServices('groups.features.2'),
            ],
          },
          gir: {
            title: tServices('gir.title'),
            description: tServices('gir.description'),
            features: [
              tServices('gir.features.0'),
              tServices('gir.features.1'),
              tServices('gir.features.2'),
            ],
          },
        }}
      />

      {/* Destinations Section */}
      <DestinationsSection
        locale={locale}
        translations={{
          title: tDestinations('title'),
          subtitle: tDestinations('subtitle'),
          cta: tDestinations('cta'),
          regions: {
            asia: tRegions('asia'),
            africa: tRegions('africa'),
            europe: tRegions('europe'),
            americas: tRegions('americas'),
            'middle-east': tRegions('middle-east'),
          },
        }}
      />

      {/* GIR Section */}
      <GirSection
        locale={locale}
        translations={{
          title: tGir('title'),
          subtitle: tGir('subtitle'),
          cta: tGir('cta'),
          requestCommission: tGir('requestCommission'),
        }}
      />

      {/* Partners Section */}
      <PartnersSection
        locale={locale}
        translations={{
          title: tPartners('title'),
          subtitle: tPartners('subtitle'),
          cta: tPartners('cta'),
        }}
      />

      {/* CTA Section */}
      <CtaSection
        locale={locale}
        translations={{
          title: tCta('title'),
          subtitle: tCta('subtitle'),
          button: tCta('button'),
        }}
      />
    </>
  );
}
