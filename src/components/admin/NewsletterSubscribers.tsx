'use client';

/**
 * NewsletterSubscribers Component
 * Manages newsletter subscribers list with filters and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { ImportSubscribers } from './ImportSubscribers';

interface Subscriber {
  id: string;
  email: string;
  company_name: string | null;
  locale: string;
  interests: string[];
  source: string;
  is_active: boolean;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscribersResponse {
  subscribers: Subscriber[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function NewsletterSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [filterSource, setFilterSource] = useState('');
  const [showImport, setShowImport] = useState(false);

  const fetchSubscribers = useCallback(async () => {
    setIsLoading(true);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: '25',
    });

    if (search) params.append('search', search);
    if (filterActive) params.append('is_active', filterActive);
    if (filterSource) params.append('source', filterSource);

    try {
      const response = await fetch(`/api/admin/newsletter/subscribers?${params}`);
      const data: SubscribersResponse = await response.json();

      setSubscribers(data.subscribers || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    }

    setIsLoading(false);
  }, [page, search, filterActive, filterSource]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchSubscribers();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, filterActive, filterSource, fetchSubscribers]);

  const handleToggleActive = async (subscriber: Subscriber) => {
    try {
      await fetch('/api/admin/newsletter/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subscriber.id,
          is_active: !subscriber.is_active,
        }),
      });

      setSubscribers(prev =>
        prev.map(s =>
          s.id === subscriber.id ? { ...s, is_active: !s.is_active } : s
        )
      );
    } catch (error) {
      console.error('Error updating subscriber:', error);
    }
  };

  const handleDelete = async (subscriber: Subscriber) => {
    if (!confirm(`Supprimer ${subscriber.email} de la liste ?`)) return;

    try {
      await fetch(`/api/admin/newsletter/subscribers?id=${subscriber.id}`, {
        method: 'DELETE',
      });

      setSubscribers(prev => prev.filter(s => s.id !== subscriber.id));
      setTotal(prev => prev - 1);
    } catch (error) {
      console.error('Error deleting subscriber:', error);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Email', 'Entreprise', 'Langue', 'Source', 'Actif', 'Date inscription'].join(','),
      ...subscribers.map(s => [
        s.email,
        s.company_name || '',
        s.locale,
        s.source,
        s.is_active ? 'Oui' : 'Non',
        new Date(s.created_at).toLocaleDateString('fr-FR'),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sourceLabels: Record<string, string> = {
    website: 'Site web',
    import: 'Import',
    manual: 'Manuel',
  };

  return (
    <div>
      {/* Import Modal */}
      <ImportSubscribers
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => {
          setShowImport(false);
          fetchSubscribers();
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500">Total contacts</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-green-600">
            {subscribers.filter(s => s.is_active).length}
          </p>
          <p className="text-sm text-gray-500">Actifs</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-400">
            {subscribers.filter(s => !s.is_active).length}
          </p>
          <p className="text-sm text-gray-500">Inactifs</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-terracotta-600">
            {subscribers.filter(s => s.source === 'website').length}
          </p>
          <p className="text-sm text-gray-500">Via site web</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par email ou entreprise..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500"
          >
            <option value="">Tous statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500"
          >
            <option value="">Toutes sources</option>
            <option value="website">Site web</option>
            <option value="import">Import</option>
            <option value="manual">Manuel</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
          >
            Exporter CSV
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors text-sm"
          >
            Importer
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Chargement...</p>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun contact</h3>
            <p className="text-gray-500 mb-4">Importez vos premiers contacts</p>
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"
            >
              Importer des contacts
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entreprise
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{subscriber.email}</p>
                        <p className="text-xs text-gray-400">{subscriber.locale.toUpperCase()}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {subscriber.company_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {sourceLabels[subscriber.source] || subscriber.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(subscriber)}
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                            subscriber.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {subscriber.is_active ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(subscriber.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleDelete(subscriber)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} sur {totalPages} ({total} contacts)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
