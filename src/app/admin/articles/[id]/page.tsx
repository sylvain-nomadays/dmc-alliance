'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface ArticleForm {
  slug: string;
  title: string;
  title_en: string;
  excerpt: string;
  excerpt_en: string;
  content: string;
  content_en: string;
  image_url: string;
  category: string;
  tags: string[];
  author_name: string;
  author_role: string;
  author_avatar: string;
  read_time: number;
  destination_id: string;
  partner_id: string;
  status: string;
  is_featured: boolean;
}

interface Destination {
  id: string;
  name: string;
}

interface Partner {
  id: string;
  name: string;
}

const defaultForm: ArticleForm = {
  slug: '',
  title: '',
  title_en: '',
  excerpt: '',
  excerpt_en: '',
  content: '',
  content_en: '',
  image_url: '',
  category: 'destinations',
  tags: [],
  author_name: '',
  author_role: '',
  author_avatar: '',
  read_time: 5,
  destination_id: '',
  partner_id: '',
  status: 'draft',
  is_featured: false,
};

const categories = [
  { value: 'destinations', label: 'Destinations' },
  { value: 'trends', label: 'Tendances' },
  { value: 'tips', label: 'Conseils' },
  { value: 'partners', label: 'Partenaires' },
  { value: 'gir', label: 'GIR' },
];

const statusOptions = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
];

export default function ArticleEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [form, setForm] = useState<ArticleForm>(defaultForm);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'content' | 'author'>('general');
  const [newTag, setNewTag] = useState('');

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
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    setDestinations(destinationsData || []);

    // Fetch article if editing
    if (!isNew) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('articles')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching article:', error);
        router.push('/admin/articles');
      } else if (data) {
        setForm({
          ...defaultForm,
          ...data,
          tags: data.tags || [],
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

  function addTag() {
    if (newTag.trim() && !form.tags.includes(newTag.trim().toLowerCase())) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()],
      }));
      setNewTag('');
    }
  }

  function removeTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }

  // Estimate read time based on content length
  function estimateReadTime(content: string) {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  function handleContentChange(content: string) {
    setForm((prev) => ({
      ...prev,
      content,
      read_time: estimateReadTime(content),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const supabase = createClient();
    const publishedAt = form.status === 'published' ? new Date().toISOString() : null;

    const payload = {
      ...form,
      destination_id: form.destination_id || null,
      partner_id: form.partner_id || null,
      published_at: publishedAt,
    };

    let error;

    if (isNew) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any).from('articles').insert([payload]);
      error = result.error;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('articles')
        .update(payload)
        .eq('id', params.id);
      error = result.error;
    }

    if (error) {
      console.error('Error saving article:', error);
      alert('Erreur lors de la sauvegarde');
    } else {
      router.push('/admin/articles');
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
            href="/admin/articles"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-heading text-gray-900">
              {isNew ? 'Nouvel article' : 'Modifier l\'article'}
            </h1>
            {!isNew && <p className="text-gray-500">{form.title}</p>}
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
              { id: 'author', label: 'Auteur' },
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
                {/* Title FR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre (FR) *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Title EN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (EN)
                  </label>
                  <input
                    type="text"
                    value={form.title_en}
                    onChange={(e) => setForm({ ...form, title_en: e.target.value })}
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

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
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

                {/* Read Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temps de lecture (min)
                  </label>
                  <input
                    type="number"
                    value={form.read_time}
                    onChange={(e) => setForm({ ...form, read_time: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination liée
                  </label>
                  <select
                    value={form.destination_id}
                    onChange={(e) => setForm({ ...form, destination_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
                  >
                    <option value="">Aucune</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Partner */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Partenaire lié
                  </label>
                  <select
                    value={form.partner_id}
                    onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 bg-white"
                  >
                    <option value="">Aucun</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image de couverture
                </label>
                <ImageUpload
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                  folder="articles"
                  aspect="video"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Ajouter un tag..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-deep-blue-100 text-deep-blue-700 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-deep-blue-500 hover:text-deep-blue-700"
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
                  Mettre en avant sur la page Magazine
                </label>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Excerpt FR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extrait / Chapô (FR)
                </label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  rows={3}
                  placeholder="Résumé accrocheur de l'article..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {form.excerpt.length}/300 caractères recommandés
                </p>
              </div>

              {/* Excerpt EN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt (EN)
                </label>
                <textarea
                  value={form.excerpt_en}
                  onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })}
                  rows={3}
                  placeholder="Catchy summary of the article..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
              </div>

              {/* Content FR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu (FR)
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={15}
                  placeholder="Contenu de l'article... (Markdown supporté)"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supporte le format Markdown. Temps de lecture estimé : {form.read_time} min
                </p>
              </div>

              {/* Content EN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content (EN)
                </label>
                <textarea
                  value={form.content_en}
                  onChange={(e) => setForm({ ...form, content_en: e.target.value })}
                  rows={15}
                  placeholder="Article content... (Markdown supported)"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Author Tab */}
          {activeTab === 'author' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Author Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l&apos;auteur
                  </label>
                  <input
                    type="text"
                    value={form.author_name}
                    onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                    placeholder="Ex: Marie Dupont"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>

                {/* Author Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fonction / Rôle
                  </label>
                  <input
                    type="text"
                    value={form.author_role}
                    onChange={(e) => setForm({ ...form, author_role: e.target.value })}
                    placeholder="Ex: Expert Asie, Fondateur..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                  />
                </div>
              </div>

              {/* Author Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo de l&apos;auteur
                </label>
                <ImageUpload
                  value={form.author_avatar}
                  onChange={(url) => setForm({ ...form, author_avatar: url })}
                  folder="authors"
                  aspect="square"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Aperçu</h4>
                <div className="flex items-center gap-3">
                  {form.author_avatar ? (
                    <img
                      src={form.author_avatar}
                      alt={form.author_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{form.author_name || 'Nom de l\'auteur'}</p>
                    <p className="text-sm text-gray-500">{form.author_role || 'Fonction'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-gray-200">
            <Link
              href="/admin/articles"
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
