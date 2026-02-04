import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { getArticleBySlug, getAllPublishedArticles, type ArticleDetail, type ArticleSummary } from '@/lib/supabase/articles';
import { getArticleBySlug as getStaticArticle, getRecentArticles as getStaticRecentArticles, categories } from '@/data/articles';
import { processContent } from '@/lib/utils/markdown';
import { ArticleFAQ } from './ArticleFAQ';

interface ArticlePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  destinations: {
    bg: 'bg-terracotta-100',
    text: 'text-terracotta-600',
  },
  trends: {
    bg: 'bg-deep-blue-100',
    text: 'text-deep-blue-600',
  },
  tips: {
    bg: 'bg-sage-100',
    text: 'text-sage-600',
  },
  partners: {
    bg: 'bg-terracotta-100',
    text: 'text-terracotta-600',
  },
  gir: {
    bg: 'bg-deep-blue-100',
    text: 'text-deep-blue-600',
  },
};

function RelatedArticleCard({ article, locale }: { article: ArticleSummary; locale: string }) {
  const isFr = locale === 'fr';
  const categoryColor = categoryColors[article.category || 'destinations'] || categoryColors.destinations;
  const categoryData = categories[article.category as keyof typeof categories];

  return (
    <Link href={`/${locale}/magazine/${article.slug}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={article.image_url || '/images/magazine/default.jpg'}
            alt={isFr ? article.title_fr : (article.title_en || article.title_fr)}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {categoryData && (
            <span className={cn(
              'absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium',
              categoryColor.bg,
              categoryColor.text
            )}>
              {isFr ? categoryData.name.fr : categoryData.name.en}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-heading text-gray-900 group-hover:text-terracotta-500 transition-colors line-clamp-2">
            {isFr ? article.title_fr : (article.title_en || article.title_fr)}
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            {article.read_time} min {isFr ? 'de lecture' : 'read'}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params;

  // Try to get article from Supabase first
  let article: ArticleDetail | null = await getArticleBySlug(slug);
  let relatedArticles: ArticleSummary[] = [];
  let isFromSupabase = true;

  // If not found in Supabase, try static data
  if (!article) {
    const staticArticle = getStaticArticle(slug);
    if (!staticArticle) {
      notFound();
    }

    // Convert static article to ArticleDetail format
    article = {
      id: staticArticle.id,
      slug: staticArticle.slug,
      title_fr: staticArticle.title.fr,
      title_en: staticArticle.title.en,
      excerpt_fr: staticArticle.excerpt.fr,
      excerpt_en: staticArticle.excerpt.en,
      content_fr: staticArticle.content?.fr || null,
      content_en: staticArticle.content?.en || null,
      image_url: staticArticle.image,
      category: staticArticle.category,
      tags: staticArticle.tags,
      read_time: staticArticle.readTime,
      published_at: staticArticle.publishedAt,
      author_name: staticArticle.author.name,
      author_role: staticArticle.author.role.fr,
      author_avatar: staticArticle.author.avatar,
      author_bio_fr: staticArticle.author.bio?.fr || null,
      author_bio_en: staticArticle.author.bio?.en || null,
      destination_id: null,
      destination: null,
    };
    isFromSupabase = false;
  }

  // Get related articles
  if (isFromSupabase) {
    const allArticles = await getAllPublishedArticles(10, 0);
    relatedArticles = allArticles.filter(a => a.id !== article!.id).slice(0, 3);
  } else {
    const staticRelated = getStaticRecentArticles(4).filter(a => a.id !== article!.id).slice(0, 3);
    relatedArticles = staticRelated.map(a => ({
      id: a.id,
      slug: a.slug,
      title_fr: a.title.fr,
      title_en: a.title.en,
      excerpt_fr: a.excerpt.fr,
      excerpt_en: a.excerpt.en,
      image_url: a.image,
      category: a.category,
      tags: a.tags,
      read_time: a.readTime,
      published_at: a.publishedAt,
      destination_id: null,
      author_name: a.author?.name || 'The DMC Alliance',
      author_role: typeof a.author?.role === 'string' ? a.author.role : (a.author?.role?.fr || ''),
      author_avatar: a.author?.avatar || null,
    }));
  }

  const isFr = locale === 'fr';
  const categoryColor = categoryColors[article.category || 'destinations'] || categoryColors.destinations;
  const categoryData = categories[article.category as keyof typeof categories];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const translations = {
    backToMagazine: isFr ? 'Retour au magazine' : 'Back to magazine',
    relatedArticles: isFr ? 'Articles similaires' : 'Related articles',
    share: isFr ? 'Partager' : 'Share',
    needHelp: isFr ? 'Des questions ?' : 'Questions?',
    needHelpText: isFr
      ? 'Notre équipe est disponible pour vous accompagner dans vos projets.'
      : 'Our team is available to support you in your projects.',
    contactUs: isFr ? 'Nous contacter' : 'Contact us',
  };

  // Get content - prioritize Supabase content, fallback to sample if empty
  // Process content to convert Markdown to HTML if needed
  const rawContent = isFr
    ? (article.content_fr || getDefaultContent(isFr))
    : (article.content_en || article.content_fr || getDefaultContent(isFr));
  const content = processContent(rawContent);

  const title = isFr ? article.title_fr : (article.title_en || article.title_fr);
  const excerpt = isFr ? article.excerpt_fr : (article.excerpt_en || article.excerpt_fr);

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-20 md:py-32 bg-deep-blue-900">
        <div className="absolute inset-0">
          <Image
            src={article.image_url || '/images/magazine/default.jpg'}
            alt={title}
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-blue-900 via-deep-blue-900/70 to-deep-blue-900/50" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            {/* Back link */}
            <Link
              href={`/${locale}/magazine`}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {translations.backToMagazine}
            </Link>

            {/* Category & Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {categoryData && (
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  categoryColor.bg,
                  categoryColor.text
                )}>
                  {isFr ? categoryData.name.fr : categoryData.name.en}
                </span>
              )}
              <span className="text-white/60">
                {formatDate(article.published_at)}
              </span>
              <span className="text-white/60">•</span>
              <span className="text-white/60">
                {article.read_time} min {isFr ? 'de lecture' : 'read'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-heading text-white mb-6 leading-tight">
              {title}
            </h1>

            {/* Excerpt */}
            {excerpt && (
              <p className="text-xl text-white/80 mb-8">
                {excerpt}
              </p>
            )}

            {/* Author */}
            {article.author_name && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                  {article.author_avatar ? (
                    <Image
                      src={article.author_avatar}
                      alt={article.author_name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-medium">
                      {article.author_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{article.author_name}</p>
                  {article.author_role && (
                    <p className="text-white/60 text-sm">{article.author_role}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Article Content */}
            <div className="lg:col-span-8">
              <article
                className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-terracotta-500 prose-blockquote:border-terracotta-500 prose-blockquote:text-gray-700 prose-blockquote:italic prose-ul:text-gray-600 prose-ol:text-gray-600 prose-li:text-gray-600"
                dangerouslySetInnerHTML={{ __html: content }}
              />

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="mt-8 flex items-center gap-4">
                <span className="text-gray-700 font-medium">{translations.share}</span>
                <div className="flex gap-2">
                  <button className="w-10 h-10 bg-gray-100 hover:bg-deep-blue-500 hover:text-white rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </button>
                  <button className="w-10 h-10 bg-gray-100 hover:bg-deep-blue-700 hover:text-white rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </button>
                  <button className="w-10 h-10 bg-gray-100 hover:bg-terracotta-500 hover:text-white rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-8">
                {/* CTA */}
                <div className="bg-sand-50 rounded-2xl p-6">
                  <h3 className="font-heading text-gray-900 mb-2">
                    {translations.needHelp}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {translations.needHelpText}
                  </p>
                  <Link href={`/${locale}/contact`}>
                    <Button variant="primary" size="md" fullWidth>
                      {translations.contactUs}
                    </Button>
                  </Link>
                </div>

                {/* Author Card */}
                {article.author_name && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        {article.author_avatar ? (
                          <Image
                            src={article.author_avatar}
                            alt={article.author_name}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium text-xl">
                            {article.author_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-heading text-gray-900">{article.author_name}</p>
                        {article.author_role && (
                          <p className="text-gray-500 text-sm">{article.author_role}</p>
                        )}
                      </div>
                    </div>
                    {/* Author Bio */}
                    {(isFr ? article.author_bio_fr : (article.author_bio_en || article.author_bio_fr)) && (
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {isFr ? article.author_bio_fr : (article.author_bio_en || article.author_bio_fr)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <ArticleFAQ articleId={article.id} locale={locale} />

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-16 bg-sand-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-heading text-gray-900 mb-8">
              {translations.relatedArticles}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <RelatedArticleCard
                  key={relatedArticle.id}
                  article={relatedArticle}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Default content when article has no content
function getDefaultContent(isFr: boolean): string {
  return isFr
    ? `<p class="lead">Contenu de l'article à venir...</p>`
    : `<p class="lead">Article content coming soon...</p>`;
}
