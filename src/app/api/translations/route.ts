/**
 * API route for automatic translations
 * POST /api/translations - Translate content from French to all languages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { translateFields, translateToAllLanguages, translateComplexContent } from '@/lib/translation/translator';
import type { TranslatableContentType, TargetLocale, TranslationResult } from '@/lib/translation/types';

// Mapping of content types to their Supabase tables and translatable fields
const CONTENT_CONFIG: Record<TranslatableContentType, {
  table: string;
  fields: { fr: string; targets: Record<TargetLocale, string> }[];
  arrayFields?: { fr: string; targets: Record<TargetLocale, string> }[];
  jsonFields?: { fr: string; targets: Record<TargetLocale, string> }[];
}> = {
  destination: {
    table: 'destinations',
    fields: [
      { fr: 'name_fr', targets: { en: 'name_en', de: 'name_de', nl: 'name_nl', es: 'name_es', it: 'name_it' } },
      { fr: 'description_fr', targets: { en: 'description_en', de: 'description_de', nl: 'description_nl', es: 'description_es', it: 'description_it' } },
      { fr: 'best_time', targets: { en: 'best_time_en', de: 'best_time_de', nl: 'best_time_nl', es: 'best_time_es', it: 'best_time_it' } },
      { fr: 'ideal_duration', targets: { en: 'ideal_duration_en', de: 'ideal_duration_de', nl: 'ideal_duration_nl', es: 'ideal_duration_es', it: 'ideal_duration_it' } },
    ],
    arrayFields: [
      { fr: 'highlights_fr', targets: { en: 'highlights_en', de: 'highlights_de', nl: 'highlights_nl', es: 'highlights_es', it: 'highlights_it' } },
    ],
  },
  article: {
    table: 'articles',
    fields: [
      { fr: 'title_fr', targets: { en: 'title_en', de: 'title_de', nl: 'title_nl', es: 'title_es', it: 'title_it' } },
      { fr: 'excerpt_fr', targets: { en: 'excerpt_en', de: 'excerpt_de', nl: 'excerpt_nl', es: 'excerpt_es', it: 'excerpt_it' } },
      { fr: 'content_fr', targets: { en: 'content_en', de: 'content_de', nl: 'content_nl', es: 'content_es', it: 'content_it' } },
    ],
  },
  circuit: {
    table: 'circuits',
    fields: [
      { fr: 'title_fr', targets: { en: 'title_en', de: 'title_de', nl: 'title_nl', es: 'title_es', it: 'title_it' } },
      { fr: 'description_fr', targets: { en: 'description_en', de: 'description_de', nl: 'description_nl', es: 'description_es', it: 'description_it' } },
    ],
    arrayFields: [
      { fr: 'highlights_fr', targets: { en: 'highlights_en', de: 'highlights_de', nl: 'highlights_nl', es: 'highlights_es', it: 'highlights_it' } },
      { fr: 'included_fr', targets: { en: 'included_en', de: 'included_de', nl: 'included_nl', es: 'included_es', it: 'included_it' } },
      { fr: 'not_included_fr', targets: { en: 'not_included_en', de: 'not_included_de', nl: 'not_included_nl', es: 'not_included_es', it: 'not_included_it' } },
    ],
    jsonFields: [
      { fr: 'itinerary_fr', targets: { en: 'itinerary_en', de: 'itinerary_de', nl: 'itinerary_nl', es: 'itinerary_es', it: 'itinerary_it' } },
    ],
  },
  partner: {
    table: 'partners',
    fields: [
      { fr: 'description_fr', targets: { en: 'description_en', de: 'description_de', nl: 'description_nl', es: 'description_es', it: 'description_it' } },
    ],
    arrayFields: [
      { fr: 'expertise_fr', targets: { en: 'expertise_en', de: 'expertise_de', nl: 'expertise_nl', es: 'expertise_es', it: 'expertise_it' } },
    ],
  },
  email_template: {
    table: 'email_templates',
    fields: [
      { fr: 'subject_fr', targets: { en: 'subject_en', de: 'subject_de', nl: 'subject_nl', es: 'subject_es', it: 'subject_it' } },
      { fr: 'body_fr', targets: { en: 'body_en', de: 'body_de', nl: 'body_nl', es: 'body_es', it: 'body_it' } },
    ],
  },
  newsletter: {
    table: 'newsletter_campaigns',
    fields: [
      { fr: 'subject_fr', targets: { en: 'subject_en', de: 'subject_de', nl: 'subject_nl', es: 'subject_es', it: 'subject_it' } },
      { fr: 'content_fr', targets: { en: 'content_en', de: 'content_de', nl: 'content_nl', es: 'content_es', it: 'content_it' } },
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { contentType, contentId, targetLocales } = body as {
      contentType: TranslatableContentType;
      contentId: string;
      targetLocales?: TargetLocale[];
    };

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'contentType and contentId are required' }, { status: 400 });
    }

    const config = CONTENT_CONFIG[contentType];
    if (!config) {
      return NextResponse.json({ error: `Unknown content type: ${contentType}` }, { status: 400 });
    }

    // Fetch the content from Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: content, error: fetchError } = await (supabase as any)
      .from(config.table)
      .select('*')
      .eq('id', contentId)
      .single();

    if (fetchError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Create a translation job record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: job } = await (supabase as any)
      .from('translation_jobs')
      .insert({
        content_type: contentType,
        content_id: contentId,
        target_locales: targetLocales || ['en', 'de', 'nl', 'es', 'it'],
        status: 'in_progress',
        created_by: user.id,
      })
      .select('id')
      .single();

    const locales = (targetLocales || ['en', 'de', 'nl', 'es', 'it']) as TargetLocale[];
    const updateData: Record<string, unknown> = {};
    const results: TranslationResult[] = [];

    try {
      // Translate regular text fields
      for (const field of config.fields) {
        const frenchContent = content[field.fr];
        if (frenchContent) {
          for (const locale of locales) {
            try {
              const { translateField } = await import('@/lib/translation/translator');
              const translated = await translateField(frenchContent, locale);
              updateData[field.targets[locale]] = translated;
            } catch (err) {
              console.error(`Error translating ${field.fr} to ${locale}:`, err);
            }
          }
        }
      }

      // Translate array fields (highlights, etc.)
      if (config.arrayFields) {
        for (const field of config.arrayFields) {
          const frenchArray = content[field.fr];
          if (frenchArray && Array.isArray(frenchArray) && frenchArray.length > 0) {
            for (const locale of locales) {
              try {
                const { translateField } = await import('@/lib/translation/translator');
                const translatedArray: string[] = [];
                for (const item of frenchArray) {
                  const translated = await translateField(item, locale);
                  translatedArray.push(translated);
                }
                updateData[field.targets[locale]] = translatedArray;
              } catch (err) {
                console.error(`Error translating ${field.fr} to ${locale}:`, err);
              }
            }
          }
        }
      }

      // Translate JSON fields (itinerary, etc.)
      if (config.jsonFields) {
        for (const field of config.jsonFields) {
          const frenchJson = content[field.fr];
          if (frenchJson) {
            for (const locale of locales) {
              try {
                const translated = await translateComplexContent(frenchJson, locale);
                updateData[field.targets[locale]] = translated;
              } catch (err) {
                console.error(`Error translating ${field.fr} to ${locale}:`, err);
              }
            }
          }
        }
      }

      // Update translations_updated_at
      updateData.translations_updated_at = new Date().toISOString();

      // Save translations to database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from(config.table)
        .update(updateData)
        .eq('id', contentId);

      if (updateError) {
        throw new Error(`Failed to save translations: ${updateError.message}`);
      }

      // Update job status
      if (job?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('translation_jobs')
          .update({
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      }

      return NextResponse.json({
        success: true,
        message: `Translated to ${locales.length} languages`,
        translatedFields: Object.keys(updateData).filter(k => k !== 'translations_updated_at'),
      });
    } catch (error) {
      // Update job status on failure
      if (job?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('translation_jobs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', job.id);
      }

      throw error;
    }
  } catch (error) {
    console.error('[API] Translation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/translations - Get translation status for content
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const contentId = searchParams.get('contentId');

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'contentType and contentId are required' }, { status: 400 });
    }

    // Get latest translation job for this content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: job } = await (supabase as any)
      .from('translation_jobs')
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get content to check which translations exist
    const config = CONTENT_CONFIG[contentType as TranslatableContentType];
    if (!config) {
      return NextResponse.json({ error: `Unknown content type: ${contentType}` }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: content } = await (supabase as any)
      .from(config.table)
      .select('translations_updated_at')
      .eq('id', contentId)
      .single();

    return NextResponse.json({
      lastJob: job || null,
      translationsUpdatedAt: content?.translations_updated_at || null,
    });
  } catch (error) {
    console.error('[API] Get translation status error:', error);
    return NextResponse.json({ error: 'Failed to get translation status' }, { status: 500 });
  }
}
