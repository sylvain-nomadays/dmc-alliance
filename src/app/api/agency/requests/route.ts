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
    let emailSent = false;
    let emailError: string | null = null;

    if (!partner) {
      emailError = 'Partenaire non trouvé pour ce circuit';
      console.warn('[Agency Request] No partner found for circuit:', circuitId);
    } else if (!partner.email) {
      emailError = `Le partenaire "${partner.name}" n'a pas d'adresse email configurée`;
      console.warn('[Agency Request] Partner has no email:', partner.id, partner.name);
    } else {
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

        if (!emailContent) {
          emailError = `Template email "${templateSlug}" introuvable en base de données`;
          console.error('[Agency Request] Email template not found:', templateSlug);
        } else {
          console.log('[Agency Request] Sending email to:', partner.email, 'template:', templateSlug);

          const emailResult = await sendEmail({
            to: partner.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            replyTo: contactEmail,
          });

          if (emailResult.success) {
            emailSent = true;
            await supabaseAdmin
              .from('agency_requests')
              .update({
                status: 'sent',
                partner_notified_at: new Date().toISOString(),
              })
              .eq('id', requestData.id);
          } else {
            emailError = `Erreur Resend: ${emailResult.error}`;
            console.error('[Agency Request] Resend error:', emailResult.error);
          }
        }
      } catch (err) {
        emailError = err instanceof Error ? err.message : 'Erreur inconnue';
        console.error('[Agency Request] Email exception:', err);
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
      emailSent,
      emailError,
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
        id, circuit_id, departure_id, request_type, travelers_count, message,
        contact_name, contact_email, contact_phone, status,
        partner_notified_at, partner_response_message, responded_at, created_at,
        circuit:circuits(
          id, title, slug, price_from,
          base_commission_rate, use_tiered_commission,
          partner:partners(name),
          departures:circuit_departures(id, start_date, price, status, booked_seats, total_seats)
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

    // Enrich accepted booking requests with commission data
    const enrichedRequests = requests || [];

    // Collect circuit IDs that use tiered commission among accepted bookings
    const circuitIdsWithTiers = new Set<string>();
    for (const req of enrichedRequests) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const circuit = (req as any).circuit;
      if (circuit?.use_tiered_commission && req.request_type === 'booking' && req.status === 'accepted') {
        circuitIdsWithTiers.add(circuit.id);
      }
    }

    // Batch-fetch commission tiers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tiersMap: Record<string, Array<{ min_participants: number; max_participants: number | null; commission_rate: number }>> = {};
    if (circuitIdsWithTiers.size > 0) {
      const { data: tiers } = await supabaseAdmin
        .from('commission_tiers')
        .select('circuit_id, min_participants, max_participants, commission_rate')
        .in('circuit_id', Array.from(circuitIdsWithTiers))
        .order('min_participants', { ascending: true });

      if (tiers) {
        for (const tier of tiers) {
          if (!tiersMap[tier.circuit_id]) tiersMap[tier.circuit_id] = [];
          tiersMap[tier.circuit_id].push(tier);
        }
      }
    }

    // Calculate commission info for each accepted booking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestsWithCommission = enrichedRequests.map((req: any) => {
      if (req.status !== 'accepted' || req.request_type !== 'booking') return req;

      const circuit = req.circuit;
      if (!circuit) return req;

      // Find the departure for this request
      const departure = req.departure_id
        ? (circuit.departures || []).find((d: { id: string }) => d.id === req.departure_id)
        : (circuit.departures || [])[0];

      if (!departure) return req;

      const bookedSeats = departure.booked_seats || 0;
      const price = departure.price || circuit.price_from || 0;

      // Calculate commission rate (same logic as /api/gir/commission)
      let commissionRate = circuit.base_commission_rate || 10;
      if (circuit.use_tiered_commission && tiersMap[circuit.id]) {
        for (const tier of tiersMap[circuit.id]) {
          if (
            bookedSeats >= tier.min_participants &&
            (tier.max_participants === null || bookedSeats <= tier.max_participants)
          ) {
            commissionRate = tier.commission_rate;
          }
        }
      }

      const travelersCount = req.travelers_count || 0;
      const estimatedCommission = (price * commissionRate / 100) * travelersCount;

      return {
        ...req,
        commission_info: {
          commission_rate: Number(commissionRate),
          price_per_person: Number(price),
          travelers_count: travelersCount,
          total_booked_seats: bookedSeats,
          estimated_commission: Math.round(estimatedCommission * 100) / 100,
          use_tiered_commission: circuit.use_tiered_commission || false,
        },
      };
    });

    return NextResponse.json({ requests: requestsWithCommission });

  } catch (error) {
    console.error('[Agency Request] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
