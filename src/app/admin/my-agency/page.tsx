'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from '@/hooks/useAuthContext';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { VideoManager, PartnerVideo } from '@/components/admin/VideoManager';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

interface PartnerForm {
  name: string;
  country: string;
  city: string;
  region: string;
  logo_url: string;
  cover_image_url: string;
  description_fr: string;
  description_en: string;
  story_fr: string;
  story_en: string;
  mission_fr: string;
  mission_en: string;
  email: string;
  phone: string;
  website: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  founded_year: number | null;
  team_size: number | null;
  languages: string[];
  certifications: string[];
  videos: PartnerVideo[];
}

const defaultForm: PartnerForm = {
  name: '',
  country: '',
  city: '',
  region: 'asia',
  logo_url: '',
  cover_image_url: '',
  description_fr: '',
  description_en: '',
  story_fr: '',
  story_en: '',
  mission_fr: '',
  mission_en: '',
  email: '',
  phone: '',
  website: '',
  facebook_url: '',
  instagram_url: '',
  linkedin_url: '',
  founded_year: null,
  team_size: null,
  languages: [],
  certifications: [],
  videos: [],
};

const regions = [
  { value: 'asia', label: 'Asie' },
  { value: 'africa', label: 'Afrique' },
  { value: 'europe', label: 'Europe' },
  { value: 'americas', label: 'Amériques' },
  { value: 'middle-east', label: 'Moyen-Orient' },
  { value: 'oceania', label: 'Océanie' },
];

const availableLanguages = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'Anglais' },
  { code: 'de', label: 'Allemand' },
  { code: 'es', label: 'Espagnol' },
  { code: 'it', label: 'Italien' },
  { code: 'nl', label: 'Néerlandais' },
  { code: 'ru', label: 'Russe' },
  { code: 'zh', label: 'Chinois' },
  { code: 'ja', label: 'Japonais' },
];

export default function MyAgencyPage() {
  const auth = useAuthContext();
  const [form, setForm] = useState<PartnerForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'content' | 'videos' | 'contact' | 'business'>('general');
  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    if (auth.partnerId) {
      fetchPartner();
    } else if (!auth.isLoading && !auth.isPartner) {
      // Not a partner, redirect
      window.location.href = '/admin';
    }
  }, [auth.partnerId, auth.isLoading, auth.isPartner]);

  async function fetchPartner() {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('partners')
      .select('*')
      .eq('id', auth.partnerId)
      .single();

    if (error) {
      console.error('Error fetching partner:', error);
    } else if (data) {
      setForm({
        name: data.name || '',
        country: data.country || '',
        city: data.city || '',
        region: data.region || 'asia',
        logo_url: data.logo_url || '',
        cover_image_url: data.cover_image_url || '',
        description_fr: data.description_fr || '',
        description_en: data.description_en || '',
        story_fr: data.story_fr || '',
        story_en: data.story_en || '',
        mission_fr: data.mission_fr || '',
        mission_en: data.mission_en || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        facebook_url: data.facebook_url || '',
        instagram_url: data.instagram_url || '',
        linkedin_url: data.linkedin_url || '',
        founded_year: data.founded_year,
        team_size: data.team_size,
        languages: data.languages || [],
        certifications: data.certifications || [],
        videos: data.videos || [],
      });
    }
    setIsLoading(false);
  }

  function toggleLanguage(code: string) {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(code)
        ? prev.languages.filter((l) => l !== code)
        : [...prev.languages, code],
    }));
  }

  function addCertification() {
    if (newCertification.trim() && !form.certifications.includes(newCertification.trim())) {
      setForm((prev) => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()],
      }));
      setNewCertification('');
    }
  }

  function removeCertification(cert: string) {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c !== cert),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const supabase = createClient();
    const payload = {
      name: form.name,
      country: form.country,
      city: form.city,
      region: form.region,
      logo_url: form.logo_url,
      cover_image_url: form.cover_image_url,
      description_fr: form.description_fr,
      description_en: form.description_en,
      story_fr: form.story_fr,
      story_en: form.story_en,
      mission_fr: form.mission_fr,
      mission_en: form.mission_en,
      email: form.email,
      phone: form.phone,
      website: form.website,
      facebook_url: form.facebook_url,
      instagram_url: form.instagram_url,
      linkedin_url: form.linkedin_url,
      founded_year: form.founded_year || null,
      team_size: form.team_size || null,
      languages: form.languages,
      certifications: form.certifications,
      videos: form.videos,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('partners')
      .update(payload)
      .eq('id', auth.partnerId);

    if (error) {
      console.error('Error saving partner:', error);
      alert('Erreur lors de la sauvegarde');
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }

    setIsSaving(false);
  }

  if (auth.isLoading || isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!auth.isPartner || !auth.partnerId) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">Accès non autorisé</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading text-gray-900">Mon Agence</h1>
          <p className="text-gray-500">Gérez les informations de votre agence</p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Modifications enregistrées
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {[
              { id: 'general', label: 'Général', icon: '🏢' },
              { id: 'content', label: 'Contenu', icon: '📝' },
              { id: 'videos', label: 'Vidéos', icon: '🎬' },
              { id: 'contact', label: 'Contact', icon: '📧' },
              { id: 'business', label: 'Infos B2B', icon: '💼' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-terracotta-500 text-terracotta-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l&apos;agence *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Région *
                  </label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
                  >
                    {regions.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays *
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    required
                    placeholder="Ex: Mongolie"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Ex: Oulan-Bator"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo de l&apos;agence
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Ce logo sera affiché sur votre page partenaire et dans les fiches circuits.
                </p>
                <ImageUpload
                  value={form.logo_url}
                  onChange={(url) => setForm({ ...form, logo_url: url })}
                  folder="partners"
                  aspect="square"
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image de couverture
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Image en bandeau affichée en haut de votre page partenaire.
                </p>
                <ImageUpload
                  value={form.cover_image_url}
                  onChange={(url) => setForm({ ...form, cover_image_url: url })}
                  folder="partners"
                  aspect="wide"
                />
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Rédigez en français.</strong> Les traductions vers les autres langues seront gérées par l&apos;équipe DMC Alliance.
                </p>
              </div>

              {/* Description FR */}
              <RichTextEditor
                value={form.description_fr}
                onChange={(content) => setForm({ ...form, description_fr: content })}
                label="Description de l'agence"
                placeholder="Présentez brièvement votre agence..."
                minHeight="150px"
              />

              {/* Story FR */}
              <RichTextEditor
                value={form.story_fr}
                onChange={(content) => setForm({ ...form, story_fr: content })}
                label="Notre histoire"
                placeholder="Racontez l'histoire de votre agence..."
                minHeight="200px"
              />

              {/* Mission FR */}
              <RichTextEditor
                value={form.mission_fr}
                onChange={(content) => setForm({ ...form, mission_fr: content })}
                label="Notre mission"
                placeholder="Quelle est la mission de votre agence ?"
                minHeight="150px"
              />
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-terracotta-50 to-sand-50 rounded-xl p-6 border border-terracotta-100">
                <h3 className="text-lg font-heading text-gray-900 mb-2">
                  Vidéos de présentation
                </h3>
                <p className="text-gray-600 text-sm">
                  Ajoutez des vidéos YouTube ou Vimeo pour présenter votre agence et vos destinations.
                  La première vidéo mise en avant sera affichée sur votre page partenaire.
                </p>
              </div>

              <VideoManager
                videos={form.videos}
                onChange={(videos) => setForm({ ...form, videos })}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Conseils
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Utilisez des vidéos de présentation de votre agence ou de vos circuits</li>
                  <li>• Les vidéos YouTube et Vimeo sont automatiquement détectées</li>
                  <li>• La vidéo &quot;mise en avant&quot; apparaît en premier sur votre page partenaire</li>
                </ul>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-700">
                  Ces informations seront affichées sur votre page partenaire et permettront aux agences de vous contacter.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de contact
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@votre-agence.com"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+976 11 123 456"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Website */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site web
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://www.votre-agence.com"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Réseaux sociaux</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facebook
                    </label>
                    <input
                      type="url"
                      value={form.facebook_url}
                      onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
                      placeholder="https://facebook.com/..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={form.instagram_url}
                      onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={form.linkedin_url}
                      onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Business Tab */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Founded Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Année de création
                  </label>
                  <input
                    type="number"
                    value={form.founded_year || ''}
                    onChange={(e) => setForm({ ...form, founded_year: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="2005"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Team Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taille de l&apos;équipe
                  </label>
                  <input
                    type="number"
                    value={form.team_size || ''}
                    onChange={(e) => setForm({ ...form, team_size: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="10"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langues parlées par votre équipe
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => toggleLanguage(lang.code)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        form.languages.includes(lang.code)
                          ? 'bg-terracotta-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications et labels
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Ajoutez vos certifications (ATR, Travelife, etc.) pour renforcer la confiance des agences.
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    placeholder="Ex: ATR, Travelife, B Corp..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                  <button
                    type="button"
                    onClick={addCertification}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
                {form.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-sage-100 text-sage-700 rounded-full text-sm"
                      >
                        {cert}
                        <button
                          type="button"
                          onClick={() => removeCertification(cert)}
                          className="text-sage-500 hover:text-sage-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Link */}
      {auth.partner?.slug && (
        <div className="bg-gradient-to-r from-sand-50 to-terracotta-50 rounded-xl p-6 border border-sand-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-gray-900 mb-1">Voir ma page partenaire</h3>
              <p className="text-sm text-gray-600">
                Prévisualisez votre page telle qu&apos;elle apparaît sur le site public.
              </p>
            </div>
            <a
              href={`/fr/partners/${auth.partner.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Voir la page
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
