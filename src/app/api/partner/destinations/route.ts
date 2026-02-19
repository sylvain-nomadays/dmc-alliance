import { NextRequest, NextResponse } from 'next/server';
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

// PUT: Mise à jour de l'image d'une destination du partenaire
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Trouver le partenaire
    const { data: partner } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    let partnerId = partner?.id;

    if (!partnerId) {
      const { data: membership } = await supabaseAdmin
        .from('partner_members')
        .select('partner_id, role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('role', ['owner', 'admin'])
        .single();

      partnerId = membership?.partner_id;
    }

    if (!partnerId) {
      return NextResponse.json({ error: 'Partenaire non trouvé ou droits insuffisants' }, { status: 403 });
    }

    const { destinationId, image_url } = await request.json();

    if (!destinationId) {
      return NextResponse.json({ error: 'ID de destination requis' }, { status: 400 });
    }

    // Vérifier que la destination appartient bien à ce partenaire
    const { data: destination } = await supabaseAdmin
      .from('destinations')
      .select('id')
      .eq('id', destinationId)
      .eq('partner_id', partnerId)
      .single();

    if (!destination) {
      return NextResponse.json({ error: 'Destination non trouvée pour ce partenaire' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('destinations')
      .update({ image_url })
      .eq('id', destinationId);

    if (error) {
      console.error('Error updating destination image:', error);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Partner destination update API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
