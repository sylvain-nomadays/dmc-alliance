'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ImageUpload } from '@/components/admin/ImageUpload';
import Image from 'next/image';

interface SiteSettings {
  id?: string;
  section: string;
  site_logo_url: string;
  site_logo_dark_url: string;
  site_footer_logo_url: string;
  site_favicon_url: string;
  site_favicon_dark_url: string;
  site_title_fr: string;
  site_title_en: string;
  site_description_fr: string;
  site_description_en: string;
  site_og_image_url: string;
  // Contact information
  contact_email: string;
  contact_phone: string;
  contact_address_fr: string;
  contact_address_en: string;
  // Social links
  social_linkedin: string;
  social_instagram: string;
  social_facebook: string;
  social_twitter: string;
  social_youtube: string;
}

const defaultSettings: SiteSettings = {
  section: 'global',
  site_logo_url: '',
  site_logo_dark_url: '',
  site_footer_logo_url: '',
  site_favicon_url: '',
  site_favicon_dark_url: '',
  site_title_fr: 'The DMC Alliance',
  site_title_en: 'The DMC Alliance',
  site_description_fr: '',
  site_description_en: '',
  site_og_image_url: '',
  // Contact information
  contact_email: '',
  contact_phone: '',
  contact_address_fr: '',
  contact_address_en: '',
  // Social links
  social_linkedin: '',
  social_instagram: '',
  social_facebook: '',
  social_twitter: '',
  social_youtube: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadSettings() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('site_settings')
          .select('*')
          .eq('section', 'global')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading settings:', error);
        }

        if (data && typeof data === 'object') {
          setSettings({ ...defaultSettings, ...(data as Partial<SiteSettings>) });
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('site_settings')
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-terracotta-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">Paramètres du site</h1>
          <p className="text-gray-600 mt-1">
            Gérez le logo, la favicon et les métadonnées du site
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

      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.type === 'success'
            ? 'bg-sage-100 text-sage-800 border border-sage-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Logo Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-heading text-gray-900 mb-2">Logo Header</h2>
          <p className="text-sm text-gray-500 mb-6">
            Logo affiché dans le header du site (navigation principale)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ImageUpload
              value={settings.site_logo_url}
              onChange={(url) => setSettings({ ...settings, site_logo_url: url })}
              onRemove={() => setSettings({ ...settings, site_logo_url: '' })}
              folder="site/logos"
              aspect="square"
              label="Logo principal (fond clair)"
              hint="PNG avec fond transparent recommandé"
            />

            <ImageUpload
              value={settings.site_logo_dark_url}
              onChange={(url) => setSettings({ ...settings, site_logo_dark_url: url })}
              onRemove={() => setSettings({ ...settings, site_logo_dark_url: '' })}
              folder="site/logos"
              aspect="square"
              label="Logo pour fond sombre (optionnel)"
              hint="Utilisé quand le header défile ou sur pages internes"
            />
          </div>

          {(settings.site_logo_url || settings.site_logo_dark_url) && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">Aperçu Header :</p>
              <div className="flex gap-6 items-center">
                {settings.site_logo_url && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-2">Fond clair</span>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <Image
                        src={settings.site_logo_url}
                        alt="Logo principal"
                        width={120}
                        height={120}
                        className="max-h-16 w-auto object-contain"
                        unoptimized={settings.site_logo_url.startsWith('http')}
                      />
                    </div>
                  </div>
                )}
                {settings.site_logo_dark_url && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-2">Fond sombre</span>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <Image
                        src={settings.site_logo_dark_url}
                        alt="Logo sombre"
                        width={120}
                        height={120}
                        className="max-h-16 w-auto object-contain"
                        unoptimized={settings.site_logo_dark_url.startsWith('http')}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logo Footer Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-heading text-gray-900 mb-2">Logo Footer</h2>
          <p className="text-sm text-gray-500 mb-6">
            Logo affiché dans le footer du site (version blanche pour le fond bleu)
          </p>

          <div className="max-w-md">
            <ImageUpload
              value={settings.site_footer_logo_url}
              onChange={(url) => setSettings({ ...settings, site_footer_logo_url: url })}
              onRemove={() => setSettings({ ...settings, site_footer_logo_url: '' })}
              folder="site/logos"
              aspect="square"
              label="Logo footer (version blanche)"
              hint="PNG blanc avec fond transparent pour le footer bleu"
            />
          </div>

          {settings.site_footer_logo_url && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">Aperçu Footer :</p>
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-2">Sur fond bleu (footer)</span>
                <div className="bg-deep-blue-900 p-6 rounded-lg">
                  <Image
                    src={settings.site_footer_logo_url}
                    alt="Logo footer"
                    width={160}
                    height={80}
                    className="max-h-16 w-auto object-contain"
                    unoptimized={settings.site_footer_logo_url.startsWith('http')}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Astuce :</strong> Utilisez une version blanche de votre logo pour qu&apos;il soit bien visible sur le fond bleu foncé du footer.
            </p>
          </div>
        </div>

        {/* Favicon Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-heading text-gray-900 mb-6">Favicon</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ImageUpload
              value={settings.site_favicon_url}
              onChange={(url) => setSettings({ ...settings, site_favicon_url: url })}
              onRemove={() => setSettings({ ...settings, site_favicon_url: '' })}
              folder="site/favicon"
              aspect="square"
              label="Favicon (32x32 ou 64x64)"
              hint="PNG ou ICO - taille recommandée: 64x64px"
            />

            <ImageUpload
              value={settings.site_favicon_dark_url}
              onChange={(url) => setSettings({ ...settings, site_favicon_dark_url: url })}
              onRemove={() => setSettings({ ...settings, site_favicon_dark_url: '' })}
              folder="site/favicon"
              aspect="square"
              label="Favicon mode sombre (optionnel)"
              hint="Pour le mode sombre du navigateur"
            />
          </div>

          {(settings.site_favicon_url || settings.site_favicon_dark_url) && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">Aperçu :</p>
              <div className="flex gap-6 items-center">
                {settings.site_favicon_url && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-2">Standard</span>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <Image
                        src={settings.site_favicon_url}
                        alt="Favicon"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  </div>
                )}
                {settings.site_favicon_dark_url && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-2">Mode sombre</span>
                    <div className="bg-gray-800 p-2 rounded">
                      <Image
                        src={settings.site_favicon_dark_url}
                        alt="Favicon sombre"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Astuce :</strong> Les favicons sont affichées dans les onglets du navigateur.
              Une taille carrée (64x64 ou 32x32 pixels) est recommandée pour un rendu optimal.
            </p>
          </div>
        </div>

        {/* Metadata Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-heading text-gray-900 mb-6">Métadonnées du site</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du site (Français)
                </label>
                <input
                  type="text"
                  value={settings.site_title_fr}
                  onChange={(e) => setSettings({ ...settings, site_title_fr: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  placeholder="The DMC Alliance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du site (Anglais)
                </label>
                <input
                  type="text"
                  value={settings.site_title_en}
                  onChange={(e) => setSettings({ ...settings, site_title_en: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  placeholder="The DMC Alliance"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description du site (Français)
              </label>
              <textarea
                value={settings.site_description_fr}
                onChange={(e) => setSettings({ ...settings, site_description_fr: e.target.value })}
                rows={3}
                maxLength={160}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                placeholder="Utilisée pour les résultats de recherche et les aperçus réseaux sociaux"
              />
              <p className="text-xs text-gray-500 mt-1">
                {settings.site_description_fr?.length || 0}/160 caractères
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description du site (Anglais)
              </label>
              <textarea
                value={settings.site_description_en}
                onChange={(e) => setSettings({ ...settings, site_description_en: e.target.value })}
                rows={3}
                maxLength={160}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                placeholder="Used for search results and social media previews"
              />
              <p className="text-xs text-gray-500 mt-1">
                {settings.site_description_en?.length || 0}/160 caractères
              </p>
            </div>

            <div>
              <ImageUpload
                value={settings.site_og_image_url}
                onChange={(url) => setSettings({ ...settings, site_og_image_url: url })}
                onRemove={() => setSettings({ ...settings, site_og_image_url: '' })}
                folder="site/og"
                aspect="video"
                label="Image Open Graph (réseaux sociaux)"
                hint="1200x630px recommandé pour Facebook, Twitter, LinkedIn"
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note :</strong> Les métadonnées sont utilisées par les moteurs de recherche (Google)
              et les réseaux sociaux (Facebook, Twitter, LinkedIn) pour afficher des aperçus de votre site.
            </p>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-heading text-gray-900 mb-2">Informations de contact</h2>
          <p className="text-sm text-gray-500 mb-6">
            Ces informations apparaissent dans le footer et sur la page Contact
          </p>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de contact
                </label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  placeholder="contact@dmc-alliance.org"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse (Français)
              </label>
              <textarea
                value={settings.contact_address_fr}
                onChange={(e) => setSettings({ ...settings, contact_address_fr: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                placeholder="123 Rue du Voyage, 75001 Paris, France"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse (Anglais)
              </label>
              <textarea
                value={settings.contact_address_en}
                onChange={(e) => setSettings({ ...settings, contact_address_en: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                placeholder="123 Travel Street, 75001 Paris, France"
              />
            </div>
          </div>
        </div>

        {/* Social Links Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-heading text-gray-900 mb-2">Réseaux sociaux</h2>
          <p className="text-sm text-gray-500 mb-6">
            Liens vers vos profils sur les réseaux sociaux (affichés dans le footer)
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#0A66C2] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={settings.social_linkedin}
                  onChange={(e) => setSettings({ ...settings, social_linkedin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  placeholder="https://linkedin.com/company/dmc-alliance"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </div>
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input
                  type="url"
                  value={settings.social_instagram}
                  onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  placeholder="https://instagram.com/dmcalliance"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#1877F2] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input
                  type="url"
                  value={settings.social_facebook}
                  onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  placeholder="https://facebook.com/dmcalliance"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">X (Twitter)</label>
                <input
                  type="url"
                  value={settings.social_twitter}
                  onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  placeholder="https://x.com/dmcalliance"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#FF0000] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
                <input
                  type="url"
                  value={settings.social_youtube}
                  onChange={(e) => setSettings({ ...settings, social_youtube: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500"
                  placeholder="https://youtube.com/@dmcalliance"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Astuce :</strong> Laissez un champ vide si vous ne souhaitez pas afficher ce réseau social dans le footer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
