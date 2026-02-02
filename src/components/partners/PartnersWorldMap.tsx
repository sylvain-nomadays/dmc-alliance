'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { partners, type Partner, regions, type Region } from '@/data/partners';
import { getCoordinates } from '@/data/destination-coordinates';
import { getPartnerProfile } from '@/data/partners-profiles';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  MapPinIcon,
  StarIcon,
  ArrowRightIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface PartnersWorldMapProps {
  locale: string;
}

// Convertir les coordonnées lat/lng vers des coordonnées SVG
// Projection Mercator simplifiée
const latLngToSvg = (lat: number, lng: number, width: number, height: number) => {
  // Mercator projection
  const x = (lng + 180) * (width / 360);
  const latRad = lat * Math.PI / 180;
  const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
  const y = (height / 2) - (width * mercN / (2 * Math.PI));
  return { x, y };
};

export function PartnersWorldMap({ locale }: PartnersWorldMapProps) {
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [hoveredDestination, setHoveredDestination] = useState<string | null>(null);
  const t = useTranslations('partners');
  const tDestinations = useTranslations('destinations');
  const tCommon = useTranslations('common');
  const isFr = locale === 'fr';

  // Créer les points de la carte avec leurs partenaires
  const mapPoints = useMemo(() => {
    const points: {
      slug: string;
      name: string;
      nameEn: string;
      x: number;
      y: number;
      partner: Partner;
      region: Region;
    }[] = [];

    partners.forEach((partner) => {
      partner.destinations.forEach((dest) => {
        const coords = getCoordinates(dest.slug);
        if (coords) {
          const svgCoords = latLngToSvg(coords.lat, coords.lng, 1000, 500);
          points.push({
            slug: dest.slug,
            name: dest.name,
            nameEn: dest.nameEn,
            x: svgCoords.x,
            y: svgCoords.y,
            partner,
            region: dest.region,
          });
        }
      });
    });

    return points;
  }, []);

  // Couleurs par région
  const regionColors: Record<Region, string> = {
    asia: '#E07A5F', // terracotta
    africa: '#81B29A', // sage
    europe: '#3D405B', // deep blue
    americas: '#F2CC8F', // sand
    'middle-east': '#D4A373', // warm
    oceania: '#577590', // blue-gray
  };

  const handlePointClick = (point: typeof mapPoints[0]) => {
    setSelectedPartner(point.partner);
  };

  const closePanel = () => {
    setSelectedPartner(null);
  };

  return (
    <div className="relative bg-deep-blue-900 rounded-2xl overflow-hidden">
      {/* Map Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-heading text-white flex items-center gap-2">
            <GlobeAltIcon className="w-5 h-5 text-terracotta-400" />
            {t('globalNetwork')}
          </h3>
          <div className="flex gap-2">
            {Object.entries(regions).slice(0, 5).map(([key]) => (
              <div
                key={key}
                className="flex items-center gap-1.5 text-xs text-white/60"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: regionColors[key as Region] }}
                />
                {tDestinations(`regions.${key}`)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        {/* SVG World Map */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-auto"
          style={{ backgroundColor: '#1a2744' }}
        >
          {/* World map background (simplified) */}
          <image
            href="/images/world-map-outline.svg"
            width="1000"
            height="500"
            opacity="0.15"
          />

          {/* Grid lines */}
          {[...Array(12)].map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 83.33}
              y1="0"
              x2={i * 83.33}
              y2="500"
              stroke="white"
              strokeOpacity="0.05"
            />
          ))}
          {[...Array(6)].map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * 83.33}
              x2="1000"
              y2={i * 83.33}
              stroke="white"
              strokeOpacity="0.05"
            />
          ))}

          {/* Destination points */}
          {mapPoints.map((point) => (
            <g
              key={`${point.partner.id}-${point.slug}`}
              className="cursor-pointer"
              onClick={() => handlePointClick(point)}
              onMouseEnter={() => setHoveredDestination(point.slug)}
              onMouseLeave={() => setHoveredDestination(null)}
            >
              {/* Outer pulse animation */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredDestination === point.slug ? 20 : 12}
                fill={regionColors[point.region]}
                opacity={hoveredDestination === point.slug ? 0.3 : 0.2}
                className="transition-all duration-300"
              >
                <animate
                  attributeName="r"
                  from="12"
                  to="20"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.3"
                  to="0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Main point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredDestination === point.slug ? 8 : 6}
                fill={regionColors[point.region]}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-200"
              />

              {/* Premium indicator */}
              {point.partner.tier === 'premium' && (
                <circle
                  cx={point.x + 8}
                  cy={point.y - 8}
                  r="4"
                  fill="#E07A5F"
                  stroke="white"
                  strokeWidth="1"
                />
              )}

              {/* Hover label */}
              {hoveredDestination === point.slug && (
                <g>
                  <rect
                    x={point.x + 12}
                    y={point.y - 20}
                    width={Math.max((isFr ? point.name : point.nameEn).length * 7 + 16, 80)}
                    height="24"
                    rx="4"
                    fill="white"
                    opacity="0.95"
                  />
                  <text
                    x={point.x + 20}
                    y={point.y - 4}
                    fontSize="12"
                    fontWeight="500"
                    fill="#1a2744"
                  >
                    {isFr ? point.name : point.nameEn}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>

        {/* Interaction hint */}
        <div className="absolute bottom-4 left-4 text-white/40 text-xs flex items-center gap-1">
          <MapPinIcon className="w-4 h-4" />
          {t('clickPointToSeePartner')}
        </div>

        {/* Stats */}
        <div className="absolute bottom-4 right-4 flex gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="text-xl font-bold text-white">{partners.length}</div>
            <div className="text-xs text-white/60">
              {tCommon('partners')}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="text-xl font-bold text-white">{mapPoints.length}</div>
            <div className="text-xs text-white/60">
              {tCommon('destinations')}
            </div>
          </div>
        </div>
      </div>

      {/* Partner Info Panel (slide in from right) */}
      <div
        className={cn(
          'absolute top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-out z-10',
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
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-sand-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
            {partner.logo ? (
              <Image
                src={partner.logo}
                alt={partner.name}
                width={36}
                height={36}
                className="object-contain"
              />
            ) : (
              <span className="text-xl font-heading text-deep-blue-600">
                {partner.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-heading text-gray-900">{partner.name}</h4>
            <div className="flex items-center gap-1.5">
              {partner.tier === 'premium' && (
                <span className="inline-flex items-center gap-0.5 text-terracotta-600 text-xs">
                  <StarIcon className="w-3 h-3" />
                  Premium
                </span>
              )}
              {partner.hasGir && (
                <span className="bg-sage-100 text-sage-700 text-xs px-1.5 py-0.5 rounded">
                  GIR
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Description */}
        <p className="text-gray-600 text-sm mb-6">
          {isFr ? partner.description.fr : partner.description.en}
        </p>

        {/* Destinations */}
        <div className="mb-6">
          <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('destinations')}
          </h5>
          <div className="flex flex-wrap gap-2">
            {partner.destinations.map((dest) => (
              <Link
                key={dest.slug}
                href={`/${locale}/destinations/${dest.slug}`}
                className="inline-flex items-center gap-1 bg-sand-50 text-gray-700 text-sm px-3 py-1.5 rounded-full hover:bg-sand-100 transition-colors"
              >
                <MapPinIcon className="w-3.5 h-3.5 text-terracotta-500" />
                {isFr ? dest.name : dest.nameEn}
              </Link>
            ))}
          </div>
        </div>

        {/* Specialties */}
        <div className="mb-6">
          <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('specialties')}
          </h5>
          <div className="flex flex-wrap gap-2">
            {partner.specialties.map((spec, idx) => (
              <span
                key={idx}
                className="bg-white border border-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-full"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Stats (if profile exists) */}
        {profile && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="bg-deep-blue-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-deep-blue-600">
                {profile.stats.yearsExperience}
              </div>
              <div className="text-xs text-gray-500">
                {t('yearsExp')}
              </div>
            </div>
            <div className="bg-terracotta-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-terracotta-600">
                {profile.teamSize}
              </div>
              <div className="text-xs text-gray-500">
                {t('teamMembers')}
              </div>
            </div>
            {profile.stats.satisfactionRate && (
              <div className="bg-sage-50 rounded-lg p-3 text-center col-span-2">
                <div className="text-xl font-bold text-sage-600">
                  {profile.stats.satisfactionRate}%
                </div>
                <div className="text-xs text-gray-500">
                  {t('satisfactionRate')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-5 border-t border-gray-100 bg-sand-50">
        <Link
          href={`/${locale}/partners/${partner.slug}`}
          className="flex items-center justify-center gap-2 w-full bg-terracotta-500 hover:bg-terracotta-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {t('viewFullProfile')}
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
