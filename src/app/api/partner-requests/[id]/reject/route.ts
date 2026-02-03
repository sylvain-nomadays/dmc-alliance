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
    const { reason } = body;

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

    // Mettre à jour la demande
    const { error: updateError } = await supabaseAdmin
      .from('partner_registration_requests')
      .update({
        status: 'rejected',
        admin_notes: reason || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('[Reject] Update error:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors du rejet de la demande' },
        { status: 500 }
      );
    }

    // Mettre à jour le profil utilisateur
    await supabaseAdmin
      .from('profiles')
      .update({
        pending_partner_approval: false,
      })
      .eq('id', requestData.user_id);

    // Envoyer email de notification
    try {
      const emailContent = await buildEmailFromTemplate('partner_request_rejected', {
        contact_name: requestData.contact_name,
        partner_name: requestData.partner_name,
        admin_notes: reason || 'Aucune raison spécifique n\'a été fournie.',
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
      console.error('[Reject] Email error:', emailError);
      // Ne pas bloquer le rejet si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: 'Demande rejetée',
    });

  } catch (error) {
    console.error('[Reject] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
