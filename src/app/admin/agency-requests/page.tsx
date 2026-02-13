'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/hooks/useAuthContext';
import {
  Calendar, Clock, Mail, Send, Info, CheckCircle, MessageCircle,
  Filter, XCircle, Users, Phone, ChevronDown, ChevronUp
} from 'lucide-react';

interface AgencyRequestRow {
  id: string;
  request_type: 'info' | 'booking';
  travelers_count: number | null;
  message: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  status: string;
  partner_notified_at: string | null;
  partner_response_message: string | null;
  responded_at: string | null;
  created_at: string;
  departure_id: string | null;
  circuit: {
    id: string;
    title: string;
    slug: string;
  };
  agency: {
    id: string;
    name: string;
  };
}

type FilterStatus = 'all' | 'pending' | 'sent' | 'accepted' | 'rejected';

export default function AdminAgencyRequestsPage() {
  const authContext = useAuthContext();
  const [requests, setRequests] = useState<AgencyRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Response modal state
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondAction, setRespondAction] = useState<'accept' | 'reject' | null>(null);
  const [respondMessage, setRespondMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    if (authContext.isLoading) return;
    loadRequests();
  }, [authContext.isLoading, filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const url = filter !== 'all'
        ? `/api/partner/requests?status=${filter}`
        : '/api/partner/requests';

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRequests((data.requests || []) as AgencyRequestRow[]);
      } else {
        console.error('Error loading requests:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
    setLoading(false);
  };

  const handleRespond = async () => {
    if (!respondingId || !respondAction) return;

    setIsResponding(true);
    try {
      const response = await fetch(`/api/agency/requests/${respondingId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: respondAction,
          message: respondMessage || undefined,
        }),
      });

      if (response.ok) {
        // Reload requests
        await loadRequests();
        closeModal();
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la réponse');
      }
    } catch (error) {
      console.error('Error responding:', error);
      alert('Erreur lors de la réponse');
    } finally {
      setIsResponding(false);
    }
  };

  const closeModal = () => {
    setRespondingId(null);
    setRespondAction(null);
    setRespondMessage('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Send className="w-3 h-3" />
            Envoyée
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Acceptée
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Refusée
          </span>
        );
      case 'responded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <MessageCircle className="w-3 h-3" />
            Répondu
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <CheckCircle className="w-3 h-3" />
            Clôturée
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
          Information
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-terracotta-100 text-terracotta-700">
        <Send className="w-3 h-3" />
        Réservation
      </span>
    );
  };

  const canRespond = (status: string) => ['pending', 'sent'].includes(status);

  if (loading && requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Demandes des agences
        </h1>
        <p className="text-gray-600 mt-1">
          Gérez les demandes de réservation et d&apos;information reçues des agences
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {([
          { value: 'all' as const, label: 'Toutes' },
          { value: 'pending' as const, label: 'En attente' },
          { value: 'sent' as const, label: 'Envoyées' },
          { value: 'accepted' as const, label: 'Acceptées' },
          { value: 'rejected' as const, label: 'Refusées' },
        ]).map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-deep-blue-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune demande
          </h2>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'Aucune demande reçue pour le moment.'
              : 'Aucune demande avec ce statut.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {requests.map((req) => (
              <div key={req.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col gap-4">
                  {/* Top row */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {getTypeBadge(req.request_type)}
                        {getStatusBadge(req.status)}
                      </div>

                      {/* Circuit title */}
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {req.circuit?.title || 'Circuit inconnu'}
                      </h3>

                      {/* Agency */}
                      <p className="text-sm text-gray-600 mb-2">
                        Agence : <span className="font-medium">{req.agency?.name || 'Inconnue'}</span>
                      </p>

                      {/* Contact info */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {req.contact_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {req.contact_email}
                        </span>
                        {req.contact_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {req.contact_phone}
                          </span>
                        )}
                        {req.travelers_count && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {req.travelers_count} voyageur(s)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date + actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right text-sm text-gray-500">
                        <p className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(req.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>

                      {/* Accept/Reject buttons */}
                      {canRespond(req.status) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setRespondingId(req.id);
                              setRespondAction('accept');
                            }}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => {
                              setRespondingId(req.id);
                              setRespondAction('reject');
                            }}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand/collapse for message */}
                  {req.message && (
                    <div>
                      <button
                        onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                      >
                        {expandedId === req.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Message de l&apos;agence
                      </button>
                      {expandedId === req.id && (
                        <div className="mt-2 bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">{req.message}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Partner response (if responded) */}
                  {req.partner_response_message && (
                    <div className={`rounded-lg p-3 ${
                      req.status === 'accepted' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className="text-xs font-medium text-gray-500 mb-1">Votre réponse :</p>
                      <p className="text-sm text-gray-700">{req.partner_response_message}</p>
                      {req.responded_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(req.responded_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response modal */}
      {respondingId && respondAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {respondAction === 'accept' ? 'Accepter la demande' : 'Refuser la demande'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {respondAction === 'accept'
                ? 'L\'agence sera notifiée que sa demande a été acceptée.'
                : 'L\'agence sera notifiée que sa demande a été refusée. Vous pouvez indiquer un motif.'}
            </p>
            <div className="mb-4">
              <label htmlFor="respondMessage" className="block text-sm font-medium text-gray-700 mb-2">
                Message {respondAction === 'reject' ? '' : '(optionnel)'}
              </label>
              <textarea
                id="respondMessage"
                value={respondMessage}
                onChange={(e) => setRespondMessage(e.target.value)}
                placeholder={respondAction === 'accept'
                  ? 'Message facultatif pour l\'agence...'
                  : 'Motif du refus...'}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-deep-blue-500 resize-none text-sm"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRespond}
                disabled={isResponding}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  respondAction === 'accept'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } ${isResponding ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isResponding
                  ? 'Envoi...'
                  : respondAction === 'accept'
                    ? 'Confirmer l\'acceptation'
                    : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
