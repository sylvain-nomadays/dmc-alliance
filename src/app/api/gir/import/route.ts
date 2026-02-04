import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';

// Initialize Supabase admin client
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Initialize Anthropic client for content rewriting
function getAnthropic() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });
}

interface ImportedCircuitData {
  title?: string;
  subtitle?: string;  // Sous-titre ou titre en anglais pour la BDD
  description_fr?: string;
  description_en?: string;
  highlights_fr?: string[];
  highlights_en?: string[];
  itinerary?: ItineraryDay[];
  included_fr?: string[];
  included_en?: string[];
  not_included_fr?: string[];
  not_included_en?: string[];
  duration_days?: number;
  price_from?: number;
  difficulty_level?: string;  // 'easy' | 'moderate' | 'challenging' | 'expert'
  group_size_min?: number;
  group_size_max?: number;
  departures?: DepartureDate[];
}

/**
 * Convertit le niveau de difficulté textuel en entier (1-5)
 */
function difficultyToInt(level?: string): number {
  if (!level) return 2; // moderate par défaut
  const map: Record<string, number> = {
    'easy': 1,
    'moderate': 2,
    'challenging': 3,
    'expert': 4,
    'extreme': 5,
  };
  return map[level.toLowerCase()] || 2;
}

interface ItineraryDay {
  day: number;
  title_fr: string;
  title_en: string;
  description_fr: string;
  description_en: string;
  meals?: string;
  accommodation?: string;
}

interface DepartureDate {
  start_date: string;
  end_date?: string;
  price: number;
  total_seats: number;
  booked_seats: number;
  status: 'open' | 'confirmed' | 'full' | 'cancelled';
}

/**
 * POST /api/gir/import
 * Importe et réécrit le contenu d'un circuit depuis une URL source
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      source_url,
      circuit_id,
      raw_content,  // Optionnel: contenu HTML brut si fourni manuellement
      rewrite_for_b2b = true,
      create_new = false,  // true = créer un nouveau circuit, false = mettre à jour existant
      destination_id,
      partner_id,
    } = body;

    if (!source_url && !raw_content) {
      return NextResponse.json(
        { error: 'source_url ou raw_content est requis' },
        { status: 400 }
      );
    }

    if (!create_new && !circuit_id) {
      return NextResponse.json(
        { error: 'circuit_id requis pour mise à jour (ou create_new=true pour créer)' },
        { status: 400 }
      );
    }

    let htmlContent = raw_content;

    // Si pas de contenu brut, essayer de récupérer depuis l'URL
    if (!htmlContent && source_url) {
      try {
        const response = await fetch(source_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        htmlContent = await response.text();
      } catch (fetchError) {
        return NextResponse.json({
          error: 'Impossible de récupérer le contenu automatiquement. Veuillez coller le contenu HTML manuellement.',
          requires_manual_content: true,
        }, { status: 422 });
      }
    }

    // Extraire les données du HTML avec l'IA
    console.log('[IMPORT] Starting AI extraction...');
    const extractedData = await extractCircuitDataWithAI(htmlContent, source_url);
    console.log('[IMPORT] Extraction complete, title:', extractedData.title);

    // Si réécriture B2B demandée et qu'on a du contenu
    let processedData = extractedData;
    if (rewrite_for_b2b && (extractedData.description_fr || extractedData.itinerary)) {
      processedData = await rewriteForB2B(extractedData);
    }

    // Sauvegarder ou créer le circuit
    const supabase = getSupabase();

    if (create_new) {
      // Vérifier que destination_id et partner_id sont fournis
      if (!destination_id || !partner_id) {
        return NextResponse.json(
          { error: 'destination_id et partner_id sont requis pour créer un nouveau circuit' },
          { status: 400 }
        );
      }

      // Créer un nouveau circuit
      const slug = generateSlug(processedData.title || 'nouveau-circuit');

      // Calculer duration_days depuis l'itinéraire si non fourni
      const durationDays = processedData.duration_days ||
        (processedData.itinerary?.length ? processedData.itinerary.length : 7);

      // Log des données avant insertion pour debug
      console.log('[IMPORT] Data to insert:', {
        title: processedData.title,
        subtitle: processedData.subtitle,
        hasDescription: !!processedData.description_fr,
        descriptionLength: processedData.description_fr?.length || 0,
        highlightsCount: processedData.highlights_fr?.length || 0,
        includedCount: processedData.included_fr?.length || 0,
        itineraryDays: processedData.itinerary?.length || 0,
        price: processedData.price_from,
        duration: durationDays,
      });

      // Essayer d'abord avec le slug de base, puis avec timestamp si conflit
      let currentSlug = slug;
      let newCircuit = null;
      let createError = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        const { data, error } = await supabase
          .from('circuits')
          .insert({
            slug: currentSlug,
            title: processedData.title || 'Circuit importé',
            subtitle: processedData.subtitle || processedData.title || '',
            description_fr: processedData.description_fr || '',
            description_en: processedData.description_en || '',
            highlights_fr: processedData.highlights_fr || [],
            highlights_en: processedData.highlights_en || [],
            itinerary: processedData.itinerary || [],
            included_fr: processedData.included_fr || [],
            included_en: processedData.included_en || [],
            not_included_fr: processedData.not_included_fr || [],
            not_included_en: processedData.not_included_en || [],
            duration_days: durationDays,
            price_from: processedData.price_from || 0,
            difficulty_level: difficultyToInt(processedData.difficulty_level),
            group_size_min: processedData.group_size_min || 2,
            group_size_max: processedData.group_size_max || 16,
            destination_id,
            partner_id,
            external_source_url: source_url,
            status: 'draft',
          })
          .select()
          .single();

        if (!error) {
          newCircuit = data;
          break;
        }

        // Si erreur de slug dupliqué, réessayer avec timestamp
        if (error.code === '23505' && error.message.includes('slug')) {
          console.log('[IMPORT] Slug exists, retrying with timestamp');
          currentSlug = generateSlug(processedData.title || 'nouveau-circuit', true);
        } else {
          createError = error;
          break;
        }
      }

      if (createError || !newCircuit) throw createError || new Error('Failed to create circuit');

      // Ajouter les dates de départ si disponibles
      if (processedData.departures && processedData.departures.length > 0) {
        await supabase
          .from('circuit_departures')
          .insert(
            processedData.departures.map(d => ({
              circuit_id: newCircuit.id,
              ...d,
            }))
          );
      }

      // Configurer la source externe pour sync futur
      if (source_url) {
        await supabase
          .from('external_sources')
          .insert({
            circuit_id: newCircuit.id,
            source_url,
            source_type: 'website',
            is_active: true,
            sync_frequency: 'daily',
          });
      }

      return NextResponse.json({
        success: true,
        action: 'created',
        circuit_id: newCircuit.id,
        slug: newCircuit.slug,
        data: processedData,
      });
    } else {
      // Mettre à jour un circuit existant
      const { error: updateError } = await supabase
        .from('circuits')
        .update({
          description_fr: processedData.description_fr,
          description_en: processedData.description_en,
          highlights_fr: processedData.highlights_fr,
          highlights_en: processedData.highlights_en,
          itinerary: processedData.itinerary,
          included_fr: processedData.included_fr,
          included_en: processedData.included_en,
          not_included_fr: processedData.not_included_fr,
          not_included_en: processedData.not_included_en,
          duration_days: processedData.duration_days || undefined,
          price_from: processedData.price_from || undefined,
          difficulty_level: processedData.difficulty_level ? difficultyToInt(processedData.difficulty_level) : undefined,
          external_source_url: source_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', circuit_id);

      if (updateError) throw updateError;

      // Mettre à jour les dates de départ si disponibles
      if (processedData.departures && processedData.departures.length > 0) {
        // Supprimer les anciennes dates ouvertes et ajouter les nouvelles
        await supabase
          .from('circuit_departures')
          .delete()
          .eq('circuit_id', circuit_id)
          .eq('status', 'open');

        await supabase
          .from('circuit_departures')
          .insert(
            processedData.departures.map(d => ({
              circuit_id,
              ...d,
            }))
          );
      }

      return NextResponse.json({
        success: true,
        action: 'updated',
        circuit_id,
        data: processedData,
      });
    }
  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Import failed';
    const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error);
    console.error('Error details:', errorDetails);
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Extrait les données du circuit depuis le HTML en utilisant Claude pour une extraction intelligente
 */
async function extractCircuitDataWithAI(html: string, sourceUrl?: string): Promise<ImportedCircuitData> {
  const anthropic = getAnthropic();

  // Utiliser cheerio pour extraire le texte pertinent (réduire la taille du HTML)
  const $ = cheerio.load(html);

  // Supprimer les éléments non pertinents
  $('script, style, nav, footer, header, aside, .cookie-banner, .newsletter, .social-share').remove();

  // Extraire le contenu principal
  const mainContent = $('main, article, .content, .circuit, .tour, .voyage, #content, .main-content').first();
  const textContent = mainContent.length > 0 ? mainContent.text() : $('body').text();

  // Limiter la taille du texte pour l'API
  const truncatedContent = textContent.replace(/\s+/g, ' ').trim().substring(0, 15000);

  console.log('[IMPORT] Extracting data with AI from content length:', truncatedContent.length);

  const extractionPrompt = `Tu es un expert en extraction de données de pages web de circuits touristiques.

Analyse ce contenu de page web et extrais les informations du circuit touristique au format JSON.

CONTENU DE LA PAGE:
${truncatedContent}

URL SOURCE: ${sourceUrl || 'Non fournie'}

Extrais les informations suivantes et retourne UNIQUEMENT du JSON valide (sans markdown, sans commentaires):

{
  "title": "titre du circuit (string)",
  "description_fr": "description complète du circuit, au moins 200 caractères si disponible (string)",
  "highlights_fr": ["point fort 1", "point fort 2", ...],
  "duration_days": nombre de jours (integer),
  "price_from": prix à partir de en euros, sans symbole (integer ou null),
  "difficulty_level": "easy" ou "moderate" ou "challenging" ou "expert" (string),
  "group_size_min": taille min du groupe (integer ou null),
  "group_size_max": taille max du groupe (integer ou null),
  "included_fr": ["prestation incluse 1", "prestation incluse 2", ...],
  "not_included_fr": ["non inclus 1", "non inclus 2", ...],
  "itinerary": [
    {
      "day": 1,
      "title_fr": "titre du jour 1",
      "description_fr": "description des activités du jour 1"
    },
    ...
  ],
  "departures": [
    {
      "start_date": "YYYY-MM-DD (date de départ)",
      "end_date": "YYYY-MM-DD (date de retour, optionnel)",
      "price": prix en euros (integer),
      "total_seats": nombre de places total (integer, défaut 16 si non spécifié),
      "booked_seats": nombre de places réservées (integer, défaut 0 si non spécifié),
      "status": "open" ou "confirmed" ou "full" selon disponibilité
    },
    ...
  ]
}

RÈGLES:
- Si une information n'est pas disponible, utilise null ou un tableau vide []
- Pour le prix, extrais uniquement le nombre (ex: "2490" pas "2 490 €")
- Pour la durée, extrais le nombre de jours (ex: 14 pour "14 jours / 13 nuits")
- Pour l'itinéraire, essaie d'extraire au moins les titres de chaque jour
- La description doit être informative et complète
- Pour les dates de départ (departures), cherche les sections "Dates", "Départs", "Planning", "Calendrier" etc.
- Les dates doivent être au format YYYY-MM-DD (ex: 2025-06-15)
- Si une date indique "complet" ou "full", met status: "full"
- Si une date indique "confirmé" ou "garanti", met status: "confirmed"

Réponds UNIQUEMENT avec le JSON, sans aucun texte avant ou après.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.error('[IMPORT] No text content in AI extraction response');
      return {};
    }

    // Extraire le JSON de la réponse
    let jsonStr = textContent.text.trim();

    // Supprimer les éventuels marqueurs markdown
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const extractedData = JSON.parse(jsonStr);

    console.log('[IMPORT] AI extracted data:', {
      title: extractedData.title,
      hasDescription: !!extractedData.description_fr,
      descriptionLength: extractedData.description_fr?.length || 0,
      highlightsCount: extractedData.highlights_fr?.length || 0,
      itineraryDays: extractedData.itinerary?.length || 0,
      price: extractedData.price_from,
      duration: extractedData.duration_days,
    });

    // Convertir au format attendu
    const result: ImportedCircuitData = {
      title: extractedData.title || undefined,
      subtitle: extractedData.title || undefined,  // Utiliser le titre comme subtitle par défaut
      description_fr: extractedData.description_fr || undefined,
      highlights_fr: extractedData.highlights_fr || undefined,
      duration_days: extractedData.duration_days || undefined,
      price_from: extractedData.price_from || undefined,
      difficulty_level: extractedData.difficulty_level || 'moderate',
      group_size_min: extractedData.group_size_min || undefined,
      group_size_max: extractedData.group_size_max || undefined,
      included_fr: extractedData.included_fr || undefined,
      not_included_fr: extractedData.not_included_fr || undefined,
      itinerary: extractedData.itinerary?.map((day: { day?: number; title_fr?: string; description_fr?: string }, index: number) => ({
        day: day.day || index + 1,
        title_fr: day.title_fr || `Jour ${index + 1}`,
        title_en: '',
        description_fr: day.description_fr || '',
        description_en: '',
      })) || undefined,
    };

    return result;
  } catch (error) {
    console.error('[IMPORT] AI extraction failed:', error);
    // Fallback sur l'extraction basique
    return extractCircuitDataBasic(html);
  }
}

/**
 * Extraction basique (fallback) avec sélecteurs CSS
 */
function extractCircuitDataBasic(html: string): ImportedCircuitData {
  const $ = cheerio.load(html);
  const data: ImportedCircuitData = {};

  // Titre
  data.title = $('h1').first().text().trim() ||
    $('[itemprop="name"]').first().text().trim() ||
    $('title').text().split('-')[0].trim();

  // Description - chercher dans plus d'endroits
  const descriptionSelectors = [
    '.circuit-description',
    '.tour-description',
    '.description',
    '[itemprop="description"]',
    '.intro',
    '.presentation',
    '.overview',
    '.resume',
    'article p',
    '.content p',
    'main p',
  ];
  for (const selector of descriptionSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      const desc = elements.map((_, el) => $(el).text().trim()).get().join(' ');
      if (desc && desc.length > 50) {
        data.description_fr = desc.substring(0, 2000);
        break;
      }
    }
  }

  // Prix - chercher dans tout le texte
  const bodyText = $('body').text();
  const pricePatterns = [
    /(?:à partir de|from|prix|price)[:\s]*(\d[\d\s]*)\s*€/i,
    /(\d[\d\s]*)\s*€\s*(?:\/\s*pers|par personne|per person)/i,
    /(\d{3,})\s*€/,
  ];
  for (const pattern of pricePatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      data.price_from = parseInt(match[1].replace(/\s/g, ''), 10);
      break;
    }
  }

  // Durée
  const durationPatterns = [
    /(\d+)\s*jours?/i,
    /(\d+)\s*days?/i,
    /durée[:\s]*(\d+)/i,
  ];
  for (const pattern of durationPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      data.duration_days = parseInt(match[1], 10);
      break;
    }
  }

  console.log('[IMPORT] Basic extraction result:', {
    title: data.title,
    hasDescription: !!data.description_fr,
    price: data.price_from,
    duration: data.duration_days,
  });

  return data;
}

/**
 * Réécrit le contenu pour un public B2B professionnel
 */
async function rewriteForB2B(data: ImportedCircuitData): Promise<ImportedCircuitData> {
  const anthropic = getAnthropic();

  const prompt = `Tu es un expert en rédaction de contenus touristiques B2B pour les professionnels du voyage (tour-opérateurs, agences de voyage).

Réécris le contenu suivant d'un circuit touristique pour qu'il soit :
1. Adapté à un public professionnel B2B (pas de "vous" direct au voyageur)
2. Reformulé professionnellement (évite le copier-coller mot à mot mais CONSERVE TOUTES les informations)
3. Professionnel mais engageant
4. Orienté vers les arguments de vente (USP, points forts)
5. Avec des informations pratiques utiles aux agents

RÈGLES IMPORTANTES DE CONSERVATION DU CONTENU :
- NE RÉSUME PAS : conserve TOUTES les informations, détails, lieux et descriptions du texte original
- La description réécrite doit être AU MOINS aussi longue que l'originale
- Chaque jour d'itinéraire doit CONSERVER tous les détails : lieux visités, activités, durées, distances, hébergements
- Tu peux ENRICHIR le texte avec des informations complémentaires mais JAMAIS le réduire
- Les noms propres (villes, sites, hôtels, parcs, monuments) doivent être conservés intégralement
- Garde les informations pratiques (km, heures, altitudes, températures) telles quelles

Contenu original à réécrire :

TITRE: ${data.title || 'Non fourni'}

DESCRIPTION:
${data.description_fr || 'Non fournie'}

POINTS FORTS:
${data.highlights_fr?.join('\n') || 'Non fournis'}

ITINÉRAIRE:
${data.itinerary?.map(d => `Jour ${d.day}: ${d.title_fr} - ${d.description_fr}`).join('\n') || 'Non fourni'}

INCLUS:
${data.included_fr?.join('\n') || 'Non fourni'}

NON INCLUS:
${data.not_included_fr?.join('\n') || 'Non fourni'}

---

Réponds au format JSON avec les clés suivantes (toutes en français d'abord, puis en anglais):
{
  "title": "titre réécrit",
  "subtitle": "sous-titre accrocheur pour le circuit",
  "description_fr": "description réécrite pour B2B",
  "description_en": "description in English",
  "highlights_fr": ["point fort 1", "point fort 2"],
  "highlights_en": ["highlight 1", "highlight 2"],
  "selling_points_fr": ["argument commercial 1", "argument commercial 2"],
  "selling_points_en": ["selling point 1", "selling point 2"],
  "ideal_clientele_fr": "description de la clientèle idéale",
  "ideal_clientele_en": "ideal client description",
  "itinerary": [{"day": 1, "title_fr": "...", "title_en": "...", "description_fr": "...", "description_en": "..."}],
  "included_fr": ["prestation 1", "prestation 2"],
  "included_en": ["service 1", "service 2"],
  "not_included_fr": ["élément 1"],
  "not_included_en": ["item 1"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extraire le JSON de la réponse
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.error('No text content in response');
      return data;
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response');
      return data;
    }

    const rewrittenData = JSON.parse(jsonMatch[0]);

    console.log('[IMPORT] Rewritten data from AI:', {
      title: rewrittenData.title,
      subtitle: rewrittenData.subtitle,
      hasDescription: !!rewrittenData.description_fr,
      highlightsCount: rewrittenData.highlights_fr?.length || 0,
    });

    return {
      ...data,
      title: rewrittenData.title || data.title,
      subtitle: rewrittenData.subtitle || data.subtitle || data.title,
      description_fr: rewrittenData.description_fr || data.description_fr,
      description_en: rewrittenData.description_en || data.description_en,
      highlights_fr: rewrittenData.highlights_fr || data.highlights_fr,
      highlights_en: rewrittenData.highlights_en || data.highlights_en,
      itinerary: rewrittenData.itinerary || data.itinerary,
      included_fr: rewrittenData.included_fr || data.included_fr,
      included_en: rewrittenData.included_en || data.included_en,
      not_included_fr: rewrittenData.not_included_fr || data.not_included_fr,
      not_included_en: rewrittenData.not_included_en || data.not_included_en,
    };
  } catch (error) {
    console.error('Error rewriting content:', error);
    // Retourner les données originales avec subtitle défini
    return {
      ...data,
      subtitle: data.subtitle || data.title,
    };
  }
}

/**
 * Génère un slug à partir du titre avec un suffixe unique si nécessaire
 */
function generateSlug(title: string, addTimestamp = false): string {
  let slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Enlever les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);

  // Ajouter un timestamp pour rendre le slug unique si demandé
  if (addTimestamp) {
    const timestamp = Date.now().toString(36);
    slug = `${slug}-${timestamp}`.substring(0, 100);
  }

  return slug;
}
