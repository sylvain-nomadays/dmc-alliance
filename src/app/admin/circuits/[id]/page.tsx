'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface ItineraryDay {
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

interface CircuitForm {
  slug: string;
  title: string;
  subtitle: string;
  description_fr: string;
  description_en: string;
  highlights_fr: string[];
  highlights_en: string[];
  itinerary: ItineraryDay[];
  price_from: number;
  price_single_supplement: number | null;
  commission_rate: number;
  duration_days: number;
  group_size_min: number;
  group_size_max: number;
  difficulty_level: number;
  included_fr: string[];
  included_en: string[];
  not_included_fr: string[];
  not_included_en: string[];
  image_url: string;
  gallery_urls: string[];
  destination_id: string;
  partner_id: string;
  status: string;
  is_featured: boolean;
}

interface Destination {
  id: string;
  name: string;
  partner_id: string;
}

interface Partner {
  id: string;
  name: string;
}

const defaultForm: CircuitForm = {
  slug: '',
  title: '',
  subtitle: '',
  description_fr: '',
  description_en: '',
  highlights_fr: [],
  highlights_en: [],
  itinerary: [],
  price_from: 0,
  price_single_supplement: null,
  commission_rate: 10,
  duration_days: 7,
  group_size_min: 2,
  group_size_max: 16,
  difficulty_level: 2,
  included_fr: [],
  included_en: [],
  not_included_fr: [],
  not_included_en: [],
  image_url: '',
  gallery_urls: [],
  destination_id: '',
  partner_id: '',
  status: 'draft',
  is_featured: false,
};

const statusOptions = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
];

const difficultyLevels = [
  { value: 1, label: 'Très facile' },
  { value: 2, label: 'Facile' },
  { value: 3, label: 'Modéré' },
  { value: 4, label: 'Difficile' },
  { value: 5, label: 'Très difficile' },
];

export default function CircuitEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [form, setForm] = useState<CircuitForm>(defaultForm);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'content' | 'itinerary' | 'pricing' | 'inclusions'>('general');

  // Inputs for list fields
  const [newHighlightFr, setNewHighlightFr] = useState('');
  const [newHighlightEn, setNewHighlightEn] = useState('');
  const [newIncludedFr, setNewIncludedFr] = useState('');
  const [newIncludedEn, setNewIncludedEn] = useState('');
  const [newNotIncludedFr, setNewNotIncludedFr] = useState('');
  const [newNotIncludedEn, setNewNotIncludedEn] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const supabase = createClient();

    // Fetch partners
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partnersData } = await (supabase as any)
      .from('partners')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    setPartners(partnersData || []);

    // Fetch destinations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: destinationsData } = await (supabase as any)
      .from('destinations')
      .select('id, name, partner_id')
      .eq('is_active', true)
      .order('name');

    setDestinations(destinationsData || []);

    // Fetch circuit if editing
    if (!isNew) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('circuits')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching circuit:', error);
        router.push('/admin/circuits');
      } else if (data) {
        setForm({
          ...defaultForm,
          ...data,
          highlights_fr: data.highlights_fr || [],
          highlights_en: data.highlights_en || [],
          itinerary: data.itinerary || [],
          included_fr: data.included_fr || [],
          included_en: data.included_en || [],
          not_included_fr: data.not_included_fr || [],
          not_included_en: data.not_included_en || [],
          gallery_urls: data.gallery_urls || [],
        });
      }
    }

    setIsLoading(false);
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: isNew ? generateSlug(title) : prev.slug,
    }));
  }

  function handleDestinationChange(destinationId: string) {
    const destination = destinations.find((d) => d.id === destinationId);
    setForm((prev) => ({
      ...prev,
      destination_id: destinationId,
      partner_id: destination?.partner_id || prev.partner_id,
    }));
  }

  // List management helpers
  function addToList(listKey: keyof CircuitForm, value: string, setter: (v: string) => void) {
    if (value.trim()) {
      setForm((prev) => ({
        ...prev,
        [listKey]: [...(prev[listKey] as string[]), value.trim()],
      }));
      setter('');
    }
  }

  function removeFromList(listKey: keyof CircuitForm, index: number) {
    setForm((prev) => ({
      ...prev,
      [listKey]: (prev[listKey] as string[]).filter((_, i) => i !== index),
    }));
  }

  // Itinerary management
  function addDay() {
    const newDay: ItineraryDay = {
      day: form.itinerary.length + 1,
      title_fr: '',
      title_en: '',
      description_fr: '',
      description_en: '',
      meals: { breakfast: true, lunch: true, dinner: true },
      accommodation: '',
    };
    setForm((prev) => ({
      ...prev,
      itinerary: [...prev.itinerary, newDay],
    }));
  }

  function updateDay(index: number, updates: Partial<ItineraryDay>) {
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((day, i) => (i === index ? { ...day, ...updates } : day)),
    }));
  }

  function removeDay(index: number) {
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary
        .filter((_, i) => i !== index)
        .map((day, i) => ({ ...day, day: i + 1 })),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const supabase = createClient();
    const publishedAt = form.status === 'published' ? new Date().toISOString() : null;

    const payload = {
      ...form,
      price_single_supplement: form.price_single_supplement || null,
      published_at: publishedAt,
    };

    let error;

    if (isNew) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any).from('circuits').insert([payload]);
      error = result.error;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('circuits')
        .update(payload)
        .eq('id', params.id);
      error = result.error;
    }

    if (error) {
      console.error('Error saving circuit:', error);
      alert('Erreur lors de la sauvegarde');
    } else {
      router.push('/admin/circuits');
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
            href="/admin/circuits"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-heading text-gray-900">
              {isNew ? 'Nouveau circuit GIR' : 'Modifier le circuit'}
            </h1>
            {!isNew && <p className="text-gray-500">{form.title}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px">
            {[
              { id: 'general', label: 'Général' },
              { id: 'content', label: 'Contenu' },
              { id: 'itinerary', label: 'Itinéraire' },
              { id: 'pricing', label: 'Tarifs' },
              { id: 'inclusions', label: 'Inclus/Non inclus' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre du circuit *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
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

                {/* Subtitle */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sous-titre
                  </label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="Ex: Mongolie authentique en 15 jours"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination *
                  </label>
                  <select
                    value={form.destination_id}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
                  >
                    <option value="">Sélectionner...</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Partner */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Partenaire *
                  </label>
                  <select
                    value={form.partner_id}
                    onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
                  >
                    <option value="">Sélectionner...</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée (jours) *
                  </label>
                  <input
                    type="number"
                    value={form.duration_days}
                    onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) || 1 })}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau de difficulté
                  </label>
                  <select
                    value={form.difficulty_level}
                    onChange={(e) => setForm({ ...form, difficulty_level: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
                  >
                    {difficultyLevels.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Group Size Min */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taille min. du groupe
                  </label>
                  <input
                    type="number"
                    value={form.group_size_min}
                    onChange={(e) => setForm({ ...form, group_size_min: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Group Size Max */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taille max. du groupe
                  </label>
                  <input
                    type="number"
                    value={form.group_size_max}
                    onChange={(e) => setForm({ ...form, group_size_max: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image principale
                </label>
                <ImageUpload
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                  folder="circuits"
                  aspect="video"
                />
              </div>

              {/* Featured */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="w-4 h-4 text-terracotta-500 border-gray-300 rounded focus:ring-terracotta-500"
                />
                <label htmlFor="is_featured" className="text-sm text-gray-700 cursor-pointer">
                  Mettre en avant sur la page d&apos;accueil
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
                  rows={5}
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
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              {/* Highlights FR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points forts (FR)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newHighlightFr}
                    onChange={(e) => setNewHighlightFr(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('highlights_fr', newHighlightFr, setNewHighlightFr))}
                    placeholder="Ajouter un point fort..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                  <button
                    type="button"
                    onClick={() => addToList('highlights_fr', newHighlightFr, setNewHighlightFr)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Ajouter
                  </button>
                </div>
                <ul className="space-y-1">
                  {form.highlights_fr.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 px-3 py-1.5 bg-gray-50 rounded">{h}</span>
                      <button
                        type="button"
                        onClick={() => removeFromList('highlights_fr', i)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Highlights EN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Highlights (EN)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newHighlightEn}
                    onChange={(e) => setNewHighlightEn(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('highlights_en', newHighlightEn, setNewHighlightEn))}
                    placeholder="Add a highlight..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                  <button
                    type="button"
                    onClick={() => addToList('highlights_en', newHighlightEn, setNewHighlightEn)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-1">
                  {form.highlights_en.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 px-3 py-1.5 bg-gray-50 rounded">{h}</span>
                      <button
                        type="button"
                        onClick={() => removeFromList('highlights_en', i)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Itinerary Tab */}
          {activeTab === 'itinerary' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {form.itinerary.length} jour{form.itinerary.length > 1 ? 's' : ''} dans l&apos;itinéraire
                </p>
                <button
                  type="button"
                  onClick={addDay}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un jour
                </button>
              </div>

              {form.itinerary.map((day, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Jour {day.day}</h3>
                    <button
                      type="button"
                      onClick={() => removeDay(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titre (FR)
                      </label>
                      <input
                        type="text"
                        value={day.title_fr}
                        onChange={(e) => updateDay(index, { title_fr: e.target.value })}
                        placeholder="Ex: Arrivée à Oulan-Bator"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title (EN)
                      </label>
                      <input
                        type="text"
                        value={day.title_en}
                        onChange={(e) => updateDay(index, { title_en: e.target.value })}
                        placeholder="Ex: Arrival in Ulaanbaatar"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (FR)
                      </label>
                      <textarea
                        value={day.description_fr}
                        onChange={(e) => updateDay(index, { description_fr: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (EN)
                      </label>
                      <textarea
                        value={day.description_en}
                        onChange={(e) => updateDay(index, { description_en: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hébergement
                      </label>
                      <input
                        type="text"
                        value={day.accommodation}
                        onChange={(e) => updateDay(index, { accommodation: e.target.value })}
                        placeholder="Ex: Yourte traditionnelle"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Repas inclus
                      </label>
                      <div className="flex gap-4 mt-2">
                        {['breakfast', 'lunch', 'dinner'].map((meal) => (
                          <label key={meal} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={day.meals[meal as keyof typeof day.meals]}
                              onChange={(e) => updateDay(index, {
                                meals: { ...day.meals, [meal]: e.target.checked }
                              })}
                              className="w-4 h-4 text-terracotta-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">
                              {meal === 'breakfast' ? 'Petit-déj' : meal === 'lunch' ? 'Déjeuner' : 'Dîner'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {form.itinerary.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500">Aucun jour dans l&apos;itinéraire</p>
                  <button
                    type="button"
                    onClick={addDay}
                    className="mt-4 text-terracotta-500 hover:text-terracotta-600 font-medium"
                  >
                    Ajouter le premier jour
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix à partir de (€) *
                  </label>
                  <input
                    type="number"
                    value={form.price_from}
                    onChange={(e) => setForm({ ...form, price_from: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplément single (€)
                  </label>
                  <input
                    type="number"
                    value={form.price_single_supplement || ''}
                    onChange={(e) => setForm({ ...form, price_single_supplement: e.target.value ? parseFloat(e.target.value) : null })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taux de commission (%)
                  </label>
                  <input
                    type="number"
                    value={form.commission_rate}
                    onChange={(e) => setForm({ ...form, commission_rate: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>

              <div className="bg-sage-50 rounded-lg p-4">
                <h4 className="font-medium text-sage-800 mb-2">Calcul de commission</h4>
                <p className="text-sm text-sage-600">
                  Pour un circuit à {form.price_from.toLocaleString('fr-FR')} €, la commission agence sera de{' '}
                  <strong>{((form.price_from * form.commission_rate) / 100).toLocaleString('fr-FR')} €</strong>
                  {' '}({form.commission_rate}%)
                </p>
              </div>
            </div>
          )}

          {/* Inclusions Tab */}
          {activeTab === 'inclusions' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Included */}
              <div className="space-y-6">
                <h3 className="font-medium text-gray-900">Le prix comprend</h3>

                {/* Included FR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inclus (FR)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newIncludedFr}
                      onChange={(e) => setNewIncludedFr(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('included_fr', newIncludedFr, setNewIncludedFr))}
                      placeholder="Ex: Vols internationaux"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                    <button
                      type="button"
                      onClick={() => addToList('included_fr', newIncludedFr, setNewIncludedFr)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {form.included_fr.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-sage-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="flex-1">{item}</span>
                        <button type="button" onClick={() => removeFromList('included_fr', i)} className="text-gray-400 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Included EN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Included (EN)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newIncludedEn}
                      onChange={(e) => setNewIncludedEn(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('included_en', newIncludedEn, setNewIncludedEn))}
                      placeholder="Ex: International flights"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                    <button
                      type="button"
                      onClick={() => addToList('included_en', newIncludedEn, setNewIncludedEn)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {form.included_en.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-sage-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="flex-1">{item}</span>
                        <button type="button" onClick={() => removeFromList('included_en', i)} className="text-gray-400 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Not Included */}
              <div className="space-y-6">
                <h3 className="font-medium text-gray-900">Le prix ne comprend pas</h3>

                {/* Not Included FR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Non inclus (FR)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newNotIncludedFr}
                      onChange={(e) => setNewNotIncludedFr(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('not_included_fr', newNotIncludedFr, setNewNotIncludedFr))}
                      placeholder="Ex: Assurance voyage"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                    <button
                      type="button"
                      onClick={() => addToList('not_included_fr', newNotIncludedFr, setNewNotIncludedFr)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {form.not_included_fr.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="flex-1">{item}</span>
                        <button type="button" onClick={() => removeFromList('not_included_fr', i)} className="text-gray-400 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Not Included EN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Not included (EN)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newNotIncludedEn}
                      onChange={(e) => setNewNotIncludedEn(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToList('not_included_en', newNotIncludedEn, setNewNotIncludedEn))}
                      placeholder="Ex: Travel insurance"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    />
                    <button
                      type="button"
                      onClick={() => addToList('not_included_en', newNotIncludedEn, setNewNotIncludedEn)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {form.not_included_en.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="flex-1">{item}</span>
                        <button type="button" onClick={() => removeFromList('not_included_en', i)} className="text-gray-400 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-gray-200">
            <Link
              href="/admin/circuits"
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
