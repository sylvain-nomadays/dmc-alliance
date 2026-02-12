import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { buildEmailFromTemplate } from '@/lib/email/templates';

// POST: Approuver ou rejeter une demande de rattachement
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'approve' ou 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    // Recuperer la demande
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: joinRequest, error: requestError } = await (supabaseAdmin as any)
      .from('partner_registration_requests')
      .select('id, join_partner_id, user_id, contact_name, contact_email, status, partner_name')
      .eq('id', id)
      .single();

    if (requestError || !joinRequest) {
      return NextResponse.json({ error: 'Demande non trouvee' }, { status: 404 });
    }

    if (!joinRequest.join_partner_id) {
      return NextResponse.json({ error: 'Cette demande n\'est pas une demande de rattachement' }, { status: 400 });
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Cette demande a deja ete traitee' }, { status: 400 });
    }

    // Verifier que l'utilisateur est owner/admin du partenaire cible
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partner } = await (supabaseAdmin as any)
      .from('partners')
      .select('id, name, owner_id')
      .eq('id', joinRequest.join_partner_id)
      .single();

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouve' }, { status: 404 });
    }

    const isOwner = partner.owner_id === user.id;

    if (!isOwner) {
      // Verifier via partner_members
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: membership } = await (supabaseAdmin as any)
        .from('partner_members')
        .select('role')
        .eq('partner_id', joinRequest.join_partner_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('role', ['owner', 'admin'])
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'Droits insuffisants' }, { status: 403 });
      }
    }

    if (action === 'approve') {
      // 1. Mettre a jour le statut de la demande
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any)
        .from('partner_registration_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      // 2. Ajouter l'utilisateur comme membre du partenaire
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: memberError } = await (supabaseAdmin as any)
        .from('partner_members')
        .upsert({
          partner_id: joinRequest.join_partner_id,
          user_id: joinRequest.user_id,
          role: 'member',
          status: 'active',
          invited_by: user.id,
          joined_at: new Date().toISOString(),
        }, { onConflict: 'partner_id,user_id' });

      if (memberError) {
        console.error('[Partner Join] Create member error:', memberError);
        return NextResponse.json(
          { error: `Erreur lors du rattachement: ${memberError.message}` },
          { status: 500 }
        );
      }

      // 3. Mettre a jour le profil de l'utilisateur
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any)
        .from('profiles')
        .update({
          role: 'partner',
          company_name: partner.name,
          pending_partner_approval: false,
        })
        .eq('id', joinRequest.user_id);

      // 4. Envoyer email de confirmation
      try {
        if (joinRequest.contact_email) {
          const emailContent = await buildEmailFromTemplate('partner_request_approved', {
            contact_name: joinRequest.contact_name || 'Collaborateur',
            partner_name: partner.name,
            login_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dmc-alliance.org'}/auth/login`,
          }, 'fr');

          if (emailContent) {
            await sendEmail({
              to: joinRequest.contact_email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });
          }
        }
      } catch (emailError) {
        console.error('[Partner Join] Email error:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: 'Demande de rattachement acceptee',
      });
    } else {
      // Rejeter la demande
      // 1. Mettre a jour le statut
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any)
        .from('partner_registration_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      // 2. Envoyer email de notification
      try {
        if (joinRequest.contact_email) {
          const emailContent = await buildEmailFromTemplate('partner_request_rejected', {
            contact_name: joinRequest.contact_name || 'Collaborateur',
            partner_name: partner.name,
          }, 'fr');

          if (emailContent) {
            await sendEmail({
              to: joinRequest.contact_email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });
          }
        }
      } catch (emailError) {
        console.error('[Partner Join] Email error:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: 'Demande de rattachement refusee',
      });
    }
  } catch (error) {
    console.error('[Partner Join] POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
