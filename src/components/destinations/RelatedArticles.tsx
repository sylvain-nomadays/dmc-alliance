import Image from 'next/image';
import Link from 'next/link';
import { getArticlesByDestinationSlug, type ArticleSummary } from '@/lib/supabase/articles';
import { CalendarIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface RelatedArticlesProps {
  locale: string;
  destinationSlug: string;
  destinationName: string;
}

function formatDate(dateString: string | null, locale: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getCategoryLabel(category: string | null, locale: string): string {
  const labels: Record<string, { fr: string; en: string }> = {
    destinations: { fr: 'Destinations', en: 'Destinations' },
    trends: { fr: 'Tendances', en: 'Trends' },
    tips: { fr: 'Conseils', en: 'Tips' },
    partners: { fr: 'Partenaires', en: 'Partners' },
    gir: { fr: 'GIR', en: 'GIR' },
  };

  if (!category) return '';
  return labels[category]?.[locale === 'fr' ? 'fr' : 'en'] || category;
}

export async function RelatedArticles({ locale, destinationSlug, destinationName }: RelatedArticlesProps) {
  const articles = await getArticlesByDestinationSlug(destinationSlug, 3);

  // If no articles found, don't render anything
  if (!articles || articles.length === 0) {
    return null;
  }

  const isFr = locale === 'fr';

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
          <div>
            <span className="inline-block text-terracotta-500 text-sm font-semibold uppercase tracking-wider mb-2">
              Magazine
            </span>
            <h2 className="text-2xl md:text-3xl font-heading text-gray-900">
              {isFr
                ? `Articles sur ${destinationName}`
                : `Articles about ${destinationName}`}
            </h2>
            <p className="text-gray-600 mt-2 max-w-2xl">
              {isFr
                ? 'Découvrez nos articles, conseils et actualités pour mieux vendre cette destination.'
                : 'Discover our articles, tips and news to help you sell this destination.'}
            </p>
          </div>
          <Link
            href={`/${locale}/magazine?destination=${destinationSlug}`}
            className="mt-4 md:mt-0 inline-flex items-center text-terracotta-600 hover:text-terracotta-700 font-medium transition-colors"
          >
            {isFr ? 'Tous les articles' : 'All articles'}
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticleCard({ article, locale }: { article: ArticleSummary; locale: string }) {
  const isFr = locale === 'fr';
  const title = isFr ? article.title_fr : (article.title_en || article.title_fr);
  const excerpt = isFr ? article.excerpt_fr : (article.excerpt_en || article.excerpt_fr);

  return (
    <Link
      href={`/${locale}/magazine/${article.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {article.image_url ? (
          <Image
            src={article.image_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sage-100 to-sand-100 flex items-center justify-center">
            <span className="text-4xl opacity-30">📰</span>
          </div>
        )}

        {/* Category Badge */}
        {article.category && (
          <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
            {getCategoryLabel(article.category, locale)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          {article.published_at && (
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{formatDate(article.published_at, locale)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>{article.read_time} min</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-heading text-gray-900 group-hover:text-terracotta-600 transition-colors mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm text-gray-600 line-clamp-2 flex-1">
            {excerpt}
          </p>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs text-deep-blue-600 bg-deep-blue-50 px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Read More */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="inline-flex items-center text-sm font-medium text-terracotta-600 group-hover:text-terracotta-700">
            {isFr ? 'Lire l\'article' : 'Read article'}
            <ArrowRightIcon className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default RelatedArticles;
