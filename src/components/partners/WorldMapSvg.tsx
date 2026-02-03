'use client';

/**
 * World Map SVG Component
 * A clean, professional world map based on simplified Natural Earth data
 * Designed for displaying destination markers
 */

interface WorldMapSvgProps {
  className?: string;
  fillColor?: string;
  strokeColor?: string;
}

export function WorldMapSvg({
  className = '',
  fillColor = '#E8F4F8',
  strokeColor = '#CBD5E1'
}: WorldMapSvgProps) {
  return (
    <g className={className} fill={fillColor} stroke={strokeColor} strokeWidth="0.5">
      {/* North America */}
      <path d="M55,95 L65,75 L85,65 L115,60 L145,55 L170,52 L190,55 L210,60 L225,70 L235,85 L238,105 L235,125 L225,145 L210,160 L185,170 L155,175 L140,180 L130,190 L125,200 L120,190 L110,175 L95,165 L80,155 L65,140 L55,120 L55,95 Z" />

      {/* Greenland */}
      <path d="M280,30 L310,25 L340,30 L360,45 L365,65 L355,85 L335,95 L305,90 L280,75 L270,55 L280,30 Z" />

      {/* Central America & Caribbean */}
      <path d="M125,200 L135,195 L150,200 L160,215 L165,230 L160,240 L150,245 L140,240 L130,230 L125,215 L125,200 Z" />

      {/* South America */}
      <path d="M155,250 L180,245 L205,255 L225,275 L235,305 L240,340 L235,375 L220,400 L195,415 L165,410 L145,390 L135,355 L140,315 L145,280 L155,250 Z" />

      {/* Europe */}
      <path d="M385,55 L410,48 L440,50 L465,55 L490,65 L505,80 L510,100 L505,115 L490,125 L465,130 L440,128 L415,120 L395,108 L385,90 L385,55 Z" />

      {/* UK & Ireland */}
      <path d="M365,65 L375,60 L385,65 L388,78 L382,90 L372,92 L365,85 L365,65 Z" />

      {/* Scandinavia */}
      <path d="M430,25 L450,20 L475,25 L495,40 L505,60 L500,75 L485,85 L460,80 L445,65 L435,45 L430,25 Z" />

      {/* Africa */}
      <path d="M400,135 L430,130 L465,135 L500,150 L530,180 L550,220 L560,270 L555,320 L540,365 L510,400 L465,415 L420,405 L390,375 L375,330 L370,280 L380,230 L390,185 L400,155 L400,135 Z" />

      {/* Madagascar */}
      <path d="M565,330 L575,320 L585,330 L590,355 L585,380 L575,390 L565,380 L560,355 L565,330 Z" />

      {/* Middle East */}
      <path d="M510,115 L545,110 L575,120 L590,140 L585,165 L565,185 L535,190 L510,180 L500,155 L510,130 L510,115 Z" />

      {/* Russia / Northern Asia */}
      <path d="M510,25 L560,20 L620,25 L680,35 L740,50 L780,70 L795,95 L790,120 L770,140 L730,150 L680,145 L620,135 L570,120 L530,105 L515,80 L510,55 L510,25 Z" />

      {/* Central Asia */}
      <path d="M530,105 L570,100 L610,110 L640,125 L650,145 L640,165 L610,175 L575,180 L545,170 L525,150 L520,125 L530,105 Z" />

      {/* India */}
      <path d="M590,185 L620,180 L645,195 L660,220 L655,260 L635,295 L600,305 L570,290 L560,255 L570,220 L590,185 Z" />

      {/* China / East Asia */}
      <path d="M650,95 L700,85 L745,95 L780,115 L790,145 L780,180 L750,205 L710,215 L670,210 L640,190 L635,160 L645,125 L650,95 Z" />

      {/* Southeast Asia Peninsula */}
      <path d="M660,215 L685,210 L710,220 L725,245 L720,275 L700,300 L675,305 L655,290 L650,260 L655,235 L660,215 Z" />

      {/* Japan */}
      <path d="M775,120 L785,115 L795,125 L798,145 L790,165 L778,175 L770,165 L770,145 L775,120 Z" />

      {/* Philippines */}
      <path d="M735,245 L745,240 L755,250 L755,275 L748,295 L738,290 L735,270 L735,245 Z" />

      {/* Indonesia */}
      <path d="M680,310 L720,305 L760,315 L790,330 L795,350 L780,365 L740,360 L700,350 L670,340 L665,325 L680,310 Z" />

      {/* Australia */}
      <path d="M700,365 L745,355 L790,365 L820,385 L830,420 L820,455 L790,475 L745,480 L700,470 L670,445 L665,410 L675,380 L700,365 Z" />

      {/* New Zealand */}
      <path d="M840,455 L850,450 L860,460 L858,480 L848,490 L838,485 L840,465 L840,455 Z" />
      <path d="M850,490 L858,488 L862,500 L855,510 L848,505 L850,490 Z" />

      {/* Papua New Guinea */}
      <path d="M800,320 L825,315 L845,325 L850,345 L840,360 L815,365 L795,355 L795,335 L800,320 Z" />
    </g>
  );
}
