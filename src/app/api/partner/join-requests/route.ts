import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET: Liste des demandes de rattachement pour le partenaire de l'utilisateur
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Trouver le partenaire de l'utilisateur (en tant que owner)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partner } = await (supabaseAdmin as any)
      .from('partners')
      .select('id, name')
      .eq('owner_id', user.id)
      .single();

    if (!partner) {
      // Verifier si l'utilisateur est owner/admin via partner_members
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: membership } = await (supabaseAdmin as any)
        .from('partner_members')
        .select('partner_id, role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('role', ['owner', 'admin'])
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'Partenaire non trouve ou droits insuffisants' }, { status: 403 });
      }

      // Utiliser le partenaire du membership
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: requests } = await (supabaseAdmin as any)
        .from('partner_registration_requests')
        .select('id, contact_name, contact_email, contact_phone, description, status, created_at, user_id')
        .eq('join_partner_id', membership.partner_id)
        .order('created_at', { ascending: false });

      return NextResponse.json({ requests: requests || [] });
    }

    // Recuperer les demandes de rattachement pour ce partenaire
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: requests } = await (supabaseAdmin as any)
      .from('partner_registration_requests')
      .select('id, contact_name, contact_email, contact_phone, description, status, created_at, user_id')
      .eq('join_partner_id', partner.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error('[Partner Join Requests] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
