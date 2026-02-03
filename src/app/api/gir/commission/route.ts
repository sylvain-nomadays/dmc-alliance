import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface CommissionTier {
  min_participants: number;
  max_participants: number | null;
  commission_rate: number;
}

/**
 * GET /api/gir/commission
 * Récupère la commission actuelle pour un circuit
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const circuitId = searchParams.get('circuit_id');

    if (!circuitId) {
      return NextResponse.json(
        { error: 'circuit_id est requis' },
        { status: 400 }
      );
    }

    // Récupérer le circuit avec ses infos de commission
    const { data: circuit, error: circuitError } = await supabase
      .from('circuits')
      .select('*')
      .eq('id', circuitId)
      .single();

    if (circuitError || !circuit) {
      return NextResponse.json(
        { error: 'Circuit non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer le nombre de participants confirmés
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('places_booked')
      .eq('circuit_id', circuitId)
      .eq('status', 'confirmed');

    if (bookingsError) throw bookingsError;

    const currentPax = bookings?.reduce((sum, b: { places_booked?: number }) => sum + (b.places_booked || 0), 0) || 0;

    // Récupérer les paliers de commission
    const { data: tiers, error: tiersError } = await supabase
      .from('commission_tiers')
      .select('*')
      .eq('circuit_id', circuitId)
      .order('min_participants', { ascending: true });

    if (tiersError) throw tiersError;

    // Calculer la commission actuelle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentCommission = (circuit as any).base_commission_rate || 10;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((circuit as any).use_tiered_commission && tiers && tiers.length > 0) {
      // Trouver le palier correspondant
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const tier of tiers as any[]) {
        if (
          currentPax >= tier.min_participants &&
          (tier.max_participants === null || currentPax <= tier.max_participants)
        ) {
          currentCommission = tier.commission_rate;
        }
      }
    }

    // Trouver le prochain palier
    let nextTier: CommissionTier | null = null;
    if (tiers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const tier of tiers as any[]) {
        if (tier.min_participants > currentPax) {
          nextTier = tier;
          break;
        }
      }
    }

    // Calculer combien de pax manquent pour le prochain palier
    const paxToNextTier = nextTier ? nextTier.min_participants - currentPax : null;

    return NextResponse.json({
      circuit_id: circuitId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      circuit_title: (circuit as any).title_fr,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      departure_date: (circuit as any).departure_date,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      places_total: (circuit as any).places_total,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      places_available: (circuit as any).places_available,
      current_pax: currentPax,
      current_commission: currentCommission,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      use_tiered_commission: (circuit as any).use_tiered_commission,
      tiers: tiers || [],
      next_tier: nextTier
        ? {
            min_participants: nextTier.min_participants,
            commission_rate: nextTier.commission_rate,
            pax_needed: paxToNextTier,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching commission:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch commission' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gir/commission
 * Configure les paliers de commission pour un circuit
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { circuit_id, base_commission_rate, use_tiered_commission, tiers } = body;

    if (!circuit_id) {
      return NextResponse.json(
        { error: 'circuit_id est requis' },
        { status: 400 }
      );
    }

    // Mettre à jour le circuit
    const { error: updateError } = await supabase
      .from('circuits')
      .update({
        base_commission_rate: base_commission_rate || 10,
        use_tiered_commission: use_tiered_commission || false,
      })
      .eq('id', circuit_id);

    if (updateError) throw updateError;

    // Si paliers fournis, les remplacer
    if (use_tiered_commission && Array.isArray(tiers)) {
      // Supprimer les anciens paliers
      await supabase
        .from('commission_tiers')
        .delete()
        .eq('circuit_id', circuit_id);

      // Insérer les nouveaux
      if (tiers.length > 0) {
        const tiersToInsert = tiers.map((tier: CommissionTier) => ({
          circuit_id,
          min_participants: tier.min_participants,
          max_participants: tier.max_participants,
          commission_rate: tier.commission_rate,
        }));

        const { error: insertError } = await supabase
          .from('commission_tiers')
          .insert(tiersToInsert);

        if (insertError) throw insertError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Commission configurée avec succès',
    });
  } catch (error) {
    console.error('Error setting commission:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to set commission' },
      { status: 500 }
    );
  }
}
