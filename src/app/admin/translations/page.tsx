'use client';

/**
 * Admin page for managing translations
 * Shows translation status and allows batch translation
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import TranslationPushButton from '@/components/admin/TranslationPushButton';
import type { TranslatableContentType } from '@/lib/translation/types';

interface ContentItem {
  id: string;
  name: string;
  type: TranslatableContentType;
  lastTranslated: string | null;
  hasAllTranslations: boolean;
}

interface TranslationJob {
  id: string;
  content_type: string;
  content_id: string;
  status: string;
  progress: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

const CONTENT_TYPES: { type: TranslatableContentType; label: string; table: string; nameField: string }[] = [
  { type: 'destination', label: 'Destinations', table: 'destinations', nameField: 'name' },
  { type: 'article', label: 'Articles', table: 'articles', nameField: 'title' },
  { type: 'circuit', label: 'Circuits', table: 'circuits', nameField: 'title' },
  { type: 'partner', label: 'Partenaires', table: 'partners', nameField: 'name' },
];

export default function TranslationsPage() {
  const [selectedType, setSelectedType] = useState<TranslatableContentType>('destination');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [recentJobs, setRecentJobs] = useState<TranslationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [translatingAll, setTranslatingAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedType]);

  async function fetchData() {
    setIsLoading(true);
    const supabase = createClient();

    const config = CONTENT_TYPES.find((c) => c.type === selectedType);
    if (!config) return;

    // Fetch content items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: items } = await (supabase as any)
      .from(config.table)
      .select(`id, ${config.nameField}, translations_updated_at`)
      .order(config.nameField);

    const mappedItems: ContentItem[] = (items || []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      name: item[config.nameField] as string || 'Sans nom',
      type: selectedType,
      lastTranslated: item.translations_updated_at as string | null,
      hasAllTranslations: !!item.translations_updated_at,
    }));

    setContentItems(mappedItems);

    // Fetch recent translation jobs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: jobs } = await (supabase as any)
      .from('translation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    setRecentJobs(jobs || []);
    setIsLoading(false);
  }

  async function translateAllMissing() {
    setTranslatingAll(true);
    const itemsToTranslate = contentItems.filter((item) => !item.hasAllTranslations);

    for (const item of itemsToTranslate) {
      try {
        await fetch('/api/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: item.type,
            contentId: item.id,
          }),
        });
      } catch (error) {
        console.error(`Error translating ${item.name}:`, error);
      }
    }

    setTranslatingAll(false);
    fetchData();
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-sage-100 text-sage-700',
    failed: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminé',
    failed: 'Échoué',
  };

  const missingCount = contentItems.filter((item) => !item.hasAllTranslations).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">Traductions</h1>
          <p className="text-gray-600 mt-1">
            Gérez les traductions automatiques du contenu (FR → EN, DE, NL, ES, IT)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total contenus</p>
          <p className="text-2xl font-bold text-gray-900">{contentItems.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Traduits</p>
          <p className="text-2xl font-bold text-sage-600">
            {contentItems.filter((i) => i.hasAllTranslations).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">À traduire</p>
          <p className="text-2xl font-bold text-terracotta-600">{missingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Langues cibles</p>
          <p className="text-2xl font-bold text-deep-blue-600">5</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Content List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Type Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {CONTENT_TYPES.map((config) => (
                <button
                  key={config.type}
                  onClick={() => setSelectedType(config.type)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    selectedType === config.type
                      ? 'border-terracotta-500 text-terracotta-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Actions Bar */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {missingCount > 0 ? (
                <>
                  <span className="font-medium text-terracotta-600">{missingCount}</span> contenu(s) sans traduction
                </>
              ) : (
                <span className="text-sage-600">Tous les contenus sont traduits !</span>
              )}
            </p>
            {missingCount > 0 && (
              <button
                onClick={translateAllMissing}
                disabled={translatingAll}
                className="px-4 py-2 bg-deep-blue-600 text-white text-sm rounded-lg hover:bg-deep-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {translatingAll ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Traduction en cours...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10" />
                    </svg>
                    Tout traduire
                  </>
                )}
              </button>
            )}
          </div>

          {/* Content Table */}
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : contentItems.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Aucun contenu trouvé
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {contentItems.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.hasAllTranslations ? 'bg-sage-500' : 'bg-terracotta-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.lastTranslated
                          ? `Traduit le ${new Date(item.lastTranslated).toLocaleDateString('fr-FR')}`
                          : 'Non traduit'}
                      </p>
                    </div>
                  </div>
                  <TranslationPushButton
                    contentType={item.type}
                    contentId={item.id}
                    onSuccess={fetchData}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-heading text-lg text-gray-900">Historique récent</h2>
          </div>

          {recentJobs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Aucune traduction récente</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {recentJobs.map((job) => (
                <div key={job.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {job.content_type}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[job.status]}`}>
                      {statusLabels[job.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(job.created_at).toLocaleString('fr-FR')}
                  </p>
                  {job.error_message && (
                    <p className="mt-1 text-xs text-red-600 truncate" title={job.error_message}>
                      {job.error_message}
                    </p>
                  )}
                  {job.status === 'in_progress' && (
                    <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-deep-blue-500 rounded-full h-1.5 transition-all"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-gradient-to-r from-deep-blue-50 to-sage-50 rounded-xl p-6 border border-deep-blue-100">
        <h3 className="font-heading text-lg text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-deep-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Comment fonctionne la traduction automatique ?
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-terracotta-100 flex items-center justify-center flex-shrink-0">
              <span className="text-terracotta-600 font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Contenu français</p>
              <p>Rédigez votre contenu en français, la langue de référence de l'admin.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-terracotta-100 flex items-center justify-center flex-shrink-0">
              <span className="text-terracotta-600 font-bold">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Push Traductions</p>
              <p>Cliquez sur le bouton "Push Traductions" pour générer automatiquement les 5 autres langues.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-terracotta-100 flex items-center justify-center flex-shrink-0">
              <span className="text-terracotta-600 font-bold">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">IA Claude</p>
              <p>L'IA traduit le contenu en préservant le ton professionnel et le vocabulaire du tourisme.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
