import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: circuitId } = await params;

    // Verify authentication
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Find the user's agency (owner or member)
    let agencyId: string | null = null;

    const { data: directAgency } = await supabaseAdmin
      .from('agencies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (directAgency) {
      agencyId = directAgency.id;
    } else {
      const { data: membership } = await supabaseAdmin
        .from('agency_members')
        .select('agency_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      if (membership) {
        agencyId = membership.agency_id;
      }
    }

    if (!agencyId) {
      return NextResponse.json({ error: 'Agence non trouvée' }, { status: 403 });
    }

    // Fetch circuit details using admin client (bypasses RLS)
    const { data: circuit, error } = await supabaseAdmin
      .from('circuits')
      .select(`
        id, title, slug, description_fr, description_en, itinerary,
        included_fr, included_en, not_included_fr, not_included_en,
        highlights_fr, highlights_en, duration_days, price_from,
        group_size_min, group_size_max, image_url, gallery_urls,
        difficulty_level, use_tiered_commission, base_commission_rate, commission_tiers,
        destination:destinations(id, name, name_en),
        partner:partners(id, name, slug, email, phone, logo_url),
        departures:circuit_departures(id, start_date, end_date, total_seats, booked_seats, price, status)
      `)
      .eq('id', circuitId)
      .single();

    if (error || !circuit) {
      return NextResponse.json({ error: 'Circuit non trouvé' }, { status: 404 });
    }

    // Check watchlist status
    const { data: watchItem } = await supabaseAdmin
      .from('gir_watchlist')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('circuit_id', circuitId)
      .single();

    // Get user profile for pre-filling forms
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      circuit,
      agencyId,
      isWatched: !!watchItem,
      profile: profile || null,
    });

  } catch (error) {
    console.error('[Agency Circuit Detail] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
