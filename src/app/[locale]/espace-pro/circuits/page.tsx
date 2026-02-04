'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Calendar, MapPin, Users, Clock, Search, Filter, Bookmark, BookmarkCheck } from 'lucide-react';

interface Departure {
  id: string;
  start_date: string;
  end_date: string | null;
  total_seats: number;
  booked_seats: number;
  status: string;
  price_override: number | null;
}

interface Circuit {
  id: string;
  title: string;
  slug: string;
  destination: {
    name_fr: string;
    name_en: string;
    country_code: string;
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

export default function AgencyCircuitsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [destinations, setDestinations] = useState<{ id: string; name_fr: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'limited'>('all');

  const isFr = locale === 'fr';

  // Charger les circuits avec leurs départs
  const loadCircuits = async () => {
    try {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('circuits')
        .select(`
          id, title, slug, duration_days, price_from, image_url,
          destination:destinations(name_fr, name_en, country_code),
          partner:partners(name, slug),
          departures:circuit_departures(id, start_date, end_date, total_seats, booked_seats, status, price_override)
        `)
        .eq('status', 'published')
        .eq('is_gir', true);

      if (destinationFilter) {
        query = query.eq('destination_id', destinationFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading circuits:', error);
        // Si la colonne is_gir n'existe pas, essayer sans ce filtre
        if (error.message?.includes('is_gir')) {
          console.warn('Column is_gir may not exist, please run migrations');
        }
        setLoading(false);
        return;
      }

    // Filtrer les circuits qui ont au moins un départ futur ouvert
    const today = new Date().toISOString().split('T')[0];
    let filtered: Circuit[] = (data || []).filter((circuit: Circuit) => {
      // Garder uniquement les départs futurs et ouverts
      const futureDepartures = (circuit.departures || []).filter(
        (dep: Departure) => dep.start_date >= today && dep.status === 'open'
      );
      return futureDepartures.length > 0;
    }).map((circuit: Circuit) => ({
      ...circuit,
      // Garder uniquement les départs futurs et ouverts, triés par date
      departures: (circuit.departures || [])
        .filter((dep: Departure) => dep.start_date >= today && dep.status === 'open')
        .sort((a: Departure, b: Departure) => a.start_date.localeCompare(b.start_date))
    }));

    // Filtrer par recherche
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c: Circuit) =>
          c.title?.toLowerCase().includes(q) ||
          c.destination?.name_fr?.toLowerCase().includes(q) ||
          c.partner?.name?.toLowerCase().includes(q)
      );
    }

    // Filtrer par disponibilité (basé sur le prochain départ)
    if (statusFilter === 'available') {
      filtered = filtered.filter((c: Circuit) => {
        const nextDeparture = c.departures[0];
        if (!nextDeparture) return false;
        const available = nextDeparture.total_seats - nextDeparture.booked_seats;
        return available > 5;
      });
    } else if (statusFilter === 'limited') {
      filtered = filtered.filter((c: Circuit) => {
        const nextDeparture = c.departures[0];
        if (!nextDeparture) return false;
        const available = nextDeparture.total_seats - nextDeparture.booked_seats;
        return available <= 5 && available > 0;
      });
    }

    // Trier par date du prochain départ
    filtered.sort((a: Circuit, b: Circuit) => {
      const dateA = a.departures[0]?.start_date || '9999-12-31';
      const dateB = b.departures[0]?.start_date || '9999-12-31';
      return dateA.localeCompare(dateB);
    });

    setCircuits(filtered);
    setLoading(false);
    } catch (error) {
      console.error('Error in loadCircuits:', error);
      setLoading(false);
    }
  };

  // Charger la watchlist
  const loadWatchlist = async () => {
    try {
      const supabase = createClient();

      // Récupérer l'agence de l'utilisateur
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
        return; // Table doesn't exist yet - ignore silently
      }

      if (data) {
        setWatchlist(new Set(data.map((w: WatchlistItem) => w.circuit_id)));
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  };

  // Charger les destinations pour le filtre
  const loadDestinations = async () => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('destinations')
      .select('id, name_fr')
      .eq('is_active', true)
      .order('name_fr');

    setDestinations(data || []);
  };

  useEffect(() => {
    loadDestinations();
    loadWatchlist();
  }, []);

  useEffect(() => {
    loadCircuits();
  }, [destinationFilter, statusFilter, searchQuery]);

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
        // Supprimer de la watchlist
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
        // Ajouter à la watchlist
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

  // Calculer le pourcentage de remplissage
  const getFillPercentage = (departure: Departure) => {
    return Math.round((departure.booked_seats / departure.total_seats) * 100);
  };

  // Couleur de la jauge selon le remplissage
  const getGaugeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-green-500';
  };

  // Formater la date
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

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
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

          {/* Filtre destination */}
          <div className="w-full md:w-56">
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
            >
              <option value="">{isFr ? 'Toutes destinations' : 'All destinations'}</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name_fr}</option>
              ))}
            </select>
          </div>

          {/* Filtre disponibilité */}
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

      {/* Liste des circuits */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          {isFr ? 'Chargement...' : 'Loading...'}
        </div>
      ) : circuits.length === 0 ? (
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

                  {/* Badge watchlist */}
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

                  {/* Badge partenaire */}
                  <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/90 rounded text-xs font-medium text-gray-700">
                    {circuit.partner?.name}
                  </div>

                  {/* Badge nombre de départs */}
                  {departureCount > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-terracotta-500 text-white rounded text-xs font-medium">
                      {departureCount} {isFr ? 'départs' : 'departures'}
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {circuit.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{isFr ? circuit.destination?.name_fr : (circuit.destination?.name_en || circuit.destination?.name_fr)}</span>
                  </div>

                  {/* Infos */}
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

                  {/* Jauge de remplissage */}
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

                  {/* Prix et action */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500">{isFr ? 'À partir de' : 'From'}</span>
                      <p className="text-lg font-bold text-terracotta-600">
                        {(nextDeparture?.price_override || circuit.price_from)?.toLocaleString()} €
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
