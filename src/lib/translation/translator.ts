/**
 * Automatic translation service using Claude API
 * Translates content from French to other supported languages
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  TargetLocale,
  TranslationResult,
  TranslationOptions,
  LOCALE_NAMES,
} from './types';

// Lazy initialization of Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

const LOCALE_FULL_NAMES: Record<TargetLocale, string> = {
  en: 'English',
  de: 'German',
  nl: 'Dutch',
  es: 'Spanish',
  it: 'Italian',
};

/**
 * Translate a single field from French to a target language
 */
export async function translateField(
  frenchContent: string,
  targetLocale: TargetLocale,
  options: TranslationOptions = {
    preserveHtml: true,
    preserveMarkdown: true,
    tone: 'professional',
  }
): Promise<string> {
  if (!frenchContent || frenchContent.trim() === '') {
    return '';
  }

  const client = getAnthropicClient();
  const targetLanguage = LOCALE_FULL_NAMES[targetLocale];

  const systemPrompt = `You are a professional translator specializing in travel and tourism content.
Your task is to translate content from French to ${targetLanguage}.

Rules:
- Maintain the exact same meaning and tone
- Keep the translation natural and fluent in ${targetLanguage}
- ${options.preserveHtml ? 'Preserve all HTML tags exactly as they are (e.g., <strong>, <br>, <a href="...">)' : 'Remove HTML tags if present'}
- ${options.preserveMarkdown ? 'Preserve markdown formatting (headers, lists, bold, etc.)' : 'Remove markdown formatting'}
- Use a ${options.tone} tone
- Do not add any explanations or notes, just provide the translation
- Keep proper nouns (place names, brand names) as they are
- Adapt units and formats to the target locale when appropriate
${options.context ? `\nContext: ${options.context}` : ''}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Translate the following French text to ${targetLanguage}. Return ONLY the translated text, nothing else.\n\n${frenchContent}`,
        },
      ],
      system: systemPrompt,
    });

    const response = message.content[0];
    if (response.type === 'text') {
      return response.text.trim();
    }

    throw new Error('Unexpected response format from Claude');
  } catch (error) {
    console.error(`[Translation] Error translating to ${targetLocale}:`, error);
    throw error;
  }
}

/**
 * Translate multiple fields to a single target language
 */
export async function translateFields(
  fields: Record<string, string>,
  targetLocale: TargetLocale,
  options?: TranslationOptions
): Promise<TranslationResult> {
  const translatedFields: Record<string, string> = {};
  const errors: string[] = [];

  for (const [fieldName, frenchContent] of Object.entries(fields)) {
    if (!frenchContent) {
      translatedFields[fieldName] = '';
      continue;
    }

    try {
      // Handle arrays (like highlights, features)
      if (Array.isArray(JSON.parse(frenchContent))) {
        const items = JSON.parse(frenchContent) as string[];
        const translatedItems: string[] = [];

        for (const item of items) {
          const translated = await translateField(item, targetLocale, options);
          translatedItems.push(translated);
        }

        translatedFields[fieldName] = JSON.stringify(translatedItems);
      } else {
        translatedFields[fieldName] = await translateField(frenchContent, targetLocale, options);
      }
    } catch {
      // If JSON parse fails, treat as regular string
      try {
        translatedFields[fieldName] = await translateField(frenchContent, targetLocale, options);
      } catch (err) {
        errors.push(`Failed to translate ${fieldName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        translatedFields[fieldName] = frenchContent; // Fallback to original
      }
    }
  }

  return {
    locale: targetLocale,
    fields: translatedFields,
    success: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined,
  };
}

/**
 * Translate content to all target languages
 */
export async function translateToAllLanguages(
  fields: Record<string, string>,
  options?: TranslationOptions
): Promise<TranslationResult[]> {
  const targetLocales: TargetLocale[] = ['en', 'de', 'nl', 'es', 'it'];
  const results: TranslationResult[] = [];

  for (const locale of targetLocales) {
    try {
      const result = await translateFields(fields, locale, options);
      results.push(result);
    } catch (error) {
      results.push({
        locale,
        fields: {},
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed',
      });
    }
  }

  return results;
}

/**
 * Translate a complex object (like itinerary with multiple days)
 */
export async function translateComplexContent(
  content: unknown,
  targetLocale: TargetLocale,
  options?: TranslationOptions
): Promise<unknown> {
  if (content === null || content === undefined) {
    return content;
  }

  if (typeof content === 'string') {
    return translateField(content, targetLocale, options);
  }

  if (Array.isArray(content)) {
    const translatedArray = [];
    for (const item of content) {
      translatedArray.push(await translateComplexContent(item, targetLocale, options));
    }
    return translatedArray;
  }

  if (typeof content === 'object') {
    const translatedObject: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(content as Record<string, unknown>)) {
      // Don't translate certain keys
      if (['id', 'day', 'order', 'duration', 'price', 'image_url', 'coordinates'].includes(key)) {
        translatedObject[key] = value;
      } else if (typeof value === 'string') {
        translatedObject[key] = await translateField(value, targetLocale, options);
      } else {
        translatedObject[key] = await translateComplexContent(value, targetLocale, options);
      }
    }
    return translatedObject;
  }

  // For numbers, booleans, etc.
  return content;
}
