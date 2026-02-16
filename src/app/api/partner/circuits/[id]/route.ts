import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function getPartnerIdForUser(userId: string): Promise<string | null> {
  // Trouver le partenaire via owner_id
  const { data: partner } = await supabaseAdmin
    .from('partners')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (partner?.id) return partner.id;

  // Fallback: chercher via partner_members
  const { data: membership } = await supabaseAdmin
    .from('partner_members')
    .select('partner_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  return membership?.partner_id || null;
}

// GET: Fetch a single circuit belonging to the partner
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const partnerId = await getPartnerIdForUser(user.id);
    if (!partnerId) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 403 });
    }

    // Fetch circuit (bypass RLS) and verify it belongs to the partner
    const { data: circuit, error } = await supabaseAdmin
      .from('circuits')
      .select('*')
      .eq('id', id)
      .eq('partner_id', partnerId)
      .single();

    if (error || !circuit) {
      return NextResponse.json({ error: 'Circuit non trouvé' }, { status: 404 });
    }

    // Also fetch partner's destinations and partner info for the form
    const { data: destinations } = await supabaseAdmin
      .from('destinations')
      .select('id, name, partner_id')
      .eq('partner_id', partnerId)
      .eq('is_active', true)
      .order('name');

    const { data: partnerData } = await supabaseAdmin
      .from('partners')
      .select('id, name')
      .eq('id', partnerId)
      .single();

    return NextResponse.json({
      circuit,
      destinations: destinations || [],
      partners: partnerData ? [partnerData] : [],
      partnerId,
    });
  } catch (error) {
    console.error('Partner circuit detail API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT: Update a circuit belonging to the partner
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const partnerId = await getPartnerIdForUser(user.id);
    if (!partnerId) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 403 });
    }

    // Verify the circuit belongs to the partner
    const { data: existing } = await supabaseAdmin
      .from('circuits')
      .select('id')
      .eq('id', id)
      .eq('partner_id', partnerId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Circuit non trouvé' }, { status: 404 });
    }

    const payload = await request.json();

    // Ensure partner_id stays locked to the partner's own ID
    payload.partner_id = partnerId;

    const { data, error } = await supabaseAdmin
      .from('circuits')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating partner circuit:', error);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    return NextResponse.json({ circuit: data });
  } catch (error) {
    console.error('Partner circuit update API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
