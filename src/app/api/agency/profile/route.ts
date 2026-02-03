import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer l'agence de l'utilisateur
    const { data: agency, error } = await supabaseAdmin
      .from('agencies')
      .select(`
        id, name, slug, logo_url, description, specialties, looking_for,
        contact_name, email, phone, website, address, city, country,
        registration_number, social_linkedin, social_instagram, social_facebook,
        profile_completed, profile_completed_at, commission_rate, is_verified
      `)
      .eq('user_id', user.id)
      .single();

    if (error || !agency) {
      // Essayer via agency_members
      const { data: membership } = await supabaseAdmin
        .from('agency_members')
        .select('agency_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (membership) {
        const { data: agencyFromMembership } = await supabaseAdmin
          .from('agencies')
          .select(`
            id, name, slug, logo_url, description, specialties, looking_for,
            contact_name, email, phone, website, address, city, country,
            registration_number, social_linkedin, social_instagram, social_facebook,
            profile_completed, profile_completed_at, commission_rate, is_verified
          `)
          .eq('id', membership.agency_id)
          .single();

        if (agencyFromMembership) {
          return NextResponse.json({ agency: agencyFromMembership });
        }
      }

      return NextResponse.json({ error: 'Agence non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ agency });
  } catch (error) {
    console.error('[Agency Profile] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();

    // Récupérer l'agence de l'utilisateur (via user_id direct ou membership)
    let agencyId: string | null = null;
    let canEdit = false;

    // D'abord vérifier si l'utilisateur est propriétaire direct
    const { data: ownedAgency } = await supabaseAdmin
      .from('agencies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (ownedAgency) {
      agencyId = ownedAgency.id;
      canEdit = true;
    } else {
      // Vérifier via agency_members
      const { data: membership } = await supabaseAdmin
        .from('agency_members')
        .select('agency_id, role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (membership && ['owner', 'admin'].includes(membership.role)) {
        agencyId = membership.agency_id;
        canEdit = true;
      }
    }

    if (!agencyId || !canEdit) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas les droits pour modifier ce profil' },
        { status: 403 }
      );
    }

    // Champs autorisés à modifier
    const allowedFields = [
      'name', 'logo_url', 'description', 'specialties', 'looking_for',
      'contact_name', 'email', 'phone', 'website', 'address', 'city', 'country',
      'registration_number', 'social_linkedin', 'social_instagram', 'social_facebook'
    ];

    // Filtrer les champs
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Vérifier si le profil est maintenant complet
    const isProfileComplete = !!(
      body.name &&
      body.description &&
      body.contact_name &&
      body.email &&
      body.phone
    );

    if (isProfileComplete) {
      updateData.profile_completed = true;
      updateData.profile_completed_at = new Date().toISOString();
    }

    // Mettre à jour l'agence
    const { data: updatedAgency, error: updateError } = await supabaseAdmin
      .from('agencies')
      .update(updateData)
      .eq('id', agencyId)
      .select()
      .single();

    if (updateError) {
      console.error('[Agency Profile] Update error:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du profil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agency: updatedAgency,
    });
  } catch (error) {
    console.error('[Agency Profile] PATCH error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
