import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

// Initialize Supabase admin client lazily
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface SyncResult {
  success: boolean;
  circuit_id: string;
  places_available?: number;
  places_total?: number;
  departure_dates?: string[];
  error?: string;
}

/**
 * POST /api/gir/sync
 * Synchronise les données de remplissage depuis une source externe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { circuit_id, source_url, selector_config } = body;

    if (!circuit_id || !source_url) {
      return NextResponse.json(
        { error: 'circuit_id et source_url sont requis' },
        { status: 400 }
      );
    }

    // Récupérer la page source
    const response = await fetch(source_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DMCAllianceBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch source: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extraire les données selon la configuration
    const extractedData = extractAvailabilityData($, selector_config || getDefaultSelectors());

    // Mettre à jour le circuit
    if (extractedData.places_available !== undefined) {
      const { error: updateError } = await getSupabase()
        .from('circuits')
        .update({
          places_available: extractedData.places_available,
          last_external_sync: new Date().toISOString(),
        })
        .eq('id', circuit_id);

      if (updateError) {
        throw updateError;
      }

      // Enregistrer dans l'historique
      await getSupabase()
        .from('circuit_availability_history')
        .insert({
          circuit_id,
          places_available: extractedData.places_available,
          places_booked: (extractedData.places_total || 0) - extractedData.places_available,
          source: 'sync',
          synced_from_url: source_url,
        });

      // Mettre à jour le statut de la source
      await getSupabase()
        .from('external_sources')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'success',
          last_sync_error: null,
        })
        .eq('circuit_id', circuit_id)
        .eq('source_url', source_url);
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('Sync error:', error);

    // Enregistrer l'erreur
    const body = await request.clone().json().catch(() => ({}));
    if (body.circuit_id && body.source_url) {
      await getSupabase()
        .from('external_sources')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'error',
          last_sync_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('circuit_id', body.circuit_id)
        .eq('source_url', body.source_url);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gir/sync
 * Lance la synchronisation pour tous les circuits configurés
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const frequency = searchParams.get('frequency') || 'daily';

    // Récupérer toutes les sources actives à synchroniser
    const { data: sources, error } = await getSupabase()
      .from('external_sources')
      .select('*, circuits(*)')
      .eq('is_active', true)
      .eq('sync_frequency', frequency);

    if (error) throw error;

    const results: SyncResult[] = [];

    for (const source of sources || []) {
      try {
        const response = await fetch(source.source_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DMCAllianceBot/1.0)',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const extractedData = extractAvailabilityData(
          $,
          source.selector_config || getDefaultSelectors()
        );

        if (extractedData.places_available !== undefined) {
          await getSupabase()
            .from('circuits')
            .update({
              places_available: extractedData.places_available,
              last_external_sync: new Date().toISOString(),
            })
            .eq('id', source.circuit_id);

          await getSupabase()
            .from('circuit_availability_history')
            .insert({
              circuit_id: source.circuit_id,
              places_available: extractedData.places_available,
              places_booked: (extractedData.places_total || 0) - extractedData.places_available,
              source: 'sync',
              synced_from_url: source.source_url,
            });
        }

        await getSupabase()
          .from('external_sources')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'success',
            last_sync_error: null,
          })
          .eq('id', source.id);

        results.push({
          success: true,
          circuit_id: source.circuit_id,
          ...extractedData,
        });
      } catch (err) {
        await getSupabase()
          .from('external_sources')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'error',
            last_sync_error: err instanceof Error ? err.message : 'Unknown error',
          })
          .eq('id', source.id);

        results.push({
          success: false,
          circuit_id: source.circuit_id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error('Batch sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch sync failed' },
      { status: 500 }
    );
  }
}

/**
 * Extraction des données de disponibilité depuis le HTML
 */
function extractAvailabilityData(
  $: cheerio.CheerioAPI,
  config: SelectorConfig
): ExtractedData {
  const data: ExtractedData = {};

  // Essayer d'extraire les places disponibles
  if (config.placesAvailable) {
    const placesText = $(config.placesAvailable).text();
    const match = placesText.match(/(\d+)/);
    if (match) {
      data.places_available = parseInt(match[1], 10);
    }
  }

  // Essayer d'extraire le total de places
  if (config.placesTotal) {
    const totalText = $(config.placesTotal).text();
    const match = totalText.match(/(\d+)/);
    if (match) {
      data.places_total = parseInt(match[1], 10);
    }
  }

  // Essayer d'extraire les dates de départ
  if (config.departureDates) {
    const dates: string[] = [];
    $(config.departureDates).each((_, el) => {
      const dateText = $(el).text().trim();
      if (dateText) {
        dates.push(dateText);
      }
    });
    if (dates.length > 0) {
      data.departure_dates = dates;
    }
  }

  // Essayer d'extraire le statut (complet, disponible, etc.)
  if (config.status) {
    const statusText = $(config.status).text().toLowerCase();
    if (statusText.includes('complet') || statusText.includes('full')) {
      data.places_available = 0;
    }
  }

  return data;
}

/**
 * Sélecteurs par défaut pour les sites courants
 */
function getDefaultSelectors(): SelectorConfig {
  return {
    // Sélecteurs génériques qui fonctionnent sur beaucoup de sites
    placesAvailable: '.places-restantes, .availability, [data-places], .seats-available',
    placesTotal: '.places-total, .total-seats, [data-total-places]',
    departureDates: '.departure-date, .date-depart, [data-departure]',
    status: '.status, .booking-status, .availability-status',
  };
}

interface SelectorConfig {
  placesAvailable?: string;
  placesTotal?: string;
  departureDates?: string;
  status?: string;
}

interface ExtractedData {
  places_available?: number;
  places_total?: number;
  departure_dates?: string[];
}
