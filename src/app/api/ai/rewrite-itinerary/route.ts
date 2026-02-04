/**
 * API de réécriture d'itinéraire avec styles IA
 *
 * 3 styles disponibles :
 * - emotional : Marketing sensoriel, évocateur, fait rêver
 * - informative : Factuel, professionnel, détaillé
 * - adventurous : Dynamique, immersif, storytelling
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export interface ItineraryDay {
  day: number;
  title_fr: string;
  title_en: string;
  description_fr: string;
  description_en: string;
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  accommodation: string;
}

export type RewriteStyle = 'emotional' | 'informative' | 'adventurous';

interface RewriteRequest {
  itinerary: ItineraryDay[];
  style: RewriteStyle;
  language: 'fr' | 'en';
  circuitTitle?: string;
  destination?: string;
}

interface RewriteResponse {
  itinerary: ItineraryDay[];
  style: RewriteStyle;
  language: 'fr' | 'en';
}

// Définition des styles avec leurs prompts spécifiques
const STYLE_PROMPTS: Record<RewriteStyle, { name: string; description: string; guidelines: string }> = {
  emotional: {
    name: 'Marketing Émotionnel',
    description: 'Style sensoriel qui fait rêver et évoque des émotions',
    guidelines: `Tu es un copywriter spécialisé dans le marketing émotionnel pour le tourisme de luxe.

Ton objectif est de faire RÊVER le lecteur en utilisant :
- Des images sensorielles (vue, son, odeur, toucher, goût)
- Des émotions et sentiments (émerveillement, sérénité, excitation)
- Un vocabulaire évocateur et poétique
- Des phrases qui transportent le lecteur sur place
- L'anticipation du plaisir et de la découverte

Exemples de tournures à utiliser :
- "Imaginez-vous..." / "Laissez-vous envoûter par..."
- "Au lever du soleil..." / "Tandis que les premiers rayons..."
- "L'air pur des montagnes..." / "Le parfum enivrant..."
- "Un moment suspendu dans le temps..."
- "Vos sens s'éveillent..."

IMPORTANT :
- Garde la même structure (jour par jour)
- Conserve les informations factuelles (distances, durées, noms de lieux)
- Enrichis le texte sans le rallonger excessivement (max +30% de longueur)
- Reste professionnel, évite le kitsch ou l'exagération`
  },

  informative: {
    name: 'Informatif Professionnel',
    description: 'Style factuel, précis et détaillé pour les professionnels',
    guidelines: `Tu es un rédacteur technique spécialisé dans les programmes de voyage B2B.

Ton objectif est de fournir des informations PRÉCISES et UTILES :
- Détails pratiques (distances, durées, altitudes)
- Informations culturelles et historiques factuelles
- Logistique claire (transferts, hébergements, repas)
- Points d'intérêt avec contexte pertinent
- Conseils pratiques pour les voyageurs

Structure à respecter :
- Phrases claires et directes
- Informations ordonnées logiquement
- Vocabulaire professionnel
- Données chiffrées quand pertinent

Exemples de tournures à utiliser :
- "Transfert de X km (environ Xh) jusqu'à..."
- "Visite du site de X, classé UNESCO depuis..."
- "Déjeuner inclus dans un restaurant local..."
- "Nuit en hôtel X étoiles / camp de yourtes..."

IMPORTANT :
- Garde la même structure (jour par jour)
- Priorise la clarté et l'exhaustivité
- Évite les superlatifs et le langage marketing
- Reste concis mais complet`
  },

  adventurous: {
    name: 'Aventurier Immersif',
    description: 'Style dynamique avec storytelling et immersion',
    guidelines: `Tu es un auteur de récits de voyage et d'aventure.

Ton objectif est de créer une NARRATION IMMERSIVE :
- Utilise le présent de narration pour l'immersion
- Crée un sentiment d'aventure et de découverte
- Implique directement le lecteur ("vous")
- Rythme dynamique avec des phrases variées
- Touches d'humour et d'authenticité

Techniques narratives à utiliser :
- "Votre aventure commence..." / "Le jour se lève sur..."
- "Cap vers..." / "Direction les..."
- "Vous partez à la rencontre de..." / "Une surprise vous attend..."
- "Les plus téméraires pourront..." / "Pour les amateurs de..."
- Utilise des verbes d'action : explorer, découvrir, s'aventurer, traverser

IMPORTANT :
- Garde la même structure (jour par jour)
- Conserve les informations essentielles
- Crée un fil narratif cohérent du début à la fin
- Reste authentique, évite les clichés d'aventurier
- Adapte le niveau d'aventure au type de voyage`
  }
};

export async function POST(request: NextRequest) {
  try {
    // Vérifier que la clé API est configurée
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Rewrite] ANTHROPIC_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Configuration IA manquante. Contactez l\'administrateur.' },
        { status: 500 }
      );
    }

    const body: RewriteRequest = await request.json();
    const { itinerary, style, language, circuitTitle, destination } = body;

    // Validation
    if (!itinerary || !Array.isArray(itinerary) || itinerary.length === 0) {
      return NextResponse.json(
        { error: 'L\'itinéraire est requis et doit contenir au moins un jour' },
        { status: 400 }
      );
    }

    if (!style || !STYLE_PROMPTS[style]) {
      return NextResponse.json(
        { error: 'Style invalide. Choisir parmi : emotional, informative, adventurous' },
        { status: 400 }
      );
    }

    if (!language || !['fr', 'en'].includes(language)) {
      return NextResponse.json(
        { error: 'Langue invalide. Choisir : fr ou en' },
        { status: 400 }
      );
    }

    const styleConfig = STYLE_PROMPTS[style];
    const langField = language === 'fr' ? 'fr' : 'en';
    const langName = language === 'fr' ? 'français' : 'anglais';

    // Préparer le contenu à réécrire
    const contentToRewrite = itinerary.map(day => ({
      day: day.day,
      title: day[`title_${langField}` as keyof ItineraryDay] as string,
      description: day[`description_${langField}` as keyof ItineraryDay] as string,
    }));

    // Construire le prompt
    const contextInfo = [
      circuitTitle && `Titre du circuit : ${circuitTitle}`,
      destination && `Destination : ${destination}`,
    ].filter(Boolean).join('\n');

    const prompt = `${styleConfig.guidelines}

---

${contextInfo ? `CONTEXTE DU VOYAGE :\n${contextInfo}\n\n---\n\n` : ''}ITINÉRAIRE À RÉÉCRIRE (en ${langName}) :

${JSON.stringify(contentToRewrite, null, 2)}

---

CONSIGNES :
1. Réécris chaque jour avec le style "${styleConfig.name}"
2. Garde le même format JSON
3. Ne modifie PAS les numéros de jours
4. Améliore à la fois les titres ET les descriptions
5. Réponds UNIQUEMENT avec le JSON, sans explication

FORMAT DE RÉPONSE ATTENDU :
[
  {
    "day": 1,
    "title": "Titre réécrit...",
    "description": "Description réécrite..."
  },
  ...
]`;

    // Appel à l'API Claude
    console.log('[Rewrite] Calling Claude API with style:', style, 'language:', language, 'days:', itinerary.length);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extraire et parser la réponse
    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    let rewrittenContent: Array<{ day: number; title: string; description: string }>;

    try {
      // Nettoyer la réponse (enlever les blocs de code markdown si présents)
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
      }
      rewrittenContent = JSON.parse(cleanedText.trim());
    } catch (parseError) {
      console.error('[Rewrite] Failed to parse response:', responseText);
      return NextResponse.json(
        { error: 'Erreur lors de la réécriture. Veuillez réessayer.' },
        { status: 500 }
      );
    }

    // Appliquer les modifications à l'itinéraire original
    const rewrittenItinerary: ItineraryDay[] = itinerary.map(originalDay => {
      const rewritten = rewrittenContent.find(r => r.day === originalDay.day);

      if (!rewritten) {
        return originalDay;
      }

      return {
        ...originalDay,
        [`title_${langField}`]: rewritten.title,
        [`description_${langField}`]: rewritten.description,
      } as ItineraryDay;
    });

    const result: RewriteResponse = {
      itinerary: rewrittenItinerary,
      style,
      language,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Rewrite Itinerary] Error:', error);

    // Log plus détaillé pour le debug
    if (error instanceof Error) {
      console.error('[Rewrite Itinerary] Error name:', error.name);
      console.error('[Rewrite Itinerary] Error message:', error.message);

      // Erreurs spécifiques Anthropic
      if (error.message.includes('401') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Erreur d\'authentification avec l\'API IA. Vérifiez la clé API.' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.' },
          { status: 429 }
        );
      }
      if (error.message.includes('model')) {
        return NextResponse.json(
          { error: 'Modèle IA non disponible. Contactez l\'administrateur.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de la réécriture de l\'itinéraire. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}

/**
 * GET - Retourne les styles disponibles avec leurs descriptions
 */
export async function GET() {
  const styles = Object.entries(STYLE_PROMPTS).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description,
  }));

  return NextResponse.json({ styles });
}
