'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar, MapPin, Users, Clock, Trash2, Bell, BellOff,
  BookmarkX, ExternalLink
} from 'lucide-react';

interface WatchlistItem {
  id: string;
  circuit_id: string;
  notify_on_booking: boolean;
  notify_on_availability_change: boolean;
  notify_on_price_change: boolean;
  created_at: string;
  circuit: {
    id: string;
    title_fr: string;
    slug: string;
    departure_date: string;
    return_date: string;
    duration_days: number;
    price_from: number;
    places_total: number;
    places_available: number;
    status: string;
    image_url: string | null;
    destination: {
      name_fr: string;
    };
    partner: {
      name: string;
    };
  };
}

export default function AgencyWatchlistPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  const isFr = locale === 'fr';

  // Charger la watchlist
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: agency } = await (supabase as any)
        .from('agencies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!agency) {
        setLoading(false);
        return;
      }

      setAgencyId(agency.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('gir_watchlist')
        .select(`
          id, circuit_id, notify_on_booking, notify_on_availability_change,
          notify_on_price_change, created_at,
          circuit:circuits(
            id, title_fr, slug, departure_date, return_date, duration_days,
            price_from, places_total, places_available, status, image_url,
            destination:destinations(name_fr),
            partner:partners(name)
          )
        `)
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading watchlist:', error);
      } else {
        setWatchlist((data || []) as WatchlistItem[]);
      }

      setLoading(false);
    };

    load();
  }, []);

  // Supprimer de la watchlist
  const removeFromWatchlist = async (itemId: string) => {
    if (!agencyId) return;

    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('gir_watchlist')
      .delete()
      .eq('id', itemId);

    setWatchlist(prev => prev.filter(w => w.id !== itemId));
  };

  // Toggle notification
  const toggleNotification = async (itemId: string, field: 'notify_on_booking' | 'notify_on_availability_change' | 'notify_on_price_change') => {
    const supabase = createClient();

    const item = watchlist.find(w => w.id === itemId);
    if (!item) return;

    const newValue = !item[field];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('gir_watchlist')
      .update({ [field]: newValue })
      .eq('id', itemId);

    setWatchlist(prev => prev.map(w =>
      w.id === itemId ? { ...w, [field]: newValue } : w
    ));
  };

  // Calculer le remplissage
  const getFillPercentage = (available: number, total: number) => {
    return Math.round(((total - available) / total) * 100);
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        {isFr ? 'Chargement...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading text-gray-900">
          {isFr ? 'Ma watchlist' : 'My Watchlist'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isFr
            ? 'Les circuits que vous suivez et pour lesquels vous recevez des alertes'
            : 'Circuits you\'re watching and receiving alerts for'}
        </p>
      </div>

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
            href={`/${locale}/agency/circuits`}
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

            const fillPercentage = getFillPercentage(circuit.places_available, circuit.places_total);
            const isPast = new Date(circuit.departure_date) < new Date();
            const isLow = circuit.places_available <= 5;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${
                  isPast ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="w-full md:w-48 h-32 md:h-auto bg-gray-100 flex-shrink-0">
                    {circuit.image_url ? (
                      <img
                        src={circuit.image_url}
                        alt={circuit.title_fr}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <MapPin className="w-10 h-10" />
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/${locale}/agency/circuits/${circuit.id}`}
                            className="font-semibold text-gray-900 hover:text-terracotta-600"
                          >
                            {circuit.title_fr}
                          </Link>
                          {isPast && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {isFr ? 'Passé' : 'Past'}
                            </span>
                          )}
                          {isLow && !isPast && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                              {isFr ? 'Places limitées' : 'Limited spots'}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {circuit.destination?.name_fr} • {circuit.partner?.name}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(circuit.departure_date).toLocaleDateString(
                                locale === 'fr' ? 'fr-FR' : 'en-US',
                                { day: 'numeric', month: 'short', year: 'numeric' }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{circuit.duration_days} {isFr ? 'jours' : 'days'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{circuit.places_available}/{circuit.places_total}</span>
                          </div>
                        </div>
                      </div>

                      {/* Prix */}
                      <div className="text-right">
                        <span className="text-xs text-gray-500">{isFr ? 'À partir de' : 'From'}</span>
                        <p className="text-lg font-bold text-terracotta-600">
                          {circuit.price_from?.toLocaleString()} €
                        </p>
                      </div>
                    </div>

                    {/* Jauge */}
                    <div className="mt-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            fillPercentage >= 80 ? 'bg-red-500' : fillPercentage >= 50 ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions et notifications */}
                <div className="border-t border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-4 bg-gray-50">
                  {/* Toggles notifications */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleNotification(item.id, 'notify_on_booking')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        item.notify_on_booking
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.notify_on_booking ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      {isFr ? 'Réservations' : 'Bookings'}
                    </button>
                    <button
                      onClick={() => toggleNotification(item.id, 'notify_on_availability_change')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        item.notify_on_availability_change
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.notify_on_availability_change ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      {isFr ? 'Disponibilité' : 'Availability'}
                    </button>
                    <button
                      onClick={() => toggleNotification(item.id, 'notify_on_price_change')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        item.notify_on_price_change
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.notify_on_price_change ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      {isFr ? 'Prix' : 'Price'}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/${locale}/agency/circuits/${circuit.id}`}
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
    </div>
  );
}
