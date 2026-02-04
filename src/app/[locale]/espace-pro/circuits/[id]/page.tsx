'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import {
  Calendar, MapPin, Users, Clock, ChevronLeft, Bookmark, BookmarkCheck,
  Check, X, Info, Send, Phone, Mail, AlertCircle
} from 'lucide-react';
import { CircuitPDFExport } from '@/components/espace-pro/CircuitPDFExport';

interface Departure {
  id: string;
  start_date: string;
  end_date: string | null;
  total_seats: number;
  booked_seats: number;
  price: number | null;
  status: 'open' | 'closed' | 'full' | 'cancelled';
}

interface CircuitDetails {
  id: string;
  title: string;
  slug: string;
  description_fr: string | null;
  description_en: string | null;
  itinerary: Array<{
    day: number;
    title_fr: string;
    title_en?: string;
    description_fr: string;
    description_en?: string;
  }> | null;
  included_fr: string[] | null;
  included_en: string[] | null;
  not_included_fr: string[] | null;
  not_included_en: string[] | null;
  highlights_fr: string[] | null;
  highlights_en: string[] | null;
  destination: {
    id: string;
    name: string;
    name_en: string | null;
  } | null;
  partner: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    logo_url: string | null;
  } | null;
  duration_days: number;
  price_from: number | null;
  group_size_min: number | null;
  group_size_max: number | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  difficulty_level: number | null;
  use_tiered_commission: boolean | null;
  base_commission_rate: number | null;
  commission_tiers: Array<{
    min_pax: number;
    max_pax: number | null;
    rate: number;
  }> | null;
  departures: Departure[];
}

export default function AgencyCircuitDetailPage() {
  const params = useParams();
  const locale = params.locale as string;
  const circuitId = params.id as string;

  const [circuit, setCircuit] = useState<CircuitDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWatched, setIsWatched] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<'info' | 'booking'>('info');
  const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null);
  const [requestForm, setRequestForm] = useState({
    message: '',
    travelersCount: 2,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const isFr = locale === 'fr';

  // Charger le circuit avec les départs
  useEffect(() => {
    const loadCircuit = async () => {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('circuits')
        .select(`
          id, title, slug, description_fr, description_en, itinerary,
          included_fr, included_en, not_included_fr, not_included_en,
          highlights_fr, highlights_en, duration_days, price_from,
          group_size_min, group_size_max, image_url, gallery_urls,
          difficulty_level, use_tiered_commission, base_commission_rate, commission_tiers,
          destination:destinations(id, name, name_en),
          partner:partners(id, name, slug, email, phone, logo_url),
          departures:circuit_departures(id, start_date, end_date, total_seats, booked_seats, price, status)
        `)
        .eq('id', circuitId)
        .single();

      if (error) {
        console.error('Error loading circuit:', error);
      } else if (data) {
        // Trier les départs par date
        const sortedDepartures = (data.departures || []).sort(
          (a: Departure, b: Departure) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
        setCircuit({ ...data, departures: sortedDepartures } as CircuitDetails);
      }
      setLoading(false);
    };

    loadCircuit();
  }, [circuitId]);

  // Charger l'agence et vérifier la watchlist
  useEffect(() => {
    const loadAgencyAndWatchlist = async () => {
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
      setAgencyId(agency.id as string);

      // Vérifier si le circuit est dans la watchlist
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: watchItem } = await (supabase as any)
        .from('gir_watchlist')
        .select('id')
        .eq('agency_id', agency.id)
        .eq('circuit_id', circuitId)
        .single();

      setIsWatched(!!watchItem);

      // Pré-remplir le formulaire
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single();

      if (profile) {
        setRequestForm((prev) => ({
          ...prev,
          contactName: profile.full_name || '',
          contactEmail: profile.email || '',
          contactPhone: profile.phone || '',
        }));
      }
    };

    loadAgencyAndWatchlist();
  }, [circuitId]);

  // Toggle watchlist
  const toggleWatchlist = async () => {
    if (!agencyId) return;
    const supabase = createClient();

    if (isWatched) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('gir_watchlist')
        .delete()
        .eq('agency_id', agencyId)
        .eq('circuit_id', circuitId);
      setIsWatched(false);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('gir_watchlist')
        .insert({
          agency_id: agencyId,
          circuit_id: circuitId,
          notify_on_booking: true,
          notify_on_availability_change: true,
        });
      setIsWatched(true);
    }
  };

  // Ouvrir le modal de demande pour un départ spécifique
  const openRequestModal = (type: 'info' | 'booking', departure?: Departure) => {
    setRequestType(type);
    setSelectedDeparture(departure || null);
    setShowRequestModal(true);
  };

  // Soumettre une demande
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyId || !circuit) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/espace-pro/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          circuitId,
          departureId: selectedDeparture?.id || null,
          requestType,
          travelersCount: requestForm.travelersCount,
          message: requestForm.message,
          contactName: requestForm.contactName,
          contactEmail: requestForm.contactEmail,
          contactPhone: requestForm.contactPhone,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi');
      }

      setRequestSuccess(true);
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestSuccess(false);
        setSelectedDeparture(null);
        setRequestForm((prev) => ({ ...prev, message: '', travelersCount: 2 }));
      }, 2000);
    } catch (error) {
      console.error('Request error:', error);
      alert('Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getAvailableSeats = (departure: Departure) => {
    return departure.total_seats - departure.booked_seats;
  };

  const getFillPercentage = (departure: Departure) => {
    return Math.round((departure.booked_seats / departure.total_seats) * 100);
  };

  const getStatusBadge = (departure: Departure) => {
    const available = getAvailableSeats(departure);
    if (departure.status === 'cancelled') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Annulé</span>;
    }
    if (departure.status === 'closed') {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Fermé</span>;
    }
    if (departure.status === 'full' || available === 0) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Complet</span>;
    }
    if (available <= 3) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">{available} place{available > 1 ? 's' : ''}</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Disponible</span>;
  };

  // Calculer la commission en fonction du nombre de voyageurs
  const calculateCommission = (travelers: number) => {
    if (!circuit) return null;

    if (circuit.use_tiered_commission && circuit.commission_tiers && circuit.commission_tiers.length > 0) {
      const tier = circuit.commission_tiers.find(t =>
        travelers >= t.min_pax && (t.max_pax === null || travelers <= t.max_pax)
      );
      return tier?.rate || circuit.base_commission_rate || 10;
    }

    return circuit.base_commission_rate || 10;
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        {isFr ? 'Chargement...' : 'Loading...'}
      </div>
    );
  }

  if (!circuit) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          {isFr ? 'Circuit non trouvé' : 'Circuit not found'}
        </p>
        <Link href={`/${locale}/espace-pro/circuits`}>
          <Button>{isFr ? 'Retour aux circuits' : 'Back to circuits'}</Button>
        </Link>
      </div>
    );
  }

  const openDepartures = circuit.departures.filter(d =>
    d.status === 'open' && new Date(d.start_date) > new Date()
  );

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Link
        href={`/${locale}/espace-pro/circuits`}
        className="inline-flex items-center text-gray-600 hover:text-terracotta-600"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        {isFr ? 'Retour aux circuits' : 'Back to circuits'}
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Image */}
        {circuit.image_url && (
          <div className="h-64 md:h-80 relative">
            <Image
              src={circuit.image_url}
              alt={circuit.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                {circuit.partner?.logo_url && (
                  <Image
                    src={circuit.partner.logo_url}
                    alt={circuit.partner.name}
                    width={24}
                    height={24}
                    className="rounded-full bg-white"
                  />
                )}
                <p className="text-sm opacity-90">{circuit.partner?.name}</p>
              </div>
              <h1 className="text-2xl md:text-3xl font-heading">{circuit.title}</h1>
            </div>
          </div>
        )}

        {/* Infos principales */}
        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5 text-terracotta-500" />
              <span>{isFr ? circuit.destination?.name : (circuit.destination?.name_en || circuit.destination?.name)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5 text-terracotta-500" />
              <span>{circuit.duration_days} {isFr ? 'jours' : 'days'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5 text-terracotta-500" />
              <span>{circuit.group_size_min || 2} - {circuit.group_size_max || 16} {isFr ? 'personnes' : 'people'}</span>
            </div>
          </div>

          {/* Prix et actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-sm text-gray-500">{isFr ? 'À partir de' : 'From'}</span>
              <p className="text-3xl font-bold text-terracotta-600">
                {circuit.price_from?.toLocaleString()} €
                <span className="text-sm font-normal text-gray-500 ml-2">{isFr ? '/ pers.' : '/ person'}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleWatchlist}
                className={`px-4 py-2 rounded-lg border-2 transition-colors flex items-center gap-2 ${
                  isWatched
                    ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-600'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {isWatched ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                {isWatched ? (isFr ? 'Suivi' : 'Watching') : (isFr ? 'Suivre' : 'Watch')}
              </button>
              <CircuitPDFExport
                circuitId={circuit.id}
                circuitTitle={circuit.title}
                departures={circuit.departures}
                locale={locale}
              />
              <Button onClick={() => openRequestModal('info')}>
                <Info className="w-4 h-4 mr-2" />
                {isFr ? 'Demande d\'info' : 'Request info'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Départs disponibles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading text-gray-900">
            {isFr ? 'Dates de départ' : 'Departure dates'}
          </h2>
          <span className="text-sm text-gray-500">
            {openDepartures.length} {isFr ? 'départ(s) disponible(s)' : 'departure(s) available'}
          </span>
        </div>

        {circuit.departures.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {isFr ? 'Aucun départ programmé pour le moment' : 'No departures scheduled yet'}
            </p>
            <Button onClick={() => openRequestModal('info')} className="mt-4">
              {isFr ? 'Être notifié des prochaines dates' : 'Get notified of upcoming dates'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {circuit.departures.map((departure) => {
              const available = getAvailableSeats(departure);
              const fillPercent = getFillPercentage(departure);
              const isPast = new Date(departure.start_date) < new Date();
              const canBook = departure.status === 'open' && available > 0 && !isPast;

              return (
                <div
                  key={departure.id}
                  className={`border rounded-lg p-4 ${
                    isPast ? 'bg-gray-50 opacity-60' : canBook ? 'hover:border-terracotta-300' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Date et statut */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-terracotta-500" />
                        <span className="font-medium text-gray-900">
                          {formatDate(departure.start_date)}
                        </span>
                        {departure.end_date && (
                          <span className="text-gray-500">
                            → {formatDate(departure.end_date)}
                          </span>
                        )}
                        {getStatusBadge(departure)}
                        {isPast && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            {isFr ? 'Passé' : 'Past'}
                          </span>
                        )}
                      </div>

                      {/* Jauge de remplissage */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-xs">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                fillPercent >= 80 ? 'bg-red-500' : fillPercent >= 50 ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${fillPercent}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">
                          <strong>{available}</strong> / {departure.total_seats} {isFr ? 'places' : 'seats'}
                        </span>
                      </div>
                    </div>

                    {/* Prix et commission */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {(departure.price || circuit.price_from)?.toLocaleString()} €
                        </p>
                        <p className="text-xs text-gray-500">{isFr ? '/ personne' : '/ person'}</p>
                      </div>

                      {/* Indicateur de commission */}
                      {circuit.use_tiered_commission && circuit.commission_tiers && (
                        <div className="text-right border-l pl-4 border-gray-200">
                          <p className="text-sm text-terracotta-600 font-medium">
                            {circuit.commission_tiers[0]?.rate}% - {circuit.commission_tiers[circuit.commission_tiers.length - 1]?.rate}%
                          </p>
                          <p className="text-xs text-gray-500">{isFr ? 'commission' : 'commission'}</p>
                        </div>
                      )}

                      {/* Bouton réserver */}
                      {canBook ? (
                        <Button
                          onClick={() => openRequestModal('booking', departure)}
                          className="whitespace-nowrap"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isFr ? 'Réserver' : 'Book'}
                        </Button>
                      ) : (
                        <Button disabled className="whitespace-nowrap opacity-50">
                          {isPast ? (isFr ? 'Terminé' : 'Ended') : (isFr ? 'Complet' : 'Full')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contenu détaillé */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {(circuit.description_fr || circuit.description_en) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-heading text-gray-900 mb-4">{isFr ? 'Description' : 'Description'}</h2>
              <div
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{
                  __html: isFr ? (circuit.description_fr || '') : (circuit.description_en || circuit.description_fr || '')
                }}
              />
            </div>
          )}

          {/* Points forts */}
          {((isFr ? circuit.highlights_fr : circuit.highlights_en) || []).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-heading text-gray-900 mb-4">{isFr ? 'Points forts' : 'Highlights'}</h2>
              <ul className="space-y-2">
                {(isFr ? circuit.highlights_fr : circuit.highlights_en || circuit.highlights_fr)?.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Itinéraire */}
          {circuit.itinerary && circuit.itinerary.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-heading text-gray-900 mb-4">{isFr ? 'Itinéraire' : 'Itinerary'}</h2>
              <div className="space-y-4">
                {circuit.itinerary.map((day, i) => (
                  <div key={i} className="border-l-2 border-terracotta-500 pl-4">
                    <h3 className="font-semibold text-gray-900">
                      {isFr ? 'Jour' : 'Day'} {day.day}: {isFr ? day.title_fr : (day.title_en || day.title_fr)}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {isFr ? day.description_fr : (day.description_en || day.description_fr)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inclus / Non inclus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {((isFr ? circuit.included_fr : circuit.included_en) || []).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-heading text-gray-900 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  {isFr ? 'Inclus' : 'Included'}
                </h2>
                <ul className="space-y-2">
                  {(isFr ? circuit.included_fr : circuit.included_en || circuit.included_fr)?.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {((isFr ? circuit.not_included_fr : circuit.not_included_en) || []).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-heading text-gray-900 mb-4 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-500" />
                  {isFr ? 'Non inclus' : 'Not included'}
                </h2>
                <ul className="space-y-2">
                  {(isFr ? circuit.not_included_fr : circuit.not_included_en || circuit.not_included_fr)?.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Paliers de commission */}
          {circuit.use_tiered_commission && circuit.commission_tiers && circuit.commission_tiers.length > 0 && (
            <div className="bg-gradient-to-br from-terracotta-50 to-orange-50 rounded-xl shadow-sm border border-terracotta-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isFr ? 'Paliers de commission' : 'Commission tiers'}
              </h3>
              <div className="space-y-2">
                {circuit.commission_tiers.map((tier, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg border border-terracotta-100">
                    <span className="text-sm text-gray-600">
                      {tier.min_pax}{tier.max_pax ? ` - ${tier.max_pax}` : '+'} {isFr ? 'voyageurs' : 'travelers'}
                    </span>
                    <span className="font-bold text-terracotta-600">{tier.rate}%</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {isFr
                  ? 'La commission augmente avec le nombre de voyageurs inscrits'
                  : 'Commission increases with the number of registered travelers'}
              </p>
            </div>
          )}

          {/* Commission fixe si pas de paliers */}
          {!circuit.use_tiered_commission && circuit.base_commission_rate && (
            <div className="bg-gradient-to-br from-terracotta-50 to-orange-50 rounded-xl shadow-sm border border-terracotta-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                {isFr ? 'Commission' : 'Commission'}
              </h3>
              <p className="text-3xl font-bold text-terracotta-600">{circuit.base_commission_rate}%</p>
            </div>
          )}

          {/* Contact partenaire */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {isFr ? 'Contact partenaire' : 'Partner contact'}
            </h3>
            <div className="flex items-center gap-3 mb-4">
              {circuit.partner?.logo_url ? (
                <Image
                  src={circuit.partner.logo_url}
                  alt={circuit.partner.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-terracotta-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-terracotta-600">
                    {circuit.partner?.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{circuit.partner?.name}</p>
                <Link
                  href={`/${locale}/partners/${circuit.partner?.slug}`}
                  className="text-sm text-terracotta-600 hover:underline"
                >
                  {isFr ? 'Voir le profil' : 'View profile'}
                </Link>
              </div>
            </div>
            {circuit.partner?.email && (
              <a
                href={`mailto:${circuit.partner.email}`}
                className="flex items-center gap-2 text-terracotta-600 hover:underline mb-2"
              >
                <Mail className="w-4 h-4" />
                {circuit.partner.email}
              </a>
            )}
            {circuit.partner?.phone && (
              <a
                href={`tel:${circuit.partner.phone}`}
                className="flex items-center gap-2 text-terracotta-600 hover:underline"
              >
                <Phone className="w-4 h-4" />
                {circuit.partner.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Modal de demande */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-heading text-gray-900">
                {requestType === 'info'
                  ? (isFr ? 'Demande d\'information' : 'Information request')
                  : (isFr ? 'Demande de réservation' : 'Booking request')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{circuit.title}</p>
              {selectedDeparture && (
                <p className="text-sm text-terracotta-600 mt-1">
                  {isFr ? 'Départ du' : 'Departure on'} {formatDate(selectedDeparture.start_date)}
                </p>
              )}
            </div>

            {requestSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isFr ? 'Demande envoyée !' : 'Request sent!'}
                </h3>
                <p className="text-gray-600">
                  {isFr
                    ? 'Le partenaire a été notifié et vous contactera bientôt.'
                    : 'The partner has been notified and will contact you soon.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                {requestType === 'booking' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Nombre de voyageurs' : 'Number of travelers'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedDeparture ? getAvailableSeats(selectedDeparture) : undefined}
                      value={requestForm.travelersCount}
                      onChange={(e) => setRequestForm({ ...requestForm, travelersCount: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                    />
                    {circuit.use_tiered_commission && (
                      <p className="text-sm text-terracotta-600 mt-1">
                        {isFr ? 'Commission pour' : 'Commission for'} {requestForm.travelersCount} {isFr ? 'voyageurs' : 'travelers'}: <strong>{calculateCommission(requestForm.travelersCount)}%</strong>
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Votre message' : 'Your message'}
                  </label>
                  <textarea
                    value={requestForm.message}
                    onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                    placeholder={requestType === 'info'
                      ? (isFr ? 'Précisez vos questions...' : 'Specify your questions...')
                      : (isFr ? 'Informations complémentaires sur votre groupe...' : 'Additional information about your group...')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Nom du contact' : 'Contact name'}
                    </label>
                    <input
                      type="text"
                      value={requestForm.contactName}
                      onChange={(e) => setRequestForm({ ...requestForm, contactName: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Téléphone' : 'Phone'}
                    </label>
                    <input
                      type="tel"
                      value={requestForm.contactPhone}
                      onChange={(e) => setRequestForm({ ...requestForm, contactPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Email' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={requestForm.contactEmail}
                    onChange={(e) => setRequestForm({ ...requestForm, contactEmail: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRequestModal(false);
                      setSelectedDeparture(null);
                    }}
                  >
                    {isFr ? 'Annuler' : 'Cancel'}
                  </Button>
                  <Button type="submit" loading={submitting}>
                    <Send className="w-4 h-4 mr-2" />
                    {isFr ? 'Envoyer' : 'Send'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
