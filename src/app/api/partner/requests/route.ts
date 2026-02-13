import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET: Liste des demandes d'agences pour les circuits du partenaire connecté (bypass RLS)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get('status'); // 'pending' | 'sent' | 'accepted' | 'rejected' | null

    // Trouver le partenaire via owner_id
    const { data: partner } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    let partnerId = partner?.id;

    // Fallback: chercher via partner_members
    if (!partnerId) {
      const { data: membership } = await supabaseAdmin
        .from('partner_members')
        .select('partner_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      partnerId = membership?.partner_id;
    }

    // Fallback: check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    if (!partnerId && !isAdmin) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 403 });
    }

    // Construire la requête
    let query = supabaseAdmin
      .from('agency_requests')
      .select(`
        id, request_type, travelers_count, message,
        contact_name, contact_email, contact_phone, status,
        partner_notified_at, partner_response_message, responded_at,
        created_at, departure_id,
        circuit:circuits(id, title, slug, partner_id),
        agency:agencies(id, name)
      `)
      .order('created_at', { ascending: false });

    // Filter by partner's circuits (unless admin)
    if (partnerId && !isAdmin) {
      // Get the partner's circuit IDs first
      const { data: circuits } = await supabaseAdmin
        .from('circuits')
        .select('id')
        .eq('partner_id', partnerId);

      const circuitIds = (circuits || []).map((c: { id: string }) => c.id);

      if (circuitIds.length === 0) {
        return NextResponse.json({ requests: [] });
      }

      query = query.in('circuit_id', circuitIds);
    }

    if (filterStatus && ['pending', 'sent', 'accepted', 'rejected'].includes(filterStatus)) {
      query = query.eq('status', filterStatus);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('[Partner Requests] GET error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error('[Partner Requests] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
