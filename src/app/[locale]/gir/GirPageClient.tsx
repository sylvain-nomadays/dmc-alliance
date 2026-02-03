'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { DbCircuit } from '@/lib/supabase/circuits';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface GirPageClientProps {
  circuits: DbCircuit[];
  locale: string;
}

// Departure interface for DB circuits (matches Supabase schema)
interface DbDeparture {
  id: string;
  start_date: string;
  end_date: string | null;
  total_seats: number | null;
  booked_seats: number | null;
  status: string | null;
  price: number | null;
}

function GirContent({ circuits, locale }: GirPageClientProps) {
  const searchParams = useSearchParams();
  const initialDestination = searchParams.get('destination') || '';

  const [selectedDestination, setSelectedDestination] = useState(initialDestination);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const isFr = locale === 'fr';

  // Get unique destinations from GIR circuits
  const destinations = useMemo(() => {
    const destMap = new Map<string, { slug: string; name: string; nameEn: string }>();
    circuits.forEach(c => {
      if (c.destination && !destMap.has(c.destination.slug)) {
        destMap.set(c.destination.slug, {
          slug: c.destination.slug,
          name: c.destination.name,
          nameEn: c.destination.name_en || c.destination.name,
        });
      }
    });
    return Array.from(destMap.values());
  }, [circuits]);

  // Filter circuits
  const filteredCircuits = useMemo(() => {
    let filtered = circuits;

    if (selectedDestination) {
      filtered = filtered.filter(c => c.destination?.slug === selectedDestination);
    }

    if (selectedMonth) {
      filtered = filtered.filter(c =>
        c.departures?.some(d => d.start_date?.startsWith(selectedMonth))
      );
    }

    return filtered;
  }, [circuits, selectedDestination, selectedMonth]);

  // Get upcoming departures count
  const upcomingDepartures = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return circuits.reduce((acc, circuit) => {
      const count = circuit.departures?.filter(d =>
        d.start_date >= today && d.status !== 'full'
      ).length || 0;
      return acc + count;
    }, 0);
  }, [circuits]);

  // Generate month options for next 12 months
  const monthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  }, [isFr]);

  const clearFilters = () => {
    setSelectedDestination('');
    setSelectedMonth('');
  };

  const hasActiveFilters = selectedDestination || selectedMonth;

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-20 bg-terracotta-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("/images/patterns/topography.svg")', backgroundSize: '400px' }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block bg-white/20 text-white text-sm font-medium px-4 py-1 rounded-full mb-4">
              {upcomingDepartures} {isFr ? 'départs disponibles' : 'departures available'}
            </span>
            <h1 className="text-4xl md:text-5xl font-heading text-white mb-4">
              {isFr ? 'Circuits GIR Co-remplissage' : 'GIR Co-filling Circuits'}
            </h1>
            <p className="text-xl text-white/90">
              {isFr
                ? 'Intégrez vos clients à nos départs garantis. Dates fixes, tarifs publics, commission sur demande.'
                : 'Integrate your clients into our guaranteed departures. Fixed dates, public rates, commission on request.'}
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-heading text-gray-900 mb-8 text-center">
            {isFr ? 'Comment ça marche ?' : 'How does it work?'}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                title: isFr ? 'Choisissez un circuit' : 'Choose a circuit',
                desc: isFr ? 'Parcourez nos GIR par destination ou date de départ.' : 'Browse our GIRs by destination or departure date.'
              },
              {
                step: 2,
                title: isFr ? 'Vérifiez les disponibilités' : 'Check availability',
                desc: isFr ? 'Consultez les places restantes en temps réel.' : 'Check remaining spots in real time.'
              },
              {
                step: 3,
                title: isFr ? 'Demandez votre commission' : 'Request your commission',
                desc: isFr ? 'Contactez-nous pour connaître vos conditions.' : 'Contact us to learn your conditions.'
              },
              {
                step: 4,
                title: isFr ? 'Inscrivez vos clients' : 'Register your clients',
                desc: isFr ? 'Confirmez les places et envoyez les dossiers.' : 'Confirm spots and send files.'
              }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-terracotta-100 text-terracotta-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-sand-50 border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-4">
              {/* Destination */}
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-500"
              >
                <option value="">{isFr ? 'Toutes les destinations' : 'All destinations'}</option>
                {destinations.map(dest => (
                  <option key={dest.slug} value={dest.slug}>
                    {isFr ? dest.name : dest.nameEn}
                  </option>
                ))}
              </select>

              {/* Month */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-500"
              >
                <option value="">{isFr ? 'Tous les mois' : 'All months'}</option>
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                  {isFr ? 'Effacer' : 'Clear'}
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200"
            >
              <FunnelIcon className="w-5 h-5" />
              {isFr ? 'Filtres' : 'Filters'}
              {hasActiveFilters && (
                <span className="bg-terracotta-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {(selectedDestination ? 1 : 0) + (selectedMonth ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Results count */}
            <div className="text-gray-600">
              <span className="font-medium text-gray-900">{filteredCircuits.length}</span>{' '}
              {isFr
                ? filteredCircuits.length === 1 ? 'circuit trouvé' : 'circuits trouvés'
                : filteredCircuits.length === 1 ? 'circuit found' : 'circuits found'}
            </div>
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-3">
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white"
              >
                <option value="">{isFr ? 'Toutes les destinations' : 'All destinations'}</option>
                {destinations.map(dest => (
                  <option key={dest.slug} value={dest.slug}>
                    {isFr ? dest.name : dest.nameEn}
                  </option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white"
              >
                <option value="">{isFr ? 'Tous les mois' : 'All months'}</option>
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Circuits List */}
      <section className="py-12 bg-sand-50">
        <div className="container mx-auto px-4">
          {filteredCircuits.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl text-gray-700 mb-2">
                {isFr ? 'Aucun circuit trouvé' : 'No circuits found'}
              </h3>
              <p className="text-gray-500 mb-4">
                {isFr ? 'Essayez de modifier vos filtres' : 'Try changing your filters'}
              </p>
              <Button variant="outline" onClick={clearFilters}>
                {isFr ? 'Réinitialiser les filtres' : 'Reset filters'}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredCircuits.map((circuit) => (
                <CircuitCard key={circuit.id} circuit={circuit} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-deep-blue-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-heading text-white mb-4">
            {isFr ? 'Vous ne trouvez pas ce que vous cherchez ?' : "Can't find what you're looking for?"}
          </h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            {isFr
              ? 'Contactez-nous pour discuter de vos besoins. Nous pouvons créer des départs sur-mesure pour vos groupes.'
              : 'Contact us to discuss your needs. We can create custom departures for your groups.'}
          </p>
          <Link href={`/${locale}/contact?subject=gir`}>
            <Button variant="primary" size="lg">
              {isFr ? 'Nous contacter' : 'Contact us'}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function CircuitCard({ circuit, locale }: { circuit: DbCircuit; locale: string }) {
  const isFr = locale === 'fr';

  // Convert difficulty level to string
  const getDifficultyString = (level: number | null) => {
    switch (level) {
      case 1: return 'easy';
      case 2: return 'moderate';
      case 3: return 'challenging';
      case 4:
      case 5: return 'expert';
      default: return 'moderate';
    }
  };

  const difficulty = getDifficultyString(circuit.difficulty_level);

  // Get upcoming departures
  const today = new Date().toISOString().split('T')[0];
  const upcomingDepartures = (circuit.departures || [])
    .filter((d: DbDeparture) => d.start_date >= today)
    .sort((a: DbDeparture, b: DbDeparture) => a.start_date.localeCompare(b.start_date))
    .slice(0, 3);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (departure: DbDeparture) => {
    const totalSeats = departure.total_seats ?? 0;
    const bookedSeats = departure.booked_seats ?? 0;
    const availableSpots = totalSeats - bookedSeats;
    const status = departure.status || 'available';

    switch (status) {
      case 'guaranteed':
        return (
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {isFr ? 'Garanti' : 'Guaranteed'}
          </span>
        );
      case 'few_spots':
        return (
          <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {isFr ? `${availableSpots} places` : `${availableSpots} spots`}
          </span>
        );
      case 'full':
        return (
          <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {isFr ? 'Complet' : 'Full'}
          </span>
        );
      default:
        return (
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {availableSpots} {isFr ? 'places' : 'spots'}
          </span>
        );
    }
  };

  // Get highlights
  const highlights = isFr
    ? (circuit.highlights_fr || [])
    : (circuit.highlights_en || circuit.highlights_fr || []);

  // Calculate nights
  const nights = circuit.duration_days > 0 ? circuit.duration_days - 1 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="md:flex">
        {/* Image */}
        <div className="md:w-1/3 relative">
          <div className="aspect-[4/3] md:aspect-auto md:absolute md:inset-0">
            <Image
              src={circuit.image_url || '/images/placeholder-circuit.jpg'}
              alt={circuit.title}
              fill
              className="object-cover"
            />
          </div>
          {/* GIR Badge */}
          <div className="absolute top-4 left-4 bg-terracotta-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            GIR
          </div>
        </div>

        {/* Content */}
        <div className="md:w-2/3 p-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-sm text-terracotta-600 font-medium">
                {isFr ? circuit.destination?.name : (circuit.destination?.name_en || circuit.destination?.name)} • {circuit.partner?.name}
              </span>
              <h3 className="text-xl md:text-2xl font-heading text-gray-900 mt-1">
                {circuit.title}
              </h3>
              {circuit.subtitle && (
                <p className="text-gray-600 mt-1">
                  {circuit.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              {circuit.duration_days} {isFr ? 'jours' : 'days'} / {nights} {isFr ? 'nuits' : 'nights'}
            </div>
            <div className="flex items-center gap-1">
              <UserGroupIcon className="w-4 h-4 text-gray-400" />
              {circuit.group_size_min || 2}-{circuit.group_size_max || 16} {isFr ? 'personnes' : 'people'}
            </div>
            <div className="flex items-center gap-1">
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                difficulty === 'easy' && 'bg-green-100 text-green-700',
                difficulty === 'moderate' && 'bg-yellow-100 text-yellow-700',
                difficulty === 'challenging' && 'bg-orange-100 text-orange-700',
                difficulty === 'expert' && 'bg-red-100 text-red-700'
              )}>
                {difficulty === 'easy' && (isFr ? 'Facile' : 'Easy')}
                {difficulty === 'moderate' && (isFr ? 'Modéré' : 'Moderate')}
                {difficulty === 'challenging' && (isFr ? 'Sportif' : 'Challenging')}
                {difficulty === 'expert' && 'Expert'}
              </span>
            </div>
          </div>

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {highlights.slice(0, 3).map((highlight, idx) => (
                  <span key={idx} className="bg-sand-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                    {highlight}
                  </span>
                ))}
                {highlights.length > 3 && (
                  <span className="text-gray-500 text-xs px-2 py-1">
                    +{highlights.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Departures */}
          {upcomingDepartures.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                {isFr ? 'Prochains départs' : 'Upcoming departures'}
              </h4>
              <div className="space-y-2">
                {upcomingDepartures.map((departure: DbDeparture) => (
                  <div
                    key={departure.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      departure.status === 'full' ? 'bg-gray-50 opacity-60' : 'bg-sand-50'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {formatDate(departure.start_date)}
                        </span>
                      </div>
                      {getStatusBadge(departure)}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {(departure.price || circuit.price_from || 0).toLocaleString()}€
                        </div>
                        <div className="text-xs text-gray-500">
                          {isFr ? 'prix public' : 'public price'}
                        </div>
                      </div>
                      {departure.status !== 'full' && (
                        <Link href={`/${locale}/gir/${circuit.slug}?departure=${departure.id}`}>
                          <Button variant="outline" size="sm">
                            {isFr ? 'Réserver' : 'Book'}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price if no departures */}
          {upcomingDepartures.length === 0 && circuit.price_from && circuit.price_from > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <div className="text-right">
                <span className="text-sm text-gray-500">{isFr ? 'À partir de' : 'From'} </span>
                <span className="text-xl font-semibold text-gray-900">
                  {circuit.price_from.toLocaleString()}€
                </span>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <Link
              href={`/${locale}/contact?circuit=${circuit.slug}&type=commission`}
              className="text-sm text-terracotta-600 hover:text-terracotta-700 font-medium"
            >
              {isFr ? 'Demander le taux de commission' : 'Request commission rate'}
            </Link>
            <Link href={`/${locale}/gir/${circuit.slug}`}>
              <Button variant="primary">
                {isFr ? 'Voir le programme' : 'View program'}
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function GirPageSkeleton() {
  return (
    <div className="pt-16 animate-pulse">
      <div className="h-64 bg-gray-200" />
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-64" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GirPageClient({ circuits, locale }: GirPageClientProps) {
  return (
    <Suspense fallback={<GirPageSkeleton />}>
      <GirContent circuits={circuits} locale={locale} />
    </Suspense>
  );
}
