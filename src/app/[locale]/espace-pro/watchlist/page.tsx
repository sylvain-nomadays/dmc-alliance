'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar, MapPin, Users, Clock, Trash2, Bell, BellOff,
  BookmarkX, ExternalLink, Heart
} from 'lucide-react';

interface Departure {
  id: string;
  start_date: string;
  end_date: string | null;
  total_seats: number;
  booked_seats: number;
  status: string;
  price: number | null;
}

interface WatchlistItem {
  id: string;
  circuit_id: string;
  notify_on_booking: boolean;
  notify_on_availability_change: boolean;
  notify_on_price_change: boolean;
  created_at: string;
  circuit: {
    id: string;
    title: string;
    slug: string;
    duration_days: number;
    price_from: number | null;
    image_url: string | null;
    destination: {
      name: string;
      name_en: string | null;
    } | null;
    partner: {
      name: string;
    } | null;
    departures: Departure[];
  } | null;
}

interface FavoriteItem {
  id: string;
  entity_type: 'destination' | 'partner';
  entity_slug: string;
  entity_name: string | null;
  created_at: string;
  destination?: { id: string; name: string; name_en: string | null; slug: string; image_url: string | null } | null;
  partner?: { id: string; name: string; slug: string; logo_url: string | null } | null;
}

export default function AgencyWatchlistPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [tab, setTab] = useState<'circuits' | 'favorites'>('circuits');

  const isFr = locale === 'fr';

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: agency } = await (supabase as any)
        .from('agencies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!agency) { setLoading(false); return; }
      setAgencyId(agency.id);

      // Load circuit watchlist
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: wlData, error: wlError } = await (supabase as any)
        .from('gir_watchlist')
        .select(`
          id, circuit_id, notify_on_booking, notify_on_availability_change,
          notify_on_price_change, created_at,
          circuit:circuits(
            id, title, slug, duration_days, price_from, image_url,
            destination:destinations(name, name_en),
            partner:partners(name),
            departures:circuit_departures(id, start_date, end_date, total_seats, booked_seats, status, price)
          )
        `)
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });

      if (wlError) {
        console.error('Error loading watchlist:', wlError.message);
      } else {
        setWatchlist((wlData || []) as WatchlistItem[]);
      }

      // Load favorites (destinations & partners) from agency_interests
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: favData, error: favError } = await (supabase as any)
        .from('agency_interests')
        .select('id, entity_type, entity_slug, entity_name, created_at')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });

      if (!favError && favData && favData.length > 0) {
        // Enrich favorites with destination/partner data
        const destSlugs = favData.filter((f: FavoriteItem) => f.entity_type === 'destination').map((f: FavoriteItem) => f.entity_slug);
        const partnerSlugs = favData.filter((f: FavoriteItem) => f.entity_type === 'partner').map((f: FavoriteItem) => f.entity_slug);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [destResult, partnerResult] = await Promise.all([
          destSlugs.length > 0
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? (supabase as any).from('destinations').select('id, name, name_en, slug, image_url').in('slug', destSlugs)
            : { data: [] },
          partnerSlugs.length > 0
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? (supabase as any).from('partners').select('id, name, slug, logo_url').in('slug', partnerSlugs)
            : { data: [] },
        ]);

        const destMap = new Map((destResult.data || []).map((d: FavoriteItem['destination']) => [d!.slug, d]));
        const partnerMap = new Map((partnerResult.data || []).map((p: FavoriteItem['partner']) => [p!.slug, p]));

        const enriched = favData.map((f: FavoriteItem) => ({
          ...f,
          destination: f.entity_type === 'destination' ? destMap.get(f.entity_slug) || null : null,
          partner: f.entity_type === 'partner' ? partnerMap.get(f.entity_slug) || null : null,
        }));

        setFavorites(enriched);
      }

      setLoading(false);
    };

    load();
  }, []);

  const removeFromWatchlist = async (itemId: string) => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('gir_watchlist').delete().eq('id', itemId);
    setWatchlist(prev => prev.filter(w => w.id !== itemId));
  };

  const removeFavorite = async (itemId: string) => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('agency_interests').delete().eq('id', itemId);
    setFavorites(prev => prev.filter(f => f.id !== itemId));
  };

  const toggleNotification = async (itemId: string, field: 'notify_on_booking' | 'notify_on_availability_change' | 'notify_on_price_change') => {
    const supabase = createClient();
    const item = watchlist.find(w => w.id === itemId);
    if (!item) return;

    const newValue = !item[field];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('gir_watchlist').update({ [field]: newValue }).eq('id', itemId);
    setWatchlist(prev => prev.map(w => w.id === itemId ? { ...w, [field]: newValue } : w));
  };

  const getNextDeparture = (departures: Departure[]) => {
    const today = new Date().toISOString().split('T')[0];
    const closedStatuses = ['cancelled', 'closed'];
    return departures
      .filter(d => d.start_date >= today && !closedStatuses.includes(d.status))
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] || null;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return <div className="text-center py-12 text-gray-500">{isFr ? 'Chargement...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading text-gray-900">
          {isFr ? 'Ma watchlist' : 'My Watchlist'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isFr
            ? 'Vos circuits suivis, destinations et partenaires favoris'
            : 'Your watched circuits, favorite destinations and partners'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setTab('circuits')}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'circuits' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {isFr ? 'Circuits suivis' : 'Watched circuits'}
          {watchlist.length > 0 && (
            <span className="ml-2 bg-terracotta-500 text-white text-xs px-2 py-0.5 rounded-full">{watchlist.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('favorites')}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'favorites' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {isFr ? 'Favoris' : 'Favorites'}
          {favorites.length > 0 && (
            <span className="ml-2 bg-terracotta-500 text-white text-xs px-2 py-0.5 rounded-full">{favorites.length}</span>
          )}
        </button>
      </div>

      {/* Circuits Tab */}
      {tab === 'circuits' && (
        <>
          {watchlist.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <BookmarkX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {isFr ? 'Votre watchlist est vide' : 'Your watchlist is empty'}
              </h2>
              <p className="text-gray-600 mb-6">
                {isFr
                  ? 'Ajoutez des circuits à votre watchlist pour suivre leur remplissage et recevoir des alertes.'
                  : 'Add circuits to your watchlist to track their filling and receive alerts.'}
              </p>
              <Link
                href={`/${locale}/espace-pro/circuits`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"
              >
                {isFr ? 'Parcourir les circuits' : 'Browse circuits'}
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {watchlist.map((item) => {
                const circuit = item.circuit;
                if (!circuit) return null;

                const nextDep = getNextDeparture(circuit.departures || []);
                const closedStatuses = ['cancelled', 'closed'];
                const totalDepartures = (circuit.departures || []).filter(
                  d => d.start_date >= new Date().toISOString().split('T')[0] && !closedStatuses.includes(d.status)
                ).length;
                const available = nextDep ? nextDep.total_seats - nextDep.booked_seats : 0;
                const fillPercent = nextDep ? Math.round((nextDep.booked_seats / nextDep.total_seats) * 100) : 0;

                return (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-48 h-32 md:h-auto bg-gray-100 flex-shrink-0">
                        {circuit.image_url ? (
                          <img src={circuit.image_url} alt={circuit.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <MapPin className="w-10 h-10" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                href={`/${locale}/gir/${circuit.slug}`}
                                className="font-semibold text-gray-900 hover:text-terracotta-600"
                              >
                                {circuit.title}
                              </Link>
                              {available <= 5 && available > 0 && nextDep && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                                  {isFr ? 'Places limitées' : 'Limited spots'}
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 mb-3">
                              {isFr ? circuit.destination?.name : (circuit.destination?.name_en || circuit.destination?.name)} • {circuit.partner?.name}
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              {nextDep && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(nextDep.start_date)}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{circuit.duration_days} {isFr ? 'jours' : 'days'}</span>
                              </div>
                              {nextDep && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{available}/{nextDep.total_seats}</span>
                                </div>
                              )}
                              {totalDepartures > 1 && (
                                <span className="text-terracotta-600 font-medium">
                                  {totalDepartures} {isFr ? 'départs' : 'departures'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-gray-500">{isFr ? 'À partir de' : 'From'}</span>
                            <p className="text-lg font-bold text-terracotta-600">
                              {(nextDep?.price || circuit.price_from)?.toLocaleString()} €
                            </p>
                          </div>
                        </div>

                        {nextDep && (
                          <div className="mt-3">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  fillPercent >= 80 ? 'bg-red-500' : fillPercent >= 50 ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-4 bg-gray-50">
                      <div className="flex flex-wrap gap-2">
                        {(['notify_on_booking', 'notify_on_availability_change', 'notify_on_price_change'] as const).map((field) => {
                          const labels = {
                            notify_on_booking: isFr ? 'Réservations' : 'Bookings',
                            notify_on_availability_change: isFr ? 'Disponibilité' : 'Availability',
                            notify_on_price_change: isFr ? 'Prix' : 'Price',
                          };
                          return (
                            <button
                              key={field}
                              onClick={() => toggleNotification(item.id, field)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                item[field] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {item[field] ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                              {labels[field]}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/${locale}/gir/${circuit.slug}`}
                          className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors text-sm"
                        >
                          {isFr ? 'Voir le circuit' : 'View circuit'}
                        </Link>
                        <button
                          onClick={() => removeFromWatchlist(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={isFr ? 'Retirer de la watchlist' : 'Remove from watchlist'}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Favorites Tab */}
      {tab === 'favorites' && (
        <>
          {favorites.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {isFr ? 'Aucun favori' : 'No favorites'}
              </h2>
              <p className="text-gray-600 mb-6">
                {isFr
                  ? 'Ajoutez des destinations et partenaires DMC à vos favoris depuis les pages publiques.'
                  : 'Add destinations and DMC partners to your favorites from the public pages.'}
              </p>
              <div className="flex justify-center gap-4">
                <Link
                  href={`/${locale}/destinations`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"
                >
                  {isFr ? 'Destinations' : 'Destinations'}
                </Link>
                <Link
                  href={`/${locale}/partners`}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {isFr ? 'Partenaires DMC' : 'DMC Partners'}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((fav) => (
                <div key={fav.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {fav.entity_type === 'destination' && (
                    <>
                      <div className="h-32 bg-gray-100">
                        {fav.destination?.image_url ? (
                          <img src={fav.destination.image_url} alt={fav.destination.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <MapPin className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <span className="text-xs text-terracotta-500 font-medium uppercase">{isFr ? 'Destination' : 'Destination'}</span>
                        <h3 className="font-semibold text-gray-900 mt-1">
                          {fav.destination
                            ? (isFr ? fav.destination.name : (fav.destination.name_en || fav.destination.name))
                            : fav.entity_name}
                        </h3>
                        <div className="flex items-center justify-between mt-3">
                          <Link
                            href={`/${locale}/destinations/${fav.destination?.slug || fav.entity_slug}`}
                            className="text-sm text-terracotta-600 hover:underline"
                          >
                            {isFr ? 'Voir la destination' : 'View destination'}
                          </Link>
                          <button
                            onClick={() => removeFavorite(fav.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {fav.entity_type === 'partner' && (
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {fav.partner?.logo_url ? (
                          <img src={fav.partner.logo_url} alt={fav.partner.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-terracotta-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-terracotta-600">
                              {(fav.partner?.name || fav.entity_name || '?').charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-terracotta-500 font-medium uppercase">{isFr ? 'Partenaire DMC' : 'DMC Partner'}</span>
                          <h3 className="font-semibold text-gray-900">{fav.partner?.name || fav.entity_name}</h3>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/${locale}/partners/${fav.partner?.slug || fav.entity_slug}`}
                          className="text-sm text-terracotta-600 hover:underline"
                        >
                          {isFr ? 'Voir le profil' : 'View profile'}
                        </Link>
                        <button
                          onClick={() => removeFavorite(fav.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
