import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { buildEmailFromTemplate } from '@/lib/email/templates';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { mode, partnerId, tier = 'classic' } = body;

    // Vérifier que l'utilisateur est admin
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((profile as { role: string } | null)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer la demande
    const { data: requestData, error: requestError } = await supabaseAdmin
      .from('partner_registration_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    if (requestData.status !== 'pending') {
      return NextResponse.json({ error: 'Cette demande a déjà été traitée' }, { status: 400 });
    }

    let finalPartnerId = partnerId;

    // Mode: créer un nouveau partenaire
    if (mode === 'new') {
      // Déterminer le pays à partir des destinations (prendre la première ou "International")
      const destinations = requestData.destinations || [];
      const country = destinations.length > 0 ? destinations[0] : 'International';

      const { data: newPartner, error: partnerError } = await supabaseAdmin
        .from('partners')
        .insert({
          owner_id: requestData.user_id,  // Note: colonne owner_id, pas user_id
          name: requestData.partner_name,
          slug: requestData.partner_slug,
          tier: tier,
          country: country,  // Colonne obligatoire
          email: requestData.contact_email,
          phone: requestData.contact_phone,
          website: requestData.website,
          description_fr: requestData.description,
          specialties: requestData.specialties || [],
          has_gir: requestData.has_gir,
          is_active: true,
        })
        .select('id')
        .single();

      if (partnerError || !newPartner) {
        console.error('[Approve] Create partner error:', partnerError);
        console.error('[Approve] Request data:', {
          partner_name: requestData.partner_name,
          partner_slug: requestData.partner_slug,
          destinations: requestData.destinations,
          country: country,
        });
        return NextResponse.json(
          { error: `Erreur lors de la création du partenaire: ${partnerError?.message || 'Erreur inconnue'}` },
          { status: 500 }
        );
      }

      finalPartnerId = newPartner.id;
    }

    // Mode: lier à un partenaire existant
    if (mode === 'existing') {
      if (!partnerId) {
        return NextResponse.json({ error: 'Partenaire non spécifié' }, { status: 400 });
      }

      console.log('[Approve] Looking for partner with ID:', partnerId);

      // D'abord, vérifier si le partenaire existe et a déjà un owner_id
      // Note: La colonne s'appelle owner_id (pas user_id) dans la table partners
      const { data: existingPartner, error: fetchError } = await supabaseAdmin
        .from('partners')
        .select('id, name, owner_id')
        .eq('id', partnerId)
        .single();

      console.log('[Approve] Partner lookup result:', { existingPartner, fetchError: fetchError?.message });

      if (fetchError || !existingPartner) {
        console.error('[Approve] Fetch partner error:', fetchError);
        return NextResponse.json(
          { error: `Partenaire non trouvé (ID: ${partnerId}). Erreur: ${fetchError?.message || 'Aucun résultat'}` },
          { status: 404 }
        );
      }

      // Si le partenaire a déjà un owner_id différent, on ne peut pas le lier directement
      // On doit demander à l'admin de choisir un autre mode ou créer un nouveau partenaire
      if (existingPartner.owner_id && existingPartner.owner_id !== requestData.user_id) {
        console.log('[Approve] Partner already has an owner_id:', existingPartner.owner_id);
        return NextResponse.json(
          { error: `Ce partenaire (${existingPartner.name}) est déjà lié à un autre utilisateur. Veuillez créer un nouveau partenaire ou contacter l'utilisateur existant.` },
          { status: 400 }
        );
      }

      // Le partenaire n'a pas de owner_id ou c'est le même utilisateur, on peut le lier
      if (!existingPartner.owner_id) {
        // Le partenaire n'a pas de owner_id, on peut le lier
        const { error: updatePartnerError } = await supabaseAdmin
          .from('partners')
          .update({ owner_id: requestData.user_id })
          .eq('id', partnerId);

        if (updatePartnerError) {
          console.error('[Approve] Update partner error:', updatePartnerError);
          return NextResponse.json(
            { error: `Erreur lors de la liaison au partenaire: ${updatePartnerError.message}` },
            { status: 500 }
          );
        }
      }

      finalPartnerId = partnerId;
    }

    // Mettre à jour le profil utilisateur
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'partner',
        pending_partner_approval: false,
      })
      .eq('id', requestData.user_id);

    if (profileError) {
      console.error('[Approve] Update profile error:', profileError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du profil' },
        { status: 500 }
      );
    }

    // Mettre à jour la demande
    const { error: updateRequestError } = await supabaseAdmin
      .from('partner_registration_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateRequestError) {
      console.error('[Approve] Update request error:', updateRequestError);
    }

    // Envoyer email de confirmation
    try {
      const emailContent = await buildEmailFromTemplate('partner_request_approved', {
        contact_name: requestData.contact_name,
        partner_name: requestData.partner_name,
        login_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dmc-alliance.org'}/auth/login`,
      }, 'fr');

      if (emailContent) {
        await sendEmail({
          to: requestData.contact_email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      }
    } catch (emailError) {
      console.error('[Approve] Email error:', emailError);
      // Ne pas bloquer l'approbation si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: 'Demande approuvée avec succès',
      partnerId: finalPartnerId,
    });

  } catch (error) {
    console.error('[Approve] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
