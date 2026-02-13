import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET: Liste des destinations du partenaire connecté (bypass RLS)
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

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

    if (!partnerId) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 403 });
    }

    // Charger les destinations de ce partenaire (bypass RLS)
    const { data: destinations, error } = await supabaseAdmin
      .from('destinations')
      .select(`
        id,
        slug,
        name,
        name_en,
        region,
        country,
        image_url,
        is_active,
        partner_id,
        partner:partners(name)
      `)
      .eq('partner_id', partnerId)
      .order('name');

    if (error) {
      console.error('Error fetching partner destinations:', error);
      return NextResponse.json({ error: 'Erreur lors du chargement' }, { status: 500 });
    }

    return NextResponse.json({ destinations: destinations || [], partnerId });
  } catch (error) {
    console.error('Partner destinations API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
