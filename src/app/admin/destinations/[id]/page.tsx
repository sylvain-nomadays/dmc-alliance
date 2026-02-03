'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ImageUpload } from '@/components/admin/ImageUpload';
import TranslationPushButton from '@/components/admin/TranslationPushButton';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

interface DestinationForm {
  name: string;
  name_en: string;
  slug: string;
  region: string;
  country: string;
  description_fr: string;
  description_en: string;
  image_url: string;
  partner_id: string;
  is_active: boolean;
  highlights: string[];
  best_time: string;
  ideal_duration: string;
  // Video webinar
  video_url: string;
  video_title_fr: string;
  video_title_en: string;
  video_duration: string;
}

interface Partner {
  id: string;
  name: string;
}

const regions = [
  { value: 'asia', label: 'Asie' },
  { value: 'africa', label: 'Afrique' },
  { value: 'europe', label: 'Europe' },
  { value: 'americas', label: 'Amériques' },
  { value: 'middle-east', label: 'Moyen-Orient' },
  { value: 'oceania', label: 'Océanie' },
];

const initialForm: DestinationForm = {
  name: '',
  name_en: '',
  slug: '',
  region: 'asia',
  country: '',
  description_fr: '',
  description_en: '',
  image_url: '',
  partner_id: '',
  is_active: true,
  highlights: [''],
  best_time: '',
  ideal_duration: '',
  video_url: '',
  video_title_fr: '',
  video_title_en: '',
  video_duration: '',
};

export default function DestinationEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === 'new';

  const [form, setForm] = useState<DestinationForm>(initialForm);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof DestinationForm, string>>>({});

  useEffect(() => {
    fetchPartners();
    if (!isNew) {
      fetchDestination();
    }
  }, [id, isNew]);

  async function fetchPartners() {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('partners')
      .select('id, name')
      .order('name');
    setPartners(data || []);
  }

  async function fetchDestination() {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('destinations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      router.push('/admin/destinations');
      return;
    }

    setForm({
      name: data.name || '',
      name_en: data.name_en || '',
      slug: data.slug || '',
      region: data.region || 'asia',
      country: data.country || '',
      description_fr: data.description_fr || '',
      description_en: data.description_en || '',
      image_url: data.image_url || '',
      partner_id: data.partner_id || '',
      is_active: data.is_active ?? true,
      highlights: data.highlights || [''],
      best_time: data.best_time || '',
      ideal_duration: data.ideal_duration || '',
      video_url: data.video_url || '',
      video_title_fr: data.video_title_fr || '',
      video_title_en: data.video_title_en || '',
      video_duration: data.video_duration || '',
    });
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

  function handleChange(field: keyof DestinationForm, value: string | boolean | string[]) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-generate slug from name
      if (field === 'name' && typeof value === 'string') {
        updated.slug = generateSlug(value);
      }

      return updated;
    });

    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleHighlightChange(index: number, value: string) {
    const newHighlights = [...form.highlights];
    newHighlights[index] = value;
    handleChange('highlights', newHighlights);
  }

  function addHighlight() {
    handleChange('highlights', [...form.highlights, '']);
  }

  function removeHighlight(index: number) {
    const newHighlights = form.highlights.filter((_, i) => i !== index);
    handleChange('highlights', newHighlights.length ? newHighlights : ['']);
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof DestinationForm, string>> = {};

    if (!form.name.trim()) newErrors.name = 'Le nom est requis';
    if (!form.slug.trim()) newErrors.slug = 'Le slug est requis';
    if (!form.country.trim()) newErrors.country = 'Le pays est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    const supabase = createClient();

    // Filter empty highlights
    const cleanedHighlights = form.highlights.filter((h) => h.trim());

    const destinationData = {
      name: form.name,
      name_en: form.name_en,
      slug: form.slug,
      region: form.region,
      country: form.country,
      description_fr: form.description_fr,
      description_en: form.description_en,
      image_url: form.image_url || null,
      partner_id: form.partner_id || null,
      is_active: form.is_active,
      highlights: cleanedHighlights,
      best_time: form.best_time,
      ideal_duration: form.ideal_duration,
      video_url: form.video_url || null,
      video_title_fr: form.video_title_fr || null,
      video_title_en: form.video_title_en || null,
      video_duration: form.video_duration || null,
    };

    let error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as any;

    if (isNew) {
      const result = await supabaseAny.from('destinations').insert(destinationData);
      error = result.error;
    } else {
      const result = await supabaseAny
        .from('destinations')
        .update(destinationData)
        .eq('id', id);
      error = result.error;
    }

    if (error) {
      console.error('Error saving destination:', error);
      alert('Erreur lors de la sauvegarde');
    } else {
      router.push('/admin/destinations');
    }

    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/destinations"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-heading text-gray-900">
            {isNew ? 'Nouvelle destination' : `Modifier ${form.name}`}
          </h1>
          <p className="text-gray-600 mt-1">
            {isNew ? 'Ajoutez une nouvelle destination au catalogue' : 'Modifiez les informations de la destination'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-heading text-gray-900 mb-6">Informations générales</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name FR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                placeholder="Ex: Mongolie"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 font-mono text-sm"
                placeholder="mongolie"
              />
              {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                placeholder="Ex: Mongolie"
              />
              {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Région
              </label>
              <select
                value={form.region}
                onChange={(e) => handleChange('region', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
              >
                {regions.map((region) => (
                  <option key={region.value} value={region.value}>{region.label}</option>
                ))}
              </select>
            </div>

            {/* Partner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partenaire
              </label>
              <select
                value={form.partner_id}
                onChange={(e) => handleChange('partner_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
              >
                <option value="">Sélectionner un partenaire</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>{partner.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-heading text-gray-900 mb-6">Image principale</h2>
          <ImageUpload
            value={form.image_url}
            onChange={(url) => handleChange('image_url', url)}
            onRemove={() => handleChange('image_url', '')}
            folder="destinations"
            aspect="video"
            hint="Format recommandé: 1920x1080, max 5 Mo"
          />
        </div>

        {/* Descriptions */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-heading text-gray-900 mb-6">Description</h2>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              <strong>Rédigez en français uniquement.</strong> Les traductions vers les autres langues seront générées automatiquement via le bouton &quot;Push Traductions&quot;.
            </p>
          </div>

          <RichTextEditor
            value={form.description_fr}
            onChange={(content) => handleChange('description_fr', content)}
            label="Description"
            placeholder="Description de la destination..."
            minHeight="200px"
          />
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-heading text-gray-900 mb-6">Détails</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Best time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meilleure période
              </label>
              <input
                type="text"
                value={form.best_time}
                onChange={(e) => handleChange('best_time', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                placeholder="Ex: Mai à Septembre"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée idéale
              </label>
              <input
                type="text"
                value={form.ideal_duration}
                onChange={(e) => handleChange('ideal_duration', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                placeholder="Ex: 12-15 jours"
              />
            </div>
          </div>

          {/* Highlights */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points forts
            </label>
            <div className="space-y-3">
              {form.highlights.map((highlight, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={highlight}
                    onChange={(e) => handleHighlightChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    placeholder="Ex: Steppes infinies et yourtes nomades"
                  />
                  <button
                    type="button"
                    onClick={() => removeHighlight(index)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addHighlight}
              className="mt-3 text-sm text-terracotta-500 hover:text-terracotta-600 font-medium"
            >
              + Ajouter un point fort
            </button>
          </div>
        </div>

        {/* Video Webinar */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-heading text-gray-900 mb-6">Vidéo Webinaire</h2>
          <p className="text-sm text-gray-500 mb-4">
            Ajoutez une vidéo de présentation (webinaire, vidéo YouTube/Vimeo) qui sera affichée sur la page destination.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de la vidéo (embed)
              </label>
              <input
                type="text"
                value={form.video_url}
                onChange={(e) => handleChange('video_url', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                placeholder="Ex: https://www.youtube.com/embed/xxxxx"
              />
              <p className="mt-1 text-xs text-gray-400">
                Utilisez l&apos;URL embed de YouTube ou Vimeo (ex: https://www.youtube.com/embed/VIDEO_ID)
              </p>
            </div>

            {/* Video Title FR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de la vidéo (FR)
              </label>
              <input
                type="text"
                value={form.video_title_fr}
                onChange={(e) => handleChange('video_title_fr', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                placeholder="Ex: Webinaire : Découvrez la Mongolie"
              />
            </div>

            {/* Video Title EN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de la vidéo (EN)
              </label>
              <input
                type="text"
                value={form.video_title_en}
                onChange={(e) => handleChange('video_title_en', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                placeholder="Ex: Webinar: Discover Mongolia"
              />
            </div>

            {/* Video Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée
              </label>
              <input
                type="text"
                value={form.video_duration}
                onChange={(e) => handleChange('video_duration', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                placeholder="Ex: 45 min"
              />
            </div>
          </div>

          {/* Preview */}
          {form.video_url && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aperçu
              </label>
              {(() => {
                // Extract YouTube video ID from embed URL
                const youtubeMatch = form.video_url.match(/youtube\.com\/embed\/([^?&]+)/);
                const vimeoMatch = form.video_url.match(/vimeo\.com\/video\/([^?&]+)/);

                if (youtubeMatch) {
                  const videoId = youtubeMatch[1];
                  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

                  return (
                    <a
                      href={watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative max-w-xl aspect-video bg-gray-900 rounded-lg overflow-hidden group"
                    >
                      <img
                        src={thumbnailUrl}
                        alt={form.video_title_fr || 'Video thumbnail'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to default quality if maxres not available
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <p className="text-white text-sm font-medium truncate">
                          {form.video_title_fr || 'Cliquez pour voir sur YouTube'}
                        </p>
                      </div>
                    </a>
                  );
                } else if (vimeoMatch) {
                  const videoId = vimeoMatch[1];
                  const watchUrl = `https://vimeo.com/${videoId}`;

                  return (
                    <a
                      href={watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative max-w-xl aspect-video bg-gray-900 rounded-lg overflow-hidden group"
                    >
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <p className="text-white text-sm font-medium truncate">
                          {form.video_title_fr || 'Cliquez pour voir sur Vimeo'}
                        </p>
                      </div>
                    </a>
                  );
                } else {
                  // Generic preview for other video URLs
                  return (
                    <div className="max-w-xl aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
                      <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500 text-center">URL vidéo configurée</p>
                      <p className="text-xs text-gray-400 mt-1 text-center break-all">{form.video_url}</p>
                    </div>
                  );
                }
              })()}
            </div>
          )}
        </div>

        {/* Status & Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-terracotta-500 focus:ring-terracotta-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Destination active (visible sur le site)
                </span>
              </label>

              {/* Translation Push Button */}
              {!isNew && (
                <TranslationPushButton
                  contentType="destination"
                  contentId={id}
                  onSuccess={() => console.log('Translations completed')}
                />
              )}
            </div>

            <div className="flex gap-3">
              <Link
                href="/admin/destinations"
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isNew ? 'Créer la destination' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
