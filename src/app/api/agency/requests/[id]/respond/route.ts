import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createNotificationAdmin } from '@/lib/email/notifications';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, message } = body as { action: 'accept' | 'reject'; message?: string };

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    // Auth check
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Get the request with circuit and partner info
    const { data: agencyRequest } = await supabaseAdmin
      .from('agency_requests')
      .select(`
        id, agency_id, circuit_id, contact_name, contact_email, status,
        circuit:circuits(id, title, partner_id)
      `)
      .eq('id', id)
      .single();

    if (!agencyRequest) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const circuit = agencyRequest.circuit as any;
    if (!circuit?.partner_id) {
      return NextResponse.json({ error: 'Circuit ou partenaire non trouvé' }, { status: 404 });
    }

    // Get partner info
    const { data: partner } = await supabaseAdmin
      .from('partners')
      .select('id, name, owner_id')
      .eq('id', circuit.partner_id)
      .single();

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 });
    }

    // Verify the current user is authorized (partner owner, member with admin/owner role, or system admin)
    const isOwner = partner.owner_id === user.id;

    const { data: membership } = await supabaseAdmin
      .from('partner_members')
      .select('id, role')
      .eq('partner_id', partner.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const isMemberAdmin = membership && ['owner', 'admin'].includes(membership.role);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isSystemAdmin = profile?.role === 'admin';

    if (!isOwner && !isMemberAdmin && !isSystemAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Only allow responding to pending or sent requests
    if (!['pending', 'sent'].includes(agencyRequest.status)) {
      return NextResponse.json({ error: 'Cette demande a déjà reçu une réponse' }, { status: 400 });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    // Update the request
    const { error: updateError } = await supabaseAdmin
      .from('agency_requests')
      .update({
        status: newStatus,
        partner_response_message: message || null,
        responded_by: user.id,
        responded_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('[Agency Request Respond] Update error:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    // Notify the agency user
    const { data: agency } = await supabaseAdmin
      .from('agencies')
      .select('user_id, name')
      .eq('id', agencyRequest.agency_id)
      .single();

    if (agency?.user_id) {
      const templateSlug = newStatus === 'accepted' ? 'agency_request_accepted' : 'agency_request_rejected';

      // Notify the agency owner
      await createNotificationAdmin({
        userId: agency.user_id,
        type: 'booking',
        title: newStatus === 'accepted' ? 'Demande acceptée' : 'Demande refusée',
        message: newStatus === 'accepted'
          ? `Votre demande pour "${circuit.title}" a été acceptée par ${partner.name}.`
          : `Votre demande pour "${circuit.title}" a été refusée par ${partner.name}.`,
        link: '/espace-pro/requests',
        metadata: { request_id: id, circuit_id: agencyRequest.circuit_id },
        sendEmail: true,
        emailTemplate: templateSlug,
        emailVariables: {
          contact_name: agencyRequest.contact_name,
          circuit_title: circuit.title,
          partner_name: partner.name,
          partner_message: message || '',
        },
      });

      // Also notify agency members
      const { data: agencyMembers } = await supabaseAdmin
        .from('agency_members')
        .select('user_id')
        .eq('agency_id', agencyRequest.agency_id)
        .eq('status', 'active');

      if (agencyMembers) {
        for (const member of agencyMembers) {
          if (member.user_id !== agency.user_id) {
            await createNotificationAdmin({
              userId: member.user_id,
              type: 'booking',
              title: newStatus === 'accepted' ? 'Demande acceptée' : 'Demande refusée',
              message: newStatus === 'accepted'
                ? `La demande pour "${circuit.title}" a été acceptée par ${partner.name}.`
                : `La demande pour "${circuit.title}" a été refusée par ${partner.name}.`,
              link: '/espace-pro/requests',
              metadata: { request_id: id, circuit_id: agencyRequest.circuit_id },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('[Agency Request Respond] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
