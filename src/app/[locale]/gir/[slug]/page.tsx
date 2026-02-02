import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { partners } from '@/data/partners';
import { getCircuitBySlug, getAllCircuitSlugs, type CircuitDeparture, type CircuitDay } from '@/data/circuits';
import { getCircuitWithImage } from '@/lib/supabase/circuits';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  PhoneIcon,
  SunIcon,
  HomeIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const circuit = getCircuitBySlug(slug);

  if (!circuit) {
    return { title: 'Circuit not found' };
  }

  const title = locale === 'fr' ? circuit.title.fr : circuit.title.en;
  const description = locale === 'fr' ? circuit.summary.fr : circuit.summary.en;

  return {
    title: `${title} - GIR | The DMC Alliance`,
    description: description.slice(0, 160),
    openGraph: {
      title: `${title} - GIR | The DMC Alliance`,
      description: description.slice(0, 160),
      locale,
      type: 'website',
      images: [circuit.images.main],
    },
  };
}

// Generate static params
export function generateStaticParams() {
  const slugs = getAllCircuitSlugs();
  const params: { locale: string; slug: string }[] = [];

  locales.forEach((locale) => {
    slugs.forEach((slug) => {
      params.push({ locale, slug });
    });
  });

  return params;
}

export default async function CircuitPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Get circuit with Supabase image (falls back to static if not in Supabase)
  const circuit = await getCircuitWithImage(slug);

  if (!circuit) {
    notFound();
  }

  const partner = partners.find((p) => p.id === circuit.partnerId);
  const destination = partner?.destinations.find((d) => d.slug === circuit.destinationSlug);
  const isFr = locale === 'fr';

  // Get upcoming departures
  const today = new Date().toISOString().split('T')[0];
  const upcomingDepartures = circuit.departures
    .filter((d) => d.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, { fr: string; en: string }> = {
      easy: { fr: 'Facile', en: 'Easy' },
      moderate: { fr: 'Modéré', en: 'Moderate' },
      challenging: { fr: 'Sportif', en: 'Challenging' },
      expert: { fr: 'Expert', en: 'Expert' },
    };
    return isFr ? labels[difficulty]?.fr : labels[difficulty]?.en;
  };

  const getStatusInfo = (departure: CircuitDeparture) => {
    switch (departure.status) {
      case 'guaranteed':
        return {
          label: isFr ? 'Départ garanti' : 'Guaranteed departure',
          class: 'bg-green-100 text-green-700 border-green-200',
        };
      case 'few_spots':
        return {
          label: isFr ? `Plus que ${departure.availableSpots} places` : `Only ${departure.availableSpots} spots left`,
          class: 'bg-orange-100 text-orange-700 border-orange-200',
        };
      case 'full':
        return {
          label: isFr ? 'Complet' : 'Full',
          class: 'bg-red-100 text-red-700 border-red-200',
        };
      default:
        return {
          label: `${departure.availableSpots}/${departure.totalSpots} ${isFr ? 'places' : 'spots'}`,
          class: 'bg-blue-100 text-blue-700 border-blue-200',
        };
    }
  };

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px]">
        <Image
          src={circuit.images.main}
          alt={isFr ? circuit.title.fr : circuit.title.en}
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
                {isFr ? 'Accueil' : 'Home'}
              </Link>
              <span>/</span>
              <Link href={`/${locale}/gir`} className="hover:text-white transition-colors">
                GIR
              </Link>
              <span>/</span>
              <span className="text-white">{isFr ? circuit.title.fr : circuit.title.en}</span>
            </nav>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 pb-10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-terracotta-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  GIR
                </span>
                <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                  {isFr ? destination?.name : destination?.nameEn}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading text-white mb-3">
                {isFr ? circuit.title.fr : circuit.title.en}
              </h1>
              <p className="text-lg text-white/90">
                {isFr ? circuit.subtitle.fr : circuit.subtitle.en}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="bg-deep-blue-900 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-terracotta-400" />
              <span>
                {circuit.duration.days} {isFr ? 'jours' : 'days'} / {circuit.duration.nights}{' '}
                {isFr ? 'nuits' : 'nights'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-terracotta-400" />
              <span>
                {circuit.practicalInfo.groupSize.min}-{circuit.practicalInfo.groupSize.max}{' '}
                {isFr ? 'personnes' : 'people'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  circuit.difficulty === 'easy' && 'bg-green-500/20 text-green-300',
                  circuit.difficulty === 'moderate' && 'bg-yellow-500/20 text-yellow-300',
                  circuit.difficulty === 'challenging' && 'bg-orange-500/20 text-orange-300',
                  circuit.difficulty === 'expert' && 'bg-red-500/20 text-red-300'
                )}
              >
                {getDifficultyLabel(circuit.difficulty)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-terracotta-400" />
              <span>{partner?.name}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Summary */}
              <section>
                <h2 className="text-2xl font-heading text-gray-900 mb-4">
                  {isFr ? 'Présentation du voyage' : 'Trip Overview'}
                </h2>
                <div className="prose prose-lg max-w-none text-gray-600">
                  {(isFr ? circuit.summary.fr : circuit.summary.en).split('\n\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>

              {/* Highlights */}
              <section className="bg-terracotta-50 rounded-2xl p-8">
                <h2 className="text-2xl font-heading text-gray-900 mb-6">
                  {isFr ? 'Points forts du voyage' : 'Trip Highlights'}
                </h2>
                <ul className="grid md:grid-cols-2 gap-4">
                  {(isFr ? circuit.highlights.fr : circuit.highlights.en).map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircleIcon className="w-6 h-6 text-terracotta-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Itinerary */}
              {circuit.itinerary.length > 0 && (
                <section>
                  <h2 className="text-2xl font-heading text-gray-900 mb-6">
                    {isFr ? 'Programme jour par jour' : 'Day-by-Day Itinerary'}
                  </h2>
                  <div className="space-y-4">
                    {circuit.itinerary.map((day, idx) => (
                      <DayCard key={idx} day={day} locale={locale} />
                    ))}
                  </div>
                </section>
              )}

              {/* Included / Not Included */}
              <section className="grid md:grid-cols-2 gap-8">
                {/* Included */}
                <div className="bg-green-50 rounded-2xl p-6">
                  <h3 className="text-lg font-heading text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    {isFr ? 'Le prix comprend' : 'Price includes'}
                  </h3>
                  <ul className="space-y-2">
                    {(isFr ? circuit.included.fr : circuit.included.en).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Not Included */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-heading text-gray-900 mb-4 flex items-center gap-2">
                    <XCircleIcon className="w-6 h-6 text-gray-400" />
                    {isFr ? 'Le prix ne comprend pas' : 'Price excludes'}
                  </h3>
                  <ul className="space-y-2">
                    {(isFr ? circuit.notIncluded.fr : circuit.notIncluded.en).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <XCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Practical Info */}
              <section className="bg-sand-50 rounded-2xl p-8">
                <h2 className="text-2xl font-heading text-gray-900 mb-6">
                  {isFr ? 'Informations pratiques' : 'Practical Information'}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {isFr ? 'Condition physique' : 'Physical condition'}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {isFr
                        ? circuit.practicalInfo.physicalCondition.fr
                        : circuit.practicalInfo.physicalCondition.en}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {isFr ? 'Meilleure période' : 'Best season'}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {isFr ? circuit.practicalInfo.bestSeason.fr : circuit.practicalInfo.bestSeason.en}
                    </p>
                  </div>
                  {circuit.practicalInfo.altitude && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {isFr ? 'Altitude maximale' : 'Maximum altitude'}
                      </h4>
                      <p className="text-gray-600 text-sm">{circuit.practicalInfo.altitude}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {isFr ? 'Taille du groupe' : 'Group size'}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {circuit.practicalInfo.groupSize.min} {isFr ? 'à' : 'to'}{' '}
                      {circuit.practicalInfo.groupSize.max} {isFr ? 'participants' : 'participants'}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column - Sticky Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Departures Card */}
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
                  <div className="bg-terracotta-500 p-4 text-center">
                    <h3 className="text-lg font-heading text-white">
                      {isFr ? 'Dates et tarifs' : 'Dates and prices'}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {upcomingDepartures.length} {isFr ? 'départs disponibles' : 'departures available'}
                    </p>
                  </div>

                  <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                    {upcomingDepartures.map((departure) => {
                      const status = getStatusInfo(departure);
                      return (
                        <div
                          key={departure.id}
                          className={cn(
                            'p-4 rounded-xl border',
                            departure.status === 'full'
                              ? 'bg-gray-50 opacity-60'
                              : 'bg-white border-gray-200 hover:border-terracotta-300 transition-colors'
                          )}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {formatShortDate(departure.startDate)} - {formatShortDate(departure.endDate)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(departure.startDate).getFullYear()}
                              </div>
                            </div>
                            <span className={cn('text-xs font-medium px-2 py-1 rounded-full border', status.class)}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-2xl font-bold text-gray-900">
                                {departure.publicPrice.toLocaleString()}€
                              </span>
                              <span className="text-sm text-gray-500 ml-1">
                                /{isFr ? 'pers.' : 'pp'}
                              </span>
                            </div>
                            {departure.status !== 'full' && (
                              <Link
                                href={`/${locale}/contact?circuit=${circuit.slug}&departure=${departure.id}`}
                              >
                                <Button variant="primary" size="sm">
                                  {isFr ? 'Réserver' : 'Book'}
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {upcomingDepartures.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {isFr ? 'Aucun départ programmé actuellement' : 'No departures currently scheduled'}
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-sand-50">
                    <p className="text-xs text-gray-500 text-center mb-3">
                      {isFr ? circuit.commissionInfo?.fr : circuit.commissionInfo?.en}
                    </p>
                    <Link href={`/${locale}/contact?circuit=${circuit.slug}&type=commission`} className="block">
                      <Button variant="outline" fullWidth>
                        {isFr ? 'Demander le taux de commission' : 'Request commission rate'}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Partner Card */}
                {partner && (
                  <div className="bg-deep-blue-900 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                        <span className="text-xl font-heading text-deep-blue-600">
                          {partner.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-heading text-lg">{partner.name}</h4>
                        <p className="text-white/60 text-sm">
                          {isFr ? 'Votre expert local' : 'Your local expert'}
                        </p>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm mb-4">
                      {(isFr ? partner.description.fr : partner.description.en).slice(0, 150)}...
                    </p>
                    <div className="flex gap-3">
                      <Link
                        href={`/${locale}/contact?partner=${partner.slug}&circuit=${circuit.slug}`}
                        className="flex-1"
                      >
                        <Button variant="secondary" fullWidth size="sm">
                          <EnvelopeIcon className="w-4 h-4 mr-1" />
                          {isFr ? 'Contacter' : 'Contact'}
                        </Button>
                      </Link>
                      <Link href={`/${locale}/partners/${partner.slug}`} className="flex-1">
                        <Button variant="outline" fullWidth size="sm" className="border-white/30 text-white hover:bg-white/10">
                          {isFr ? 'Profil' : 'Profile'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Need Help */}
                <div className="bg-terracotta-50 rounded-2xl p-6">
                  <h4 className="font-heading text-lg text-gray-900 mb-2">
                    {isFr ? 'Besoin d\'aide ?' : 'Need help?'}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    {isFr
                      ? 'Notre équipe est à votre disposition pour répondre à vos questions.'
                      : 'Our team is available to answer your questions.'}
                  </p>
                  <Link href={`/${locale}/contact?circuit=${circuit.slug}`}>
                    <Button variant="primary" fullWidth>
                      <PhoneIcon className="w-4 h-4 mr-2" />
                      {isFr ? 'Nous appeler' : 'Call us'}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other GIR */}
      <section className="bg-sand-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-heading text-gray-900 mb-8 text-center">
            {isFr ? 'Autres circuits GIR' : 'Other GIR circuits'}
          </h2>
          <div className="text-center">
            <Link href={`/${locale}/gir`}>
              <Button variant="outline" size="lg">
                {isFr ? 'Voir tous les GIR' : 'View all GIR circuits'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Day Card Component
function DayCard({ day, locale }: { day: CircuitDay; locale: string }) {
  const isFr = locale === 'fr';

  return (
    <details className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
      <summary className="flex items-center gap-4 p-4 cursor-pointer hover:bg-sand-50 transition-colors list-none">
        <div className="w-12 h-12 bg-terracotta-100 text-terracotta-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
          J{day.day}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">
            {isFr ? day.title.fr : day.title.en}
          </h4>
          {day.transferInfo && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <TruckIcon className="w-4 h-4" />
              {isFr ? day.transferInfo.fr : day.transferInfo.en}
            </p>
          )}
        </div>
        <ChevronDownIcon className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
      </summary>

      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        <p className="text-gray-600 mb-4">
          {isFr ? day.description.fr : day.description.en}
        </p>

        {/* Highlights */}
        {day.highlights && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {(isFr ? day.highlights.fr : day.highlights.en).map((h, i) => (
                <span key={i} className="bg-terracotta-50 text-terracotta-700 text-xs px-2 py-1 rounded-full">
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Meals & Accommodation */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {day.meals && (
            <div className="flex items-center gap-2">
              <SunIcon className="w-4 h-4 text-gray-400" />
              <span>
                {[
                  day.meals.breakfast && (isFr ? 'PDJ' : 'B'),
                  day.meals.lunch && (isFr ? 'Déj' : 'L'),
                  day.meals.dinner && (isFr ? 'Dîn' : 'D'),
                ]
                  .filter(Boolean)
                  .join(' • ') || (isFr ? 'Repas libres' : 'Free meals')}
              </span>
            </div>
          )}
          {day.accommodation && (
            <div className="flex items-center gap-2">
              <HomeIcon className="w-4 h-4 text-gray-400" />
              <span>{isFr ? day.accommodation.fr : day.accommodation.en}</span>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
