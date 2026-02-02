import { getRequestConfig } from 'next-intl/server';
import { routing, locales, defaultLocale, type Locale } from './navigation';

// Re-export for backward compatibility
export { locales, defaultLocale, localeNames, type Locale } from './navigation';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the request
  let locale = await requestLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
