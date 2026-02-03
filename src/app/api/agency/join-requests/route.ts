import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { buildEmailFromTemplate } from '@/lib/email/templates';

// GET: Liste des demandes pour rejoindre l'agence de l'utilisateur
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer l'agence de l'utilisateur
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agency } = await (supabaseAdmin as any)
      .from('agencies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!agency) {
      // Vérifier si l'utilisateur est owner/admin via agency_members
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: membership } = await (supabaseAdmin as any)
        .from('agency_members')
        .select('agency_id, role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('role', ['owner', 'admin'])
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'Agence non trouvée ou droits insuffisants' }, { status: 403 });
      }

      // Utiliser l'agence du membership
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: requests } = await (supabaseAdmin as any)
        .from('agency_join_requests')
        .select(`
          id, message, status, created_at,
          user:profiles(id, email, full_name)
        `)
        .eq('agency_id', membership.agency_id)
        .order('created_at', { ascending: false });

      return NextResponse.json({ requests: requests || [] });
    }

    // Récupérer les demandes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: requests } = await (supabaseAdmin as any)
      .from('agency_join_requests')
      .select(`
        id, message, status, created_at,
        user:profiles(id, email, full_name)
      `)
      .eq('agency_id', agency.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error('[Agency Join Requests] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
