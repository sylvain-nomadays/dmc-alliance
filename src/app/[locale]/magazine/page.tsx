import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getAllPublishedArticles, getFeaturedArticles as getDbFeaturedArticles, type ArticleSummary } from '@/lib/supabase/articles';
import { articles as staticArticles, categories, getFeaturedArticles as getStaticFeatured, type Article } from '@/data/articles';
import { MagazinePageClient } from './MagazinePageClient';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === 'fr';

  return {
    title: isFr ? 'Le Magazine - DMC Alliance' : 'The Magazine - DMC Alliance',
    description: isFr
      ? 'Tendances, conseils et inspiration pour vos programmations voyage.'
      : 'Trends, tips and inspiration for your travel programming.',
  };
}

// Convert Supabase article to static Article format for the client component
function convertDbArticleToStatic(dbArticle: ArticleSummary): Article {
  return {
    id: dbArticle.id,
    slug: dbArticle.slug,
    title: {
      fr: dbArticle.title_fr,
      en: dbArticle.title_en || dbArticle.title_fr,
    },
    excerpt: {
      fr: dbArticle.excerpt_fr || '',
      en: dbArticle.excerpt_en || dbArticle.excerpt_fr || '',
    },
    image: dbArticle.image_url || '/images/magazine/default.jpg',
    category: (dbArticle.category as Article['category']) || 'destinations',
    author: {
      name: dbArticle.author_name || 'DMC Alliance',
      role: {
        fr: dbArticle.author_role || 'Équipe éditoriale',
        en: dbArticle.author_role || 'Editorial team'
      },
      avatar: dbArticle.author_avatar || '/images/team/default.jpg',
    },
    publishedAt: dbArticle.published_at || new Date().toISOString(),
    readTime: dbArticle.read_time || 5,
    tags: dbArticle.tags || [],
  };
}

export default async function MagazinePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Get articles from Supabase
  const [dbArticles, dbFeatured] = await Promise.all([
    getAllPublishedArticles(50, 0),
    getDbFeaturedArticles(4),
  ]);

  // Use DB articles if available, otherwise fallback to static
  let articles: Article[];
  let featuredArticles: Article[];

  if (dbArticles.length > 0) {
    articles = dbArticles.map(convertDbArticleToStatic);
    featuredArticles = dbFeatured.length > 0
      ? dbFeatured.map(convertDbArticleToStatic)
      : articles.slice(0, 4);

    console.log(`[Magazine] Loaded ${articles.length} articles from Supabase`);
  } else {
    // Fallback to static data
    articles = staticArticles;
    featuredArticles = getStaticFeatured();
    console.log(`[Magazine] Using ${articles.length} static articles (fallback)`);
  }

  return (
    <MagazinePageClient
      locale={locale}
      articles={articles}
      featuredArticles={featuredArticles}
      categories={categories}
    />
  );
}
