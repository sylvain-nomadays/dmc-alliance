'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface DestinationsSectionProps {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    cta: string;
    regions: {
      asia: string;
      africa: string;
      europe: string;
      americas: string;
      'middle-east': string;
    };
  };
}

// Featured destinations with images
const featuredDestinations = [
  {
    name: 'Mongolie',
    nameEn: 'Mongolia',
    slug: 'mongolie',
    region: 'asia',
    image: '/images/destinations/mongolia.jpg',
    partner: 'Horseback Adventure',
  },
  {
    name: 'Tanzanie',
    nameEn: 'Tanzania',
    slug: 'tanzanie',
    region: 'africa',
    image: '/images/destinations/tanzania.jpg',
    partner: 'Galago Expeditions',
  },
  {
    name: 'Thaïlande',
    nameEn: 'Thailand',
    slug: 'thailande',
    region: 'asia',
    image: '/images/destinations/thailand.jpg',
    partner: 'Sawa Discovery',
  },
  {
    name: 'Kirghizistan',
    nameEn: 'Kyrgyzstan',
    slug: 'kirghizistan',
    region: 'asia',
    image: '/images/destinations/kyrgyzstan.jpg',
    partner: "Kyrgyz'What ?",
  },
  {
    name: 'Costa Rica',
    nameEn: 'Costa Rica',
    slug: 'costa-rica',
    region: 'americas',
    image: '/images/destinations/costa-rica.jpg',
    partner: 'Morpho Evasions',
  },
  {
    name: 'Indonésie',
    nameEn: 'Indonesia',
    slug: 'indonesie',
    region: 'asia',
    image: '/images/destinations/indonesia.jpg',
    partner: 'Azimuth Adventure Travel',
  },
  {
    name: 'Madagascar',
    nameEn: 'Madagascar',
    slug: 'madagascar',
    region: 'africa',
    image: '/images/destinations/madagascar.jpg',
    partner: 'Détours Opérator',
  },
  {
    name: 'Pérou',
    nameEn: 'Peru',
    slug: 'perou',
    region: 'americas',
    image: '/images/destinations/peru.jpg',
    partner: 'Pasión Andina',
  },
];

type Region = 'all' | 'asia' | 'africa' | 'europe' | 'americas' | 'middle-east';

export function DestinationsSection({ locale, translations }: DestinationsSectionProps) {
  const [activeRegion, setActiveRegion] = useState<Region>('all');

  const regions: { key: Region; label: string }[] = [
    { key: 'all', label: locale === 'fr' ? 'Toutes' : 'All' },
    { key: 'asia', label: translations.regions.asia },
    { key: 'africa', label: translations.regions.africa },
    { key: 'europe', label: translations.regions.europe },
    { key: 'americas', label: translations.regions.americas },
  ];

  const filteredDestinations = activeRegion === 'all'
    ? featuredDestinations
    : featuredDestinations.filter((d) => d.region === activeRegion);

  return (
    <section className="py-20 md:py-28 bg-sand-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-heading text-gray-900 mb-4">
            {translations.title}
          </h2>
          <p className="text-lg text-gray-600">
            {translations.subtitle}
          </p>
        </div>

        {/* Region Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {regions.map((region) => (
            <button
              key={region.key}
              onClick={() => setActiveRegion(region.key)}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all',
                activeRegion === region.key
                  ? 'bg-terracotta-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-terracotta-50 hover:text-terracotta-600'
              )}
            >
              {region.label}
            </button>
          ))}
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDestinations.map((destination, index) => (
            <Link
              key={destination.slug}
              href={`/${locale}/destinations/${destination.slug}`}
              className={cn(
                'group block animate-fade-in-up',
                // Make first two items larger on desktop
                index < 2 && 'lg:col-span-2 lg:row-span-2'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                'relative rounded-2xl overflow-hidden',
                index < 2 ? 'aspect-[4/3] lg:aspect-square' : 'aspect-[4/3]'
              )}>
                {/* Image */}
                <Image
                  src={destination.image}
                  alt={locale === 'fr' ? destination.name : destination.nameEn}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes={index < 2
                    ? '(max-width: 768px) 100vw, 50vw'
                    : '(max-width: 768px) 100vw, 25vw'
                  }
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <span className="text-terracotta-300 text-xs font-accent font-medium uppercase tracking-wider mb-1">
                    {translations.regions[destination.region as keyof typeof translations.regions]}
                  </span>
                  <h3 className={cn(
                    'text-white font-heading',
                    index < 2 ? 'text-2xl lg:text-3xl' : 'text-xl'
                  )}>
                    {locale === 'fr' ? destination.name : destination.nameEn}
                  </h3>
                  <p className="text-white/70 text-sm mt-1">
                    {destination.partner}
                  </p>
                </div>

                {/* Hover Arrow */}
                <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link href={`/${locale}/destinations`}>
            <Button variant="primary" size="lg" rightIcon={
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
