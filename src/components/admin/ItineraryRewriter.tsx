'use client';

import { useState } from 'react';
import { Sparkles, Wand2, Heart, BookOpen, Compass, Loader2, Check, X } from 'lucide-react';

export interface ItineraryDay {
  day: number;
  title_fr: string;
  title_en: string;
  description_fr: string;
  description_en: string;
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  accommodation: string;
}

export type RewriteStyle = 'emotional' | 'informative' | 'adventurous';

interface StyleOption {
  id: RewriteStyle;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  example: string;
}

const STYLES: StyleOption[] = [
  {
    id: 'emotional',
    name: 'Marketing Émotionnel',
    description: 'Fait rêver avec des images sensorielles et des émotions',
    icon: <Heart className="w-5 h-5" />,
    color: 'rose',
    example: '"Imaginez-vous au lever du soleil sur les steppes infinies..."',
  },
  {
    id: 'informative',
    name: 'Informatif Pro',
    description: 'Factuel, précis et détaillé pour les professionnels',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'blue',
    example: '"Transfert de 45 km (2h) jusqu\'au monastère de Erdene Zuu..."',
  },
  {
    id: 'adventurous',
    name: 'Aventurier Immersif',
    description: 'Storytelling dynamique et ton d\'aventure',
    icon: <Compass className="w-5 h-5" />,
    color: 'amber',
    example: '"Votre aventure commence ! Cap vers les montagnes sacrées..."',
  },
];

interface ItineraryRewriterProps {
  itinerary: ItineraryDay[];
  onRewrite: (rewrittenItinerary: ItineraryDay[], style: RewriteStyle, language: 'fr' | 'en') => void;
  circuitTitle?: string;
  destination?: string;
  className?: string;
}

export function ItineraryRewriter({
  itinerary,
  onRewrite,
  circuitTitle,
  destination,
  className = '',
}: ItineraryRewriterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<RewriteStyle | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ItineraryDay[] | null>(null);

  const handleRewrite = async () => {
    if (!selectedStyle) return;

    setIsLoading(true);
    setError(null);
    setPreview(null);

    try {
      const response = await fetch('/api/ai/rewrite-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary,
          style: selectedStyle,
          language: selectedLanguage,
          circuitTitle,
          destination,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la réécriture');
      }

      const data = await response.json();
      setPreview(data.itinerary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (preview && selectedStyle) {
      onRewrite(preview, selectedStyle, selectedLanguage);
      setIsOpen(false);
      setPreview(null);
      setSelectedStyle(null);
    }
  };

  const handleCancel = () => {
    setPreview(null);
  };

  const getStyleColor = (style: StyleOption, isSelected: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      rose: {
        bg: isSelected ? 'bg-rose-100' : 'bg-white hover:bg-rose-50',
        border: isSelected ? 'border-rose-500' : 'border-gray-200 hover:border-rose-300',
        text: isSelected ? 'text-rose-700' : 'text-gray-700',
      },
      blue: {
        bg: isSelected ? 'bg-blue-100' : 'bg-white hover:bg-blue-50',
        border: isSelected ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300',
        text: isSelected ? 'text-blue-700' : 'text-gray-700',
      },
      amber: {
        bg: isSelected ? 'bg-amber-100' : 'bg-white hover:bg-amber-50',
        border: isSelected ? 'border-amber-500' : 'border-gray-200 hover:border-amber-300',
        text: isSelected ? 'text-amber-700' : 'text-gray-700',
      },
    };
    return colors[style.color];
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg ${className}`}
      >
        <Sparkles className="w-4 h-4" />
        Réécrire avec l&apos;IA
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Réécriture IA de l&apos;itinéraire
                </h2>
                <p className="text-sm text-gray-500">
                  Choisissez un style pour transformer votre programme
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setPreview(null);
                setSelectedStyle(null);
              }}
              className="p-2 hover:bg-white/50 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {!preview ? (
            <>
              {/* Language Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue à réécrire
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedLanguage('fr')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedLanguage === 'fr'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    🇫🇷 Français
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLanguage('en')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedLanguage === 'en'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {/* Style Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Style de réécriture
                </label>
                <div className="space-y-3">
                  {STYLES.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    const colors = getStyleColor(style, isSelected);

                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedStyle(style.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${colors.bg} ${colors.border}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? `bg-${style.color}-200` : 'bg-gray-100'}`}>
                            {style.icon}
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium ${colors.text}`}>
                              {style.name}
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">
                              {style.description}
                            </div>
                            <div className="text-xs text-gray-400 mt-2 italic">
                              {style.example}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className={`w-5 h-5 text-${style.color}-600`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Info */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <strong>💡 Bon à savoir :</strong> La réécriture conserve toutes les informations factuelles (lieux, distances, durées) tout en adaptant le ton et le style du texte.
              </div>
            </>
          ) : (
            /* Preview */
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  Aperçu de la réécriture
                </h3>
                <span className="text-sm text-gray-500">
                  Style : {STYLES.find(s => s.id === selectedStyle)?.name}
                </span>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {preview.map((day, index) => {
                  const originalDay = itinerary[index];
                  const langField = selectedLanguage === 'fr' ? 'fr' : 'en';
                  const titleField = `title_${langField}` as keyof ItineraryDay;
                  const descField = `description_${langField}` as keyof ItineraryDay;

                  return (
                    <div key={day.day} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-700">Jour {day.day}</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {/* Title comparison */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Titre</div>
                          <div className="text-sm text-gray-400 line-through">
                            {originalDay[titleField] as string}
                          </div>
                          <div className="text-sm text-gray-900 font-medium">
                            {day[titleField] as string}
                          </div>
                        </div>
                        {/* Description comparison */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Description</div>
                          <div className="text-xs text-gray-400 line-through line-clamp-2">
                            {originalDay[descField] as string}
                          </div>
                          <div className="text-sm text-gray-700 mt-1">
                            {day[descField] as string}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          {!preview ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedStyle(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleRewrite}
                disabled={!selectedStyle || isLoading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Réécriture en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Générer la réécriture
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Recommencer
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Appliquer cette version
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
