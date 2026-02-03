'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Partner {
  id: string;
  name: string;
  slug: string;
  logo: string;
  destinations: string[];
  isPremium: boolean;
}

interface PartnersSectionProps {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    cta: string;
  };
  /** Partners data from Supabase */
  partners?: Partner[];
}

// Default fallback partners
const defaultPartners: Partner[] = [
  { id: 'horseback-adventure', name: 'Horseback Adventure', slug: 'horseback-adventure', logo: '/images/partners/horseback-adventure.png', destinations: ['Mongolie'], isPremium: true },
  { id: 'kyrgyzwhat', name: "Kyrgyz'What ?", slug: 'kyrgyzwhat', logo: '/images/partners/kyrgyzwhat.png', destinations: ['Kirghizistan'], isPremium: true },
  { id: 'sawa-discovery', name: 'Sawa Discovery', slug: 'sawa-discovery', logo: '/images/partners/sawa-discovery.png', destinations: ['Thaïlande'], isPremium: true },
  { id: 'galago-expeditions', name: 'Galago Expeditions', slug: 'galago-expeditions', logo: '/images/partners/galago.png', destinations: ['Kenya', 'Tanzanie', 'Ouganda'], isPremium: true },
  { id: 'detours-operator', name: 'Détours Opérator', slug: 'detours-operator', logo: '/images/partners/detours.png', destinations: ['Madagascar', 'Mauritanie', 'Algérie'], isPremium: true },
  { id: 'azimuth', name: 'Azimuth Adventure Travel', slug: 'azimuth', logo: '/images/partners/azimuth.png', destinations: ['Indonésie'], isPremium: true },
];

export function PartnersSection({ locale, translations, partners }: PartnersSectionProps) {
  // Use provided partners or fallback to defaults
  const featuredPartners = partners && partners.length > 0 ? partners : defaultPartners;

  return (
    <section className="py-20 md:py-28 bg-gray-900 text-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-terracotta-400 font-accent font-medium uppercase tracking-wider text-sm mb-2 block">
            {locale === 'fr' ? 'Nos partenaires' : 'Our Partners'}
          </span>
          <h2 className="text-3xl md:text-4xl font-heading mb-4">
            {translations.title}
          </h2>
          <p className="text-lg text-gray-400">
            {translations.subtitle}
          </p>
        </div>

        {/* Partner Logos Carousel/Grid */}
        <div className="relative">
          {/* Gradient fades on sides */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none" />

          {/* Partners Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8">
            {featuredPartners.map((partner, index) => (
              <Link
                key={partner.id}
                href={`/${locale}/partners/${partner.slug}`}
                className={cn(
                  'group relative bg-gray-800/50 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:bg-gray-800 hover:scale-105 animate-fade-in-up',
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Premium Badge */}
                {partner.isPremium && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-terracotta-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}

                {/* Logo */}
                <div className="h-16 flex items-center justify-center mb-3">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={120}
                    height={60}
                    className="max-h-12 w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity filter grayscale group-hover:grayscale-0"
                  />
                </div>

                {/* Name */}
                <h3 className="text-white font-medium text-sm mb-1 group-hover:text-terracotta-400 transition-colors">
                  {partner.name}
                </h3>

                {/* Destinations */}
                <p className="text-gray-500 text-xs">
                  {partner.destinations.join(' • ')}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-gray-800">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-heading text-terracotta-400 mb-2">20+</div>
            <div className="text-gray-400 text-sm">{locale === 'fr' ? 'Agences locales' : 'Local agencies'}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-heading text-terracotta-400 mb-2">30+</div>
            <div className="text-gray-400 text-sm">{locale === 'fr' ? 'Destinations' : 'Destinations'}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-heading text-terracotta-400 mb-2">15+</div>
            <div className="text-gray-400 text-sm">{locale === 'fr' ? 'Années d\'expérience' : 'Years of experience'}</div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link href={`/${locale}/partners`}>
            <Button variant="outline-white" size="lg" rightIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            }>
              {translations.cta}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
