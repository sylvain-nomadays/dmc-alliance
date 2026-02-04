'use client';

import { useState } from 'react';
import { FileDown, Loader2, X, Eye, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Departure {
  id: string;
  start_date: string;
  end_date: string | null;
  total_seats: number;
  booked_seats: number;
  price: number | null;
  status: string;
}

interface CircuitPDFExportProps {
  circuitId: string;
  circuitTitle: string;
  departures?: Departure[];
  locale: string;
}

export function CircuitPDFExport({
  circuitId,
  circuitTitle,
  departures = [],
  locale,
}: CircuitPDFExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Options de personnalisation
  const [language, setLanguage] = useState<'fr' | 'en'>(locale === 'en' ? 'en' : 'fr');
  const [customNote, setCustomNote] = useState('');
  const [showPrice, setShowPrice] = useState(true);
  const [showCommission, setShowCommission] = useState(false);
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null);

  const isFr = locale === 'fr';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/agency/circuits/${circuitId}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          customNote: customNote.trim() || undefined,
          showPrice,
          showCommission,
          departureId: selectedDepartureId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      // Télécharger le PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${circuitTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${language}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsGenerating(false);
    }
  };

  const openDepartures = departures.filter(d =>
    d.status === 'open' && new Date(d.start_date) > new Date()
  );

  return (
    <>
      {/* Bouton principal */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-deep-blue-600 to-deep-blue-700 text-white rounded-lg hover:from-deep-blue-700 hover:to-deep-blue-800 transition-all shadow-md hover:shadow-lg"
      >
        <FileDown className="w-4 h-4" />
        {isFr ? 'Exporter PDF' : 'Export PDF'}
      </button>

      {/* Modal de personnalisation */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-deep-blue-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-deep-blue-600 to-deep-blue-700 flex items-center justify-center">
                    <FileDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {isFr ? 'Exporter l\'itinéraire en PDF' : 'Export itinerary to PDF'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {isFr ? 'Personnalisez le document avec votre logo' : 'Customize the document with your logo'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/50 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Langue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isFr ? 'Langue du document' : 'Document language'}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLanguage('fr')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      language === 'fr'
                        ? 'border-deep-blue-500 bg-deep-blue-50 text-deep-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">🇫🇷</span>
                    <span>Français</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      language === 'en'
                        ? 'border-deep-blue-500 bg-deep-blue-50 text-deep-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">🇬🇧</span>
                    <span>English</span>
                  </button>
                </div>
              </div>

              {/* Départ spécifique (optionnel) */}
              {openDepartures.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isFr ? 'Inclure un départ spécifique (optionnel)' : 'Include specific departure (optional)'}
                  </label>
                  <select
                    value={selectedDepartureId || ''}
                    onChange={(e) => setSelectedDepartureId(e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500"
                  >
                    <option value="">
                      {isFr ? '-- Sans départ spécifique --' : '-- No specific departure --'}
                    </option>
                    {openDepartures.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {formatDate(dep.start_date)} - {dep.total_seats - dep.booked_seats} {isFr ? 'places' : 'seats'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Note personnalisée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isFr ? 'Note personnalisée (optionnel)' : 'Custom note (optional)'}
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  rows={3}
                  placeholder={isFr
                    ? 'Ajoutez une note pour votre client...'
                    : 'Add a note for your client...'}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isFr
                    ? 'Cette note apparaîtra en évidence dans le document'
                    : 'This note will appear prominently in the document'}
                </p>
              </div>

              {/* Options d'affichage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Settings2 className="w-4 h-4 inline-block mr-1" />
                  {isFr ? 'Options d\'affichage' : 'Display options'}
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPrice}
                      onChange={(e) => setShowPrice(e.target.checked)}
                      className="w-5 h-5 text-deep-blue-600 border-gray-300 rounded focus:ring-deep-blue-500"
                    />
                    <div>
                      <span className="text-sm text-gray-900">
                        {isFr ? 'Afficher les prix' : 'Show prices'}
                      </span>
                      <p className="text-xs text-gray-500">
                        {isFr ? 'Prix par personne dans le document' : 'Price per person in the document'}
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCommission}
                      onChange={(e) => setShowCommission(e.target.checked)}
                      className="w-5 h-5 text-deep-blue-600 border-gray-300 rounded focus:ring-deep-blue-500"
                    />
                    <div>
                      <span className="text-sm text-gray-900">
                        {isFr ? 'Afficher la commission' : 'Show commission'}
                      </span>
                      <p className="text-xs text-gray-500">
                        {isFr ? 'Votre taux de commission (visible uniquement par vous)' : 'Your commission rate (only visible to you)'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Info sur le logo */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {isFr ? 'Votre logo sera inclus automatiquement' : 'Your logo will be included automatically'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {isFr
                        ? 'Le logo de votre agence apparaîtra en en-tête du document. Vous pouvez le modifier dans les paramètres de votre profil.'
                        : 'Your agency logo will appear in the document header. You can change it in your profile settings.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                {isFr ? 'Annuler' : 'Cancel'}
              </Button>
              <Button
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="bg-gradient-to-r from-deep-blue-600 to-deep-blue-700 hover:from-deep-blue-700 hover:to-deep-blue-800"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isFr ? 'Génération...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    {isFr ? 'Télécharger le PDF' : 'Download PDF'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CircuitPDFExport;
