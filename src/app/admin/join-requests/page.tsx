'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/hooks/useAuthContext';

interface JoinRequest {
  id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  description: string | null;
  status: string;
  created_at: string;
  user_id: string;
}

export default function PartnerJoinRequestsPage() {
  const auth = useAuthContext();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/partner/join-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching join requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth.isLoading && auth.isPartner) {
      fetchRequests();
    } else if (!auth.isLoading && !auth.isPartner) {
      setLoading(false);
    }
  }, [auth.isLoading, auth.isPartner, fetchRequests]);

  async function handleAction(requestId: string, action: 'approve' | 'reject') {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/partner/join-requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        // Refresh the list
        await fetchRequests();
      } else {
        const data = await res.json();
        alert(data.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error handling action:', error);
      alert('Une erreur est survenue');
    } finally {
      setActionLoading(null);
    }
  }

  if (auth.isLoading || loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!auth.isPartner) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Acces reserve aux partenaires DMC.</p>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Demandes de rattachement
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerez les demandes des collaborateurs qui souhaitent rejoindre votre DMC.
        </p>
      </div>

      {/* Pending requests */}
      {pendingRequests.length === 0 && processedRequests.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande</h3>
          <p className="mt-1 text-sm text-gray-500">
            Les demandes de rattachement de vos collaborateurs apparaitront ici.
          </p>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            En attente ({pendingRequests.length})
          </h2>
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-terracotta-100 flex items-center justify-center">
                        <span className="text-terracotta-600 font-semibold text-sm">
                          {req.contact_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{req.contact_name}</p>
                        <p className="text-sm text-gray-500">{req.contact_email}</p>
                      </div>
                    </div>
                    {req.contact_phone && (
                      <p className="mt-2 text-sm text-gray-500">
                        Tel : {req.contact_phone}
                      </p>
                    )}
                    {req.description && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-3">
                        {req.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(req.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={actionLoading === req.id}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === req.id ? '...' : 'Accepter'}
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={actionLoading === req.id}
                      className="px-4 py-2 bg-white text-red-600 text-sm font-medium rounded-lg border border-red-300 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed requests */}
      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Historique
          </h2>
          <div className="space-y-3">
            {processedRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-gray-200 rounded-lg p-4 opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500 font-semibold text-xs">
                        {req.contact_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 text-sm">{req.contact_name}</p>
                      <p className="text-xs text-gray-400">{req.contact_email}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      req.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {req.status === 'approved' ? 'Accepte' : 'Refuse'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
