'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Link, usePathname, useRouter, type Locale } from '@/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// Type for navigation links (without dynamic segments)
type NavHref = '/' | '/partners' | '/destinations' | '/magazine' | '/about' | '/contact' | '/gir';

// Types for navigation
interface NavItem {
  label: string;
  href?: NavHref;
  children?: {
    label: string;
    description?: string;
    href: NavHref;
    icon?: React.ReactNode;
  }[];
}

interface HeaderProps {
  locale: string;
  translations: {
    destinations: string;
    services: string;
    partners: string;
    magazine: string;
    about: string;
    contact: string;
    proSpace: string;
    tailorMade: string;
    tailorMadeDesc: string;
    groups: string;
    groupsDesc: string;
    gir: string;
    girDesc: string;
  };
}

interface LanguageSwitcherProps {
  locale: string;
  languages: { code: string; label: string }[];
  isScrolled: boolean;
  isHomepage: boolean;
}

/**
 * Language Switcher component that handles locale switching properly
 * for both static and dynamic routes with localized pathnames
 */
function LanguageSwitcher({ locale, languages, isScrolled, isHomepage }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const handleLocaleChange = (newLocale: string) => {
    // router.replace handles dynamic params automatically
    router.replace(
      // @ts-expect-error - pathname from usePathname is the internal route pattern
      { pathname, params },
      { locale: newLocale as Locale }
    );
  };

  return (
    <div className="relative group">
      <button
        className={cn(
          'flex items-center gap-1 text-sm font-medium',
          isScrolled || !isHomepage ? 'text-gray-600' : 'text-white/80'
        )}
      >
        {languages.find((l) => l.code === locale)?.label}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        <div className="bg-white rounded-lg shadow-lg py-1 min-w-[60px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLocaleChange(lang.code)}
              className={cn(
                'block w-full text-left px-4 py-2 text-sm hover:bg-sand-50 transition-colors',
                lang.code === locale ? 'text-terracotta-500 font-medium' : 'text-gray-700'
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Language Switcher component
 */
function MobileLanguageSwitcher({ locale, languages }: { locale: string; languages: { code: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(
      // @ts-expect-error - pathname from usePathname is the internal route pattern
      { pathname, params },
      { locale: newLocale as Locale }
    );
  };

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-gray-100 mt-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLocaleChange(lang.code)}
          className={cn(
            'px-3 py-1 rounded-full text-sm',
            lang.code === locale
              ? 'bg-terracotta-500 text-white'
              : 'bg-gray-100 text-gray-700'
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}

export function Header({ locale, translations }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  // Check if we're on the homepage (with hero) for transparent header
  const isHomepage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Navigation items using localized pathnames
  const navigation: NavItem[] = [
    {
      label: translations.destinations,
      href: '/destinations',
    },
    {
      label: translations.services,
      children: [
        {
          label: translations.tailorMade,
          description: translations.tailorMadeDesc,
          href: '/contact',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ),
        },
        {
          label: translations.groups,
          description: translations.groupsDesc,
          href: '/contact',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          label: translations.gir,
          description: translations.girDesc,
          href: '/gir',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: translations.partners,
      href: '/partners',
    },
    {
      label: translations.magazine,
      href: '/magazine',
    },
    {
      label: translations.about,
      href: '/about',
    },
  ];

  const languages = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'de', label: 'DE' },
    { code: 'nl', label: 'NL' },
    { code: 'es', label: 'ES' },
    { code: 'it', label: 'IT' },
  ];

  const headerClasses = cn(
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
    isScrolled || !isHomepage || isMobileMenuOpen
      ? 'bg-white shadow-md py-3'
      : 'bg-transparent py-5'
  );

  const linkClasses = cn(
    'font-medium transition-colors',
    isScrolled || !isHomepage
      ? 'text-gray-700 hover:text-terracotta-500'
      : 'text-white hover:text-white/80'
  );

  const logoClasses = cn(
    'transition-all duration-300',
    isScrolled || !isHomepage ? 'brightness-0' : ''
  );

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo-dmc-alliance.svg"
              alt="DMC Alliance"
              width={168}
              height={60}
              className={cn('h-12 w-auto', logoClasses)}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {item.href ? (
                  <Link href={item.href} className={linkClasses}>
                    {item.label}
                  </Link>
                ) : (
                  <button
                    className={cn(linkClasses, 'flex items-center gap-1')}
                    onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                  >
                    {item.label}
                    <svg
                      className={cn(
                        'w-4 h-4 transition-transform',
                        activeDropdown === item.label && 'rotate-180'
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}

                {/* Dropdown Menu */}
                {item.children && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 pt-2 w-72 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-elevated p-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-sand-50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-terracotta-100 text-terracotta-600 rounded-lg flex items-center justify-center">
                            {child.icon}
                          </div>
                          <div>
                            <span className="block font-medium text-gray-900">{child.label}</span>
                            {child.description && (
                              <span className="text-sm text-gray-500">{child.description}</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side: Language + Pro Space + CTA */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Language Switcher */}
            <LanguageSwitcher
              locale={locale}
              languages={languages}
              isScrolled={isScrolled}
              isHomepage={isHomepage}
            />

            {/* Pro Space Link */}
            <NextLink
              href={`/${locale}/auth/login`}
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium transition-colors',
                isScrolled || !isHomepage
                  ? 'text-gray-600 hover:text-terracotta-500'
                  : 'text-white/80 hover:text-white'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {translations.proSpace}
            </NextLink>

            {/* Contact CTA */}
            <Link href="/contact">
              <Button
                variant={isScrolled || !isHomepage ? 'primary' : 'outline-white'}
                size="sm"
              >
                {translations.contact}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className={cn('w-6 h-6', isScrolled || !isHomepage ? 'text-gray-700' : 'text-white')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <div key={item.label}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="block py-3 px-4 text-gray-700 hover:bg-sand-50 rounded-lg font-medium"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <>
                      <button
                        className="flex items-center justify-between w-full py-3 px-4 text-gray-700 hover:bg-sand-50 rounded-lg font-medium"
                        onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                      >
                        {item.label}
                        <svg
                          className={cn(
                            'w-4 h-4 transition-transform',
                            activeDropdown === item.label && 'rotate-180'
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {activeDropdown === item.label && item.children && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block py-2 px-4 text-gray-600 hover:text-terracotta-500"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* Mobile Language Switcher */}
              <MobileLanguageSwitcher locale={locale} languages={languages} />

              {/* Mobile Pro Space + Contact CTAs */}
              <div className="px-4 pt-2 space-y-2">
                <NextLink href={`/${locale}/auth/login`}>
                  <Button variant="outline" fullWidth>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {translations.proSpace}
                  </Button>
                </NextLink>
                <Link href="/contact">
                  <Button variant="primary" fullWidth>
                    {translations.contact}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
