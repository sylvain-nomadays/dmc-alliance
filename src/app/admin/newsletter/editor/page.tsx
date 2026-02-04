'use client';

/**
 * Newsletter Visual Editor Page
 * Page dédiée pour l'édition visuelle des newsletters avec drag & drop
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { NewsletterEditor } from '@/components/newsletter';
import {
  NewsletterBlock,
  TemplateSettings,
  DEFAULT_TEMPLATE_SETTINGS
} from '@/lib/newsletter/types';
import {
  NEWSLETTER_TEMPLATES,
  getTemplateById,
  cloneTemplateBlocksWithLogo,
} from '@/lib/newsletter/templates';
import { renderBlocksToPreview } from '@/lib/newsletter/render-blocks';
import { Loader2 } from 'lucide-react';

interface CampaignData {
  id?: string;
  title: string;
  subject_fr: string;
  subject_en: string | null;
  blocks_fr: NewsletterBlock[];
  blocks_en: NewsletterBlock[];
  template_settings: TemplateSettings;
  target_audience: 'all' | 'fr' | 'en' | 'agencies' | 'partners' | 'custom';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
}

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('id');
  const templateId = searchParams.get('template');

  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<'fr' | 'en'>('fr');
  const [campaign, setCampaign] = useState<CampaignData>({
    title: 'Nouvelle newsletter',
    subject_fr: '',
    subject_en: null,
    blocks_fr: [],
    blocks_en: [],
    template_settings: DEFAULT_TEMPLATE_SETTINGS,
    target_audience: 'all',
    status: 'draft',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showMetaEditor, setShowMetaEditor] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string>('/images/logo-dmc-alliance-white.svg');

  // Fetch site logo from admin settings
  useEffect(() => {
    async function fetchSiteLogo() {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          // Use footer logo for newsletters (white version for dark header)
          if (data.footerLogo) {
            setSiteLogo(data.footerLogo);
          }
        }
      } catch (error) {
        console.error('Error fetching site logo:', error);
      }
    }
    fetchSiteLogo();
  }, []);

  useEffect(() => {
    async function loadData() {
      if (campaignId) {
        // Load existing campaign
        const supabase = createClient();
        const { data, error } = await (supabase as any)
          .from('newsletter_campaigns')
          .select('*')
          .eq('id', campaignId)
          .single();

        if (data && !error) {
          setCampaign({
            id: data.id,
            title: data.title,
            subject_fr: data.subject_fr,
            subject_en: data.subject_en,
            blocks_fr: data.blocks_fr || [],
            blocks_en: data.blocks_en || [],
            template_settings: data.template_settings || DEFAULT_TEMPLATE_SETTINGS,
            target_audience: data.target_audience,
            status: data.status,
          });
        }
      } else if (templateId) {
        // Load from template
        const template = getTemplateById(templateId);
        if (template) {
          setCampaign((prev) => ({
            ...prev,
            blocks_fr: cloneTemplateBlocksWithLogo(template, siteLogo),
            blocks_en: [],
            template_settings: template.settings,
          }));
        }
      } else {
        // New campaign - show template selector
        setShowTemplateSelector(true);
      }
      setIsLoading(false);
    }

    loadData();
  }, [campaignId, templateId, siteLogo]);

  const currentBlocks = currentLanguage === 'fr' ? campaign.blocks_fr : campaign.blocks_en;

  const handleBlocksChange = (blocks: NewsletterBlock[], settings: TemplateSettings) => {
    setCampaign((prev) => ({
      ...prev,
      [currentLanguage === 'fr' ? 'blocks_fr' : 'blocks_en']: blocks,
      template_settings: settings,
    }));
  };

  const handleSave = async (blocks: NewsletterBlock[], settings: TemplateSettings) => {
    const supabase = createClient();

    const updatedCampaign = {
      ...campaign,
      [currentLanguage === 'fr' ? 'blocks_fr' : 'blocks_en']: blocks,
      template_settings: settings,
    };

    const campaignData = {
      title: updatedCampaign.title,
      subject_fr: updatedCampaign.subject_fr || 'Sans objet',
      subject_en: updatedCampaign.subject_en,
      blocks_fr: updatedCampaign.blocks_fr,
      blocks_en: updatedCampaign.blocks_en,
      template_settings: updatedCampaign.template_settings,
      target_audience: updatedCampaign.target_audience,
      status: updatedCampaign.status,
      // Keep old content fields for backward compatibility
      content_fr: '',
      content_en: '',
    };

    if (campaign.id) {
      // Update
      const { error } = await (supabase as any)
        .from('newsletter_campaigns')
        .update(campaignData)
        .eq('id', campaign.id);

      if (error) {
        console.error('Error updating campaign:', error);
        alert('Erreur lors de la mise à jour');
        return;
      }
    } else {
      // Create
      const { data, error } = await (supabase as any)
        .from('newsletter_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', error);
        alert('Erreur lors de la création');
        return;
      }

      // Update URL with new ID
      if (data) {
        setCampaign((prev) => ({ ...prev, id: data.id }));
        window.history.replaceState(null, '', `/admin/newsletter/editor?id=${data.id}`);
      }
    }

    setCampaign(updatedCampaign);
    alert('Newsletter sauvegardée !');
  };

  const handleTranslate = async () => {
    if (campaign.blocks_fr.length === 0) {
      alert('Veuillez d\'abord créer du contenu en français');
      return;
    }

    setIsTranslating(true);

    try {
      const response = await fetch('/api/newsletter/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: campaign.blocks_fr,
          sourceLanguage: 'fr',
          targetLanguage: 'en',
        }),
      });

      const data = await response.json();

      if (data.blocks) {
        setCampaign((prev) => ({
          ...prev,
          blocks_en: data.blocks,
        }));
        setCurrentLanguage('en');
        alert('Traduction effectuée ! Vérifiez et ajustez si nécessaire.');
      } else {
        alert(data.error || 'Erreur lors de la traduction');
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert('Erreur lors de la traduction');
    }

    setIsTranslating(false);
  };

  const handleSelectTemplate = (template: typeof NEWSLETTER_TEMPLATES[0]) => {
    setCampaign((prev) => ({
      ...prev,
      blocks_fr: cloneTemplateBlocksWithLogo(template, siteLogo),
      template_settings: template.settings,
    }));
    setShowTemplateSelector(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta-500" />
      </div>
    );
  }

  // Template selector modal
  if (showTemplateSelector) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-8">
          <h1 className="text-2xl font-heading text-gray-900 mb-2">
            Choisissez un template
          </h1>
          <p className="text-gray-600 mb-8">
            Sélectionnez un template comme point de départ pour votre newsletter
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {NEWSLETTER_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="text-left p-4 border-2 border-gray-200 rounded-xl hover:border-terracotta-500 hover:shadow-md transition-all group"
              >
                <div
                  className="aspect-[3/4] rounded-lg mb-4 flex items-center justify-center"
                  style={{ backgroundColor: template.settings.backgroundColor }}
                >
                  <div
                    className="w-3/4 h-4/5 rounded"
                    style={{ backgroundColor: template.settings.secondaryColor }}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-terracotta-600">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                {template.isDefault && (
                  <span className="inline-block mt-2 text-xs bg-terracotta-100 text-terracotta-700 px-2 py-1 rounded">
                    Recommandé
                  </span>
                )}
              </button>
            ))}

            {/* Empty template option */}
            <button
              onClick={() => setShowTemplateSelector(false)}
              className="text-left p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition-all"
            >
              <div className="aspect-[3/4] rounded-lg mb-4 bg-gray-50 flex items-center justify-center">
                <span className="text-4xl text-gray-300">+</span>
              </div>
              <h3 className="font-semibold text-gray-700">Vide</h3>
              <p className="text-sm text-gray-500 mt-1">
                Commencez de zéro
              </p>
            </button>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => router.push('/admin/newsletter')}
              className="text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Preview modal
  if (showPreview) {
    const previewHtml = renderBlocksToPreview(currentBlocks, campaign.template_settings);

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Aperçu de l'email</h2>
              <p className="text-sm text-gray-500">
                {currentLanguage === 'fr' ? 'Version française' : 'English version'}
              </p>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full min-h-[600px] bg-white rounded-lg shadow"
              title="Email preview"
            />
          </div>
        </div>
      </div>
    );
  }

  // Meta editor modal (title, subject, audience)
  if (showMetaEditor) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Paramètres de la campagne</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre interne
              </label>
              <input
                type="text"
                value={campaign.title}
                onChange={(e) => setCampaign((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                placeholder="Ex: Newsletter Janvier 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objet de l'email (FR)
              </label>
              <input
                type="text"
                value={campaign.subject_fr}
                onChange={(e) => setCampaign((prev) => ({ ...prev, subject_fr: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                placeholder="Ex: Découvrez nos nouveaux circuits !"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objet de l'email (EN)
              </label>
              <input
                type="text"
                value={campaign.subject_en || ''}
                onChange={(e) => setCampaign((prev) => ({ ...prev, subject_en: e.target.value || null }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                placeholder="Ex: Discover our new tours!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audience cible
              </label>
              <select
                value={campaign.target_audience}
                onChange={(e) => setCampaign((prev) => ({ ...prev, target_audience: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
              >
                <option value="all">Tous les contacts</option>
                <option value="fr">🇫🇷 Francophones uniquement</option>
                <option value="en">🇬🇧 Anglophones uniquement</option>
                <option value="agencies">Agences uniquement</option>
                <option value="partners">Partenaires uniquement</option>
              </select>
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => setShowMetaEditor(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Translation button overlay */}
      {currentLanguage === 'fr' && campaign.blocks_fr.length > 0 && (
        <button
          onClick={handleTranslate}
          disabled={isTranslating}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-deep-blue-600 text-white rounded-full shadow-lg hover:bg-deep-blue-700 transition-colors disabled:opacity-50"
        >
          {isTranslating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span>🔄</span>
          )}
          Traduire en anglais
        </button>
      )}

      {/* Settings button */}
      <button
        onClick={() => setShowMetaEditor(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-50 border border-gray-200 transition-colors"
      >
        ⚙️ Paramètres
      </button>

      <NewsletterEditor
        initialBlocks={currentBlocks}
        initialSettings={campaign.template_settings}
        language={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        onSave={handleSave}
        onPreview={() => setShowPreview(true)}
        onBack={() => router.push('/admin/newsletter')}
        title={campaign.title}
      />
    </div>
  );
}

export default function NewsletterEditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta-500" />
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
