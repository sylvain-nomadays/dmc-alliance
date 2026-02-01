import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Automatically detect the user's locale
  localeDetection: true,

  // Don't add locale prefix for the default locale
  localePrefix: 'as-needed',
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except:
    // - api routes
    // - static files
    // - internal Next.js files
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
