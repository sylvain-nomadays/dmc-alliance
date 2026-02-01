'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface GirSectionProps {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    cta: string;
    requestCommission: string;
  };
}

// Sample GIR data - In production, this would come from API/CMS
const upcomingGirs = [
  {
    id: '1',
    title: 'Entre Steppe et Désert',
    slug: 'entre-steppe-et-desert',
    destination: 'Mongolie',
    image: '/images/gir/mongolia-steppe.jpg',
    departureDate: '2024-06-15',
    duration: 15,
    price: 3290,
    level: 'moderate' as const,
    placesRemaining: 6,
    partner: 'Horseback Adventure',
  },
  {
    id: '2',
    title: 'Merveilles de Kirghizie',
    slug: 'merveilles-kirghizie',
    destination: 'Kirghizistan',
    image: '/images/gir/kyrgyzstan-mountains.jpg',
    departureDate: '2024-07-08',
    duration: 12,
    price: 2490,
    level: 'challenging' as const,
    placesRemaining: 4,
    partner: "Kyrgyz'What ?",
  },
  {
    id: '3',
    title: 'Grande Découverte de la Thaïlande',
    slug: 'grande-decouverte-thailande',
    destination: 'Thaïlande',
    image: '/images/gir/thailand-temple.jpg',
    departureDate: '2024-05-20',
    duration: 14,
    price: 2890,
    level: 'easy' as const,
    placesRemaining: 8,
    partner: 'Sawa Discovery',
  },
];

const levelLabels = {
  easy: { fr: 'Facile', en: 'Easy' },
  moderate: { fr: 'Modéré', en: 'Moderate' },
  challenging: { fr: 'Sportif', en: 'Challenging' },
  expert: { fr: 'Expert', en: 'Expert' },
};

const levelColors = {
  easy: 'bg-sage-100 text-sage-700',
  moderate: 'bg-terracotta-100 text-terracotta-700',
  challenging: 'bg-deep-blue-100 text-deep-blue-700',
  expert: 'bg-gray-800 text-white',
};

export function GirSection({ locale, translations }: GirSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="text-terracotta-500 font-accent font-medium uppercase tracking-wider text-sm mb-2 block">
              {locale === 'fr' ? 'GIR Co-remplissage' : 'Shared Departures'}
            </span>
            <h2 className="text-3xl md:text-4xl font-heading text-gray-900 mb-4">
              {translations.title}
            </h2>
            <p className="text-lg text-gray-600">
              {translations.subtitle}
            </p>
          </div>
          <Link href={`/${locale}/services/gir`}>
            <Button variant="outline" size="md">
              {translations.cta}
            </Button>
          </Link>
        </div>

        {/* GIR Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingGirs.map((gir, index) => (
            <article
              key={gir.id}
              className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={gir.image}
                  alt={gir.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Date Badge */}
                <div className="absolute top-4 left-4 bg-terracotta-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {formatDate(gir.departureDate)}
                </div>

                {/* Places Badge */}
                {gir.placesRemaining <= 5 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                    {gir.placesRemaining} {locale === 'fr' ? 'places' : 'seats'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-terracotta-500 text-sm font-accent font-medium uppercase tracking-wider">
                    {gir.destination}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500 text-sm">
                    {gir.partner}
                  </span>
                </div>

                <h3 className="text-lg font-heading text-gray-900 mb-3 line-clamp-2 group-hover:text-terracotta-600 transition-colors">
                  {gir.title}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {gir.duration} {locale === 'fr' ? 'jours' : 'days'}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    levelColors[gir.level]
                  )}>
                    {levelLabels[gir.level][locale === 'fr' ? 'fr' : 'en']}
                  </span>
                </div>

                {/* Price & CTA */}
                <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-gray-500 text-sm block">
                      {locale === 'fr' ? 'À partir de' : 'From'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-heading text-gray-900">
                        {gir.price.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                      </span>
                      <span className="text-gray-500">€</span>
                    </div>
                  </div>

                  <Link
                    href={`/${locale}/services/gir/${gir.slug}`}
                    className="text-deep-blue-600 font-medium text-sm hover:text-terracotta-500 transition-colors flex items-center gap-1"
                  >
                    {locale === 'fr' ? 'Voir le circuit' : 'View tour'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Commission CTA */}
        <div className="mt-12 bg-sand-100 rounded-2xl p-8 md:p-10 text-center">
          <h3 className="text-xl font-heading text-gray-900 mb-3">
            {locale === 'fr' ? 'Vous êtes professionnel du voyage ?' : 'Are you a travel professional?'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            {locale === 'fr'
              ? 'Contactez-nous pour connaître vos conditions de commission et intégrer vos clients à nos départs.'
              : 'Contact us to learn about your commission terms and add your clients to our departures.'}
          </p>
          <Link href={`/${locale}/contact?subject=gir`}>
            <Button variant="primary" size="lg">
              {translations.requestCommission}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
