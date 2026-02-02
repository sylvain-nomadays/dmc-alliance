'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface PartnerForm {
  slug: string;
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
  tier: string;
  founded_year: number | null;
  team_size: number | null;
  languages: string[];
  certifications: string[];
  commission_rate: number | null;
  has_gir: boolean;
  is_active: boolean;
  is_featured: boolean;
}

const defaultForm: PartnerForm = {
  slug: '',
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
  tier: 'standard',
  founded_year: null,
  team_size: null,
  languages: [],
  certifications: [],
  commission_rate: null,
  has_gir: false,
  is_active: true,
  is_featured: false,
};

const regions = [
  { value: 'asia', label: 'Asie' },
  { value: 'africa', label: 'Afrique' },
  { value: 'europe', label: 'Europe' },
  { value: 'americas', label: 'Amériques' },
  { value: 'middle-east', label: 'Moyen-Orient' },
  { value: 'oceania', label: 'Océanie' },
];

const tiers = [
  { value: 'premium', label: 'Premium' },
  { value: 'standard', label: 'Standard' },
  { value: 'basic', label: 'Basic' },
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

export default function PartnerEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [form, setForm] = useState<PartnerForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'content' | 'contact' | 'business'>('general');
  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    if (!isNew) {
      fetchPartner();
    }
  }, [isNew, params.id]);

  async function fetchPartner() {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('partners')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching partner:', error);
      router.push('/admin/partners');
    } else if (data) {
      setForm({
        ...defaultForm,
        ...data,
        languages: data.languages || [],
        certifications: data.certifications || [],
      });
    }
    setIsLoading(false);
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: isNew ? generateSlug(name) : prev.slug,
    }));
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

    const supabase = createClient();
    const payload = {
      ...form,
      founded_year: form.founded_year || null,
      team_size: form.team_size || null,
      commission_rate: form.commission_rate || null,
    };

    let error;

    if (isNew) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any).from('partners').insert([payload]);
      error = result.error;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('partners')
        .update(payload)
        .eq('id', params.id);
      error = result.error;
    }

    if (error) {
      console.error('Error saving partner:', error);
      alert('Erreur lors de la sauvegarde');
    } else {
      router.push('/admin/partners');
    }

    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/partners"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-heading text-gray-900">
              {isNew ? 'Nouveau partenaire' : 'Modifier le partenaire'}
            </h1>
            {!isNew && <p className="text-gray-500">{form.name}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'general', label: 'Général' },
              { id: 'content', label: 'Contenu' },
              { id: 'contact', label: 'Contact' },
              { id: 'business', label: 'B2B' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-terracotta-500 text-terracotta-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
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
                    Nom du partenaire *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
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

                {/* Tier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau *
                  </label>
                  <select
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
                  >
                    {tiers.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
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
                <ImageUpload
                  value={form.cover_image_url}
                  onChange={(url) => setForm({ ...form, cover_image_url: url })}
                  folder="partners"
                  aspect="wide"
                />
              </div>

              {/* Status toggles */}
              <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-terracotta-500 border-gray-300 rounded focus:ring-terracotta-500"
                  />
                  <span className="text-sm text-gray-700">Actif</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="w-4 h-4 text-terracotta-500 border-gray-300 rounded focus:ring-terracotta-500"
                  />
                  <span className="text-sm text-gray-700">Mis en avant</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_gir}
                    onChange={(e) => setForm({ ...form, has_gir: e.target.checked })}
                    className="w-4 h-4 text-terracotta-500 border-gray-300 rounded focus:ring-terracotta-500"
                  />
                  <span className="text-sm text-gray-700">Propose des GIR</span>
                </label>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Description FR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (FR)
                </label>
                <textarea
                  value={form.description_fr}
                  onChange={(e) => setForm({ ...form, description_fr: e.target.value })}
                  rows={4}
                  placeholder="Description courte du partenaire..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              {/* Description EN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (EN)
                </label>
                <textarea
                  value={form.description_en}
                  onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                  rows={4}
                  placeholder="Short description of the partner..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              {/* Story FR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notre histoire (FR)
                </label>
                <textarea
                  value={form.story_fr}
                  onChange={(e) => setForm({ ...form, story_fr: e.target.value })}
                  rows={6}
                  placeholder="L'histoire de l'agence..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              {/* Story EN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Our story (EN)
                </label>
                <textarea
                  value={form.story_en}
                  onChange={(e) => setForm({ ...form, story_en: e.target.value })}
                  rows={6}
                  placeholder="The agency's story..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              {/* Mission FR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notre mission (FR)
                </label>
                <textarea
                  value={form.mission_fr}
                  onChange={(e) => setForm({ ...form, mission_fr: e.target.value })}
                  rows={4}
                  placeholder="La mission de l'agence..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              {/* Mission EN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Our mission (EN)
                </label>
                <textarea
                  value={form.mission_en}
                  onChange={(e) => setForm({ ...form, mission_en: e.target.value })}
                  rows={4}
                  placeholder="The agency's mission..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@example.com"
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
                    placeholder="+33 1 23 45 67 89"
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
                    placeholder="https://www.example.com"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                {/* Commission Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taux de commission (%)
                  </label>
                  <input
                    type="number"
                    value={form.commission_rate || ''}
                    onChange={(e) => setForm({ ...form, commission_rate: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="10"
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langues parlées
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
                  Certifications
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    placeholder="Ex: ATR, Travelife..."
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
            <Link
              href="/admin/partners"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Enregistrement...' : (isNew ? 'Créer' : 'Enregistrer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
