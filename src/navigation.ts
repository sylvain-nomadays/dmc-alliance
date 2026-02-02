import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const locales = ['fr', 'en', 'de', 'nl', 'es', 'it'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  nl: 'Nederlands',
  es: 'Español',
  it: 'Italiano',
};

// Define localized pathnames
export const pathnames = {
  '/': '/',
  '/partners': {
    fr: '/partenaires',
    en: '/partners',
    de: '/partner',
    nl: '/partners',
    es: '/socios',
    it: '/partner',
  },
  '/partners/[slug]': {
    fr: '/partenaires/[slug]',
    en: '/partners/[slug]',
    de: '/partner/[slug]',
    nl: '/partners/[slug]',
    es: '/socios/[slug]',
    it: '/partner/[slug]',
  },
  '/destinations': {
    fr: '/destinations',
    en: '/destinations',
    de: '/reiseziele',
    nl: '/bestemmingen',
    es: '/destinos',
    it: '/destinazioni',
  },
  '/destinations/[slug]': {
    fr: '/destinations/[slug]',
    en: '/destinations/[slug]',
    de: '/reiseziele/[slug]',
    nl: '/bestemmingen/[slug]',
    es: '/destinos/[slug]',
    it: '/destinazioni/[slug]',
  },
  '/magazine': {
    fr: '/magazine',
    en: '/magazine',
    de: '/magazin',
    nl: '/magazine',
    es: '/revista',
    it: '/rivista',
  },
  '/magazine/[slug]': {
    fr: '/magazine/[slug]',
    en: '/magazine/[slug]',
    de: '/magazin/[slug]',
    nl: '/magazine/[slug]',
    es: '/revista/[slug]',
    it: '/rivista/[slug]',
  },
  '/about': {
    fr: '/a-propos',
    en: '/about',
    de: '/ueber-uns',
    nl: '/over-ons',
    es: '/nosotros',
    it: '/chi-siamo',
  },
  '/contact': {
    fr: '/contact',
    en: '/contact',
    de: '/kontakt',
    nl: '/contact',
    es: '/contacto',
    it: '/contatti',
  },
  '/gir': {
    fr: '/gir',
    en: '/gir',
    de: '/gir',
    nl: '/gir',
    es: '/gir',
    it: '/gir',
  },
  '/gir/[slug]': {
    fr: '/gir/[slug]',
    en: '/gir/[slug]',
    de: '/gir/[slug]',
    nl: '/gir/[slug]',
    es: '/gir/[slug]',
    it: '/gir/[slug]',
  },
} as const;

export const routing = defineRouting({
  locales,
  defaultLocale,
  pathnames,
  localePrefix: 'always',
});

// Create navigation utilities
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
