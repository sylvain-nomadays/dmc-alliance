import { Metadata } from 'next';
import { Inter, DM_Serif_Display, Montserrat } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { locales, type Locale } from '@/i18n';
import { getSiteSettings, getLogoUrl, getFooterLogoUrl, getContactEmail, getContactPhone, getContactAddress, getSocialLinks } from '@/lib/supabase/site-settings';

import '@/app/globals.css';

// Fonts
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-serif',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

// Metadata
export const metadata: Metadata = {
  title: {
    default: 'The DMC Alliance - Local Experts in B2B Travel',
    template: '%s | The DMC Alliance',
  },
  description:
    'Collective of local receptive agencies. Tailor-made, groups and shared departure tours for tour operators and travel agencies in Europe.',
  keywords: ['DMC', 'travel', 'B2B', 'tour operator', 'receptive agency', 'local expert'],
  authors: [{ name: 'The DMC Alliance' }],
  creator: 'The DMC Alliance',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    alternateLocale: ['en_US', 'de_DE', 'nl_NL', 'es_ES', 'it_IT'],
    siteName: 'The DMC Alliance',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Generate static params for all locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Layout props type
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for client provider
  const messages = await getMessages();

  // Get site settings for logos, contact info, and social links
  const siteSettings = await getSiteSettings();
  const logoUrl = getLogoUrl(siteSettings);
  const logoDarkUrl = siteSettings.site_logo_dark_url || logoUrl;
  const footerLogoUrl = getFooterLogoUrl(siteSettings);

  // Contact info and social links
  const contactInfo = {
    email: getContactEmail(siteSettings),
    phone: getContactPhone(siteSettings),
    address: getContactAddress(siteSettings, locale),
  };
  const socialLinks = getSocialLinks(siteSettings);

  return (
    <div
      lang={locale}
      className={`${inter.variable} ${dmSerif.variable} ${montserrat.variable} font-body antialiased bg-white text-gray-900`}
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        {/* Header */}
        <Header
          locale={locale}
          logoUrl={logoUrl}
          logoDarkUrl={logoDarkUrl}
          translations={{
            destinations: (messages.nav as Record<string, string>)?.destinations || 'Destinations',
            services: (messages.nav as Record<string, string>)?.services || 'Services',
            partners: (messages.nav as Record<string, string>)?.partners || 'Partners',
            magazine: (messages.nav as Record<string, string>)?.magazine || 'Magazine',
            about: (messages.nav as Record<string, string>)?.about || 'About',
            contact: (messages.common as Record<string, string>)?.contactUs || 'Contact',
            proSpace: (messages.common as Record<string, string>)?.proSpace || 'Pro Space',
            tailorMade: (messages.nav as Record<string, string>)?.tailorMade || 'Tailor-made',
            tailorMadeDesc: (messages.nav as Record<string, string>)?.tailorMadeDesc || '',
            groups: (messages.nav as Record<string, string>)?.groups || 'Groups',
            groupsDesc: (messages.nav as Record<string, string>)?.groupsDesc || '',
            gir: (messages.nav as Record<string, string>)?.gir || 'GIR',
            girDesc: (messages.nav as Record<string, string>)?.girDesc || '',
          }}
        />

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <Footer
          locale={locale}
          footerLogoUrl={footerLogoUrl}
          contactInfo={contactInfo}
          socialLinks={socialLinks}
          translations={{
            description: (messages.footer as Record<string, string>)?.description || '',
            quickLinks: (messages.footer as Record<string, string>)?.quickLinks || 'Quick Links',
            destinations: (messages.common as Record<string, string>)?.destinations || 'Destinations',
            services: (messages.common as Record<string, string>)?.services || 'Services',
            partners: (messages.common as Record<string, string>)?.partners || 'Partners',
            magazine: (messages.common as Record<string, string>)?.magazine || 'Magazine',
            about: (messages.common as Record<string, string>)?.about || 'About',
            contact: (messages.common as Record<string, string>)?.contact || 'Contact',
            legal: (messages.footer as Record<string, string>)?.legal || 'Legal',
            privacy: (messages.footer as Record<string, string>)?.privacy || 'Privacy',
            terms: (messages.footer as Record<string, string>)?.terms || 'Terms',
            copyright: (messages.footer as Record<string, string>)?.copyright || '© {year} The DMC Alliance',
            socialTitle: (messages.footer as Record<string, string>)?.socialTitle || 'Follow us',
            newsletterTitle: ((messages.home as Record<string, Record<string, string>>)?.newsletter)?.title || 'Newsletter',
            newsletterSubtitle: ((messages.home as Record<string, Record<string, string>>)?.newsletter)?.subtitle || '',
            newsletterPlaceholder: ((messages.home as Record<string, Record<string, string>>)?.newsletter)?.placeholder || 'Email',
            newsletterCta: ((messages.home as Record<string, Record<string, string>>)?.newsletter)?.cta || 'Subscribe',
          }}
        />
      </NextIntlClientProvider>
    </div>
  );
}
