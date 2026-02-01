'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    cta: string;
    ctaSecondary: string;
  };
}

// Images de fond qui défilent
const heroImages = [
  '/images/hero/mongolia-horses.jpg',
  '/images/hero/tanzania-safari.jpg',
  '/images/hero/thailand-temple.jpg',
  '/images/hero/kyrgyzstan-mountains.jpg',
  '/images/hero/madagascar-lemur.jpg',
];

export function HeroSection({ locale, translations }: HeroSectionProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen min-h-[600px] max-h-[900px] flex items-center">
      {/* Background Images with Crossfade */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={image}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000',
              index === currentImage ? 'opacity-100' : 'opacity-0'
            )}
          >
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div
          className={cn(
            'max-w-3xl transition-all duration-1000 delay-300',
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 bg-terracotta-500 rounded-full animate-pulse" />
            <span className="text-white/90 text-sm font-medium">
              {locale === 'fr' ? 'Réseau de 20+ agences locales' : 'Network of 20+ local agencies'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading text-white leading-tight mb-6">
            {translations.title.split('\n').map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/85 leading-relaxed mb-8 max-w-2xl">
            {translations.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={`/${locale}/destinations`}>
              <Button variant="primary" size="lg" rightIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              }>
                {translations.cta}
              </Button>
            </Link>
            <Link href={`/${locale}/services/gir`}>
              <Button variant="outline-white" size="lg">
                {translations.ctaSecondary}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/70 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Image Indicators */}
      <div className="absolute bottom-8 right-8 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImage(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              index === currentImage
                ? 'bg-white w-6'
                : 'bg-white/40 hover:bg-white/60'
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
