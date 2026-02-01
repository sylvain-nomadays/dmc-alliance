'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { partners, getAllDestinations, getPartnerByDestination, regions, type Region } from '@/data/partners';

interface DestinationsPageProps {
  params: { locale: string };
}

export default function DestinationsPage({ params: { locale } }: DestinationsPageProps) {
  const [activeRegion, setActiveRegion] = useState<Region | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allDestinations = useMemo(() => getAllDestinations(), []);

  const filteredDestinations = useMemo(() => {
    let filtered = allDestinations;

    // Filter by region
    if (activeRegion !== 'all') {
      filtered = filtered.filter((d) => d.region === activeRegion);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.nameEn.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allDestinations, activeRegion, searchQuery]);

  const regionTabs: { key: Region | 'all'; label: string }[] = [
    { key: 'all', label: locale === 'fr' ? 'Toutes' : 'All' },
    { key: 'asia', label: locale === 'fr' ? 'Asie' : 'Asia' },
    { key: 'africa', label: locale === 'fr' ? 'Afrique' : 'Africa' },
    { key: 'europe', label: 'Europe' },
    { key: 'americas', label: locale === 'fr' ? 'Amériques' : 'Americas' },
    { key: 'middle-east', label: locale === 'fr' ? 'Moyen-Orient' : 'Middle East' },
  ];

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-20 bg-deep-blue-900">
        <div className="absolute inset-0">
          <Image
            src="/images/destinations/hero-map.jpg"
            alt=""
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-heading text-white mb-4">
              {locale === 'fr' ? 'Nos destinations' : 'Our destinations'}
            </h1>
            <p className="text-xl text-white/80">
              {locale === 'fr'
                ? '30+ destinations à travers le monde, chacune avec son expert local dédié.'
                : '30+ destinations worldwide, each with its dedicated local expert.'}
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-white border-b border-gray-100 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Region Tabs */}
            <div className="flex flex-wrap gap-2">
              {regionTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveRegion(tab.key)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    activeRegion === tab.key
                      ? 'bg-terracotta-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder={locale === 'fr' ? 'Rechercher une destination...' : 'Search destination...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="py-12 bg-sand-50">
        <div className="container mx-auto px-4">
          {filteredDestinations.length === 0 ? (
            <div className="text-center py-20">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl text-gray-500">
                {locale === 'fr' ? 'Aucune destination trouvée' : 'No destinations found'}
              </h3>
              <p className="text-gray-400 mt-2">
                {locale === 'fr'
                  ? 'Essayez de modifier vos filtres'
                  : 'Try changing your filters'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDestinations.map((destination, index) => {
                const partner = getPartnerByDestination(destination.slug);

                return (
                  <Link
                    key={destination.slug}
                    href={`/${locale}/destinations/${destination.slug}`}
                    className="group animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                      <Image
                        src={`/images/destinations/${destination.slug}.jpg`}
                        alt={locale === 'fr' ? destination.name : destination.nameEn}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Content */}
                      <div className="absolute inset-0 p-5 flex flex-col justify-end">
                        <span className="text-terracotta-300 text-xs font-accent font-medium uppercase tracking-wider mb-1">
                          {regions[destination.region].name}
                        </span>
                        <h3 className="text-white text-xl font-heading mb-1">
                          {locale === 'fr' ? destination.name : destination.nameEn}
                        </h3>
                        {partner && (
                          <p className="text-white/60 text-sm">{partner.name}</p>
                        )}
                      </div>

                      {/* Partner has GIR badge */}
                      {partner?.hasGir && (
                        <div className="absolute top-4 right-4 bg-terracotta-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                          GIR
                        </div>
                      )}

                      {/* Hover Arrow */}
                      <div className="absolute top-4 left-4 w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-heading text-gray-900 mb-4">
              {locale === 'fr' ? 'Notre réseau mondial' : 'Our global network'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {locale === 'fr'
                ? 'Des experts locaux sur tous les continents pour vous accompagner dans vos projets.'
                : 'Local experts on every continent to support your projects.'}
            </p>
          </div>

          {/* Interactive Map placeholder */}
          <div className="relative aspect-[21/9] bg-deep-blue-50 rounded-2xl overflow-hidden">
            <Image
              src="/images/destinations/world-map.svg"
              alt="World map"
              fill
              className="object-contain p-8"
            />
            {/* Map dots would be dynamically placed here */}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-sand-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-heading text-gray-900 mb-4">
            {locale === 'fr'
              ? 'Vous ne trouvez pas votre destination ?'
              : "Can't find your destination?"}
          </h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            {locale === 'fr'
              ? 'Notre réseau s\'agrandit constamment. Contactez-nous pour discuter de vos besoins.'
              : 'Our network is constantly growing. Contact us to discuss your needs.'}
          </p>
          <Link href={`/${locale}/contact`}>
            <Button variant="primary" size="lg">
              {locale === 'fr' ? 'Nous contacter' : 'Contact us'}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
