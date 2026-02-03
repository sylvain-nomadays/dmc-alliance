'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ArticleAIAssistantProps {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  onInsertContent: (content: string) => void;
  onUpdateMeta: (meta: { title?: string; excerpt?: string; tags?: string[]; slug?: string }) => void;
}

interface TopicSuggestion {
  title: string;
  angle: string;
  keywords: string[];
  targetAudience: string;
  estimatedReadTime: number;
}

interface OutlineSection {
  h2: string;
  brief: string;
  subsections?: { h3: string; points: string[] }[];
}

interface Outline {
  h1: string;
  introduction: string;
  sections: OutlineSection[];
  conclusion: string;
  cta: string;
}

interface SEOAnalysis {
  score: number;
  analysis: {
    keywordDensity: { status: string; message: string };
    structure: { status: string; message: string };
    readability: { status: string; message: string; score?: number };
    contentLength: { status: string; message: string; wordCount?: number };
  };
  suggestions: { type: string; priority: string; suggestion: string }[];
  missingKeywords: string[];
}

type AssistantTab = 'topics' | 'outline' | 'write' | 'improve' | 'seo';

export function ArticleAIAssistant({
  title,
  excerpt,
  content,
  tags,
  onInsertContent,
  onUpdateMeta,
}: ArticleAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Mode large/plein écran
  const [activeTab, setActiveTab] = useState<AssistantTab>('topics');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input states
  const [keywords, setKeywords] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [textToImprove, setTextToImprove] = useState('');
  const [targetKeywords, setTargetKeywords] = useState('');

  // Result states
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([]);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [improvedText, setImprovedText] = useState('');
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null);

  const callAssistant = useCallback(async (action: string, params: Record<string, unknown> = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/article-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...params,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la communication avec l\'assistant');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      return data.result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Action handlers
  const handleSuggestTopics = async () => {
    const result = await callAssistant('suggest_topics', {
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      category: 'destinations',
    });
    if (result?.topics) {
      setTopicSuggestions(result.topics);
    }
  };

  const handleGenerateOutline = async () => {
    const result = await callAssistant('generate_outline', {
      title: title || keywords,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
    });
    if (result?.outline) {
      setOutline(result.outline);
    }
  };

  const handleWriteSection = async () => {
    const result = await callAssistant('write_section', {
      sectionTitle,
      targetKeywords: targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
      currentContent: content,
    });
    if (result) {
      setGeneratedContent(typeof result === 'string' ? result : '');
    }
  };

  const handleImproveText = async () => {
    const result = await callAssistant('improve_text', {
      currentContent: textToImprove || content,
      targetKeywords: targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
    });
    if (result) {
      setImprovedText(typeof result === 'string' ? result : '');
    }
  };

  const handleSEOAnalysis = async () => {
    const result = await callAssistant('seo_analysis', {
      title,
      excerpt,
      currentContent: content,
      targetKeywords: targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
    });
    if (result) {
      setSeoAnalysis(result as SEOAnalysis);
    }
  };

  const handleGenerateMeta = async () => {
    const result = await callAssistant('generate_meta', {
      title,
      excerpt,
      currentContent: content,
      targetKeywords: targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
    });
    if (result) {
      onUpdateMeta({
        title: result.metaTitle,
        excerpt: result.metaDescription,
        tags: result.tags,
        slug: result.slug,
      });
    }
  };

  const handleWriteFullArticle = async () => {
    if (!outline) return;

    const result = await callAssistant('write_full_article', {
      title: outline.h1 || title,
      outline: JSON.stringify(outline),
      targetKeywords: targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
    });
    if (result) {
      setGeneratedContent(typeof result === 'string' ? result : '');
      setActiveTab('write');
    }
  };

  const tabs: { id: AssistantTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'topics',
      label: 'Sujets',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'outline',
      label: 'Structure',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      id: 'write',
      label: 'Rédiger',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    {
      id: 'improve',
      label: 'Améliorer',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'seo',
      label: 'SEO',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="font-medium">Assistant IA</span>
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed z-50 bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300",
      isExpanded
        ? "inset-4 rounded-3xl"
        : "bottom-6 right-6 w-[500px] max-h-[700px] rounded-2xl"
    )}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="font-semibold">Assistant IA</span>
          {isExpanded && <span className="text-xs text-white/70 ml-2">Mode étendu</span>}
        </div>
        <div className="flex items-center gap-1">
          {/* Toggle expand button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title={isExpanded ? "Réduire" : "Agrandir"}
          >
            {isExpanded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Topics Tab */}
        {activeTab === 'topics' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mots-clés (séparés par des virgules)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Ex: safari, Kenya, grande migration"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleSuggestTopics}
              disabled={isLoading}
              className="w-full py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Génération...
                </>
              ) : (
                'Suggérer des sujets'
              )}
            </button>

            {topicSuggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Sujets suggérés <span className="text-gray-500 font-normal">(cliquez pour sélectionner)</span> :</h4>
                {topicSuggestions.map((topic, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-purple-50 hover:border-purple-200 border border-transparent cursor-pointer transition-all group"
                    onClick={() => {
                      // Update article title
                      onUpdateMeta({ title: topic.title });
                      // Set keywords for next steps
                      setKeywords(topic.keywords.join(', '));
                      setTargetKeywords(topic.keywords.join(', '));
                      // Switch to outline tab
                      setActiveTab('outline');
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <h5 className="font-medium text-gray-900 text-sm group-hover:text-purple-700">{topic.title}</h5>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-500 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{topic.angle}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {topic.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-purple-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Cliquez pour continuer avec ce sujet →
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Outline Tab */}
        {activeTab === 'outline' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sujet / Mots-clés
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Ex: Comment organiser un safari au Kenya"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleGenerateOutline}
              disabled={isLoading}
              className="w-full py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? 'Génération...' : 'Générer la structure'}
            </button>

            {outline && (
              <div className="space-y-3 text-sm">
                {/* Option to write full article */}
                <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">Rédaction complète</span>
                    <span className="text-xs text-purple-500">1500-2500 mots</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Générer l&apos;article complet en une seule fois, en suivant la structure ci-dessous.
                  </p>
                  <button
                    onClick={handleWriteFullArticle}
                    disabled={isLoading}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Rédaction en cours...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Rédiger tout l&apos;article
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">ou rédiger section par section</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 italic">
                  <span>Cliquez sur une section pour lancer la rédaction automatique</span>
                  {isLoading && (
                    <svg className="w-4 h-4 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                </div>

                {/* H1 Title - Click to use */}
                <div
                  className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 cursor-pointer transition-colors group"
                  onClick={() => {
                    onUpdateMeta({ title: outline.h1 });
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600 font-medium">H1</span>
                    <span className="text-xs text-purple-500 opacity-0 group-hover:opacity-100">Utiliser comme titre</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{outline.h1}</h3>
                </div>

                {/* Introduction - Click to write */}
                <div
                  className="p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group"
                  onClick={async () => {
                    setSectionTitle('Introduction');
                    setActiveTab('write');
                    // Auto-launch writing
                    const result = await callAssistant('write_section', {
                      sectionTitle: 'Introduction',
                      targetKeywords: targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
                      currentContent: content,
                    });
                    if (result) {
                      setGeneratedContent(typeof result === 'string' ? result : '');
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Introduction</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <p className="text-gray-700">{outline.introduction}</p>
                </div>

                {/* Sections - Click to write */}
                {outline.sections.map((section, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group"
                    onClick={async () => {
                      setSectionTitle(section.h2);
                      setActiveTab('write');
                      // Auto-launch writing
                      const result = await callAssistant('write_section', {
                        sectionTitle: section.h2,
                        targetKeywords: targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
                        currentContent: content,
                      });
                      if (result) {
                        setGeneratedContent(typeof result === 'string' ? result : '');
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600 font-medium">H2</span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">{section.h2}</h4>
                    <p className="text-xs text-gray-600 mt-1">{section.brief}</p>
                    {section.subsections?.map((sub, subIndex) => (
                      <div
                        key={subIndex}
                        className="mt-2 pl-3 border-l-2 border-gray-200 hover:border-green-400"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setSectionTitle(sub.h3);
                          setActiveTab('write');
                          // Auto-launch writing
                          const result = await callAssistant('write_section', {
                            sectionTitle: sub.h3,
                            targetKeywords: targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
                            currentContent: content,
                          });
                          if (result) {
                            setGeneratedContent(typeof result === 'string' ? result : '');
                          }
                        }}
                      >
                        <span className="text-xs text-green-600 font-medium">H3</span>
                        <h5 className="text-sm font-medium text-gray-800">{sub.h3}</h5>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Conclusion - Click to write */}
                <div
                  className="p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group"
                  onClick={async () => {
                    setSectionTitle('Conclusion');
                    setActiveTab('write');
                    // Auto-launch writing
                    const result = await callAssistant('write_section', {
                      sectionTitle: 'Conclusion',
                      targetKeywords: targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
                      currentContent: content,
                    });
                    if (result) {
                      setGeneratedContent(typeof result === 'string' ? result : '');
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Conclusion</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <p className="text-gray-700">{outline.conclusion}</p>
                </div>

                {/* CTA */}
                <div className="p-3 bg-terracotta-50 rounded-lg">
                  <span className="text-xs text-terracotta-600 font-medium">Call-to-Action suggéré</span>
                  <p className="text-gray-700">{outline.cta}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Write Tab */}
        {activeTab === 'write' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre de la section à rédiger
              </label>
              <input
                type="text"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder="Ex: Pourquoi choisir un DMC local ?"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mots-clés cibles (optionnel)
              </label>
              <input
                type="text"
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
                placeholder="Ex: DMC, voyage sur-mesure, expertise locale"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleWriteSection}
              disabled={isLoading || !sectionTitle}
              className="w-full py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Rédaction en cours...
                </>
              ) : (
                'Rédiger cette section'
              )}
            </button>

            {/* Loading placeholder */}
            {isLoading && !generatedContent && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-purple-700">L&apos;IA rédige votre section...</p>
                    <p className="text-xs text-purple-500">Cela peut prendre quelques secondes</p>
                  </div>
                </div>
              </div>
            )}

            {generatedContent && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">Contenu généré :</h4>
                  <button
                    onClick={() => setGeneratedContent('')}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Effacer
                  </button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg prose prose-sm max-w-none border border-gray-200" dangerouslySetInnerHTML={{ __html: generatedContent }} />
                <button
                  onClick={() => onInsertContent(generatedContent)}
                  className="w-full py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Insérer dans l&apos;article
                </button>
              </div>
            )}
          </div>
        )}

        {/* Improve Tab */}
        {activeTab === 'improve' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texte à améliorer
              </label>
              <textarea
                value={textToImprove}
                onChange={(e) => setTextToImprove(e.target.value)}
                placeholder="Collez ici le texte à améliorer ou laissez vide pour utiliser le contenu actuel"
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mots-clés cibles pour optimisation
              </label>
              <input
                type="text"
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
                placeholder="Ex: safari, Kenya, voyage"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleImproveText}
              disabled={isLoading || (!textToImprove && !content)}
              className="w-full py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? 'Amélioration...' : 'Améliorer le texte'}
            </button>

            {improvedText && (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: improvedText }} />
                <button
                  onClick={() => onInsertContent(improvedText)}
                  className="w-full py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Remplacer le contenu
                </button>
              </div>
            )}
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mots-clés cibles SEO
              </label>
              <input
                type="text"
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
                placeholder="Ex: safari Kenya, grande migration, Masai Mara"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSEOAnalysis}
                disabled={isLoading || !content}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Analyse...' : 'Analyser SEO'}
              </button>
              <button
                onClick={handleGenerateMeta}
                disabled={isLoading || !content}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Générer métas
              </button>
            </div>

            {seoAnalysis && (
              <div className="space-y-4">
                {/* Score */}
                <div className="flex items-center justify-center">
                  <div className={cn(
                    'w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white',
                    seoAnalysis.score >= 80 ? 'bg-green-500' :
                    seoAnalysis.score >= 60 ? 'bg-yellow-500' :
                    seoAnalysis.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  )}>
                    {seoAnalysis.score}
                  </div>
                </div>

                {/* Analysis */}
                <div className="space-y-2">
                  {Object.entries(seoAnalysis.analysis).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className={cn(
                        'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                        value.status === 'ok' ? 'bg-green-500' :
                        value.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      )} />
                      <div>
                        <span className="text-xs font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <p className="text-xs text-gray-600">{value.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                {seoAnalysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Suggestions :</h4>
                    {seoAnalysis.suggestions.map((sug, index) => (
                      <div key={index} className={cn(
                        'p-2 rounded-lg text-xs',
                        sug.priority === 'high' ? 'bg-red-50 text-red-700' :
                        sug.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                      )}>
                        {sug.suggestion}
                      </div>
                    ))}
                  </div>
                )}

                {/* Missing Keywords */}
                {seoAnalysis.missingKeywords.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Mots-clés manquants :</h4>
                    <div className="flex flex-wrap gap-1">
                      {seoAnalysis.missingKeywords.map((kw, index) => (
                        <span key={index} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
