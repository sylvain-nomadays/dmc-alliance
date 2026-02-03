import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { buildEmailFromTemplate } from '@/lib/email/templates';

// POST: Approuver ou rejeter une demande
export async function POST(
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

    const body = await request.json();
    const { action } = body; // 'approve' ou 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    // Récupérer la demande
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: joinRequest, error: requestError } = await (supabaseAdmin as any)
      .from('agency_join_requests')
      .select(`
        id, agency_id, user_id, status,
        agency:agencies(id, name, user_id),
        user:profiles(id, email, full_name)
      `)
      .eq('id', id)
      .single();

    if (requestError || !joinRequest) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Cette demande a déjà été traitée' }, { status: 400 });
    }

    // Vérifier que l'utilisateur peut gérer cette demande
    const agency = joinRequest.agency as { id: string; name: string; user_id: string | null };
    const isOwner = agency?.user_id === user.id;

    if (!isOwner) {
      // Vérifier si l'utilisateur est owner/admin via agency_members
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: membership } = await (supabaseAdmin as any)
        .from('agency_members')
        .select('role')
        .eq('agency_id', joinRequest.agency_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('role', ['owner', 'admin'])
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'Droits insuffisants' }, { status: 403 });
      }
    }

    const requestUser = joinRequest.user as { id: string; email: string; full_name: string | null };

    if (action === 'approve') {
      // 1. Mettre à jour le statut de la demande
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any)
        .from('agency_join_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      // 2. Ajouter l'utilisateur comme membre de l'agence
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any)
        .from('agency_members')
        .insert({
          agency_id: joinRequest.agency_id,
          user_id: joinRequest.user_id,
          role: 'member',
          status: 'active',
          invited_by: user.id,
          joined_at: new Date().toISOString(),
        });

      // 3. Mettre à jour le profil de l'utilisateur
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any)
        .from('profiles')
        .update({
          role: 'agency',
          company_name: agency?.name,
          pending_partner_approval: false,
        })
        .eq('id', joinRequest.user_id);

      // 4. Envoyer email de confirmation
      try {
        if (requestUser?.email) {
          const emailContent = await buildEmailFromTemplate('agency_join_approved', {
            user_name: requestUser.full_name || 'Collaborateur',
            agency_name: agency?.name || 'L\'agence',
            login_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dmc-alliance.com'}/auth/login`,
          }, 'fr');

          if (emailContent) {
            await sendEmail({
              to: requestUser.email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });
          }
        }
      } catch (emailError) {
        console.error('[Join Request] Email error:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: 'Demande acceptée',
      });
    } else {
      // Rejeter la demande
      // 1. Mettre à jour le statut
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any)
        .from('agency_join_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      // 2. Envoyer email de notification
      try {
        if (requestUser?.email) {
          const emailContent = await buildEmailFromTemplate('agency_join_rejected', {
            user_name: requestUser.full_name || 'Collaborateur',
            agency_name: agency?.name || 'L\'agence',
          }, 'fr');

          if (emailContent) {
            await sendEmail({
              to: requestUser.email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });
          }
        }
      } catch (emailError) {
        console.error('[Join Request] Email error:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: 'Demande refusée',
      });
    }
  } catch (error) {
    console.error('[Join Request] POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
