'use client';

import { forwardRef, HTMLAttributes } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ============================================
// Base Card Component
// ============================================

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-2xl overflow-hidden shadow-card',
          hover && 'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// ============================================
// Destination Card
// ============================================

interface DestinationCardProps {
  name: string;
  slug: string;
  image: string;
  region: string;
  partnerLogo?: string;
  locale?: string;
}

const DestinationCard = ({
  name,
  slug,
  image,
  region,
  partnerLogo,
  locale = 'fr',
}: DestinationCardProps) => {
  return (
    <Link href={`/${locale}/destinations/${slug}`} className="block group">
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
        {/* Image */}
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-card-gradient" />

        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <span className="text-terracotta-300 text-sm font-accent font-medium uppercase tracking-wider mb-1">
            {region}
          </span>
          <h3 className="text-white text-2xl font-heading">{name}</h3>
        </div>

        {/* Partner Logo */}
        {partnerLogo && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2">
            <Image
              src={partnerLogo}
              alt="Partner"
              width={60}
              height={30}
              className="h-6 w-auto"
            />
          </div>
        )}
      </div>
    </Link>
  );
};

// ============================================
// GIR Circuit Card
// ============================================

interface GirCardProps {
  title: string;
  slug: string;
  image: string;
  destination: string;
  departureDate: string;
  duration: number;
  price: number;
  level: 'easy' | 'moderate' | 'challenging' | 'expert';
  placesRemaining: number;
  locale?: string;
}

const GirCard = ({
  title,
  slug,
  image,
  destination,
  departureDate,
  duration,
  price,
  level,
  placesRemaining,
  locale = 'fr',
}: GirCardProps) => {
  const levelColors = {
    easy: 'bg-sage-100 text-sage-700',
    moderate: 'bg-terracotta-100 text-terracotta-700',
    challenging: 'bg-deep-blue-100 text-deep-blue-700',
    expert: 'bg-gray-800 text-white',
  };

  const levelLabels = {
    easy: locale === 'fr' ? 'Facile' : 'Easy',
    moderate: locale === 'fr' ? 'Modéré' : 'Moderate',
    challenging: locale === 'fr' ? 'Sportif' : 'Challenging',
    expert: 'Expert',
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card className="overflow-hidden">
      <Link href={`/${locale}/services/gir/${slug}`} className="block group">
        {/* Image */}
        <div className="relative aspect-[16/9]">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Date Badge */}
          <div className="absolute top-4 left-4 bg-terracotta-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
            {formatDate(departureDate)}
          </div>

          {/* Places Badge */}
          {placesRemaining <= 5 && placesRemaining > 0 && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
              {placesRemaining} {locale === 'fr' ? 'places' : 'seats'}
            </div>
          )}
          {placesRemaining === 0 && (
            <div className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1.5 rounded-full text-sm font-medium">
              {locale === 'fr' ? 'Complet' : 'Sold out'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <span className="text-terracotta-500 text-sm font-accent font-medium uppercase tracking-wider">
            {destination}
          </span>
          <h3 className="text-gray-900 text-lg font-heading mt-1 mb-3 line-clamp-2 group-hover:text-terracotta-600 transition-colors">
            {title}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {duration} {locale === 'fr' ? 'jours' : 'days'}
            </span>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', levelColors[level])}>
              {levelLabels[level]}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-end justify-between pt-3 border-t border-gray-100">
            <div>
              <span className="text-gray-500 text-sm">
                {locale === 'fr' ? 'À partir de' : 'From'}
              </span>
              <p className="text-2xl font-heading text-gray-900">
                {price.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} €
              </p>
            </div>
            <span className="text-deep-blue-600 font-medium text-sm group-hover:text-terracotta-500 transition-colors">
              {locale === 'fr' ? 'Voir le circuit →' : 'View tour →'}
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
};

// ============================================
// Partner Card
// ============================================

interface PartnerCardProps {
  name: string;
  slug: string;
  logo?: string;
  destinations: string[];
  specialties: string[];
  isPremium?: boolean;
  hasGir?: boolean;
  locale?: string;
}

const PartnerCard = ({
  name,
  slug,
  logo,
  destinations,
  specialties,
  isPremium = false,
  hasGir = false,
  locale = 'fr',
}: PartnerCardProps) => {
  return (
    <Card className="p-6">
      <Link href={`/${locale}/partners/${slug}`} className="block group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          {logo ? (
            <Image
              src={logo}
              alt={name}
              width={120}
              height={60}
              className="h-12 w-auto object-contain"
            />
          ) : (
            <div className="h-12 w-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 font-heading text-lg">
              {name.charAt(0)}
            </div>
          )}
          {isPremium && (
            <span className="bg-terracotta-100 text-terracotta-700 text-xs font-medium px-2 py-1 rounded-full">
              Premium
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-lg font-heading text-gray-900 mb-2 group-hover:text-terracotta-600 transition-colors">
          {name}
        </h3>

        {/* Destinations */}
        <p className="text-sm text-gray-600 mb-3">
          {destinations.join(' • ')}
        </p>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {specialties.slice(0, 3).map((specialty) => (
            <span
              key={specialty}
              className="bg-sand-100 text-sand-700 text-xs px-2 py-1 rounded-full"
            >
              {specialty}
            </span>
          ))}
          {specialties.length > 3 && (
            <span className="text-gray-400 text-xs py-1">
              +{specialties.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {hasGir && (
            <span className="text-sage-600 text-xs font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {locale === 'fr' ? 'GIR disponibles' : 'GIR available'}
            </span>
          )}
          <span className="text-deep-blue-600 font-medium text-sm group-hover:text-terracotta-500 transition-colors ml-auto">
            {locale === 'fr' ? 'Voir le profil →' : 'View profile →'}
          </span>
        </div>
      </Link>
    </Card>
  );
};

// ============================================
// Article Card (Magazine)
// ============================================

interface ArticleCardProps {
  title: string;
  slug: string;
  image: string;
  excerpt: string;
  category: string;
  date: string;
  locale?: string;
}

const ArticleCard = ({
  title,
  slug,
  image,
  excerpt,
  category,
  date,
  locale = 'fr',
}: ArticleCardProps) => {
  return (
    <Card className="overflow-hidden">
      <Link href={`/${locale}/magazine/${slug}`} className="block group">
        <div className="relative aspect-[16/10]">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-terracotta-500 text-xs font-accent font-medium uppercase tracking-wider">
              {category}
            </span>
            <span className="text-gray-400 text-xs">{date}</span>
          </div>
          <h3 className="text-gray-900 text-lg font-heading mb-2 line-clamp-2 group-hover:text-terracotta-600 transition-colors">
            {title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">{excerpt}</p>
        </div>
      </Link>
    </Card>
  );
};

export { Card, DestinationCard, GirCard, PartnerCard, ArticleCard };
