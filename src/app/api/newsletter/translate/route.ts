/**
 * Newsletter Translation API
 * Traduit automatiquement les blocs FR vers EN en utilisant Claude
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { NewsletterBlock } from '@/lib/newsletter/types';

const anthropic = new Anthropic();

interface TranslateRequest {
  blocks: NewsletterBlock[];
  sourceLanguage: 'fr' | 'en';
  targetLanguage: 'fr' | 'en';
}

export async function POST(request: NextRequest) {
  try {
    const { blocks, sourceLanguage, targetLanguage }: TranslateRequest = await request.json();

    if (!blocks || !Array.isArray(blocks)) {
      return NextResponse.json(
        { error: 'Les blocs sont requis' },
        { status: 400 }
      );
    }

    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({ blocks });
    }

    // Extract translatable content from blocks
    const translatableContent = extractTranslatableContent(blocks);

    if (translatableContent.length === 0) {
      return NextResponse.json({ blocks });
    }

    const sourceLang = sourceLanguage === 'fr' ? 'français' : 'anglais';
    const targetLang = targetLanguage === 'fr' ? 'français' : 'anglais';

    const prompt = `Tu es un traducteur professionnel spécialisé dans le tourisme B2B.

Traduis le contenu suivant du ${sourceLang} vers le ${targetLang}.
Conserve le même ton professionnel et le formatage HTML exact (balises <p>, <ul>, <li>, <a>, etc.).
Ne traduis PAS les URLs, les noms propres de marques, ou les balises HTML.

Contenu à traduire (format JSON) :
${JSON.stringify(translatableContent, null, 2)}

Réponds UNIQUEMENT avec le JSON traduit, sans explication ni texte supplémentaire.
Le format doit être exactement le même que l'entrée.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Fast and cost-effective for translation
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the translated content
    const translatedText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parse the translated JSON
    let translatedContent: Array<{ blockId: string; field: string; value: string }>;
    try {
      // Clean up the response (remove markdown code blocks if present)
      let cleanedText = translatedText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
      }
      translatedContent = JSON.parse(cleanedText.trim());
    } catch (parseError) {
      console.error('[Translate] Failed to parse response:', translatedText);
      return NextResponse.json(
        { error: 'Erreur lors de la traduction. Veuillez réessayer.' },
        { status: 500 }
      );
    }

    // Apply translations back to blocks
    const translatedBlocks = applyTranslations(blocks, translatedContent);

    return NextResponse.json({
      blocks: translatedBlocks,
      sourceLanguage,
      targetLanguage,
    });
  } catch (error) {
    console.error('[Translate] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la traduction' },
      { status: 500 }
    );
  }
}

/**
 * Extrait le contenu traduisible des blocs
 */
function extractTranslatableContent(blocks: NewsletterBlock[]): Array<{ blockId: string; field: string; value: string }> {
  const content: Array<{ blockId: string; field: string; value: string }> = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'header':
        if (block.content.title) {
          content.push({ blockId: block.id, field: 'title', value: block.content.title });
        }
        if (block.content.subtitle) {
          content.push({ blockId: block.id, field: 'subtitle', value: block.content.subtitle });
        }
        break;

      case 'text':
        if (block.content.html) {
          content.push({ blockId: block.id, field: 'html', value: block.content.html });
        }
        break;

      case 'image':
        if (block.content.alt) {
          content.push({ blockId: block.id, field: 'alt', value: block.content.alt });
        }
        if (block.content.caption) {
          content.push({ blockId: block.id, field: 'caption', value: block.content.caption });
        }
        break;

      case 'button':
        if (block.content.text) {
          content.push({ blockId: block.id, field: 'text', value: block.content.text });
        }
        break;

      case 'footer':
        if (block.content.address) {
          content.push({ blockId: block.id, field: 'address', value: block.content.address });
        }
        if (block.content.unsubscribeText) {
          content.push({ blockId: block.id, field: 'unsubscribeText', value: block.content.unsubscribeText });
        }
        break;
    }
  }

  return content;
}

/**
 * Applique les traductions aux blocs
 */
function applyTranslations(
  blocks: NewsletterBlock[],
  translations: Array<{ blockId: string; field: string; value: string }>
): NewsletterBlock[] {
  const translationMap = new Map<string, Map<string, string>>();

  for (const translation of translations) {
    if (!translationMap.has(translation.blockId)) {
      translationMap.set(translation.blockId, new Map());
    }
    translationMap.get(translation.blockId)!.set(translation.field, translation.value);
  }

  return blocks.map((block) => {
    const blockTranslations = translationMap.get(block.id);
    if (!blockTranslations) {
      return block;
    }

    const newContent = { ...block.content };

    for (const [field, value] of blockTranslations) {
      (newContent as any)[field] = value;
    }

    return {
      ...block,
      content: newContent,
    };
  });
}
