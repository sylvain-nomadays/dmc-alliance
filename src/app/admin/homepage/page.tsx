'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface HomepageSettings {
  id?: string;
  section: string;
  hero_title_fr: string;
  hero_title_en: string;
  hero_subtitle_fr: string;
  hero_subtitle_en: string;
  hero_image_url: string;
  stats_destinations: number;
  stats_partners: number;
  stats_years: number;
  stats_travelers: number;
  cta_title_fr: string;
  cta_title_en: string;
  cta_subtitle_fr: string;
  cta_subtitle_en: string;
  cta_button_text_fr: string;
  cta_button_text_en: string;
  cta_background_image: string;
  featured_destinations: string[];
  featured_partners: string[];
  featured_circuits: string[];
}

const defaultSettings: HomepageSettings = {
  section: 'global',
  hero_title_fr: 'Votre réseau de DMC experts',
  hero_title_en: 'Your network of expert DMCs',
  hero_subtitle_fr: 'Accédez aux meilleurs réceptifs du monde pour créer des voyages d\'exception',
  hero_subtitle_en: 'Access the best receptive operators worldwide to create exceptional journeys',
  hero_image_url: '/images/hero-background.jpg',
  stats_destinations: 70,
  stats_partners: 35,
  stats_years: 15,
  stats_travelers: 25000,
  cta_title_fr: 'Prêt à rejoindre l\'alliance ?',
  cta_title_en: 'Ready to join the alliance?',
  cta_subtitle_fr: 'Découvrez les avantages de notre réseau de partenaires',
  cta_subtitle_en: 'Discover the benefits of our partner network',
  cta_button_text_fr: 'Contactez-nous',
  cta_button_text_en: 'Contact us',
  cta_background_image: '/images/cta-background.jpg',
  featured_destinations: [],
  featured_partners: [],
  featured_circuits: [],
};

type Tab = 'hero' | 'stats' | 'cta' | 'featured';

export default function HomepageAdminPage() {
  const [settings, setSettings] = useState<HomepageSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<Tab>('hero');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Charger les paramètres existants
  useEffect(() => {
    async function loadSettings() {
      try {
        // Use type assertion since homepage_settings table might not be in generated types yet
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('homepage_settings')
          .select('*')
          .eq('section', 'global')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading settings:', error);
        }

        if (data && typeof data === 'object') {
          setSettings({ ...defaultSettings, ...(data as Partial<HomepageSettings>) });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [supabase]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Use type assertion since homepage_settings table might not be in generated types yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('homepage_settings')
        .upsert({
          ...settings,
          section: 'global',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'section',
        });

      if (error) throw error;

      setSaveMessage({ type: 'success', text: 'Paramètres enregistrés avec succès !' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof HomepageSettings) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'homepage');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();
      setSettings({ ...settings, [field]: url });
    } catch (error) {
      console.error('Upload error:', error);
      setSaveMessage({ type: 'error', text: 'Erreur lors de l\'upload de l\'image' });
    }
  };

  const tabs = [
    { id: 'hero' as Tab, label: 'Section Hero', icon: '🎬' },
    { id: 'stats' as Tab, label: 'Statistiques', icon: '📊' },
    { id: 'cta' as Tab, label: 'Call to Action', icon: '📢' },
    { id: 'featured' as Tab, label: 'Contenus à la une', icon: '⭐' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-terracotta-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">Page d'accueil</h1>
          <p className="text-gray-600 mt-1">
            Personnalisez le contenu de votre page d'accueil
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enregistrement...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Enregistrer
            </>
          )}
        </button>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            saveMessage.type === 'success'
              ? 'bg-sage-100 text-sage-800 border border-sage-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-terracotta-500 text-terracotta-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {activeTab === 'hero' && (
          <HeroSection settings={settings} setSettings={setSettings} onImageUpload={handleImageUpload} />
        )}
        {activeTab === 'stats' && (
          <StatsSection settings={settings} setSettings={setSettings} />
        )}
        {activeTab === 'cta' && (
          <CtaSection settings={settings} setSettings={setSettings} onImageUpload={handleImageUpload} />
        )}
        {activeTab === 'featured' && (
          <FeaturedSection settings={settings} setSettings={setSettings} />
        )}
      </div>
    </div>
  );
}

// Hero Section Form
function HeroSection({
  settings,
  setSettings,
  onImageUpload,
}: {
  settings: HomepageSettings;
  setSettings: (s: HomepageSettings) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: keyof HomepageSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-heading text-gray-900 mb-4">Section Hero</h3>
      <p className="text-gray-600 text-sm mb-6">
        La section hero est la première chose que vos visiteurs voient. Personnalisez le titre, le sous-titre et l'image de fond.
      </p>

      {/* Image de fond */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Image de fond</label>
        <div className="flex items-start gap-4">
          {settings.hero_image_url && (
            <div className="relative w-48 h-28 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={settings.hero_image_url}
                alt="Hero background"
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onImageUpload(e, 'hero_image_url')}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-terracotta-50 file:text-terracotta-700 hover:file:bg-terracotta-100 cursor-pointer"
            />
            <p className="mt-1 text-xs text-gray-500">PNG, JPG jusqu'à 5MB. Recommandé: 1920x1080px</p>
          </div>
        </div>
      </div>

      {/* Titre FR */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre <span className="text-gray-400">(Français)</span>
        </label>
        <input
          type="text"
          value={settings.hero_title_fr}
          onChange={(e) => setSettings({ ...settings, hero_title_fr: e.target.value })}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
          placeholder="Ex: Votre réseau de DMC experts"
        />
      </div>

      {/* Titre EN */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre <span className="text-gray-400">(English)</span>
        </label>
        <input
          type="text"
          value={settings.hero_title_en}
          onChange={(e) => setSettings({ ...settings, hero_title_en: e.target.value })}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
          placeholder="Ex: Your network of expert DMCs"
        />
      </div>

      {/* Sous-titre FR */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sous-titre <span className="text-gray-400">(Français)</span>
        </label>
        <textarea
          value={settings.hero_subtitle_fr}
          onChange={(e) => setSettings({ ...settings, hero_subtitle_fr: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent resize-none"
          placeholder="Ex: Accédez aux meilleurs réceptifs du monde..."
        />
      </div>

      {/* Sous-titre EN */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sous-titre <span className="text-gray-400">(English)</span>
        </label>
        <textarea
          value={settings.hero_subtitle_en}
          onChange={(e) => setSettings({ ...settings, hero_subtitle_en: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent resize-none"
          placeholder="Ex: Access the best receptive operators..."
        />
      </div>
    </div>
  );
}

// Stats Section Form
function StatsSection({
  settings,
  setSettings,
}: {
  settings: HomepageSettings;
  setSettings: (s: HomepageSettings) => void;
}) {
  const stats = [
    { key: 'stats_destinations' as const, label: 'Destinations', icon: '🌍', suffix: '+' },
    { key: 'stats_partners' as const, label: 'Partenaires', icon: '🤝', suffix: '+' },
    { key: 'stats_years' as const, label: 'Années d\'expérience', icon: '📅', suffix: '' },
    { key: 'stats_travelers' as const, label: 'Voyageurs accompagnés', icon: '✈️', suffix: '+' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-heading text-gray-900 mb-4">Statistiques</h3>
      <p className="text-gray-600 text-sm mb-6">
        Ces chiffres sont affichés dans la section statistiques de la page d'accueil pour montrer votre expertise.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat) => (
          <div key={stat.key} className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <span className="text-lg">{stat.icon}</span>
              {stat.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings[stat.key]}
                onChange={(e) => setSettings({ ...settings, [stat.key]: parseInt(e.target.value) || 0 })}
                className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
              <span className="text-gray-500 text-lg">{stat.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="mt-8 p-6 bg-deep-blue-900 rounded-xl">
        <p className="text-deep-blue-200 text-sm mb-4">Aperçu :</p>
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.key} className="text-center">
              <div className="text-2xl font-bold text-white">
                {settings[stat.key].toLocaleString()}{stat.suffix}
              </div>
              <div className="text-deep-blue-300 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// CTA Section Form
function CtaSection({
  settings,
  setSettings,
  onImageUpload,
}: {
  settings: HomepageSettings;
  setSettings: (s: HomepageSettings) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: keyof HomepageSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-heading text-gray-900 mb-4">Section Call to Action</h3>
      <p className="text-gray-600 text-sm mb-6">
        La section CTA encourage les visiteurs à passer à l'action (contact, inscription, etc.).
      </p>

      {/* Image de fond */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Image de fond</label>
        <div className="flex items-start gap-4">
          {settings.cta_background_image && (
            <div className="relative w-48 h-28 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={settings.cta_background_image}
                alt="CTA background"
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onImageUpload(e, 'cta_background_image')}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-terracotta-50 file:text-terracotta-700 hover:file:bg-terracotta-100 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Titre FR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre <span className="text-gray-400">(FR)</span>
          </label>
          <input
            type="text"
            value={settings.cta_title_fr}
            onChange={(e) => setSettings({ ...settings, cta_title_fr: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
          />
        </div>

        {/* Titre EN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre <span className="text-gray-400">(EN)</span>
          </label>
          <input
            type="text"
            value={settings.cta_title_en}
            onChange={(e) => setSettings({ ...settings, cta_title_en: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
          />
        </div>

        {/* Sous-titre FR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sous-titre <span className="text-gray-400">(FR)</span>
          </label>
          <textarea
            value={settings.cta_subtitle_fr}
            onChange={(e) => setSettings({ ...settings, cta_subtitle_fr: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Sous-titre EN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sous-titre <span className="text-gray-400">(EN)</span>
          </label>
          <textarea
            value={settings.cta_subtitle_en}
            onChange={(e) => setSettings({ ...settings, cta_subtitle_en: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Texte bouton FR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texte du bouton <span className="text-gray-400">(FR)</span>
          </label>
          <input
            type="text"
            value={settings.cta_button_text_fr}
            onChange={(e) => setSettings({ ...settings, cta_button_text_fr: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
          />
        </div>

        {/* Texte bouton EN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texte du bouton <span className="text-gray-400">(EN)</span>
          </label>
          <input
            type="text"
            value={settings.cta_button_text_en}
            onChange={(e) => setSettings({ ...settings, cta_button_text_en: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

// Featured Section Form
function FeaturedSection({
  settings,
  setSettings,
}: {
  settings: HomepageSettings;
  setSettings: (s: HomepageSettings) => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-heading text-gray-900 mb-4">Contenus à la une</h3>
      <p className="text-gray-600 text-sm mb-6">
        Sélectionnez les destinations, partenaires et circuits GIR que vous souhaitez mettre en avant sur la page d'accueil.
      </p>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-yellow-800">
              <strong>Fonctionnalité à venir</strong>
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              La sélection des contenus à la une sera bientôt disponible. Pour l'instant, les contenus sont sélectionnés automatiquement.
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span className="text-2xl">🌍</span>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Destinations à la une</h4>
          <p className="text-sm text-gray-500">
            {settings.featured_destinations.length || 'Auto'} sélectionnée(s)
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span className="text-2xl">🤝</span>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Partenaires à la une</h4>
          <p className="text-sm text-gray-500">
            {settings.featured_partners.length || 'Auto'} sélectionné(s)
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span className="text-2xl">✈️</span>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Circuits GIR à la une</h4>
          <p className="text-sm text-gray-500">
            {settings.featured_circuits.length || 'Auto'} sélectionné(s)
          </p>
        </div>
      </div>
    </div>
  );
}
