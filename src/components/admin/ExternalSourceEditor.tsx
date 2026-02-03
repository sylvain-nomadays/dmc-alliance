'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ExternalSource {
  id?: string;
  source_url: string;
  source_type: 'web_scraping' | 'api' | 'manual';
  sync_frequency: 'hourly' | 'daily' | 'weekly' | 'manual';
  selector_config?: {
    placesAvailable?: string;
    placesTotal?: string;
    departureDates?: string;
    status?: string;
  };
  last_sync_at?: string;
  last_sync_status?: string;
  last_sync_error?: string;
  is_active: boolean;
}

interface ExternalSourceEditorProps {
  circuitId: string;
}

export function ExternalSourceEditor({ circuitId }: ExternalSourceEditorProps) {
  const [source, setSource] = useState<ExternalSource>({
    source_url: '',
    source_type: 'web_scraping',
    sync_frequency: 'daily',
    selector_config: {},
    is_active: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    places_available?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (circuitId && circuitId !== 'new') {
      fetchSource();
    }
  }, [circuitId]);

  async function fetchSource() {
    setIsLoading(true);
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('external_sources')
      .select('*')
      .eq('circuit_id', circuitId)
      .single();

    if (!error && data) {
      setSource(data);
    }
    setIsLoading(false);
  }

  async function saveSource() {
    if (!circuitId || circuitId === 'new') {
      alert('Veuillez d\'abord sauvegarder le circuit.');
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    try {
      if (source.id) {
        // Update
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('external_sources')
          .update({
            source_url: source.source_url,
            source_type: source.source_type,
            sync_frequency: source.sync_frequency,
            selector_config: source.selector_config,
            is_active: source.is_active,
          })
          .eq('id', source.id);

        if (error) throw error;
      } else {
        // Insert
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error, data } = await (supabase as any)
          .from('external_sources')
          .insert({
            circuit_id: circuitId,
            source_url: source.source_url,
            source_type: source.source_type,
            sync_frequency: source.sync_frequency,
            selector_config: source.selector_config,
            is_active: source.is_active,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setSource(data);
      }

      // Update circuit external_source_url
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('circuits')
        .update({
          external_source_url: source.source_url,
          auto_sync_enabled: source.is_active,
        })
        .eq('id', circuitId);

      alert('Source externe enregistrée !');
    } catch (error) {
      console.error('Error saving source:', error);
      alert('Erreur lors de la sauvegarde');
    }

    setIsSaving(false);
  }

  async function triggerSync() {
    if (!source.source_url) {
      alert('Veuillez d\'abord configurer une URL source.');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/gir/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit_id: circuitId,
          source_url: source.source_url,
          selector_config: source.selector_config,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSyncResult({
          success: true,
          places_available: result.data?.places_available,
        });
        // Refresh source to get updated sync status
        fetchSource();
      } else {
        setSyncResult({
          success: false,
          error: result.error || 'Échec de la synchronisation',
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur réseau',
      });
    }

    setIsSyncing(false);
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">Synchronisation externe</h4>
          <p className="text-sm text-gray-500">
            Récupérer automatiquement le remplissage depuis un site externe
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={source.is_active}
            onChange={(e) => setSource({ ...source, is_active: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-terracotta-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terracotta-500"></div>
        </label>
      </div>

      {/* Source URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL de la page source
        </label>
        <input
          type="url"
          value={source.source_url}
          onChange={(e) => setSource({ ...source, source_url: e.target.value })}
          placeholder="https://www.voyage-mongolie.com/circuit/entre-steppe-et-desert"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          L'URL de la page contenant les informations de remplissage
        </p>
      </div>

      {/* Source type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de source
          </label>
          <select
            value={source.source_type}
            onChange={(e) =>
              setSource({
                ...source,
                source_type: e.target.value as ExternalSource['source_type'],
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
          >
            <option value="web_scraping">Web Scraping (HTML)</option>
            <option value="api">API (JSON)</option>
            <option value="manual">Manuel</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fréquence de sync
          </label>
          <select
            value={source.sync_frequency}
            onChange={(e) =>
              setSource({
                ...source,
                sync_frequency: e.target.value as ExternalSource['sync_frequency'],
              })
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
          >
            <option value="hourly">Toutes les heures</option>
            <option value="daily">Quotidienne</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="manual">Manuelle uniquement</option>
          </select>
        </div>
      </div>

      {/* Selector config (for web scraping) */}
      {source.source_type === 'web_scraping' && (
        <div className="p-4 border border-gray-200 rounded-lg space-y-4">
          <h5 className="font-medium text-gray-900 text-sm">
            Configuration des sélecteurs CSS
          </h5>
          <p className="text-xs text-gray-500">
            Optionnel - Si non renseigné, des sélecteurs par défaut seront utilisés
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Places disponibles
              </label>
              <input
                type="text"
                value={source.selector_config?.placesAvailable || ''}
                onChange={(e) =>
                  setSource({
                    ...source,
                    selector_config: {
                      ...source.selector_config,
                      placesAvailable: e.target.value,
                    },
                  })
                }
                placeholder=".places-restantes"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-terracotta-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Places totales
              </label>
              <input
                type="text"
                value={source.selector_config?.placesTotal || ''}
                onChange={(e) =>
                  setSource({
                    ...source,
                    selector_config: {
                      ...source.selector_config,
                      placesTotal: e.target.value,
                    },
                  })
                }
                placeholder=".places-total"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-terracotta-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Dates de départ
              </label>
              <input
                type="text"
                value={source.selector_config?.departureDates || ''}
                onChange={(e) =>
                  setSource({
                    ...source,
                    selector_config: {
                      ...source.selector_config,
                      departureDates: e.target.value,
                    },
                  })
                }
                placeholder=".departure-date"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-terracotta-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Statut (complet/disponible)
              </label>
              <input
                type="text"
                value={source.selector_config?.status || ''}
                onChange={(e) =>
                  setSource({
                    ...source,
                    selector_config: {
                      ...source.selector_config,
                      status: e.target.value,
                    },
                  })
                }
                placeholder=".booking-status"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-terracotta-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Last sync status */}
      {source.last_sync_at && (
        <div
          className={`p-4 rounded-lg ${
            source.last_sync_status === 'success'
              ? 'bg-sage-50 border border-sage-200'
              : source.last_sync_status === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {source.last_sync_status === 'success' ? (
                  <span className="text-sage-700">✓ Dernière sync réussie</span>
                ) : source.last_sync_status === 'error' ? (
                  <span className="text-red-700">✗ Dernière sync en erreur</span>
                ) : (
                  <span className="text-gray-700">Sync en cours...</span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(source.last_sync_at).toLocaleString('fr-FR')}
              </p>
              {source.last_sync_error && (
                <p className="text-xs text-red-600 mt-1">{source.last_sync_error}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sync result */}
      {syncResult && (
        <div
          className={`p-4 rounded-lg ${
            syncResult.success
              ? 'bg-sage-50 border border-sage-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {syncResult.success ? (
            <p className="text-sage-700">
              ✓ Synchronisation réussie !{' '}
              {syncResult.places_available !== undefined && (
                <strong>{syncResult.places_available} places disponibles</strong>
              )}
            </p>
          ) : (
            <p className="text-red-700">✗ {syncResult.error}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={saveSource}
          disabled={isSaving}
          className="flex-1 px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer la configuration'}
        </button>

        <button
          type="button"
          onClick={triggerSync}
          disabled={isSyncing || !source.source_url}
          className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sync...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Synchroniser
            </>
          )}
        </button>
      </div>
    </div>
  );
}
