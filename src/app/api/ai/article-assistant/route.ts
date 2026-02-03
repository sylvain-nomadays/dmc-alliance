import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
function getAnthropic() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });
}

interface AssistantRequest {
  action: 'suggest_topics' | 'generate_outline' | 'write_section' | 'write_full_article' | 'improve_text' | 'seo_analysis' | 'generate_meta';
  keywords?: string[];
  category?: string;
  currentContent?: string;
  sectionTitle?: string;
  targetKeywords?: string[];
  title?: string;
  excerpt?: string;
  language?: 'fr' | 'en';
  outline?: string; // JSON stringified outline for full article generation
}

// System prompts for different actions
const SYSTEM_PROMPTS = {
  suggest_topics: `Tu es un expert en marketing de contenu B2B spécialisé dans le secteur du voyage et du tourisme.
Tu travailles pour DMC Alliance, une plateforme qui connecte les agences de voyage avec des DMC (Destination Management Companies) locaux.

Ta mission est de suggérer des sujets d'articles pertinents et engageants pour un public B2B (agents de voyage, tour-opérateurs).

Les sujets doivent être :
- Pertinents pour l'industrie du voyage B2B
- Optimisés pour le référencement naturel
- Utiles et informatifs pour les professionnels du voyage
- En lien avec les mots-clés fournis

Réponds en JSON avec le format suivant :
{
  "topics": [
    {
      "title": "Titre de l'article suggéré",
      "angle": "Angle éditorial proposé",
      "keywords": ["mot-clé 1", "mot-clé 2"],
      "targetAudience": "Public cible spécifique",
      "estimatedReadTime": 5
    }
  ]
}`,

  generate_outline: `Tu es un rédacteur B2B expert dans le secteur du voyage.
Tu dois créer une structure d'article détaillée et optimisée pour le SEO.

La structure doit inclure :
- Un titre H1 accrocheur et optimisé
- Une introduction engageante
- Des sections H2 logiques avec sous-sections H3 si nécessaire
- Des points clés à aborder dans chaque section
- Une conclusion avec call-to-action

Réponds en JSON avec le format suivant :
{
  "outline": {
    "h1": "Titre principal",
    "introduction": "Brief de l'introduction (2-3 phrases)",
    "sections": [
      {
        "h2": "Titre de section",
        "brief": "Ce que cette section doit couvrir",
        "subsections": [
          {
            "h3": "Sous-titre",
            "points": ["Point 1", "Point 2"]
          }
        ]
      }
    ],
    "conclusion": "Brief de la conclusion",
    "cta": "Call-to-action suggéré"
  }
}`,

  write_section: `Tu es un rédacteur B2B expert dans le secteur du voyage.
Tu dois rédiger une section d'article en français, avec un ton professionnel mais accessible.

Le texte doit être :
- Informatif et utile pour les professionnels du voyage
- Bien structuré avec des paragraphes courts
- Optimisé pour les mots-clés fournis (sans sur-optimisation)
- Engageant et facile à lire

Utilise le format HTML pour le formatage :
- <p> pour les paragraphes
- <strong> pour le gras
- <em> pour l'italique
- <ul><li> pour les listes
- <blockquote> pour les citations/points importants

Réponds directement avec le contenu HTML, sans JSON.`,

  write_full_article: `Tu es un rédacteur B2B expert dans le secteur du voyage et du tourisme.
Tu travailles pour DMC Alliance, une plateforme qui connecte les agences de voyage avec des DMC locaux.

Tu dois rédiger un article COMPLET en français, avec un ton professionnel mais accessible.
L'article doit faire entre 1500 et 2500 mots.

Le texte doit être :
- Informatif et utile pour les professionnels du voyage (agents de voyage, tour-opérateurs)
- Bien structuré avec une introduction, des sections H2/H3, et une conclusion
- Optimisé pour les mots-clés fournis (sans sur-optimisation)
- Engageant et facile à lire
- Avec des transitions fluides entre les sections

Utilise le format HTML pour le formatage :
- <h2> pour les titres de section principaux
- <h3> pour les sous-sections
- <p> pour les paragraphes
- <strong> pour le gras
- <em> pour l'italique
- <ul><li> pour les listes
- <blockquote> pour les citations/points importants

Réponds directement avec le contenu HTML complet de l'article, sans JSON ni balises markdown.`,

  improve_text: `Tu es un rédacteur B2B expert et un spécialiste SEO.
Tu dois améliorer le texte fourni en :
- Améliorant la clarté et la lisibilité
- Renforçant l'engagement
- Optimisant naturellement pour les mots-clés cibles
- Corrigeant les erreurs grammaticales
- Ajoutant des transitions fluides

Conserve le format HTML existant et améliore-le si nécessaire.
Réponds directement avec le contenu HTML amélioré, sans JSON ni explication.`,

  seo_analysis: `Tu es un expert SEO spécialisé dans le contenu B2B du secteur voyage.
Tu dois analyser le contenu fourni et fournir des recommandations d'optimisation.

Analyse les aspects suivants :
- Densité des mots-clés cibles
- Structure des titres (H1, H2, H3)
- Longueur du contenu
- Lisibilité
- Mots-clés manquants ou à ajouter
- Opportunités d'amélioration

Réponds en JSON avec le format suivant :
{
  "score": 75,
  "analysis": {
    "keywordDensity": {
      "status": "ok|warning|error",
      "message": "Explication",
      "details": {}
    },
    "structure": {
      "status": "ok|warning|error",
      "message": "Explication"
    },
    "readability": {
      "status": "ok|warning|error",
      "message": "Explication",
      "score": 80
    },
    "contentLength": {
      "status": "ok|warning|error",
      "message": "Explication",
      "wordCount": 500
    }
  },
  "suggestions": [
    {
      "type": "keyword|structure|readability|content",
      "priority": "high|medium|low",
      "suggestion": "Suggestion d'amélioration"
    }
  ],
  "missingKeywords": ["mot-clé 1", "mot-clé 2"]
}`,

  generate_meta: `Tu es un expert SEO.
Tu dois générer des métadonnées optimisées pour le référencement.

Génère :
- Un meta title (max 60 caractères)
- Une meta description (max 155 caractères)
- Des tags pertinents
- Un slug URL optimisé

Réponds en JSON avec le format suivant :
{
  "metaTitle": "Titre SEO optimisé",
  "metaDescription": "Description engageante pour les SERP",
  "tags": ["tag1", "tag2", "tag3"],
  "slug": "slug-optimise-seo"
}`
};

export async function POST(request: NextRequest) {
  try {
    const body: AssistantRequest = await request.json();
    const { action, keywords, category, currentContent, sectionTitle, targetKeywords, title, excerpt, language = 'fr' } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action requise' }, { status: 400 });
    }

    const anthropic = getAnthropic();
    let userMessage = '';
    let systemPrompt = SYSTEM_PROMPTS[action];

    // Build user message based on action
    switch (action) {
      case 'suggest_topics':
        userMessage = `Suggère 5 sujets d'articles pour le secteur du voyage B2B.
${keywords?.length ? `Mots-clés à intégrer : ${keywords.join(', ')}` : ''}
${category ? `Catégorie : ${category}` : ''}
Langue : ${language === 'fr' ? 'français' : 'anglais'}`;
        break;

      case 'generate_outline':
        userMessage = `Crée une structure d'article détaillée.
Titre/Sujet : ${title || 'À déterminer'}
${keywords?.length ? `Mots-clés cibles : ${keywords.join(', ')}` : ''}
${category ? `Catégorie : ${category}` : ''}
Langue : ${language === 'fr' ? 'français' : 'anglais'}`;
        break;

      case 'write_section':
        userMessage = `Rédige la section suivante d'un article :
Titre de la section : ${sectionTitle || 'Introduction'}
${targetKeywords?.length ? `Mots-clés à intégrer naturellement : ${targetKeywords.join(', ')}` : ''}
${currentContent ? `Contexte de l'article :\n${currentContent.substring(0, 500)}...` : ''}
Langue : ${language === 'fr' ? 'français' : 'anglais'}

Rédige environ 200-300 mots pour cette section.`;
        break;

      case 'write_full_article':
        userMessage = `Rédige un article complet sur le sujet suivant :
Titre : ${title || 'À déterminer'}
${body.outline ? `Structure à suivre :\n${body.outline}` : ''}
${targetKeywords?.length ? `Mots-clés à intégrer naturellement : ${targetKeywords.join(', ')}` : ''}
Langue : ${language === 'fr' ? 'français' : 'anglais'}

L'article doit faire entre 1500 et 2500 mots, avec une introduction, des sections H2/H3, et une conclusion engageante.`;
        break;

      case 'improve_text':
        if (!currentContent) {
          return NextResponse.json({ error: 'Contenu requis pour l\'amélioration' }, { status: 400 });
        }
        userMessage = `Améliore ce texte :

${currentContent}

${targetKeywords?.length ? `Mots-clés cibles pour l'optimisation : ${targetKeywords.join(', ')}` : ''}
Langue : ${language === 'fr' ? 'français' : 'anglais'}`;
        break;

      case 'seo_analysis':
        if (!currentContent) {
          return NextResponse.json({ error: 'Contenu requis pour l\'analyse SEO' }, { status: 400 });
        }
        userMessage = `Analyse SEO de ce contenu :

Titre : ${title || 'Non défini'}
Extrait : ${excerpt || 'Non défini'}

Contenu :
${currentContent}

${targetKeywords?.length ? `Mots-clés cibles : ${targetKeywords.join(', ')}` : 'Aucun mot-clé cible défini'}`;
        break;

      case 'generate_meta':
        userMessage = `Génère les métadonnées SEO pour cet article :

Titre : ${title || 'Non défini'}
${excerpt ? `Extrait : ${excerpt}` : ''}
${currentContent ? `Début du contenu :\n${currentContent.substring(0, 1000)}...` : ''}
${targetKeywords?.length ? `Mots-clés cibles : ${targetKeywords.join(', ')}` : ''}
Langue : ${language === 'fr' ? 'français' : 'anglais'}`;
        break;

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    }

    // Call Anthropic API
    // Use higher max_tokens for full article generation
    const maxTokens = action === 'write_full_article' ? 8192 : 4096;
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'Pas de réponse de l\'IA' }, { status: 500 });
    }

    let result = textContent.text;

    // For actions that return JSON, parse it
    if (['suggest_topics', 'generate_outline', 'seo_analysis', 'generate_meta'].includes(action)) {
      try {
        // Extract JSON from response (sometimes Claude wraps it in markdown)
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // If parsing fails, return raw text
        console.error('Failed to parse JSON response:', result);
      }
    }

    return NextResponse.json({
      success: true,
      action,
      result,
    });

  } catch (error) {
    console.error('Article assistant error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de la demande' },
      { status: 500 }
    );
  }
}
