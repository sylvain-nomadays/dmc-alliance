'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import Link from 'next/link';
import { regions, type Region } from '@/data/partners';
import { getCoordinates } from '@/data/destination-coordinates';
import { cn } from '@/lib/utils';
import { GlobeAltIcon, MapPinIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import type { DestinationListItem } from '@/lib/supabase/destinations-list';

interface DestinationsMapboxProps {
  locale: string;
  destinations: DestinationListItem[];
  translations: {
    ourGlobalNetwork: string;
    globalNetworkDescription: string;
    clickToDiscover: string;
    all: string;
    regions: {
      asia: string;
      africa: string;
      europe: string;
      americas: string;
      'middle-east': string;
    };
  };
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

// Mapbox style
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';

export function DestinationsMapbox({ locale, destinations, translations }: DestinationsMapboxProps) {
  const mapRef = useRef<any>(null);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<Region | 'all'>('all');
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    name: string;
    nameEn: string;
    slug: string;
    region: Region;
    hasGir: boolean;
    partnerName?: string;
  } | null>(null);

  const isFr = locale === 'fr';

  // Create map points from destinations
  const mapPoints = useMemo(() => {
    const points: {
      slug: string;
      name: string;
      nameEn: string;
      lng: number;
      lat: number;
      region: Region;
      hasGir: boolean;
      partnerName?: string;
    }[] = [];

    destinations.forEach((dest) => {
      const coords = getCoordinates(dest.slug);
      if (coords) {
        points.push({
          slug: dest.slug,
          name: dest.name,
          nameEn: dest.nameEn,
          lng: coords.lng,
          lat: coords.lat,
          region: dest.region as Region,
          hasGir: dest.hasGir,
          partnerName: dest.partnerName,
        });
      }
    });

    return points;
  }, [destinations]);

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
      slug: point.slug,
      region: point.region,
      hasGir: point.hasGir,
      partnerName: point.partnerName,
    });
  }, []);

  // Handle sidebar click - fly to location
  const handleSidebarClick = useCallback((point: typeof mapPoints[0]) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [point.lng, point.lat],
        zoom: 5,
        duration: 1000,
      });
    }
    setPopupInfo({
      longitude: point.lng,
      latitude: point.lat,
      name: point.name,
      nameEn: point.nameEn,
      slug: point.slug,
      region: point.region,
      hasGir: point.hasGir,
      partnerName: point.partnerName,
    });
  }, []);

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

  const regionTabs: { key: Region | 'all'; label: string }[] = [
    { key: 'all', label: translations.all },
    { key: 'asia', label: translations.regions.asia },
    { key: 'africa', label: translations.regions.africa },
    { key: 'europe', label: translations.regions.europe },
    { key: 'americas', label: translations.regions.americas },
    { key: 'middle-east', label: translations.regions['middle-east'] },
  ];

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
                {translations.ourGlobalNetwork}
              </h3>

              {/* Region Pills */}
              <div className="flex flex-wrap gap-2">
                {regionTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveRegion(tab.key)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2',
                      activeRegion === tab.key
                        ? tab.key === 'all'
                          ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                          : `bg-gradient-to-r ${regionColors[tab.key as Region].gradient} text-white shadow-lg`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {tab.key !== 'all' && (
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          activeRegion === tab.key ? 'bg-white/80' : regionColors[tab.key as Region].bg
                        )}
                      />
                    )}
                    {tab.label}
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
                const isHovered = hoveredPoint === point.slug;
                const pointId = `${point.slug}-${index}`;

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
                      onMouseEnter={() => setHoveredPoint(point.slug)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Pulse animation */}
                      {isHovered && (
                        <div
                          className="absolute inset-0 rounded-full animate-ping"
                          style={{
                            backgroundColor: regionColors[point.region]?.marker || '#E07A5F',
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
                          backgroundColor: regionColors[point.region]?.marker || '#E07A5F',
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

                      {/* GIR badge */}
                      {point.hasGir && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-terracotta-500 rounded-full border border-white flex items-center justify-center">
                          <span className="text-[6px] text-white font-bold">GIR</span>
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
                  className="destination-popup"
                >
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-gray-900">
                        {isFr ? popupInfo.name : popupInfo.nameEn}
                      </h4>
                      {popupInfo.hasGir && (
                        <span className="bg-terracotta-100 text-terracotta-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                          GIR
                        </span>
                      )}
                    </div>
                    {popupInfo.partnerName && (
                      <p className="text-sm text-gray-600 mt-1">{popupInfo.partnerName}</p>
                    )}
                    <Link
                      href={`/${locale}/destinations/${popupInfo.slug}`}
                      className="mt-3 w-full text-sm bg-terracotta-500 hover:bg-terracotta-600 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      {isFr ? 'Découvrir' : 'Discover'}
                      <ArrowRightIcon className="w-3 h-3" />
                    </Link>
                  </div>
                </Popup>
              )}
            </Map>

            {/* Stats Overlay */}
            <div className="absolute bottom-6 left-6 flex gap-3 z-10">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl px-5 py-4 shadow-xl border border-white/50">
                <div className="text-3xl font-bold bg-gradient-to-r from-terracotta-500 to-terracotta-700 bg-clip-text text-transparent">
                  {destinations.length}
                </div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  {isFr ? 'Destinations' : 'Destinations'}
                </div>
              </div>
            </div>

            {/* Hint */}
            <div className="absolute bottom-6 right-6 text-gray-600 text-sm flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50 z-10">
              <div className="w-2 h-2 rounded-full bg-terracotta-500 animate-pulse" />
              {translations.clickToDiscover}
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
              const regionDestinations = destinationsByRegion[region];
              if (regionDestinations.length === 0) return null;

              return (
                <div key={region} className="mb-5">
                  <div className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl mb-2',
                    regionColors[region]?.light || 'bg-gray-50'
                  )}>
                    <span className={cn('w-3 h-3 rounded-full', regionColors[region]?.bg || 'bg-gray-500')} />
                    <span className={cn('text-sm font-semibold', regionColors[region]?.text || 'text-gray-600')}>
                      {translations.regions[region as keyof typeof translations.regions] || region}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto bg-white/60 px-2 py-0.5 rounded-full">
                      {regionDestinations.length}
                    </span>
                  </div>

                  <div className="space-y-1 pl-2">
                    {regionDestinations.map((dest) => (
                      <button
                        key={dest.slug}
                        onClick={() => handleSidebarClick(dest)}
                        onMouseEnter={() => setHoveredPoint(dest.slug)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className={cn(
                          'w-full flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl transition-all text-left group',
                          hoveredPoint === dest.slug
                            ? 'bg-white shadow-md text-gray-900 scale-[1.02]'
                            : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                        )}
                      >
                        <span className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          hoveredPoint === dest.slug ? (regionColors[dest.region]?.bg || 'bg-gray-500') : 'bg-gray-300'
                        )} />
                        <span className="flex-1 truncate">
                          {isFr ? dest.name : dest.nameEn}
                        </span>
                        {dest.hasGir && (
                          <span className="text-[10px] bg-terracotta-100 text-terracotta-600 px-1.5 py-0.5 rounded font-medium">
                            GIR
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
