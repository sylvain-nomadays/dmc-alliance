'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { articles, categories, getFeaturedArticles, type Article } from '@/data/articles';

const categoryColors = {
  destinations: {
    bg: 'bg-terracotta-100',
    text: 'text-terracotta-600',
    hover: 'hover:bg-terracotta-500 hover:text-white',
  },
  trends: {
    bg: 'bg-deep-blue-100',
    text: 'text-deep-blue-600',
    hover: 'hover:bg-deep-blue-500 hover:text-white',
  },
  tips: {
    bg: 'bg-sage-100',
    text: 'text-sage-600',
    hover: 'hover:bg-sage-500 hover:text-white',
  },
  partners: {
    bg: 'bg-terracotta-100',
    text: 'text-terracotta-600',
    hover: 'hover:bg-terracotta-500 hover:text-white',
  },
  gir: {
    bg: 'bg-deep-blue-100',
    text: 'text-deep-blue-600',
    hover: 'hover:bg-deep-blue-500 hover:text-white',
  },
};

function ArticleCard({ article, locale, featured = false }: { article: Article; locale: string; featured?: boolean }) {
  const isFr = locale === 'fr';
  const categoryColor = categoryColors[article.category];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (featured) {
    return (
      <Link href={`/${locale}/magazine/${article.slug}`} className="group block">
        <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden">
          <Image
            src={article.image}
            alt={isFr ? article.title.fr : article.title.en}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end">
            <div className="max-w-3xl">
              <span className={cn(
                'inline-block px-3 py-1 rounded-full text-xs font-medium mb-4',
                categoryColor.bg,
                categoryColor.text
              )}>
                {isFr ? categories[article.category].name.fr : categories[article.category].name.en}
              </span>
              <h2 className="text-2xl md:text-4xl font-heading text-white mb-3 group-hover:text-terracotta-300 transition-colors">
                {isFr ? article.title.fr : article.title.en}
              </h2>
              <p className="text-white/80 text-base md:text-lg mb-4 line-clamp-2">
                {isFr ? article.excerpt.fr : article.excerpt.en}
              </p>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span>{formatDate(article.publishedAt)}</span>
                <span>•</span>
                <span>{article.readTime} min {isFr ? 'de lecture' : 'read'}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/${locale}/magazine/${article.slug}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={article.image}
            alt={isFr ? article.title.fr : article.title.en}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <span className={cn(
            'absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium',
            categoryColor.bg,
            categoryColor.text
          )}>
            {isFr ? categories[article.category].name.fr : categories[article.category].name.en}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-lg font-heading text-gray-900 mb-2 group-hover:text-terracotta-500 transition-colors line-clamp-2">
            {isFr ? article.title.fr : article.title.en}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
            {isFr ? article.excerpt.fr : article.excerpt.en}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative">
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-gray-700 font-medium truncate max-w-[120px]">
                {article.author.name}
              </span>
            </div>
            <span className="text-gray-400">
              {article.readTime} min
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MagazinePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const isFr = locale === 'fr';
  const [activeCategory, setActiveCategory] = useState<Article['category'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const featuredArticles = useMemo(() => getFeaturedArticles(), []);
  const mainFeatured = featuredArticles[0];

  const filteredArticles = useMemo(() => {
    let filtered = articles;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter((a) => a.category === activeCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.fr.toLowerCase().includes(query) ||
          a.title.en.toLowerCase().includes(query) ||
          a.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [activeCategory, searchQuery]);

  const translations = {
    title: isFr ? 'Le Magazine' : 'The Magazine',
    subtitle: isFr
      ? 'Tendances, conseils et inspiration pour vos programmations voyage.'
      : 'Trends, tips and inspiration for your travel programming.',
    searchPlaceholder: isFr ? 'Rechercher un article...' : 'Search article...',
    all: isFr ? 'Tous' : 'All',
    noResults: isFr ? 'Aucun article trouvé' : 'No articles found',
    noResultsHint: isFr
      ? 'Essayez de modifier vos filtres ou votre recherche'
      : 'Try changing your filters or search',
    newsletter: {
      title: isFr ? 'Ne manquez rien !' : 'Don\'t miss anything!',
      subtitle: isFr
        ? 'Inscrivez-vous à notre newsletter pour recevoir nos derniers articles et actualités.'
        : 'Subscribe to our newsletter to receive our latest articles and news.',
      placeholder: isFr ? 'Votre email professionnel' : 'Your professional email',
      button: isFr ? 'S\'inscrire' : 'Subscribe',
    },
  };

  const categoryTabs: { key: Article['category'] | 'all'; label: string }[] = [
    { key: 'all', label: translations.all },
    { key: 'destinations', label: isFr ? 'Destinations' : 'Destinations' },
    { key: 'trends', label: isFr ? 'Tendances' : 'Trends' },
    { key: 'tips', label: isFr ? 'Conseils pros' : 'Pro tips' },
    { key: 'gir', label: isFr ? 'GIR' : 'GIR' },
    { key: 'partners', label: isFr ? 'Partenaires' : 'Partners' },
  ];

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-16 bg-deep-blue-900">
        <div className="absolute inset-0">
          <Image
            src="/images/magazine/hero-magazine.jpg"
            alt=""
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-heading text-white mb-4">
              {translations.title}
            </h1>
            <p className="text-xl text-white/80">
              {translations.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {mainFeatured && activeCategory === 'all' && !searchQuery && (
        <section className="py-12 bg-sand-50">
          <div className="container mx-auto px-4">
            <ArticleCard article={mainFeatured} locale={locale} featured />
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-white border-b border-gray-100 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    activeCategory === tab.key
                      ? 'bg-terracotta-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder={translations.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12 bg-sand-50">
        <div className="container mx-auto px-4">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-20">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-xl text-gray-500">{translations.noResults}</h3>
              <p className="text-gray-400 mt-2">{translations.noResultsHint}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles
                .filter((a) => !(activeCategory === 'all' && !searchQuery && a.id === mainFeatured?.id))
                .map((article, index) => (
                  <div
                    key={article.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ArticleCard article={article} locale={locale} />
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-terracotta-500">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-heading text-white mb-4">
              {translations.newsletter.title}
            </h2>
            <p className="text-white/80 mb-8">
              {translations.newsletter.subtitle}
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder={translations.newsletter.placeholder}
                className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Button variant="outline-white" size="lg" type="submit">
                {translations.newsletter.button}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
