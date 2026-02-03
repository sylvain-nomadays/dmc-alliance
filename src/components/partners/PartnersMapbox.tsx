'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { partners as staticPartners, type Partner, regions, type Region } from '@/data/partners';
import { getCoordinates } from '@/data/destination-coordinates';
import { getPartnerProfile } from '@/data/partners-profiles';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  MapPinIcon,
  StarIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface PartnersMapboxProps {
  locale: string;
  partnersWithLogos?: Partner[];
}

// Region colors
const regionColors: Record<Region, { bg: string; text: string; marker: string; light: string; gradient: string }> = {
  asia: { bg: 'bg-terracotta-500', text: 'text-terracotta-600', marker: '#E07A5F', light: 'bg-terracotta-50', gradient: 'from-terracotta-400 to-terracotta-600' },
  africa: { bg: 'bg-sage-500', text: 'text-sage-600', marker: '#81B29A', light: 'bg-sage-50', gradient: 'from-sage-400 to-sage-600' },
  europe: { bg: 'bg-deep-blue-500', text: 'text-deep-blue-600', marker: '#3D405B', light: 'bg-deep-blue-50', gradient: 'from-deep-blue-400 to-deep-blue-600' },
  americas: { bg: 'bg-amber-500', text: 'text-amber-600', marker: '#F59E0B', light: 'bg-amber-50', gradient: 'from-amber-400 to-amber-600' },
  'middle-east': { bg: 'bg-orange-500', text: 'text-orange-600', marker: '#EA580C', light: 'bg-orange-50', gradient: 'from-orange-400 to-orange-600' },
  oceania: { bg: 'bg-cyan-500', text: 'text-cyan-600', marker: '#06B6D4', light: 'bg-cyan-50', gradient: 'from-cyan-400 to-cyan-600' },
};

// Mapbox style with no labels
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';

export function PartnersMapbox({ locale, partnersWithLogos }: PartnersMapboxProps) {
  const partners = partnersWithLogos || staticPartners;
  const mapRef = useRef<any>(null);

  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<Region | 'all'>('all');
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    name: string;
    nameEn: string;
    partner: Partner;
    region: Region;
  } | null>(null);

  const t = useTranslations('partners');
  const tDestinations = useTranslations('destinations');
  const tCommon = useTranslations('common');
  const isFr = locale === 'fr';

  // Create map points
  const mapPoints = useMemo(() => {
    const points: {
      slug: string;
      name: string;
      nameEn: string;
      lng: number;
      lat: number;
      partner: Partner;
      region: Region;
    }[] = [];

    partners.forEach((partner) => {
      partner.destinations.forEach((dest) => {
        const coords = getCoordinates(dest.slug);
        if (coords) {
          points.push({
            slug: dest.slug,
            name: dest.name,
            nameEn: dest.nameEn,
            lng: coords.lng,
            lat: coords.lat,
            partner,
            region: dest.region,
          });
        }
      });
    });

    return points;
  }, [partners]);

  // Group by region for sidebar
  const destinationsByRegion = useMemo(() => {
    const grouped: Record<Region, typeof mapPoints> = {
      asia: [],
      africa: [],
      europe: [],
      americas: [],
      'middle-east': [],
      oceania: [],
    };

    mapPoints.forEach((point) => {
      if (grouped[point.region] && !grouped[point.region].find((p) => p.slug === point.slug)) {
        grouped[point.region].push(point);
      }
    });

    return grouped;
  }, [mapPoints]);

  const filteredPoints = activeRegion === 'all'
    ? mapPoints
    : mapPoints.filter((p) => p.region === activeRegion);

  const handleMarkerClick = useCallback((point: typeof mapPoints[0]) => {
    setPopupInfo({
      longitude: point.lng,
      latitude: point.lat,
      name: point.name,
      nameEn: point.nameEn,
      partner: point.partner,
      region: point.region,
    });
  }, []);

  // Handle sidebar click - fly to location and open partner panel directly
  const handleSidebarClick = useCallback((point: typeof mapPoints[0]) => {
    // Fly to destination
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [point.lng, point.lat],
        zoom: 5,
        duration: 1000,
      });
    }
    // Open partner panel directly
    setSelectedPartner(point.partner);
    setPopupInfo(null);
  }, []);

  const openPartnerPanel = (partner: Partner) => {
    setSelectedPartner(partner);
    setPopupInfo(null);
  };

  const closePanel = () => {
    setSelectedPartner(null);
  };

  // Fly to region when filter changes
  useEffect(() => {
    if (!mapRef.current) return;

    const regionCenters: Record<Region | 'all', { lng: number; lat: number; zoom: number }> = {
      all: { lng: 20, lat: 20, zoom: 1.5 },
      asia: { lng: 100, lat: 35, zoom: 3 },
      africa: { lng: 20, lat: 0, zoom: 3 },
      europe: { lng: 15, lat: 50, zoom: 3.5 },
      americas: { lng: -80, lat: 10, zoom: 2.5 },
      'middle-east': { lng: 45, lat: 28, zoom: 4 },
      oceania: { lng: 140, lat: -25, zoom: 3 },
    };

    const center = regionCenters[activeRegion];
    mapRef.current.flyTo({
      center: [center.lng, center.lat],
      zoom: center.zoom,
      duration: 1500,
    });
  }, [activeRegion]);

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      <div className="flex flex-col lg:flex-row">
        {/* Map Section */}
        <div className="flex-1 relative">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-heading text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta-500 to-terracotta-600 flex items-center justify-center shadow-lg shadow-terracotta-500/20">
                  <GlobeAltIcon className="w-5 h-5 text-white" />
                </div>
                {t('globalNetwork')}
              </h3>

              {/* Region Pills */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveRegion('all')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200',
                    activeRegion === 'all'
                      ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {isFr ? 'Tous' : 'All'}
                </button>
                {(Object.keys(regions) as Region[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setActiveRegion(key)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2',
                      activeRegion === key
                        ? `bg-gradient-to-r ${regionColors[key].gradient} text-white shadow-lg`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <span
                      className={cn('w-2 h-2 rounded-full', activeRegion === key ? 'bg-white/80' : regionColors[key].bg)}
                    />
                    {tDestinations(`regions.${key}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative h-[500px]">
            <Map
              ref={mapRef}
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
              initialViewState={{
                longitude: 20,
                latitude: 20,
                zoom: 1.5,
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle={MAP_STYLE}
              attributionControl={false}
              logoPosition="bottom-right"
            >
              <NavigationControl position="top-right" showCompass={false} />

              {/* Markers */}
              {filteredPoints.map((point, index) => {
                const isHovered = hoveredPoint === `${point.partner.id}-${point.slug}`;
                const pointId = `${point.partner.id}-${point.slug}-${index}`;

                return (
                  <Marker
                    key={pointId}
                    longitude={point.lng}
                    latitude={point.lat}
                    anchor="center"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      handleMarkerClick(point);
                    }}
                  >
                    <div
                      className="relative cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(`${point.partner.id}-${point.slug}`)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Pulse animation */}
                      {isHovered && (
                        <div
                          className="absolute inset-0 rounded-full animate-ping"
                          style={{
                            backgroundColor: regionColors[point.region].marker,
                            opacity: 0.3,
                            transform: 'scale(2)',
                          }}
                        />
                      )}

                      {/* Main marker */}
                      <div
                        className={cn(
                          'rounded-full border-2 border-white shadow-lg transition-all duration-200',
                          isHovered ? 'scale-125' : 'scale-100'
                        )}
                        style={{
                          backgroundColor: regionColors[point.region].marker,
                          width: isHovered ? 20 : 16,
                          height: isHovered ? 20 : 16,
                        }}
                      >
                        {/* Inner dot */}
                        <div
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full"
                          style={{
                            width: isHovered ? 8 : 6,
                            height: isHovered ? 8 : 6,
                          }}
                        />
                      </div>

                      {/* Premium badge */}
                      {point.partner.tier === 'premium' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border border-white flex items-center justify-center">
                          <span className="text-[8px] text-white">★</span>
                        </div>
                      )}
                    </div>
                  </Marker>
                );
              })}

              {/* Popup */}
              {popupInfo && (
                <Popup
                  longitude={popupInfo.longitude}
                  latitude={popupInfo.latitude}
                  anchor="bottom"
                  onClose={() => setPopupInfo(null)}
                  closeButton={true}
                  closeOnClick={false}
                  className="partner-popup"
                >
                  <div className="p-2 min-w-[200px]">
                    <h4 className="font-semibold text-gray-900">
                      {isFr ? popupInfo.name : popupInfo.nameEn}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{popupInfo.partner.name}</p>
                    <button
                      onClick={() => openPartnerPanel(popupInfo.partner)}
                      className="mt-3 w-full text-sm bg-terracotta-500 hover:bg-terracotta-600 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      {t('viewProfile')}
                      <ArrowRightIcon className="w-3 h-3" />
                    </button>
                  </div>
                </Popup>
              )}
            </Map>

            {/* Stats Overlay */}
            <div className="absolute bottom-6 left-6 flex gap-3 z-10">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl px-5 py-4 shadow-xl border border-white/50">
                <div className="text-3xl font-bold bg-gradient-to-r from-deep-blue-600 to-deep-blue-800 bg-clip-text text-transparent">
                  {partners.length}
                </div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  {tCommon('partners')}
                </div>
              </div>
              <div className="bg-white/95 backdrop-blur-md rounded-2xl px-5 py-4 shadow-xl border border-white/50">
                <div className="text-3xl font-bold bg-gradient-to-r from-terracotta-500 to-terracotta-700 bg-clip-text text-transparent">
                  {mapPoints.length}
                </div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  {tCommon('destinations')}
                </div>
              </div>
            </div>

            {/* Hint */}
            <div className="absolute bottom-6 right-6 text-gray-600 text-sm flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50 z-10">
              <div className="w-2 h-2 rounded-full bg-terracotta-500 animate-pulse" />
              {t('clickPointToSeePartner')}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 border-l border-gray-100 bg-gradient-to-b from-gray-50 to-white max-h-[600px] overflow-y-auto">
          <div className="p-5">
            <h4 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wider flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-terracotta-500" />
              {isFr ? 'Nos Destinations' : 'Our Destinations'}
            </h4>

            {(Object.keys(destinationsByRegion) as Region[]).map((region) => {
              const destinations = destinationsByRegion[region];
              if (destinations.length === 0) return null;

              return (
                <div key={region} className="mb-5">
                  <div className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl mb-2',
                    regionColors[region].light
                  )}>
                    <span className={cn('w-3 h-3 rounded-full', regionColors[region].bg)} />
                    <span className={cn('text-sm font-semibold', regionColors[region].text)}>
                      {tDestinations(`regions.${region}`)}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto bg-white/60 px-2 py-0.5 rounded-full">
                      {destinations.length}
                    </span>
                  </div>

                  <div className="space-y-1 pl-2">
                    {destinations.map((dest) => (
                      <button
                        key={dest.slug}
                        onClick={() => handleSidebarClick(dest)}
                        onMouseEnter={() => setHoveredPoint(`${dest.partner.id}-${dest.slug}`)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className={cn(
                          'w-full flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl transition-all text-left group',
                          hoveredPoint === `${dest.partner.id}-${dest.slug}`
                            ? 'bg-white shadow-md text-gray-900 scale-[1.02]'
                            : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                        )}
                      >
                        <span className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          hoveredPoint === `${dest.partner.id}-${dest.slug}` ? regionColors[region].bg : 'bg-gray-300'
                        )} />
                        <span className="flex-1 truncate">
                          {isFr ? dest.name : dest.nameEn}
                        </span>
                        <ChevronRightIcon className={cn(
                          'w-4 h-4 transition-all',
                          hoveredPoint === `${dest.partner.id}-${dest.slug}`
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0'
                        )} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Partner Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50',
          selectedPartner ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {selectedPartner && (
          <PartnerInfoPanel
            partner={selectedPartner}
            locale={locale}
            onClose={closePanel}
          />
        )}
      </div>

      {/* Backdrop */}
      {selectedPartner && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={closePanel}
        />
      )}

      {/* Custom popup styles */}
      <style jsx global>{`
        .mapboxgl-popup-content {
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
        }
        .mapboxgl-popup-close-button {
          font-size: 18px;
          padding: 4px 8px;
          color: #6b7280;
        }
        .mapboxgl-popup-close-button:hover {
          background: #f3f4f6;
          color: #1f2937;
        }
        .mapboxgl-ctrl-logo {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}

// Partner Info Panel Component
function PartnerInfoPanel({
  partner,
  locale,
  onClose,
}: {
  partner: Partner;
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations('partners');
  const profile = getPartnerProfile(partner.id);
  const isFr = locale === 'fr';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-r from-sand-50 via-white to-sand-50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 shadow-lg bg-white flex items-center justify-center">
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
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-2xl font-heading text-deep-blue-600">${partner.name.charAt(0)}</span>`;
                    }
                  }}
                />
              ) : (
                <span className="text-2xl font-heading text-deep-blue-600">
                  {partner.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h4 className="font-heading text-xl text-gray-900">{partner.name}</h4>
              <div className="flex items-center gap-2 mt-2">
                {partner.tier === 'premium' && (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
                    <StarIcon className="w-3.5 h-3.5 fill-amber-500 stroke-amber-600" />
                    Premium
                  </span>
                )}
                {partner.hasGir && (
                  <span className="bg-gradient-to-r from-sage-100 to-sage-50 text-sage-700 text-xs font-semibold px-3 py-1 rounded-full border border-sage-200">
                    GIR
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <p className="text-gray-600 mb-8 leading-relaxed text-[15px]">
          {isFr ? partner.description.fr : partner.description.en}
        </p>

        {/* Destinations */}
        <div className="mb-8">
          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPinIcon className="w-4 h-4" />
            {t('destinations')}
          </h5>
          <div className="flex flex-wrap gap-2">
            {partner.destinations.map((dest) => (
              <Link
                key={dest.slug}
                href={`/${locale}/destinations/${dest.slug}`}
                className="inline-flex items-center gap-2 bg-gray-50 text-gray-700 text-sm px-4 py-2.5 rounded-xl hover:bg-terracotta-50 hover:text-terracotta-600 transition-all border border-gray-100 hover:border-terracotta-200"
              >
                <MapPinIcon className="w-4 h-4" />
                {isFr ? dest.name : dest.nameEn}
              </Link>
            ))}
          </div>
        </div>

        {/* Specialties */}
        <div className="mb-8">
          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            {t('specialties')}
          </h5>
          <div className="flex flex-wrap gap-2">
            {partner.specialties.map((spec, idx) => (
              <span
                key={idx}
                className="bg-white border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-full hover:border-gray-300 transition-colors"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        {profile && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-deep-blue-50 to-deep-blue-100 rounded-2xl p-5 text-center border border-deep-blue-100">
              <div className="text-3xl font-bold text-deep-blue-600">
                {profile.stats.yearsExperience}
              </div>
              <div className="text-xs text-deep-blue-600/70 mt-1 font-medium">
                {t('yearsExp')}
              </div>
            </div>
            <div className="bg-gradient-to-br from-terracotta-50 to-terracotta-100 rounded-2xl p-5 text-center border border-terracotta-100">
              <div className="text-3xl font-bold text-terracotta-600">
                {profile.teamSize}
              </div>
              <div className="text-xs text-terracotta-600/70 mt-1 font-medium">
                {t('teamMembers')}
              </div>
            </div>
            {profile.stats.satisfactionRate && (
              <div className="bg-gradient-to-br from-sage-50 to-sage-100 rounded-2xl p-5 text-center col-span-2 border border-sage-100">
                <div className="text-3xl font-bold text-sage-600">
                  {profile.stats.satisfactionRate}%
                </div>
                <div className="text-xs text-sage-600/70 mt-1 font-medium">
                  {t('satisfactionRate')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <Link
          href={`/${locale}/partners/${partner.slug}`}
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white font-semibold py-4 px-4 rounded-2xl transition-all shadow-xl shadow-terracotta-500/25 hover:shadow-terracotta-500/40 hover:scale-[1.02]"
        >
          {t('viewFullProfile')}
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
