/**
 * Articles data fetching from Supabase
 * Functions to fetch articles, especially those linked to destinations
 *
 * NOTE: Table columns are:
 * - title (French, base column)
 * - title_en (English)
 * - excerpt (French, base column)
 * - excerpt_en (English)
 * - content (French, HTML)
 * - content_en (English)
 * - status: 'draft' | 'published' | 'archived'
 */

import { createStaticClient } from './server';

export interface ArticleSummary {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string | null;
  excerpt_fr: string | null;
  excerpt_en: string | null;
  image_url: string | null;
  category: string | null;
  tags: string[];
  read_time: number;
  published_at: string | null;
  destination_id: string | null;
  destination?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  image_url: string | null;
  category: string | null;
  tags: string[];
  read_time: number | null;
  published_at: string | null;
  destination_id: string | null;
  destination?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface ArticleDetailRow extends ArticleRow {
  content: string | null;
  content_en: string | null;
  author_name: string | null;
  author_role: string | null;
  author_avatar: string | null;
}

// Convert database row to our interface (rename title -> title_fr, etc.)
function mapArticleRow(article: ArticleRow): ArticleSummary {
  return {
    id: article.id,
    slug: article.slug,
    title_fr: article.title,
    title_en: article.title_en,
    excerpt_fr: article.excerpt,
    excerpt_en: article.excerpt_en,
    image_url: article.image_url,
    category: article.category,
    tags: article.tags || [],
    read_time: article.read_time || 5,
    published_at: article.published_at,
    destination_id: article.destination_id,
    destination: article.destination,
  };
}

/**
 * Get articles linked to a specific destination
 * @param destinationId - The destination UUID from Supabase
 * @param limit - Maximum number of articles to return
 */
export async function getArticlesByDestinationId(
  destinationId: string,
  limit: number = 3
): Promise<ArticleSummary[]> {
  const supabase = createStaticClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('articles')
    .select(`
      id,
      slug,
      title,
      title_en,
      excerpt,
      excerpt_en,
      image_url,
      category,
      tags,
      read_time,
      published_at
    `)
    .eq('destination_id', destinationId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching articles by destination:', error);
    return [];
  }

  return ((data as ArticleRow[]) || []).map(mapArticleRow);
}

/**
 * Get articles linked to a destination by slug
 * First finds the destination ID, then fetches related articles
 * @param destinationSlug - The destination slug
 * @param limit - Maximum number of articles to return
 */
export async function getArticlesByDestinationSlug(
  destinationSlug: string,
  limit: number = 3
): Promise<ArticleSummary[]> {
  const supabase = createStaticClient();

  // First, get the destination ID from the slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: destinationData, error: destError } = await (supabase as any)
    .from('destinations')
    .select('id')
    .eq('slug', destinationSlug)
    .eq('is_active', true)
    .single();

  if (destError || !destinationData) {
    // If destination not found in Supabase, try to find articles by destination name match
    // This is a fallback for when destinations are in static data but articles have destination_id
    console.log(`Destination "${destinationSlug}" not found in Supabase, trying name match`);
    return getArticlesByDestinationName(destinationSlug, limit);
  }

  return getArticlesByDestinationId(destinationData.id, limit);
}

/**
 * Fallback: Get articles that might be related by searching in tags or content
 * @param destinationSlug - The destination slug to search for
 * @param limit - Maximum number of articles to return
 */
async function getArticlesByDestinationName(
  destinationSlug: string,
  limit: number = 3
): Promise<ArticleSummary[]> {
  const supabase = createStaticClient();

  // Convert slug to a searchable name (e.g., "mongolie" -> "mongolie")
  const searchTerm = destinationSlug.toLowerCase().replace(/-/g, ' ');

  // Search for articles that have the destination name in their tags
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('articles')
    .select(`
      id,
      slug,
      title,
      title_en,
      excerpt,
      excerpt_en,
      image_url,
      category,
      tags,
      read_time,
      published_at,
      destination_id
    `)
    .eq('status', 'published')
    .contains('tags', [searchTerm])
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching articles by tag search:', error);
    return [];
  }

  return ((data as ArticleRow[]) || []).map(mapArticleRow);
}

/**
 * Get all published articles
 * @param limit - Maximum number of articles to return
 * @param offset - Number of articles to skip (for pagination)
 */
export async function getAllPublishedArticles(
  limit: number = 10,
  offset: number = 0
): Promise<ArticleSummary[]> {
  const supabase = createStaticClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('articles')
    .select(`
      id,
      slug,
      title,
      title_en,
      excerpt,
      excerpt_en,
      image_url,
      category,
      tags,
      read_time,
      published_at,
      destination_id,
      destination:destinations(id, name, slug)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching all articles:', error);
    return [];
  }

  return ((data as ArticleRow[]) || []).map(mapArticleRow);
}

/**
 * Full article detail including content
 */
export interface ArticleDetail {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string | null;
  excerpt_fr: string | null;
  excerpt_en: string | null;
  content_fr: string | null;
  content_en: string | null;
  image_url: string | null;
  category: string | null;
  tags: string[];
  read_time: number;
  published_at: string | null;
  author_name: string | null;
  author_role: string | null;
  author_avatar: string | null;
  destination_id: string | null;
  destination?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

/**
 * Get a single article by slug
 * @param slug - The article slug
 */
export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  const supabase = createStaticClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('articles')
    .select(`
      id,
      slug,
      title,
      title_en,
      excerpt,
      excerpt_en,
      content,
      content_en,
      image_url,
      category,
      tags,
      read_time,
      published_at,
      author_name,
      author_role,
      author_avatar,
      destination_id,
      destination:destinations(id, name, slug)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    console.error('Error fetching article by slug:', error);
    return null;
  }

  const article = data as ArticleDetailRow;

  return {
    id: article.id,
    slug: article.slug,
    title_fr: article.title,
    title_en: article.title_en,
    excerpt_fr: article.excerpt,
    excerpt_en: article.excerpt_en,
    content_fr: article.content,
    content_en: article.content_en,
    image_url: article.image_url,
    category: article.category,
    tags: article.tags || [],
    read_time: article.read_time || 5,
    published_at: article.published_at,
    author_name: article.author_name,
    author_role: article.author_role,
    author_avatar: article.author_avatar,
    destination_id: article.destination_id,
    destination: article.destination,
  };
}

/**
 * Get featured articles
 * @param limit - Maximum number of articles to return
 */
export async function getFeaturedArticles(limit: number = 4): Promise<ArticleSummary[]> {
  const supabase = createStaticClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('articles')
    .select(`
      id,
      slug,
      title,
      title_en,
      excerpt,
      excerpt_en,
      image_url,
      category,
      tags,
      read_time,
      published_at,
      destination_id,
      destination:destinations(id, name, slug)
    `)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured articles:', error);
    return [];
  }

  return ((data as ArticleRow[]) || []).map(mapArticleRow);
}
