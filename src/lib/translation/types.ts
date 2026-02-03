/**
 * Types for the automatic translation system
 */

// Supported languages (French is the reference language)
export const SUPPORTED_LOCALES = ['fr', 'en', 'de', 'nl', 'es', 'it'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Target languages for translation (all except French)
export const TARGET_LOCALES = ['en', 'de', 'nl', 'es', 'it'] as const;
export type TargetLocale = (typeof TARGET_LOCALES)[number];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  nl: 'Nederlands',
  es: 'Español',
  it: 'Italiano',
};

// Content types that can be translated
export type TranslatableContentType =
  | 'destination'
  | 'article'
  | 'circuit'
  | 'partner'
  | 'email_template'
  | 'newsletter';

// Fields that can be translated for each content type
export const TRANSLATABLE_FIELDS: Record<TranslatableContentType, string[]> = {
  destination: ['name', 'description', 'highlights', 'best_time', 'ideal_duration'],
  article: ['title', 'excerpt', 'content', 'meta_title', 'meta_description'],
  circuit: ['title', 'description', 'highlights', 'itinerary', 'included', 'not_included'],
  partner: ['description', 'expertise', 'services'],
  email_template: ['subject', 'body'],
  newsletter: ['subject', 'content'],
};

// Translation request
export interface TranslationRequest {
  contentType: TranslatableContentType;
  contentId: string;
  fields: Record<string, string>; // Field name -> French content
  targetLocales?: TargetLocale[]; // If not provided, translate to all
}

// Translation result
export interface TranslationResult {
  locale: TargetLocale;
  fields: Record<string, string>; // Field name -> Translated content
  success: boolean;
  error?: string;
}

// Batch translation request
export interface BatchTranslationRequest {
  items: TranslationRequest[];
}

// Translation status
export type TranslationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Translation job (for tracking async translations)
export interface TranslationJob {
  id: string;
  contentType: TranslatableContentType;
  contentId: string;
  sourceLocale: 'fr';
  targetLocales: TargetLocale[];
  status: TranslationStatus;
  progress: number; // 0-100
  results: TranslationResult[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// Options for translation
export interface TranslationOptions {
  preserveHtml: boolean; // Keep HTML tags in translation
  preserveMarkdown: boolean; // Keep markdown formatting
  tone: 'formal' | 'friendly' | 'professional';
  context?: string; // Additional context for better translation
}
