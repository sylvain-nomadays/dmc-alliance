'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ServiceData {
  title: string;
  description: string;
  features: string[];
  image?: string;
}

interface ServicesSectionProps {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    tailorMade: ServiceData;
    groups: ServiceData;
    gir: ServiceData;
  };
}

const servicesConfig = [
  {
    key: 'tailorMade',
    href: '/contact?service=tailor-made',
    defaultImage: '/images/services/tailor-made.jpg',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'terracotta',
  },
  {
    key: 'groups',
    href: '/contact?service=groups',
    defaultImage: '/images/services/groups.jpg',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'deep-blue',
  },
  {
    key: 'gir',
    href: '/gir',
    defaultImage: '/images/services/gir.jpg',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'sage',
  },
];

const colorClasses = {
  terracotta: {
    bg: 'bg-terracotta-100',
    text: 'text-terracotta-600',
    hover: 'group-hover:bg-terracotta-500 group-hover:text-white',
  },
  'deep-blue': {
    bg: 'bg-deep-blue-100',
    text: 'text-deep-blue-600',
    hover: 'group-hover:bg-deep-blue-500 group-hover:text-white',
  },
  sage: {
    bg: 'bg-sage-100',
    text: 'text-sage-600',
    hover: 'group-hover:bg-sage-500 group-hover:text-white',
  },
};

export function ServicesSection({ locale, translations }: ServicesSectionProps) {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-heading text-gray-900 mb-4">
            {translations.title}
          </h2>
          <p className="text-lg text-gray-600">
            {translations.subtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {servicesConfig.map((service) => {
            const translationKey = service.key as keyof typeof translations;
            const serviceData = translations[translationKey] as ServiceData;
            const colors = colorClasses[service.color as keyof typeof colorClasses];
            const imageUrl = serviceData.image || service.defaultImage;

            return (
              <Link
                key={service.key}
                href={`/${locale}${service.href}`}
                className="group"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 h-full flex flex-col">
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={serviceData.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                    {/* Icon Badge */}
                    <div
                      className={cn(
                        'absolute top-4 left-4 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                        colors.bg,
                        colors.text,
                        colors.hover
                      )}
                    >
                      {service.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-heading text-gray-900 mb-3 group-hover:text-terracotta-600 transition-colors">
                      {serviceData.title}
                    </h3>
                    <p className="text-gray-600 mb-4 flex-1">
                      {serviceData.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2 mb-4">
                      {serviceData.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-sage-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="flex items-center text-deep-blue-600 font-medium group-hover:text-terracotta-500 transition-colors">
                      <span>{locale === 'fr' ? 'En savoir plus' : 'Learn more'}</span>
                      <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
