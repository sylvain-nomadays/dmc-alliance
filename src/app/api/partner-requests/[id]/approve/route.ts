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

    // Détecter si c'est une demande de rattachement (rejoindre un partenaire existant)
    const isJoinRequest = !!requestData.join_partner_id;
    let finalPartnerId = partnerId;

    if (isJoinRequest) {
      // --- DEMANDE DE RATTACHEMENT ---
      // L'utilisateur veut rejoindre un partenaire existant
      finalPartnerId = requestData.join_partner_id;

      // Vérifier que le partenaire existe
      const { data: existingPartner, error: fetchError } = await supabaseAdmin
        .from('partners')
        .select('id, name')
        .eq('id', finalPartnerId)
        .single();

      if (fetchError || !existingPartner) {
        return NextResponse.json(
          { error: 'Le partenaire cible n\'existe plus' },
          { status: 404 }
        );
      }

      // Créer l'entrée partner_members avec rôle 'member'
      const { error: memberError } = await supabaseAdmin
        .from('partner_members')
        .upsert({
          partner_id: finalPartnerId,
          user_id: requestData.user_id,
          role: 'member',
          status: 'active',
          joined_at: new Date().toISOString(),
          invited_by: user.id,
        }, { onConflict: 'partner_id,user_id' });

      if (memberError) {
        console.error('[Approve] Create partner member error:', memberError);
        return NextResponse.json(
          { error: `Erreur lors du rattachement: ${memberError.message}` },
          { status: 500 }
        );
      }

    } else {
      // --- NOUVELLE INSCRIPTION DMC ---

      // Mode: créer un nouveau partenaire
      if (mode === 'new') {
        // Déterminer le pays à partir des destinations (prendre la première ou "International")
        const destinations = requestData.destinations || [];
        const country = destinations.length > 0 ? destinations[0] : 'International';

        const { data: newPartner, error: partnerError } = await supabaseAdmin
          .from('partners')
          .insert({
            owner_id: requestData.user_id,
            name: requestData.partner_name,
            slug: requestData.partner_slug,
            tier: tier,
            country: country,
            email: requestData.contact_email,
            phone: requestData.contact_phone,
            website: requestData.website,
            description_fr: requestData.description,
            has_gir: requestData.has_gir,
            is_active: true,
          })
          .select('id')
          .single();

        if (partnerError || !newPartner) {
          console.error('[Approve] Create partner error:', partnerError);
          return NextResponse.json(
            { error: `Erreur lors de la création du partenaire: ${partnerError?.message || 'Erreur inconnue'}` },
            { status: 500 }
          );
        }

        finalPartnerId = newPartner.id;

        // Créer l'entrée partner_members avec rôle 'owner'
        await supabaseAdmin
          .from('partner_members')
          .upsert({
            partner_id: finalPartnerId,
            user_id: requestData.user_id,
            role: 'owner',
            status: 'active',
            joined_at: new Date().toISOString(),
          }, { onConflict: 'partner_id,user_id' });
      }

      // Mode: lier à un partenaire existant (sans join_partner_id = admin fait le lien manuellement)
      if (mode === 'existing') {
        if (!partnerId) {
          return NextResponse.json({ error: 'Partenaire non spécifié' }, { status: 400 });
        }

        const { data: existingPartner, error: fetchError } = await supabaseAdmin
          .from('partners')
          .select('id, name, owner_id')
          .eq('id', partnerId)
          .single();

        if (fetchError || !existingPartner) {
          return NextResponse.json(
            { error: `Partenaire non trouvé (ID: ${partnerId})` },
            { status: 404 }
          );
        }

        // Si le partenaire n'a pas de owner_id, on le définit
        if (!existingPartner.owner_id) {
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

          // owner_id assigné → rôle 'owner' dans partner_members
          await supabaseAdmin
            .from('partner_members')
            .upsert({
              partner_id: partnerId,
              user_id: requestData.user_id,
              role: 'owner',
              status: 'active',
              joined_at: new Date().toISOString(),
            }, { onConflict: 'partner_id,user_id' });
        } else if (existingPartner.owner_id === requestData.user_id) {
          // Même utilisateur, juste s'assurer qu'il est dans partner_members
          await supabaseAdmin
            .from('partner_members')
            .upsert({
              partner_id: partnerId,
              user_id: requestData.user_id,
              role: 'owner',
              status: 'active',
              joined_at: new Date().toISOString(),
            }, { onConflict: 'partner_id,user_id' });
        } else {
          // Le partenaire a déjà un owner différent → rattacher comme membre
          await supabaseAdmin
            .from('partner_members')
            .upsert({
              partner_id: partnerId,
              user_id: requestData.user_id,
              role: 'member',
              status: 'active',
              joined_at: new Date().toISOString(),
              invited_by: user.id,
            }, { onConflict: 'partner_id,user_id' });
        }

        finalPartnerId = partnerId;
      }
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
      message: isJoinRequest
        ? 'Demande de rattachement approuvée avec succès'
        : 'Demande approuvée avec succès',
      partnerId: finalPartnerId,
    });

  } catch (error) {
    console.error('[Approve] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
