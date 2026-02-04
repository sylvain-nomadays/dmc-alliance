'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface CtaSectionProps {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    button: string;
  };
  backgroundImage?: string;
}

export function CtaSection({ locale, translations, backgroundImage }: CtaSectionProps) {
  const bgImage = backgroundImage || '/images/cta/collaboration.jpg';

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={bgImage}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-deep-blue-900/95 via-deep-blue-900/90 to-deep-blue-900/80" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute -right-20 -top-20 w-96 h-96 text-terracotta-500/10"
          viewBox="0 0 200 200"
          fill="currentColor"
        >
          <circle cx="100" cy="100" r="100" />
        </svg>
        <svg
          className="absolute -left-10 -bottom-10 w-64 h-64 text-sage-500/10"
          viewBox="0 0 200 200"
          fill="currentColor"
        >
          <circle cx="100" cy="100" r="100" />
        </svg>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-terracotta-500/20 rounded-2xl mb-8">
            <svg
              className="w-8 h-8 text-terracotta-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading text-white mb-6">
            {translations.title}
          </h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            {translations.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={`/${locale}/contact`}>
              <Button
                variant="primary"
                size="xl"
                rightIcon={
                  <svg
                    className="w-5 h-5"
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
                }
              >
                {translations.button}
              </Button>
            </Link>

            <a
              href="mailto:contact@dmc-alliance.org"
              className="text-white/70 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              contact@dmc-alliance.org
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-10 border-t border-white/10">
            <p className="text-white/50 text-sm mb-4">
              {locale === 'fr' ? 'Ils nous font confiance' : 'They trust us'}
            </p>
            <div className="flex items-center justify-center gap-8 opacity-50">
              {/* Placeholder for partner/client logos */}
              <div className="h-8 w-24 bg-white/20 rounded" />
              <div className="h-8 w-20 bg-white/20 rounded" />
              <div className="h-8 w-28 bg-white/20 rounded" />
              <div className="h-8 w-24 bg-white/20 rounded hidden sm:block" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
