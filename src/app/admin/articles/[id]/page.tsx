'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ImageUpload } from '@/components/admin/ImageUpload';
import TranslationPushButton from '@/components/admin/TranslationPushButton';
import { RichTextEditor, MarkdownEditor } from '@/components/admin/RichTextEditor';
import { ArticleAIAssistant } from '@/components/admin/ArticleAIAssistant';

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
  author_bio_fr: string;
  author_bio_en: string;
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
  author_bio_fr: '',
  author_bio_en: '',
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
  const [activeTab, setActiveTab] = useState<'general' | 'content' | 'author' | 'faq'>('general');
  const [newTag, setNewTag] = useState('');
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual');

  // FAQ state
  interface FAQItem {
    id?: string;
    question_fr: string;
    answer_fr: string;
    order_index: number;
    is_active: boolean;
    isNew?: boolean;
  }
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

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

        // Fetch FAQs for this article
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: faqData } = await (supabase as any)
          .from('article_faqs')
          .select('*')
          .eq('article_id', params.id)
          .order('order_index', { ascending: true });

        if (faqData) {
          setFaqs(faqData);
        }
      }
    }

    setIsLoading(false);
  }

  // FAQ management functions
  function addFAQ() {
    setFaqs((prev) => [
      ...prev,
      {
        question_fr: '',
        answer_fr: '',
        order_index: prev.length,
        is_active: true,
        isNew: true,
      },
    ]);
  }

  function updateFAQ(index: number, field: 'question_fr' | 'answer_fr', value: string) {
    setFaqs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeFAQ(index: number) {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  }

  function moveFAQ(index: number, direction: 'up' | 'down') {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === faqs.length - 1)
    ) {
      return;
    }

    setFaqs((prev) => {
      const updated = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      // Update order_index
      return updated.map((faq, i) => ({ ...faq, order_index: i }));
    });
  }

  async function saveFAQs() {
    if (isNew) {
      alert('Veuillez d\'abord créer l\'article avant d\'ajouter des FAQs');
      return;
    }

    const supabase = createClient();

    // Delete existing FAQs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('article_faqs').delete().eq('article_id', params.id);

    // Insert new FAQs
    const faqsToInsert = faqs
      .filter((faq) => faq.question_fr && faq.answer_fr)
      .map((faq, index) => ({
        article_id: params.id,
        question_fr: faq.question_fr,
        answer_fr: faq.answer_fr,
        order_index: index,
        is_active: faq.is_active ?? true,
      }));

    if (faqsToInsert.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('article_faqs').insert(faqsToInsert);

      if (error) {
        console.error('Error saving FAQs:', error);
        alert('Erreur lors de la sauvegarde des FAQs');
      } else {
        alert('FAQs sauvegardées avec succès');
      }
    }
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
              { id: 'faq', label: 'FAQ' },
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
              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Rédigez en français uniquement.</strong> Les traductions seront générées automatiquement via le bouton &quot;Push Traductions&quot;.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title FR */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre *
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
              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Rédigez en français uniquement.</strong> Les traductions seront générées automatiquement via le bouton &quot;Push Traductions&quot;.
                </p>
              </div>

              {/* Excerpt FR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extrait / Chapô
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

              {/* Editor Mode Toggle */}
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Contenu
                </label>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setEditorMode('visual')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      editorMode === 'visual'
                        ? 'bg-white text-terracotta-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Éditeur visuel
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('markdown')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      editorMode === 'markdown'
                        ? 'bg-white text-terracotta-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Markdown
                    </span>
                  </button>
                </div>
              </div>

              {/* Content Editor - Visual (HTML) */}
              {editorMode === 'visual' && (
                <RichTextEditor
                  value={form.content}
                  onChange={handleContentChange}
                  placeholder="Contenu de l'article..."
                  minHeight="400px"
                  enableAdvancedFeatures={true}
                />
              )}

              {/* Content Editor - Markdown */}
              {editorMode === 'markdown' && (
                <div>
                  <MarkdownEditor
                    value={form.content}
                    onChange={handleContentChange}
                    placeholder="Écrivez votre article en Markdown..."
                    rows={20}
                  />
                  <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    ⚠️ Note: Le contenu Markdown sera affiché tel quel sur le site. L&apos;éditeur visuel génère du HTML.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Author Tab */}
          {activeTab === 'author' && (
            <div className="space-y-6">
              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Rédigez en français uniquement.</strong> Les traductions de la bio seront générées automatiquement via le bouton &quot;Push Traductions&quot;.
                </p>
              </div>

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

              {/* Author Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio de l&apos;auteur
                </label>
                <textarea
                  value={form.author_bio_fr || ''}
                  onChange={(e) => setForm({ ...form, author_bio_fr: e.target.value })}
                  rows={4}
                  placeholder="Courte biographie de l'auteur (2-3 phrases). Ex: Spécialiste de l'Asie depuis 15 ans, Marie a vécu 5 ans au Japon et parcourt la région chaque année. Elle partage sa passion pour les voyages authentiques et hors des sentiers battus."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(form.author_bio_fr || '').length}/300 caractères recommandés
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Aperçu</h4>
                <div className="flex items-start gap-3">
                  {form.author_avatar ? (
                    <img
                      src={form.author_avatar}
                      alt={form.author_name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{form.author_name || 'Nom de l\'auteur'}</p>
                    <p className="text-sm text-gray-500">{form.author_role || 'Fonction'}</p>
                    {form.author_bio_fr && (
                      <p className="text-sm text-gray-600 mt-2">{form.author_bio_fr}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Ajoutez des questions fréquentes qui seront affichées en bas de l&apos;article. Les réponses seront traduites automatiquement.
                </p>
              </div>

              {isNew && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-700">
                    <strong>Note :</strong> Vous devez d&apos;abord créer l&apos;article avant de pouvoir ajouter des FAQs.
                  </p>
                </div>
              )}

              {/* FAQ List */}
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={faq.id || `new-${index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <span className="flex items-center justify-center w-8 h-8 bg-terracotta-100 text-terracotta-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveFAQ(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Monter"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFAQ(index, 'down')}
                          disabled={index === faqs.length - 1}
                          className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Descendre"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFAQ(index)}
                          className="p-1.5 text-red-400 hover:text-red-600"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question
                        </label>
                        <input
                          type="text"
                          value={faq.question_fr}
                          onChange={(e) => updateFAQ(index, 'question_fr', e.target.value)}
                          placeholder="Ex: Quelle est la meilleure période pour visiter ?"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                        />
                      </div>
                      <div>
                        <RichTextEditor
                          value={faq.answer_fr}
                          onChange={(content) => updateFAQ(index, 'answer_fr', content)}
                          label="Réponse"
                          placeholder="Votre réponse détaillée..."
                          minHeight="120px"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {faqs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Aucune FAQ pour cet article</p>
                    <p className="text-sm text-gray-400 mt-1">Cliquez sur le bouton ci-dessous pour ajouter une question</p>
                  </div>
                )}
              </div>

              {/* Add FAQ Button */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={addFAQ}
                  disabled={isNew}
                  className="px-4 py-2 border border-terracotta-300 text-terracotta-600 rounded-lg hover:bg-terracotta-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Ajouter une question
                </button>

                {faqs.length > 0 && !isNew && (
                  <button
                    type="button"
                    onClick={saveFAQs}
                    className="px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors"
                  >
                    Sauvegarder les FAQs
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 pt-6 mt-6 border-t border-gray-200">
            {/* Translation Push Button */}
            {!isNew && (
              <TranslationPushButton
                contentType="article"
                contentId={params.id as string}
                onSuccess={() => console.log('Article translations completed')}
              />
            )}
            {isNew && <div />}

            <div className="flex items-center gap-4">
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
          </div>
        </form>
      </div>

      {/* AI Assistant */}
      <ArticleAIAssistant
        title={form.title}
        excerpt={form.excerpt}
        content={form.content}
        tags={form.tags}
        onInsertContent={(content) => {
          // Append or replace content based on current state
          if (form.content) {
            setForm({ ...form, content: form.content + '\n\n' + content });
          } else {
            setForm({ ...form, content });
          }
        }}
        onUpdateMeta={(meta) => {
          const updates: Partial<ArticleForm> = {};
          if (meta.title) updates.title = meta.title;
          if (meta.excerpt) updates.excerpt = meta.excerpt;
          if (meta.slug) updates.slug = meta.slug;
          if (meta.tags) updates.tags = meta.tags;
          setForm({ ...form, ...updates });
        }}
      />
    </div>
  );
}
