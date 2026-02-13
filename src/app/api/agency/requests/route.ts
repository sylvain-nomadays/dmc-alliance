import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { buildEmailFromTemplate } from '@/lib/email/templates';
import { createNotificationAdmin } from '@/lib/email/notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      agencyId,
      circuitId,
      departureId,
      requestType,
      travelersCount,
      message,
      contactName,
      contactEmail,
      contactPhone,
    } = body;

    // Vérifier l'authentification
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur appartient à cette agence (owner ou member)
    let agency: { id: string; name: string } | null = null;

    const { data: directAgency } = await supabaseAdmin
      .from('agencies')
      .select('id, name')
      .eq('id', agencyId)
      .eq('user_id', user.id)
      .single();

    if (directAgency) {
      agency = directAgency;
    } else {
      // Fallback: check agency_members
      const { data: membership } = await supabaseAdmin
        .from('agency_members')
        .select('agency_id')
        .eq('agency_id', agencyId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (membership) {
        const { data: memberAgency } = await supabaseAdmin
          .from('agencies')
          .select('id, name')
          .eq('id', agencyId)
          .single();
        agency = memberAgency;
      }
    }

    if (!agency) {
      return NextResponse.json({ error: 'Agence non trouvée' }, { status: 403 });
    }

    const agencyData = agency;

    // Récupérer les infos du circuit et du partenaire
    const { data: circuit, error: circuitError } = await supabaseAdmin
      .from('circuits')
      .select(`
        id, title, slug,
        partner:partners(id, name, email, phone),
        departures:circuit_departures(id, start_date, end_date, price, status)
      `)
      .eq('id', circuitId)
      .single();

    if (circuitError || !circuit) {
      return NextResponse.json({ error: 'Circuit non trouvé' }, { status: 404 });
    }

    // Créer la demande
    const { data: requestData, error: insertError } = await supabaseAdmin
      .from('agency_requests')
      .insert({
        agency_id: agencyId,
        circuit_id: circuitId,
        departure_id: departureId || null,
        request_type: requestType,
        travelers_count: travelersCount || null,
        message: message || null,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[Agency Request] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la demande' },
        { status: 500 }
      );
    }

    // Envoyer email au partenaire
    const partner = circuit.partner as { id: string; name: string; email: string | null; phone: string | null } | null;

    if (partner?.email) {
      try {
        const templateSlug = requestType === 'booking' ? 'agency_booking_request' : 'agency_info_request';

        // Find the relevant departure date if a departure_id was provided
        const departures = circuit.departures || [];
        const selectedDep = body.departureId
          ? departures.find((d: { id: string }) => d.id === body.departureId)
          : departures[0];

        const emailContent = await buildEmailFromTemplate(templateSlug, {
          circuit_title: circuit.title,
          departure_date: selectedDep?.start_date
            ? new Date(selectedDep.start_date).toLocaleDateString('fr-FR')
            : '',
          travelers_count: travelersCount || '',
          places_requested: travelersCount || '',
          agency_name: agencyData.name,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone || 'Non renseigné',
          message: message || 'Aucun message',
          notes: message || 'Aucun message',
        }, 'fr');

        if (emailContent) {
          const emailResult = await sendEmail({
            to: partner.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            replyTo: contactEmail,
          });

          // Mettre à jour le statut
          if (emailResult.success) {
            await supabaseAdmin
              .from('agency_requests')
              .update({
                status: 'sent',
                partner_notified_at: new Date().toISOString(),
              })
              .eq('id', requestData.id);
          }
        }
      } catch (emailError) {
        console.error('[Agency Request] Email error:', emailError);
        // La demande est créée, l'email a échoué mais on continue
      }
    }

    // Notify all partner members via in-app notification
    if (partner) {
      try {
        const partnerId = (partner as { id: string }).id;

        // Get all active partner members
        const { data: partnerMembers } = await supabaseAdmin
          .from('partner_members')
          .select('user_id')
          .eq('partner_id', partnerId)
          .eq('status', 'active');

        const memberUserIds = (partnerMembers || []).map((m: { user_id: string }) => m.user_id);

        // Also include the partner owner
        const { data: partnerData } = await supabaseAdmin
          .from('partners')
          .select('owner_id')
          .eq('id', partnerId)
          .single();

        if (partnerData?.owner_id && !memberUserIds.includes(partnerData.owner_id)) {
          memberUserIds.push(partnerData.owner_id);
        }

        const notifTitle = requestType === 'booking'
          ? 'Nouvelle demande de réservation'
          : 'Nouvelle demande d\'information';

        for (const memberId of memberUserIds) {
          await createNotificationAdmin({
            userId: memberId,
            type: 'booking',
            title: notifTitle,
            message: `${agencyData.name} a envoyé une demande pour "${circuit.title}".`,
            link: '/admin/agency-requests',
            metadata: { request_id: requestData.id, circuit_id: circuitId },
          });
        }
      } catch (notifError) {
        console.error('[Agency Request] Notification error:', notifError);
      }
    }

    return NextResponse.json({
      success: true,
      requestId: requestData.id,
      message: 'Demande créée avec succès',
    });

  } catch (error) {
    console.error('[Agency Request] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('type'); // 'info' | 'booking' | null

    // Vérifier l'authentification
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Trouver l'agence de l'utilisateur (owner ou member)
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

    // Récupérer les demandes
    let query = supabaseAdmin
      .from('agency_requests')
      .select(`
        id, circuit_id, request_type, travelers_count, message,
        contact_name, contact_email, contact_phone, status,
        partner_notified_at, partner_response_message, responded_at, created_at,
        circuit:circuits(
          id, title, slug,
          partner:partners(name),
          departures:circuit_departures(id, start_date, price, status)
        )
      `)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (filterType && ['info', 'booking'].includes(filterType)) {
      query = query.eq('request_type', filterType);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('[Agency Request] Get error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ requests });

  } catch (error) {
    console.error('[Agency Request] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
