import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { buildEmailFromTemplate } from '@/lib/email/templates';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      agencyId,
      circuitId,
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

    // Vérifier que l'utilisateur appartient à cette agence
    const { data: agency } = await supabaseAdmin
      .from('agencies')
      .select('id, name')
      .eq('id', agencyId)
      .eq('user_id', user.id)
      .single();

    if (!agency) {
      return NextResponse.json({ error: 'Agence non trouvée' }, { status: 403 });
    }

    // Cast agency pour le typage
    const agencyData = agency as { id: string; name: string };

    // Récupérer les infos du circuit et du partenaire
    const { data: circuit, error: circuitError } = await supabaseAdmin
      .from('circuits')
      .select(`
        id, title_fr, departure_date,
        partner:partners(id, name, email, phone)
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

        const emailContent = await buildEmailFromTemplate(templateSlug, {
          circuit_title: circuit.title_fr,
          departure_date: circuit.departure_date
            ? new Date(circuit.departure_date).toLocaleDateString('fr-FR')
            : '',
          travelers_count: travelersCount || '',
          agency_name: agencyData.name,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone || 'Non renseigné',
          message: message || 'Aucun message',
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
    const agencyId = searchParams.get('agencyId');

    // Vérifier l'authentification
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Si pas d'agencyId, récupérer celle de l'utilisateur
    let agency: { id: string } | null = null;
    if (agencyId) {
      const { data } = await supabaseAdmin
        .from('agencies')
        .select('id')
        .eq('id', agencyId)
        .eq('user_id', user.id)
        .single();
      agency = data;
    } else {
      const { data } = await supabaseAdmin
        .from('agencies')
        .select('id')
        .eq('user_id', user.id)
        .single();
      agency = data;
    }

    if (!agency) {
      return NextResponse.json({ error: 'Agence non trouvée' }, { status: 403 });
    }

    // Récupérer les demandes
    const { data: requests, error } = await supabaseAdmin
      .from('agency_requests')
      .select(`
        id, circuit_id, request_type, travelers_count, message,
        contact_name, contact_email, contact_phone, status,
        partner_notified_at, created_at,
        circuit:circuits(
          id, title_fr, slug, departure_date,
          partner:partners(name)
        )
      `)
      .eq('agency_id', agency.id)
      .order('created_at', { ascending: false });

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
