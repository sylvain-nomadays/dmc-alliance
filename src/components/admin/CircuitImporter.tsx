'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface CircuitImporterProps {
  circuitId?: string;
  destinationId?: string;
  partnerId?: string;
  onImportComplete?: (data: ImportResult) => void;
}

interface ImportResult {
  success: boolean;
  action?: 'created' | 'updated';
  circuit_id?: string;
  slug?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export function CircuitImporter({
  circuitId,
  destinationId,
  partnerId,
  onImportComplete,
}: CircuitImporterProps) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [showRawInput, setShowRawInput] = useState(false);
  const [rewriteForB2B, setRewriteForB2B] = useState(true);
  const [createNew, setCreateNew] = useState(!circuitId);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);

  const handleImport = async (preview = false) => {
    if (!sourceUrl && !rawContent) {
      setResult({ success: false, error: 'Veuillez entrer une URL source ou coller le contenu HTML' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/gir/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: sourceUrl || undefined,
          raw_content: rawContent || undefined,
          circuit_id: circuitId,
          create_new: createNew,
          rewrite_for_b2b: rewriteForB2B,
          destination_id: destinationId,
          partner_id: partnerId,
          preview,  // Si true, ne pas sauvegarder
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requires_manual_content) {
          setShowRawInput(true);
          setResult({
            success: false,
            error: 'Le contenu ne peut pas être récupéré automatiquement (page dynamique). Veuillez coller le HTML manuellement.',
          });
        } else {
          setResult({ success: false, error: data.error });
        }
        return;
      }

      if (preview) {
        setPreviewData(data.data);
      } else {
        setResult(data);
        if (onImportComplete) {
          onImportComplete(data);
        }
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'import',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we're missing required fields for new circuit creation
  const isNewCircuit = !circuitId;
  const missingRequiredFields = isNewCircuit && createNew && (!destinationId || !partnerId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-heading text-gray-900 mb-4">
        Importer un circuit depuis une URL
      </h3>

      {/* Warning if missing destination or partner for new circuit */}
      {missingRequiredFields && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Action requise avant l&apos;import
          </p>
          <p className="text-sm text-amber-700 mt-2">
            Pour importer un nouveau circuit, veuillez d&apos;abord sélectionner une <strong>destination</strong> et un <strong>partenaire</strong> dans l&apos;onglet &quot;Général&quot;.
          </p>
        </div>
      )}

      <p className="text-sm text-gray-600 mb-4">
        Entrez l'URL du circuit source. Le contenu sera automatiquement extrait et réécrit pour
        éviter la duplication de contenu tout en l'adaptant à une clientèle B2B.
      </p>

      {/* URL Source */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL du circuit source
        </label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://www.example.com/circuit/nom-du-circuit"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Ex: https://www.voyage-mongolie.com/circuit/entre-steppe-et-desert
        </p>
      </div>

      {/* Option pour contenu manuel */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowRawInput(!showRawInput)}
          className="text-sm text-terracotta-600 hover:text-terracotta-700"
        >
          {showRawInput ? '− Masquer' : '+ Coller le contenu HTML manuellement'}
        </button>

        {showRawInput && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenu HTML (si la page utilise JavaScript)
            </label>
            <textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="Collez ici le HTML de la page (Ctrl+U dans le navigateur pour voir le source)"
              rows={6}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 font-mono text-xs"
            />
            <p className="text-xs text-gray-500 mt-1">
              Astuce: Faites clic-droit → "Afficher le code source" puis copiez tout le contenu
            </p>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-4 mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rewriteForB2B}
            onChange={(e) => setRewriteForB2B(e.target.checked)}
            className="rounded border-gray-300 text-terracotta-500 focus:ring-terracotta-500"
          />
          <span className="text-sm text-gray-700">
            Réécrire le contenu pour B2B (évite la duplication)
          </span>
        </label>

        {!circuitId && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createNew}
              onChange={(e) => setCreateNew(e.target.checked)}
              className="rounded border-gray-300 text-terracotta-500 focus:ring-terracotta-500"
            />
            <span className="text-sm text-gray-700">
              Créer un nouveau circuit
            </span>
          </label>
        )}
      </div>

      {/* Boutons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => handleImport(true)}
          disabled={isLoading || (!sourceUrl && !rawContent) || missingRequiredFields}
        >
          {isLoading ? 'Extraction...' : 'Prévisualiser'}
        </Button>
        <Button
          variant="primary"
          onClick={() => handleImport(false)}
          disabled={isLoading || (!sourceUrl && !rawContent) || missingRequiredFields}
        >
          {isLoading ? 'Import en cours...' : 'Importer et sauvegarder'}
        </Button>
      </div>

      {/* Résultat */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.success ? (
            <div>
              <p className="text-green-700 font-medium">
                ✓ Circuit {result.action === 'created' ? 'créé' : 'mis à jour'} avec succès
              </p>
              {result.circuit_id && (
                <p className="text-sm text-green-600 mt-1">
                  ID: {result.circuit_id}
                  {result.slug && ` | Slug: ${result.slug}`}
                </p>
              )}
            </div>
          ) : (
            <p className="text-red-700">{result.error}</p>
          )}
        </div>
      )}

      {/* Prévisualisation */}
      {previewData && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Prévisualisation du contenu extrait</h4>

          <div className="space-y-4">
            {typeof previewData.title === 'string' && previewData.title && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Titre</span>
                <p className="text-gray-900">{previewData.title}</p>
              </div>
            )}

            {typeof previewData.description_fr === 'string' && previewData.description_fr && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Description</span>
                <p className="text-gray-700 text-sm">{previewData.description_fr.substring(0, 300)}...</p>
              </div>
            )}

            {Array.isArray(previewData.highlights_fr) && previewData.highlights_fr.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Points forts</span>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {(previewData.highlights_fr as string[]).slice(0, 5).map((h, i) => (
                    <li key={i}>{String(h)}</li>
                  ))}
                </ul>
              </div>
            )}

            {typeof previewData.duration_days === 'number' && previewData.duration_days > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Durée</span>
                <p className="text-gray-900">{previewData.duration_days} jours</p>
              </div>
            )}

            {typeof previewData.price_from === 'number' && previewData.price_from > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Prix à partir de</span>
                <p className="text-gray-900">{previewData.price_from.toLocaleString('fr-FR')} €</p>
              </div>
            )}

            {Array.isArray(previewData.itinerary) && previewData.itinerary.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Itinéraire ({previewData.itinerary.length} jours)
                </span>
                <ul className="text-sm text-gray-700 mt-1 space-y-1">
                  {(previewData.itinerary as Array<{day: number; title_fr: string}>).slice(0, 3).map((day, i) => (
                    <li key={i} className="text-gray-600">
                      <span className="font-medium">Jour {day.day}:</span> {day.title_fr}
                    </li>
                  ))}
                  {previewData.itinerary.length > 3 && (
                    <li className="text-gray-400">... et {previewData.itinerary.length - 3} jours de plus</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setPreviewData(null)}>
              Fermer la prévisualisation
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleImport(false)}>
              Confirmer et sauvegarder
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
