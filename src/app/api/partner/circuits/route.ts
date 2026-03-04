import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function getPartnerIdForUser(userId: string): Promise<string | null> {
  const { data: partner } = await supabaseAdmin
    .from('partners')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (partner?.id) return partner.id;

  const { data: membership } = await supabaseAdmin
    .from('partner_members')
    .select('partner_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  return membership?.partner_id || null;
}

// POST: Créer un nouveau circuit pour le partenaire connecté (bypass RLS)
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const partnerId = await getPartnerIdForUser(user.id);
    if (!partnerId) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 403 });
    }

    const payload = await request.json();

    // Force partner_id to the authenticated partner
    payload.partner_id = partnerId;

    // Convert empty UUID strings to null
    if (!payload.destination_id) payload.destination_id = null;

    const { data, error } = await supabaseAdmin
      .from('circuits')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating partner circuit:', error);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    return NextResponse.json({ circuit: data });
  } catch (error) {
    console.error('Partner circuit create API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET: Liste des circuits du partenaire connecté (bypass RLS)
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

    // Charger les circuits de ce partenaire (bypass RLS)
    const { data: circuits, error } = await supabaseAdmin
      .from('circuits')
      .select(`
        id,
        slug,
        title,
        partner_id,
        duration_days,
        price_from,
        status,
        image_url,
        destination:destinations(name),
        partner:partners(name)
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching partner circuits:', error);
      return NextResponse.json({ error: 'Erreur lors du chargement' }, { status: 500 });
    }

    return NextResponse.json({ circuits: circuits || [], partnerId });
  } catch (error) {
    console.error('Partner circuits API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
