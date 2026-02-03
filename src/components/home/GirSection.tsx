'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface GirCircuit {
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

interface GirSectionProps {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    cta: string;
    requestCommission: string;
  };
  /** Circuits data from Supabase */
  circuits?: GirCircuit[];
}

// Default fallback GIR data
const defaultGirs = [
  {
    id: '1',
    slug: 'entre-steppe-et-desert',
    title: 'Entre Steppe et Désert',
    titleEn: 'Between Steppe and Desert',
    destination: 'Mongolie',
    image: '/images/gir/mongolia-steppe.jpg',
    departureDate: '2024-06-15',
    duration: 15,
    price: 3290,
    placesAvailable: 6,
  },
  {
    id: '2',
    slug: 'merveilles-de-kirghizie',
    title: 'Merveilles de Kirghizie',
    titleEn: 'Wonders of Kyrgyzstan',
    destination: 'Kirghizistan',
    image: '/images/gir/kyrgyzstan-mountains.jpg',
    departureDate: '2024-07-08',
    duration: 12,
    price: 2490,
    placesAvailable: 4,
  },
  {
    id: '3',
    slug: 'grande-migration-masai-mara',
    title: 'Grande Migration Masai Mara',
    titleEn: 'Great Masai Mara Migration',
    destination: 'Kenya',
    image: '/images/gir/kenya-migration.jpg',
    departureDate: '2024-07-15',
    duration: 10,
    price: 4890,
    placesAvailable: 6,
  },
];

export function GirSection({ locale, translations, circuits }: GirSectionProps) {
  // Use provided circuits or fallback to defaults
  const upcomingGirs = circuits && circuits.length > 0 ? circuits : defaultGirs;
  const isFr = locale === 'fr';

  const formatDate = (dateString: string) => {
    if (!dateString) return isFr ? 'Dates à venir' : 'Dates TBC';
    return new Date(dateString).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
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
              {isFr ? 'GIR Co-remplissage' : 'Shared Departures'}
            </span>
            <h2 className="text-3xl md:text-4xl font-heading text-gray-900 mb-4">
              {translations.title}
            </h2>
            <p className="text-lg text-gray-600">
              {translations.subtitle}
            </p>
          </div>
          <Link href={`/${locale}/gir`}>
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
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <Image
                  src={gir.image}
                  alt={isFr ? gir.title : gir.titleEn}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Date Badge */}
                <div className="absolute top-4 left-4 bg-terracotta-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {formatDate(gir.departureDate)}
                </div>

                {/* Places Badge */}
                {gir.placesAvailable > 0 && gir.placesAvailable <= 6 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                    {gir.placesAvailable} {isFr ? 'places' : 'seats'}
                  </div>
                )}

                {gir.placesAvailable === 0 && (
                  <div className="absolute top-4 right-4 bg-gray-700 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                    {isFr ? 'Complet' : 'Full'}
                  </div>
                )}

                {gir.placesAvailable < 0 && (
                  <div className="absolute top-4 right-4 bg-terracotta-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                    GIR
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-terracotta-500 text-sm font-accent font-medium uppercase tracking-wider">
                    {gir.destination}
                  </span>
                </div>

                <h3 className="text-lg font-heading text-gray-900 mb-3 line-clamp-2 group-hover:text-terracotta-600 transition-colors">
                  {isFr ? gir.title : gir.titleEn}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {gir.duration} {isFr ? 'jours' : 'days'}
                  </span>
                </div>

                {/* Price & CTA */}
                <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-gray-500 text-sm block">
                      {isFr ? 'À partir de' : 'From'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-heading text-gray-900">
                        {gir.price.toLocaleString(isFr ? 'fr-FR' : 'en-US')}
                      </span>
                      <span className="text-gray-500">€</span>
                    </div>
                  </div>

                  <Link
                    href={`/${locale}/gir/${gir.slug}`}
                    className="text-deep-blue-600 font-medium text-sm hover:text-terracotta-500 transition-colors flex items-center gap-1"
                  >
                    {isFr ? 'Voir le circuit' : 'View tour'}
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
            {isFr ? 'Vous êtes professionnel du voyage ?' : 'Are you a travel professional?'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            {isFr
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
