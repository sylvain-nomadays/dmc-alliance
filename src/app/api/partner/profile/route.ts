import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET: Profil du partenaire connecté (bypass RLS)
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
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (partner) {
      // Also fetch destinations for this partner
      const { data: destinations } = await supabaseAdmin
        .from('destinations')
        .select('id, slug, name, name_en, image_url')
        .eq('partner_id', partner.id);

      return NextResponse.json({ partner, partnerId: partner.id, destinations: destinations || [] });
    }

    // Fallback: chercher via partner_members
    const { data: membership } = await supabaseAdmin
      .from('partner_members')
      .select('partner_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 403 });
    }

    const { data: memberPartner } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('id', membership.partner_id)
      .single();

    if (!memberPartner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 403 });
    }

    // Also fetch destinations for this partner
    const { data: destinations } = await supabaseAdmin
      .from('destinations')
      .select('id, slug, name, name_en, image_url')
      .eq('partner_id', memberPartner.id);

    return NextResponse.json({ partner: memberPartner, partnerId: memberPartner.id, destinations: destinations || [] });
  } catch (error) {
    console.error('Partner profile API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT: Mise à jour du profil partenaire (bypass RLS)
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

    const body = await request.json();

    const { error } = await supabaseAdmin
      .from('partners')
      .update(body)
      .eq('id', partnerId);

    if (error) {
      console.error('Error updating partner:', error);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Partner profile update API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
