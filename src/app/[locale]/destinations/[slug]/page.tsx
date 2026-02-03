import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { partners } from '@/data/partners';
import { getDestinationBySlug, getAllDestinationSlugs, destinationsData } from '@/data/destinations';
import { getDestinationWithImage, getAllDestinationsWithImages } from '@/lib/supabase/destinations';
import { getPartnerWithImage } from '@/lib/supabase/partners';
import { RelatedArticles } from '@/components/destinations/RelatedArticles';

// Icons
import {
  CalendarIcon,
  ClockIcon,
  GlobeAltIcon,
  CurrencyEuroIcon,
  PlayCircleIcon,
  MapPinIcon,
  CheckCircleIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const destination = getDestinationBySlug(slug);

  if (!destination) {
    return { title: 'Destination not found' };
  }

  const description = locale === 'fr' ? destination.metaDescription.fr : destination.metaDescription.en;
  const name = locale === 'fr' ? destination.name : destination.nameEn;

  return {
    title: `${name} - The DMC Alliance`,
    description,
    openGraph: {
      title: `${name} - The DMC Alliance`,
      description,
      locale,
      type: 'website',
      images: [destination.images.hero],
    },
  };
}

// Generate static params for all destinations and locales
export function generateStaticParams() {
  const slugs = getAllDestinationSlugs();
  const params: { locale: string; slug: string }[] = [];

  locales.forEach((locale) => {
    slugs.forEach((slug) => {
      params.push({ locale, slug });
    });
  });

  return params;
}

export default async function DestinationPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Get destination with Supabase image (falls back to static if not in Supabase)
  const destination = await getDestinationWithImage(slug);

  if (!destination) {
    notFound();
  }

  // Get static partner data first for basic info
  const staticPartner = partners.find((p) => p.id === destination.partnerId);
  // Get partner with Supabase logo (falls back to static if not in Supabase)
  const partner = staticPartner ? await getPartnerWithImage(staticPartner.slug) : null;
  const t = await getTranslations({ locale, namespace: 'destination' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const isFr = locale === 'fr';
  const destinationName: string = isFr ? destination.name : (destination.nameEn ?? destination.name);

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px]">
        <Image
          src={destination.images.hero}
          alt={destinationName}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        {/* Breadcrumb */}
        <div className="absolute top-8 left-0 right-0 z-10">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-2 text-white/70 text-sm">
              <Link href={`/${locale}`} className="hover:text-white transition-colors">
                {tCommon('home') || 'Accueil'}
              </Link>
              <span>/</span>
              <Link href={`/${locale}/destinations`} className="hover:text-white transition-colors">
                {tCommon('destinations')}
              </Link>
              <span>/</span>
              <span className="text-white">{destinationName}</span>
            </nav>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <span className="inline-block bg-terracotta-500 text-white text-sm font-medium px-3 py-1 rounded-full mb-4">
                {partner?.name}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading text-white mb-4">
                {destinationName}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-light">
                {isFr ? destination.tagline.fr : destination.tagline.en}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Facts Bar */}
      <section className="bg-deep-blue-900 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-terracotta-400" />
              <span className="text-white/70">{isFr ? 'Meilleure saison' : 'Best season'}:</span>
              <span className="font-medium">{destination.highlights.bestSeason}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-terracotta-400" />
              <span className="text-white/70">{isFr ? 'Vol' : 'Flight'}:</span>
              <span className="font-medium">{destination.highlights.flightTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="w-5 h-5 text-terracotta-400" />
              <span className="text-white/70">{isFr ? 'Langue' : 'Language'}:</span>
              <span className="font-medium">{destination.highlights.language}</span>
            </div>
            <div className="flex items-center gap-2">
              <CurrencyEuroIcon className="w-5 h-5 text-terracotta-400" />
              <span className="text-white/70">{isFr ? 'Monnaie' : 'Currency'}:</span>
              <span className="font-medium">{destination.highlights.currency}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Description Section */}
              <section>
                <h2 className="text-2xl md:text-3xl font-heading text-gray-900 mb-6">
                  {isFr ? 'Présentation de la destination' : 'Destination Overview'}
                </h2>
                <div className="prose prose-lg max-w-none text-gray-600">
                  {(isFr ? destination.description.fr : destination.description.en)
                    .split('\n\n')
                    .map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                </div>
              </section>

              {/* Selling Points */}
              <section className="bg-sand-50 rounded-2xl p-8">
                <h2 className="text-2xl font-heading text-gray-900 mb-6">
                  {isFr ? 'Points forts pour vos clients' : 'Key selling points'}
                </h2>
                <ul className="space-y-4">
                  {(isFr ? destination.sellingPoints.fr : destination.sellingPoints.en).map(
                    (point, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircleIcon className="w-6 h-6 text-sage-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{point}</span>
                      </li>
                    )
                  )}
                </ul>
              </section>

              {/* Ideal For */}
              <section>
                <h2 className="text-2xl font-heading text-gray-900 mb-6">
                  {isFr ? 'Clientèle idéale' : 'Ideal clientele'}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {(isFr ? destination.idealFor.fr : destination.idealFor.en).map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 bg-deep-blue-50 text-deep-blue-700 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      <UserGroupIcon className="w-4 h-4" />
                      {item}
                    </span>
                  ))}
                </div>
              </section>

              {/* Video Webinar Section */}
              {destination.webinarVideo && (
                <section className="bg-gray-900 rounded-2xl overflow-hidden">
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <PlayCircleIcon className="w-8 h-8 text-terracotta-500" />
                      <div>
                        <h2 className="text-xl md:text-2xl font-heading text-white">
                          {isFr ? destination.webinarVideo.title.fr : destination.webinarVideo.title.en}
                        </h2>
                        <p className="text-white/60 text-sm">
                          {isFr ? 'Durée' : 'Duration'}: {destination.webinarVideo.duration}
                          {destination.webinarVideo.recordedDate && (
                            <span> • {isFr ? 'Enregistré en' : 'Recorded'} {destination.webinarVideo.recordedDate}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="aspect-video">
                    <iframe
                      src={destination.webinarVideo.url}
                      title={isFr ? destination.webinarVideo.title.fr : destination.webinarVideo.title.en}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </section>
              )}

              {/* GIR Section if available */}
              {destination.hasGir && (
                <section className="border-2 border-terracotta-200 rounded-2xl p-8 bg-terracotta-50/50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <span className="inline-block bg-terracotta-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                        GIR
                      </span>
                      <h2 className="text-2xl font-heading text-gray-900 mb-2">
                        {isFr ? 'Circuits GIR disponibles' : 'GIR circuits available'}
                      </h2>
                      <p className="text-gray-600">
                        {isFr
                          ? 'Intégrez vos clients à nos départs garantis. Dates fixes, commission sur demande.'
                          : 'Integrate your clients into our guaranteed departures. Fixed dates, commission on request.'}
                      </p>
                    </div>
                    <Link href={`/${locale}/gir?destination=${slug}`}>
                      <Button variant="primary" size="lg">
                        {isFr ? 'Voir les GIR' : 'View GIR circuits'}
                        <ArrowRightIcon className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Partner Card (Sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {/* Partner Card */}
                {partner && (
                  <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
                    {/* Partner Header */}
                    <div className="bg-deep-blue-900 p-6 text-center">
                      <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 overflow-hidden">
                        {partner.logo ? (
                          <div
                            className="w-full h-full bg-contain bg-center bg-no-repeat"
                            style={{ backgroundImage: `url(${partner.logo})` }}
                            aria-label={partner.name}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl font-heading text-deep-blue-600">
                              {partner.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-heading text-white mb-1">{partner.name}</h3>
                      <p className="text-white/70 text-sm">
                        {isFr ? 'Votre expert local' : 'Your local expert'}
                      </p>
                      {partner.tier === 'premium' && (
                        <span className="inline-block mt-3 bg-terracotta-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {isFr ? 'Partenaire Premium' : 'Premium Partner'}
                        </span>
                      )}
                    </div>

                    {/* Partner Content */}
                    <div className="p-6">
                      <p className="text-gray-600 text-sm mb-6">
                        {isFr ? partner.description.fr : partner.description.en}
                      </p>

                      {/* Specialties */}
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          {isFr ? 'Spécialités' : 'Specialties'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {partner.specialties.slice(0, 4).map((specialty, idx) => (
                            <span
                              key={idx}
                              className="bg-sage-50 text-sage-700 text-xs px-3 py-1 rounded-full"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Experience */}
                      <div className="bg-sand-50 rounded-xl p-4 mb-6">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-heading text-terracotta-600">15+</div>
                            <div className="text-xs text-gray-500">
                              {isFr ? "Années d'expérience" : 'Years of experience'}
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-heading text-terracotta-600">
                              {partner.destinations.length}
                            </div>
                            <div className="text-xs text-gray-500">
                              {partner.destinations.length > 1
                                ? isFr
                                  ? 'Destinations'
                                  : 'Destinations'
                                : isFr
                                ? 'Destination'
                                : 'Destination'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CTAs */}
                      <div className="space-y-3">
                        <Link href={`/${locale}/contact?partner=${partner.slug}&destination=${slug}`} className="block">
                          <Button variant="primary" fullWidth>
                            <EnvelopeIcon className="w-5 h-5 mr-2" />
                            {isFr ? "Contacter l'agence" : 'Contact agency'}
                          </Button>
                        </Link>
                        <Link href={`/${locale}/partners/${partner.slug}`} className="block">
                          <Button variant="outline" fullWidth>
                            {isFr ? 'Voir le profil complet' : 'View full profile'}
                          </Button>
                        </Link>
                        {partner.website && (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center text-sm text-gray-500 hover:text-terracotta-600 transition-colors"
                          >
                            {isFr ? 'Visiter le site web' : 'Visit website'} →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Contact */}
                <div className="mt-6 bg-terracotta-500 rounded-2xl p-6 text-white">
                  <h3 className="font-heading text-lg mb-3">
                    {isFr ? 'Besoin d\'un devis rapide ?' : 'Need a quick quote?'}
                  </h3>
                  <p className="text-white/80 text-sm mb-4">
                    {isFr
                      ? 'Notre équipe vous répond sous 48h avec une proposition personnalisée.'
                      : 'Our team responds within 48h with a personalized proposal.'}
                  </p>
                  <Link href={`/${locale}/contact?type=quote&destination=${slug}`}>
                    <Button variant="secondary" fullWidth>
                      {isFr ? 'Demander un devis' : 'Request a quote'}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Articles from Magazine */}
      <RelatedArticles
        locale={locale}
        destinationSlug={slug}
        destinationName={destinationName}
      />

      {/* Other Destinations in Same Region */}
      <OtherDestinationsSection
        locale={locale}
        currentSlug={slug}
        currentRegion={destination.region}
        isFr={isFr}
      />

      {/* CTA Section */}
      <section className="bg-deep-blue-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading text-white mb-4">
            {isFr ? 'Prêt à programmer cette destination ?' : 'Ready to program this destination?'}
          </h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            {isFr
              ? 'Contactez-nous pour recevoir nos tarifs professionnels et discuter de vos projets.'
              : 'Contact us to receive our professional rates and discuss your projects.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/contact?destination=${slug}`}>
              <Button variant="primary" size="lg">
                {isFr ? 'Nous contacter' : 'Contact us'}
              </Button>
            </Link>
            <Link href={`/${locale}/destinations`}>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-deep-blue-900">
                {isFr ? 'Voir toutes les destinations' : 'View all destinations'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Server component for other destinations with Supabase images
async function OtherDestinationsSection({
  locale,
  currentSlug,
  currentRegion,
  isFr,
}: {
  locale: string;
  currentSlug: string;
  currentRegion: string;
  isFr: boolean;
}) {
  // Get all destinations with Supabase images
  const allDestinations = await getAllDestinationsWithImages();

  const otherDestinations = allDestinations
    .filter((d) => d.region === currentRegion && d.slug !== currentSlug)
    .slice(0, 4);

  if (otherDestinations.length === 0) return null;

  return (
    <section className="bg-sand-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-heading text-gray-900 mb-8 text-center">
          {isFr ? 'Autres destinations dans la région' : 'Other destinations in the region'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {otherDestinations.map((dest) => (
            <Link
              key={dest.slug}
              href={`/${locale}/destinations/${dest.slug}`}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden"
            >
              <Image
                src={dest.images.hero}
                alt={isFr ? dest.name : dest.nameEn}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-heading text-lg">
                  {isFr ? dest.name : dest.nameEn}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
