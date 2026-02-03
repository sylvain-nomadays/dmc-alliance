'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import {
  Check, X, Clock, Eye, Globe, Mail, Phone,
  ExternalLink, Building2, ChevronDown
} from 'lucide-react';
import type { PartnerRegistrationRequest } from '@/types/database';

interface RequestWithProfile extends PartnerRegistrationRequest {
  profile?: {
    email: string;
    full_name: string | null;
  };
}

interface Partner {
  id: string;
  name: string;
  slug: string;
}

export default function PartnerRequestsPage() {
  const [requests, setRequests] = useState<RequestWithProfile[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<RequestWithProfile | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalMode, setApprovalMode] = useState<'new' | 'existing'>('new');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Charger les demandes
  const loadRequests = async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('partner_registration_requests')
      .select('*, profile:profiles!partner_registration_requests_user_id_fkey(email, full_name)')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading requests:', error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  // Charger les partenaires existants
  const loadPartners = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('partners')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');

    setPartners(data || []);
  };

  useEffect(() => {
    loadRequests();
    loadPartners();
  }, [filter]);

  // Approuver une demande
  const handleApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/partner-requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: approvalMode,
          partnerId: approvalMode === 'existing' ? selectedPartnerId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'approbation');
      }

      // Rafraîchir la liste
      await loadRequests();
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalMode('new');
      setSelectedPartnerId('');
    } catch (error) {
      console.error('Approval error:', error);
      alert(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  // Rejeter une demande
  const handleReject = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/partner-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du rejet');
      }

      await loadRequests();
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectReason('');
    } catch (error) {
      console.error('Reject error:', error);
      alert(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setActionLoading(false);
    }
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
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="w-3 h-3" />
            Approuvée
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="w-3 h-3" />
            Refusée
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">
            Demandes d&apos;inscription DMC
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez les demandes d&apos;adhésion des nouveaux partenaires
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-terracotta-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f === 'all' && 'Toutes'}
            {f === 'pending' && 'En attente'}
            {f === 'approved' && 'Approuvées'}
            {f === 'rejected' && 'Refusées'}
          </button>
        ))}
      </div>

      {/* Liste des demandes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Chargement...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune demande {filter !== 'all' ? `${filter === 'pending' ? 'en attente' : filter === 'approved' ? 'approuvée' : 'refusée'}` : ''}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* Info principale */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {request.partner_name}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{request.contact_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${request.contact_email}`} className="text-terracotta-600 hover:underline">
                          {request.contact_email}
                        </a>
                      </div>
                      {request.contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{request.contact_phone}</span>
                        </div>
                      )}
                      {request.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <a
                            href={request.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-terracotta-600 hover:underline flex items-center gap-1"
                          >
                            Site web <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Destinations */}
                    {request.destinations && request.destinations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {request.destinations.map((dest) => (
                          <span
                            key={dest}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {dest}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Date */}
                    <p className="mt-3 text-xs text-gray-500">
                      Demande reçue le {new Date(request.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Voir les détails"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowApprovalModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approuver"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Rejeter"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {selectedRequest && !showApprovalModal && !showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-heading text-gray-900">
                  {selectedRequest.partner_name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Demande du {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Statut */}
              <div>
                <span className="text-sm text-gray-500">Statut</span>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Contact</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nom</span>
                    <p className="font-medium">{selectedRequest.contact_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email</span>
                    <p className="font-medium">{selectedRequest.contact_email}</p>
                  </div>
                  {selectedRequest.contact_phone && (
                    <div>
                      <span className="text-gray-500">Téléphone</span>
                      <p className="font-medium">{selectedRequest.contact_phone}</p>
                    </div>
                  )}
                  {selectedRequest.website && (
                    <div>
                      <span className="text-gray-500">Site web</span>
                      <p>
                        <a
                          href={selectedRequest.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-terracotta-600 hover:underline"
                        >
                          {selectedRequest.website}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Destinations */}
              {selectedRequest.destinations && selectedRequest.destinations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Destinations couvertes</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.destinations.map((dest) => (
                      <span key={dest} className="px-3 py-1 bg-terracotta-100 text-terracotta-800 rounded-full text-sm">
                        {dest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Spécialités */}
              {selectedRequest.specialties && selectedRequest.specialties.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Spécialités</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.specialties.map((spec) => (
                      <span key={spec} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedRequest.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              )}

              {/* GIR */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Circuits GIR</h4>
                <p className="text-gray-600">
                  {selectedRequest.has_gir
                    ? 'Ce DMC propose des circuits GIR'
                    : 'Ce DMC ne propose pas de circuits GIR'
                  }
                </p>
              </div>

              {/* Admin notes */}
              {selectedRequest.admin_notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notes admin</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedRequest.admin_notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedRequest.status === 'pending' && (
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                >
                  Rejeter
                </Button>
                <Button
                  onClick={() => {
                    setShowApprovalModal(true);
                  }}
                >
                  Approuver
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Approbation */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-heading text-gray-900">
                Approuver la demande
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Choisissez comment associer ce compte
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Option 1: Créer un nouveau partenaire */}
              <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                approvalMode === 'new' ? 'border-terracotta-500 bg-terracotta-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="approvalMode"
                  value="new"
                  checked={approvalMode === 'new'}
                  onChange={() => setApprovalMode('new')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">Créer un nouveau partenaire</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Un nouveau partenaire &quot;{selectedRequest.partner_name}&quot; sera créé automatiquement
                  </p>
                </div>
              </label>

              {/* Option 2: Lier à un partenaire existant */}
              <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                approvalMode === 'existing' ? 'border-terracotta-500 bg-terracotta-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="approvalMode"
                  value="existing"
                  checked={approvalMode === 'existing'}
                  onChange={() => setApprovalMode('existing')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Lier à un partenaire existant</p>
                  <p className="text-sm text-gray-500 mt-1 mb-3">
                    Associer ce compte à un partenaire déjà enregistré
                  </p>

                  {approvalMode === 'existing' && (
                    <div className="relative">
                      <select
                        value={selectedPartnerId}
                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 appearance-none"
                      >
                        <option value="">Sélectionner un partenaire...</option>
                        {partners.map((partner) => (
                          <option key={partner.id} value={partner.id}>
                            {partner.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalMode('new');
                  setSelectedPartnerId('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleApprove}
                loading={actionLoading}
                disabled={approvalMode === 'existing' && !selectedPartnerId}
              >
                Approuver
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejet */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-heading text-gray-900">
                Rejeter la demande
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedRequest.partner_name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif du refus (optionnel)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500"
                  placeholder="Expliquez brièvement la raison du refus..."
                />
                <p className="mt-2 text-xs text-gray-500">
                  Ce message sera inclus dans l&apos;email envoyé au demandeur
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                onClick={handleReject}
                loading={actionLoading}
              >
                Rejeter la demande
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
