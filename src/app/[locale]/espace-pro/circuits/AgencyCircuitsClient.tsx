'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Calendar, MapPin, Users, Clock, Search, Filter, Bookmark, BookmarkCheck } from 'lucide-react';
import type { DbCircuit } from '@/lib/supabase/circuits';

interface Departure {
  id: string;
  start_date: string;
  end_date: string | null;
  total_seats: number;
  booked_seats: number;
  status: string;
  price: number | null;
}

interface Circuit {
  id: string;
  title: string;
  slug: string;
  destination: {
    name: string;
    name_en: string | null;
    slug: string;
  } | null;
  partner: {
    name: string;
    slug: string;
  } | null;
  duration_days: number;
  price_from: number;
  image_url: string | null;
  departures: Departure[];
}

interface WatchlistItem {
  circuit_id: string;
}

interface AgencyCircuitsClientProps {
  locale: string;
  serverCircuits: DbCircuit[];
}

export default function AgencyCircuitsClient({ locale, serverCircuits }: AgencyCircuitsClientProps) {
  // Transform server circuits to the local Circuit format with only future departures
  const transformCircuits = (dbCircuits: DbCircuit[]): Circuit[] => {
    const today = new Date().toISOString().split('T')[0];
    const closedStatuses = ['cancelled', 'closed'];

    return dbCircuits
      .map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        destination: c.destination ? { name: c.destination.name, name_en: c.destination.name_en, slug: c.destination.slug } : null,
        partner: c.partner ? { name: c.partner.name, slug: c.partner.slug } : null,
        duration_days: c.duration_days,
        price_from: c.price_from || 0,
        image_url: c.image_url,
        departures: (c.departures || [])
          .filter((dep) => dep.start_date >= today && !closedStatuses.includes(dep.status || ''))
          .sort((a, b) => a.start_date.localeCompare(b.start_date))
          .map((dep) => ({
            id: dep.id,
            start_date: dep.start_date,
            end_date: dep.end_date,
            total_seats: dep.total_seats || 0,
            booked_seats: dep.booked_seats || 0,
            status: dep.status || 'open',
            price: dep.price,
          })),
      }))
      .filter((c) => c.departures.length > 0)
      .sort((a, b) => {
        const dateA = a.departures[0]?.start_date || '9999-12-31';
        const dateB = b.departures[0]?.start_date || '9999-12-31';
        return dateA.localeCompare(dateB);
      });
  };

  const allCircuits = transformCircuits(serverCircuits);

  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'limited'>('all');

  const isFr = locale === 'fr';

  // Derive destinations from circuits
  const destinations = Array.from(
    new Map(
      allCircuits
        .filter((c) => c.destination)
        .map((c) => [c.destination!.slug, { id: c.destination!.slug, name: c.destination!.name }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Filter circuits
  const circuits = allCircuits.filter((c) => {
    // Destination filter
    if (destinationFilter && c.destination?.slug !== destinationFilter) return false;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !c.title?.toLowerCase().includes(q) &&
        !c.destination?.name?.toLowerCase().includes(q) &&
        !c.partner?.name?.toLowerCase().includes(q)
      )
        return false;
    }

    // Availability filter
    if (statusFilter === 'available') {
      const nextDeparture = c.departures[0];
      if (!nextDeparture) return false;
      const available = nextDeparture.total_seats - nextDeparture.booked_seats;
      if (available <= 5) return false;
    } else if (statusFilter === 'limited') {
      const nextDeparture = c.departures[0];
      if (!nextDeparture) return false;
      const available = nextDeparture.total_seats - nextDeparture.booked_seats;
      if (available > 5 || available <= 0) return false;
    }

    return true;
  });

  // Load watchlist (client-side, user-specific)
  const loadWatchlist = async () => {
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: agency } = await (supabase as any)
        .from('agencies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!agency) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('gir_watchlist')
        .select('circuit_id')
        .eq('agency_id', agency.id);

      if (error) {
        console.error('Watchlist table may not exist:', error.message);
        return;
      }

      if (data) {
        setWatchlist(new Set(data.map((w: WatchlistItem) => w.circuit_id)));
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  // Toggle watchlist
  const toggleWatchlist = async (circuitId: string) => {
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: agency } = await (supabase as any)
        .from('agencies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!agency) return;

      if (watchlist.has(circuitId)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('gir_watchlist')
          .delete()
          .eq('agency_id', agency.id)
          .eq('circuit_id', circuitId);

        if (error) {
          console.error('Error removing from watchlist:', error.message);
          return;
        }

        setWatchlist((prev) => {
          const next = new Set(prev);
          next.delete(circuitId);
          return next;
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('gir_watchlist')
          .insert({
            agency_id: agency.id,
            circuit_id: circuitId,
            notify_on_booking: true,
            notify_on_availability_change: true,
          });

        if (error) {
          console.error('Error adding to watchlist:', error.message);
          return;
        }

        setWatchlist((prev) => new Set([...prev, circuitId]));
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  // Calculate fill percentage
  const getFillPercentage = (departure: Departure) => {
    if (!departure.total_seats) return 0;
    return Math.round((departure.booked_seats / departure.total_seats) * 100);
  };

  // Gauge color based on fill
  const getGaugeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-green-500';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading text-gray-900">
          {isFr ? 'Circuits GIR disponibles' : 'Available GIR Circuits'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isFr
            ? 'Découvrez tous les circuits à départs garantis de nos partenaires'
            : 'Discover all guaranteed departure circuits from our partners'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isFr ? 'Rechercher un circuit...' : 'Search circuits...'}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
            />
          </div>

          {/* Destination filter */}
          <div className="w-full md:w-56">
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
            >
              <option value="">{isFr ? 'Toutes destinations' : 'All destinations'}</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Availability filter */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: isFr ? 'Tous' : 'All' },
              { value: 'available', label: isFr ? 'Disponible' : 'Available' },
              { value: 'limited', label: isFr ? 'Places limitées' : 'Limited' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value as typeof statusFilter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-terracotta-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Circuits list */}
      {circuits.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">
            {isFr ? 'Aucun circuit GIR disponible' : 'No GIR circuits available'}
          </p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {searchQuery || destinationFilter ? (
              isFr
                ? 'Aucun circuit ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
                : 'No circuits match your search criteria. Try adjusting your filters.'
            ) : (
              isFr
                ? 'Les circuits GIR de nos partenaires seront bientôt disponibles. Revenez régulièrement pour découvrir les nouvelles offres.'
                : 'GIR circuits from our partners will be available soon. Check back regularly for new offers.'
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circuits.map((circuit) => {
            const nextDeparture = circuit.departures[0];
            const fillPercentage = nextDeparture ? getFillPercentage(nextDeparture) : 0;
            const availableSeats = nextDeparture
              ? nextDeparture.total_seats - nextDeparture.booked_seats
              : 0;
            const isWatched = watchlist.has(circuit.id);
            const departureCount = circuit.departures.length;

            return (
              <div
                key={circuit.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-100">
                  {circuit.image_url ? (
                    <img
                      src={circuit.image_url}
                      alt={circuit.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <MapPin className="w-12 h-12" />
                    </div>
                  )}

                  {/* Watchlist badge */}
                  <button
                    onClick={() => toggleWatchlist(circuit.id)}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                      isWatched
                        ? 'bg-terracotta-500 text-white'
                        : 'bg-white/80 text-gray-700 hover:bg-white'
                    }`}
                    title={isWatched ? (isFr ? 'Retirer de ma watchlist' : 'Remove from watchlist') : (isFr ? 'Ajouter à ma watchlist' : 'Add to watchlist')}
                  >
                    {isWatched ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </button>

                  {/* Partner badge */}
                  <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/90 rounded text-xs font-medium text-gray-700">
                    {circuit.partner?.name}
                  </div>

                  {/* Departure count badge */}
                  {departureCount > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-terracotta-500 text-white rounded text-xs font-medium">
                      {departureCount} {isFr ? 'départs' : 'departures'}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {circuit.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{isFr ? circuit.destination?.name : (circuit.destination?.name_en || circuit.destination?.name)}</span>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{circuit.duration_days} {isFr ? 'jours' : 'days'}</span>
                    </div>
                    {nextDeparture && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(nextDeparture.start_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Fill gauge */}
                  {nextDeparture && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">
                          <Users className="w-3 h-3 inline mr-1" />
                          {availableSeats} {isFr ? 'places restantes' : 'spots left'}
                        </span>
                        <span className={`font-medium ${fillPercentage >= 80 ? 'text-red-600' : fillPercentage >= 50 ? 'text-orange-600' : 'text-green-600'}`}>
                          {fillPercentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getGaugeColor(fillPercentage)} transition-all duration-500`}
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Price and action */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500">{isFr ? 'À partir de' : 'From'}</span>
                      <p className="text-lg font-bold text-terracotta-600">
                        {(nextDeparture?.price || circuit.price_from)?.toLocaleString()} €
                      </p>
                    </div>
                    <Link
                      href={`/${locale}/espace-pro/circuits/${circuit.id}`}
                      className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors text-sm font-medium"
                    >
                      {isFr ? 'Voir détails' : 'View details'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
