'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar, Clock, Mail, Send, Info, CheckCircle, MessageCircle, Filter
} from 'lucide-react';

interface AgencyRequestItem {
  id: string;
  circuit_id: string;
  request_type: 'info' | 'booking';
  travelers_count: number | null;
  message: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  status: 'pending' | 'sent' | 'responded' | 'closed';
  partner_notified_at: string | null;
  created_at: string;
  circuit: {
    id: string;
    title_fr: string;
    slug: string;
    departure_date: string;
    partner: {
      name: string;
    };
  };
}

export default function AgencyRequestsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [requests, setRequests] = useState<AgencyRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'booking'>('all');

  const isFr = locale === 'fr';

  // Charger les demandes
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('agency_requests')
        .select(`
          id, circuit_id, request_type, travelers_count, message,
          contact_name, contact_email, contact_phone, status,
          partner_notified_at, created_at,
          circuit:circuits(
            id, title_fr, slug, departure_date,
            partner:partners(name)
          )
        `)
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('request_type', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading requests:', error);
      } else {
        setRequests((data || []) as AgencyRequestItem[]);
      }

      setLoading(false);
    };

    load();
  }, [filter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            {isFr ? 'En attente' : 'Pending'}
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Send className="w-3 h-3" />
            {isFr ? 'Envoyée' : 'Sent'}
          </span>
        );
      case 'responded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <MessageCircle className="w-3 h-3" />
            {isFr ? 'Répondu' : 'Responded'}
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <CheckCircle className="w-3 h-3" />
            {isFr ? 'Clôturée' : 'Closed'}
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'info') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
          <Info className="w-3 h-3" />
          {isFr ? 'Information' : 'Information'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-terracotta-100 text-terracotta-700">
        <Send className="w-3 h-3" />
        {isFr ? 'Réservation' : 'Booking'}
      </span>
    );
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
          {isFr ? 'Mes demandes' : 'My Requests'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isFr
            ? 'Historique de vos demandes d\'information et de réservation'
            : 'History of your information and booking requests'}
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {[
          { value: 'all' as const, label: isFr ? 'Toutes' : 'All' },
          { value: 'info' as const, label: isFr ? 'Information' : 'Information' },
          { value: 'booking' as const, label: isFr ? 'Réservation' : 'Booking' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-terracotta-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isFr ? 'Aucune demande' : 'No requests'}
          </h2>
          <p className="text-gray-600 mb-6">
            {filter === 'all'
              ? (isFr
                  ? 'Vous n\'avez pas encore fait de demande. Parcourez les circuits pour commencer.'
                  : 'You haven\'t made any requests yet. Browse circuits to get started.')
              : (isFr
                  ? 'Aucune demande de ce type.'
                  : 'No requests of this type.')}
          </p>
          <Link
            href={`/${locale}/espace-pro/circuits`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"
          >
            {isFr ? 'Parcourir les circuits' : 'Browse circuits'}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {requests.map((req) => (
              <div key={req.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getTypeBadge(req.request_type)}
                      {getStatusBadge(req.status)}
                    </div>

                    {/* Circuit */}
                    <Link
                      href={`/${locale}/espace-pro/circuits/${req.circuit_id}`}
                      className="font-semibold text-gray-900 hover:text-terracotta-600 block mb-1"
                    >
                      {req.circuit?.title_fr}
                    </Link>

                    <p className="text-sm text-gray-600 mb-3">
                      {req.circuit?.partner?.name}
                      {req.circuit?.departure_date && (
                        <>
                          {' '}• {isFr ? 'Départ' : 'Departure'}:{' '}
                          {new Date(req.circuit.departure_date).toLocaleDateString(
                            locale === 'fr' ? 'fr-FR' : 'en-US',
                            { day: 'numeric', month: 'short', year: 'numeric' }
                          )}
                        </>
                      )}
                    </p>

                    {/* Message */}
                    {req.message && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-700">{req.message}</p>
                      </div>
                    )}

                    {/* Infos */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {req.travelers_count && (
                        <span>
                          {req.travelers_count} {isFr ? 'voyageur(s)' : 'traveler(s)'}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {req.contact_email}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-right text-sm text-gray-500">
                    <p>
                      {isFr ? 'Envoyée le' : 'Sent on'}
                    </p>
                    <p className="font-medium">
                      {new Date(req.created_at).toLocaleDateString(
                        locale === 'fr' ? 'fr-FR' : 'en-US',
                        { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                      )}
                    </p>
                    {req.partner_notified_at && (
                      <p className="text-xs text-green-600 mt-1">
                        {isFr ? 'Partenaire notifié' : 'Partner notified'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
