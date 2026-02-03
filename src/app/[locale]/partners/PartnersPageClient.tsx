'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { partners as staticPartners, regions, type Region, type Partner } from '@/data/partners';
import { getPartnerProfile } from '@/data/partners-profiles';
import { cn } from '@/lib/utils';
import {
  MapPinIcon,
  StarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowRightIcon,
  MapIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { PartnersWorldMap } from '@/components/partners/PartnersWorldMap';

// Dynamic import for Mapbox (requires window/browser APIs)
const PartnersMapbox = dynamic(
  () => import('@/components/partners/PartnersMapbox').then((mod) => mod.PartnersMapbox),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement de la carte...</p>
        </div>
      </div>
    )
  }
);

interface PartnersPageClientProps {
  locale: string;
  partnersWithLogos?: Partner[];
}

export function PartnersPageClient({ locale, partnersWithLogos }: PartnersPageClientProps) {
  // Use partners with logos from Supabase if provided, otherwise fall back to static
  const partners = partnersWithLogos || staticPartners;

  const t = useTranslations('partners');
  const tDestinations = useTranslations('destinations');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region | ''>('');
  const [selectedTier, setSelectedTier] = useState<'premium' | 'classic' | ''>('');
  const [onlyGir, setOnlyGir] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Filter partners
  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = partner.name.toLowerCase().includes(query);
        const matchesDestination = partner.destinations.some(
          d => d.name.toLowerCase().includes(query) || d.nameEn.toLowerCase().includes(query)
        );
        const matchesSpecialty = partner.specialties.some(s => s.toLowerCase().includes(query));
        if (!matchesName && !matchesDestination && !matchesSpecialty) {
          return false;
        }
      }

      // Region filter
      if (selectedRegion && !partner.destinations.some(d => d.region === selectedRegion)) {
        return false;
      }

      // Tier filter
      if (selectedTier && partner.tier !== selectedTier) {
        return false;
      }

      // GIR filter
      if (onlyGir && !partner.hasGir) {
        return false;
      }

      return true;
    });
  }, [partners, searchQuery, selectedRegion, selectedTier, onlyGir]);

  // Sort: Premium first, then alphabetically
  const sortedPartners = useMemo(() => {
    return [...filteredPartners].sort((a, b) => {
      if (a.tier === 'premium' && b.tier !== 'premium') return -1;
      if (a.tier !== 'premium' && b.tier === 'premium') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredPartners]);

  const hasActiveFilters = searchQuery || selectedRegion || selectedTier || onlyGir;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('');
    setSelectedTier('');
    setOnlyGir(false);
  };

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-deep-blue-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-heading text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-white/80">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-terracotta-500 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-white">
            <div className="text-center">
              <span className="text-2xl font-bold">{partners.length}</span>
              <span className="ml-2 text-white/80">{t('partnerAgencies')}</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold">
                {partners.reduce((acc, p) => acc + p.destinations.length, 0)}+
              </span>
              <span className="ml-2 text-white/80">{t('destinations')}</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold">
                {partners.filter(p => p.hasGir).length}
              </span>
              <span className="ml-2 text-white/80">{t('offerGir')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* World Map Section */}
      <section className="py-8 bg-sand-50">
        <div className="container mx-auto px-4">
          {/* View Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading text-gray-900">
              {t('exploreNetwork')}
            </h2>
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                  viewMode === 'map'
                    ? 'bg-terracotta-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <MapIcon className="w-4 h-4" />
                {t('map')}
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                  viewMode === 'list'
                    ? 'bg-terracotta-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <ListBulletIcon className="w-4 h-4" />
                {t('list')}
              </button>
            </div>
          </div>

          {/* Map View */}
          {viewMode === 'map' && (
            <div className="mb-8">
              {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
                <PartnersMapbox locale={locale} partnersWithLogos={partners} />
              ) : (
                <PartnersWorldMap locale={locale} partnersWithLogos={partners} />
              )}
            </div>
          )}

          {/* List View with Filters */}
          {viewMode === 'list' && (
            <>
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('searchPlaceholder')}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                  </div>

                  {/* Region Filter */}
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value as Region | '')}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  >
                    <option value="">{t('allRegions')}</option>
                    {Object.entries(regions).map(([key, value]) => (
                      <option key={key} value={key}>
                        {tDestinations(`regions.${key}`)}
                      </option>
                    ))}
                  </select>

                  {/* Tier Filter */}
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value as 'premium' | 'classic' | '')}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  >
                    <option value="">{t('allTiers')}</option>
                    <option value="premium">Premium</option>
                    <option value="classic">Classic</option>
                  </select>

                  {/* GIR Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyGir}
                      onChange={(e) => setOnlyGir(e.target.checked)}
                      className="rounded border-gray-300 text-terracotta-500 focus:ring-terracotta-500"
                    />
                    <span className="text-sm text-gray-700">{t('withGir')}</span>
                  </label>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      {t('clear')}
                    </button>
                  )}
                </div>

                {/* Results count */}
                <div className="mt-3 text-sm text-gray-500">
                  <span className="font-medium text-gray-900">{sortedPartners.length}</span>{' '}
                  {sortedPartners.length === 1 ? t('partnerFound') : t('partnersFound')}
                </div>
              </div>

              {/* Partners Grid */}
              {sortedPartners.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl text-gray-700 mb-2">
                    {t('noPartnerFound')}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {t('tryChangingFilters')}
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    {t('resetFilters')}
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedPartners.map((partner) => (
                    <PartnerCard key={partner.id} partner={partner} locale={locale} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-deep-blue-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading text-white mb-4">
            {t('areYouLocalDmc')}
          </h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            {t('joinAlliance')}
          </p>
          <Link href={`/${locale}/contact?type=join`}>
            <Button variant="primary" size="lg">
              {t('becomePartner')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

// Partner Card Component
function PartnerCard({ partner, locale }: { partner: Partner; locale: string }) {
  const t = useTranslations('partners');
  const profile = getPartnerProfile(partner.id);
  const isFr = locale === 'fr';

  return (
    <Link
      href={`/${locale}/partners/${partner.slug}`}
      className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-all group"
    >
      {/* Header with logo */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden shadow-sm border border-gray-100 bg-white flex items-center justify-center">
            {partner.logo ? (
              <Image
                src={partner.logo}
                alt={partner.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-2xl font-heading text-deep-blue-600">
                {partner.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading text-lg text-gray-900 truncate group-hover:text-terracotta-600 transition-colors">
                {partner.name}
              </h3>
            </div>
            <div className="flex flex-wrap gap-1">
              {partner.tier === 'premium' && (
                <span className="inline-flex items-center gap-0.5 bg-terracotta-100 text-terracotta-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  <StarIcon className="w-3 h-3" />
                  Premium
                </span>
              )}
              {partner.hasGir && (
                <span className="bg-sage-100 text-sage-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  GIR
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-6 pb-4">
        <p className="text-gray-600 text-sm line-clamp-2">
          {isFr ? partner.description.fr : partner.description.en}
        </p>
      </div>

      {/* Destinations */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-1.5">
          {partner.destinations.slice(0, 3).map((dest) => (
            <span
              key={dest.slug}
              className="inline-flex items-center gap-1 bg-sand-50 text-gray-600 text-xs px-2 py-1 rounded-full"
            >
              <MapPinIcon className="w-3 h-3" />
              {isFr ? dest.name : dest.nameEn}
            </span>
          ))}
          {partner.destinations.length > 3 && (
            <span className="text-gray-400 text-xs px-2 py-1">
              +{partner.destinations.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Stats & CTA */}
      <div className="px-6 py-4 bg-sand-50 border-t border-sand-100 flex items-center justify-between">
        <div className="flex gap-4 text-sm text-gray-500">
          {profile && (
            <>
              <span>{profile.stats.yearsExperience} {t('yrs')}</span>
              <span>{profile.teamSize} {t('pers')}</span>
            </>
          )}
          {!profile && (
            <span>{partner.specialties.length} {t('specialtiesCount')}</span>
          )}
        </div>
        <span className="inline-flex items-center text-terracotta-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
          {t('viewProfile')}
          <ArrowRightIcon className="w-4 h-4 ml-1" />
        </span>
      </div>
    </Link>
  );
}
