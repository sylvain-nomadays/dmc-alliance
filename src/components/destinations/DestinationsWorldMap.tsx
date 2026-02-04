'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { regions, type Region } from '@/data/partners';
import { getCoordinates } from '@/data/destination-coordinates';
import { cn } from '@/lib/utils';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import type { DestinationListItem } from '@/lib/supabase/destinations-list';

interface DestinationsWorldMapProps {
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

// Convert lat/lng to SVG coordinates (Equirectangular projection)
const latLngToSvg = (lat: number, lng: number, width: number = 1000, height: number = 500) => {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
};

// Region colors with gradient variants
const regionColors: Record<Region, { bg: string; marker: string; gradient: string }> = {
  asia: { bg: 'bg-terracotta-500', marker: '#E07A5F', gradient: 'from-terracotta-400 to-terracotta-600' },
  africa: { bg: 'bg-sage-500', marker: '#81B29A', gradient: 'from-sage-400 to-sage-600' },
  europe: { bg: 'bg-deep-blue-500', marker: '#3D405B', gradient: 'from-deep-blue-400 to-deep-blue-600' },
  americas: { bg: 'bg-amber-500', marker: '#F59E0B', gradient: 'from-amber-400 to-amber-600' },
  'middle-east': { bg: 'bg-orange-500', marker: '#EA580C', gradient: 'from-orange-400 to-orange-600' },
  oceania: { bg: 'bg-cyan-500', marker: '#06B6D4', gradient: 'from-cyan-400 to-cyan-600' },
};

export function DestinationsWorldMap({ locale, destinations, translations }: DestinationsWorldMapProps) {
  const [hoveredDestination, setHoveredDestination] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<Region | 'all'>('all');
  const isFr = locale === 'fr';

  // Create map points from destinations
  const mapPoints = useMemo(() => {
    const points: {
      slug: string;
      name: string;
      nameEn: string;
      x: number;
      y: number;
      region: Region;
      hasGir: boolean;
      partnerName?: string;
    }[] = [];

    destinations.forEach((dest) => {
      const coords = getCoordinates(dest.slug);
      if (coords) {
        const svgCoords = latLngToSvg(coords.lat, coords.lng, 1000, 500);
        points.push({
          slug: dest.slug,
          name: dest.name,
          nameEn: dest.nameEn,
          x: svgCoords.x,
          y: svgCoords.y,
          region: dest.region as Region,
          hasGir: dest.hasGir,
          partnerName: dest.partnerName,
        });
      }
    });

    return points;
  }, [destinations]);

  const filteredPoints = activeRegion === 'all'
    ? mapPoints
    : mapPoints.filter((p) => p.region === activeRegion);

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
      {/* Map Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
      <div className="relative bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-6">
        <div className="relative rounded-2xl overflow-hidden shadow-inner">
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-auto"
            style={{ minHeight: '400px' }}
          >
            {/* Definitions */}
            <defs>
              {/* Ocean gradient */}
              <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="30%" stopColor="#BAE6FD" />
                <stop offset="70%" stopColor="#7DD3FC" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>

              {/* Land gradient */}
              <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>

              {/* Shadow filter */}
              <filter id="landShadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#64748B" floodOpacity="0.15" />
              </filter>

              {/* Marker glow */}
              <filter id="markerGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Pattern for ocean texture */}
              <pattern id="oceanPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="#93C5FD" opacity="0.3" />
              </pattern>
            </defs>

            {/* Ocean background */}
            <rect width="1000" height="500" fill="url(#oceanGradient)" />
            <rect width="1000" height="500" fill="url(#oceanPattern)" />

            {/* World Map - Simplified continents */}
            <g fill="url(#landGradient)" stroke="#94A3B8" strokeWidth="0.8" filter="url(#landShadow)">
              {/* North America */}
              <path d="M50,120 Q80,80 120,70 Q180,50 230,55 Q280,60 300,80 Q310,100 300,130 Q285,160 260,180 Q230,200 200,210 Q180,215 165,230 Q150,250 140,270 L130,250 Q115,220 100,200 Q80,180 65,160 Q50,140 50,120 Z" />

              {/* Greenland */}
              <path d="M320,30 Q360,20 400,30 Q430,50 435,80 Q420,110 390,115 Q350,110 325,90 Q310,65 320,30 Z" />

              {/* Central America */}
              <path d="M140,270 Q160,265 175,280 Q185,300 180,315 Q170,330 155,330 Q140,325 135,310 Q130,290 140,270 Z" />

              {/* South America */}
              <path d="M175,320 Q205,310 235,330 Q260,360 270,400 Q275,450 260,480 Q235,500 200,495 Q165,480 150,450 Q140,410 145,370 Q150,340 175,320 Z" />

              {/* Europe */}
              <path d="M440,65 Q470,55 510,60 Q550,70 575,90 Q590,115 580,140 Q560,160 530,165 Q490,165 460,155 Q435,140 430,115 Q430,85 440,65 Z" />

              {/* UK & Ireland */}
              <path d="M415,75 Q430,70 440,80 Q445,95 435,108 Q420,115 410,105 Q405,90 415,75 Z" />

              {/* Scandinavia */}
              <path d="M500,25 Q530,15 565,25 Q590,45 595,75 Q585,100 560,105 Q530,100 510,80 Q495,55 500,25 Z" />

              {/* Africa */}
              <path d="M460,170 Q500,160 545,175 Q590,200 620,250 Q640,310 635,375 Q620,430 580,460 Q530,475 480,460 Q440,435 420,390 Q405,340 410,280 Q420,220 460,170 Z" />

              {/* Madagascar */}
              <path d="M620,380 Q635,370 645,385 Q650,420 640,450 Q625,465 615,455 Q605,430 615,400 Q620,380 620,380 Z" />

              {/* Middle East */}
              <path d="M580,145 Q620,135 660,150 Q690,175 685,210 Q665,245 630,255 Q590,255 565,235 Q550,205 560,175 Q570,155 580,145 Z" />

              {/* Russia */}
              <path d="M600,30 Q680,20 780,35 Q860,55 900,90 Q920,125 900,160 Q860,185 800,185 Q720,175 650,155 Q600,135 585,105 Q580,70 600,30 Z" />

              {/* Central Asia */}
              <path d="M610,120 Q660,110 710,130 Q750,155 755,190 Q740,225 700,240 Q650,245 610,225 Q580,195 585,160 Q595,135 610,120 Z" />

              {/* India */}
              <path d="M665,220 Q705,210 740,240 Q765,280 755,330 Q730,375 690,385 Q650,380 630,350 Q615,305 630,260 Q645,230 665,220 Z" />

              {/* China & East Asia */}
              <path d="M720,115 Q780,100 840,115 Q890,145 900,195 Q890,250 850,280 Q800,300 745,290 Q700,270 690,230 Q685,180 700,145 Q710,125 720,115 Z" />

              {/* Southeast Asia */}
              <path d="M730,290 Q770,280 800,305 Q820,345 810,390 Q785,425 750,430 Q715,420 700,385 Q695,340 710,310 Q720,295 730,290 Z" />

              {/* Japan */}
              <path d="M870,145 Q885,135 900,150 Q910,180 900,210 Q880,235 865,225 Q855,200 860,170 Q865,155 870,145 Z" />

              {/* Philippines */}
              <path d="M830,280 Q845,270 860,285 Q870,315 865,350 Q850,370 835,360 Q825,335 830,305 Q830,285 830,280 Z" />

              {/* Indonesia */}
              <path d="M755,400 Q810,390 865,410 Q910,440 915,475 Q890,500 840,495 Q785,490 745,470 Q720,445 730,420 Q740,405 755,400 Z" />

              {/* Australia */}
              <path d="M785,420 Q845,405 900,425 Q945,460 960,510 Q950,560 910,585 Q855,600 800,585 Q755,555 745,505 Q745,455 770,430 Q780,420 785,420 Z" />

              {/* New Zealand */}
              <path d="M965,530 Q980,520 990,540 Q988,570 975,585 Q960,590 955,575 Q955,550 965,530 Z" />

              {/* Papua New Guinea */}
              <path d="M895,380 Q925,370 950,390 Q965,420 955,450 Q930,465 900,455 Q880,435 885,410 Q890,390 895,380 Z" />
            </g>

            {/* Grid lines (subtle) */}
            <g stroke="#CBD5E1" strokeWidth="0.3" opacity="0.4">
              {[100, 200, 300, 400].map((y) => (
                <line key={`h-${y}`} x1="0" y1={y} x2="1000" y2={y} strokeDasharray="4,8" />
              ))}
              {[200, 400, 600, 800].map((x) => (
                <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="500" strokeDasharray="4,8" />
              ))}
            </g>

            {/* Equator */}
            <line x1="0" y1="250" x2="1000" y2="250" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="8,4" opacity="0.5" />

            {/* Destination Markers */}
            {filteredPoints.map((point, index) => {
              const isHovered = hoveredDestination === point.slug;
              const isActive = activeRegion === 'all' || activeRegion === point.region;
              const markerColor = regionColors[point.region]?.marker || '#E07A5F';

              return (
                <Link
                  key={`${point.slug}-${index}`}
                  href={`/${locale}/destinations/${point.slug}`}
                >
                  <g
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredDestination(point.slug)}
                    onMouseLeave={() => setHoveredDestination(null)}
                    style={{
                      opacity: isActive ? 1 : 0.3,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Pulse animation ring */}
                    {isHovered && (
                      <>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="25"
                          fill="none"
                          stroke={markerColor}
                          strokeWidth="2"
                        >
                          <animate
                            attributeName="r"
                            from="12"
                            to="35"
                            dur="1.5s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            from="0.8"
                            to="0"
                            dur="1.5s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="20"
                          fill="none"
                          stroke={markerColor}
                          strokeWidth="1.5"
                        >
                          <animate
                            attributeName="r"
                            from="12"
                            to="30"
                            dur="1.5s"
                            begin="0.3s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            from="0.6"
                            to="0"
                            dur="1.5s"
                            begin="0.3s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </>
                    )}

                    {/* Marker circle */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isHovered ? 14 : 10}
                      fill={markerColor}
                      stroke="white"
                      strokeWidth={isHovered ? 3 : 2}
                      filter={isHovered ? "url(#markerGlow)" : undefined}
                      style={{
                        transition: 'all 0.2s ease',
                      }}
                    />

                    {/* Inner dot */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isHovered ? 5 : 4}
                      fill="white"
                      style={{
                        transition: 'all 0.2s ease',
                      }}
                    />

                    {/* GIR badge */}
                    {point.hasGir && (
                      <g transform={`translate(${point.x + 8}, ${point.y - 12})`}>
                        <circle r="8" fill="#E07A5F" stroke="white" strokeWidth="1.5" />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fontSize="6"
                          fontWeight="bold"
                          fill="white"
                        >
                          GIR
                        </text>
                      </g>
                    )}

                    {/* Tooltip */}
                    {isHovered && (
                      <g>
                        {/* Tooltip background */}
                        <rect
                          x={point.x + 18}
                          y={point.y - 22}
                          width={Math.max((isFr ? point.name : point.nameEn).length * 9 + 30, 120)}
                          height="44"
                          rx="10"
                          fill="white"
                          filter="url(#landShadow)"
                        />
                        {/* Destination name */}
                        <text
                          x={point.x + 32}
                          y={point.y - 2}
                          fontSize="13"
                          fontWeight="600"
                          fill="#1F2937"
                        >
                          {isFr ? point.name : point.nameEn}
                        </text>
                        {/* Partner name */}
                        {point.partnerName && (
                          <text
                            x={point.x + 32}
                            y={point.y + 14}
                            fontSize="11"
                            fill="#6B7280"
                          >
                            {point.partnerName}
                          </text>
                        )}
                        {/* Arrow indicator */}
                        <polygon
                          points={`${point.x + 16},${point.y} ${point.x + 22},${point.y - 6} ${point.x + 22},${point.y + 6}`}
                          fill="white"
                        />
                      </g>
                    )}
                  </g>
                </Link>
              );
            })}
          </svg>
        </div>

        {/* Map Stats Overlay */}
        <div className="absolute bottom-8 left-8 flex gap-3">
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
        <div className="absolute bottom-8 right-8 text-gray-600 text-sm flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50">
          <div className="w-2 h-2 rounded-full bg-terracotta-500 animate-pulse" />
          {translations.clickToDiscover}
        </div>
      </div>
    </div>
  );
}
