import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { buildEmailFromTemplate } from '@/lib/email/templates';

// Helper pour générer un slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Endpoint pour vérifier si une agence existe (utilisé avant inscription)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyName = searchParams.get('agencyName');

    if (!agencyName) {
      return NextResponse.json({ exists: false });
    }

    const slug = generateSlug(agencyName);

    // Chercher une agence avec ce slug
    const { data: existingAgency } = await supabaseAdmin
      .from('agencies')
      .select('id, name, slug, city, country')
      .eq('slug', slug)
      .single();

    if (existingAgency) {
      return NextResponse.json({
        exists: true,
        agency: {
          id: existingAgency.id,
          name: existingAgency.name,
          city: existingAgency.city,
          country: existingAgency.country,
        },
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('[Register Check] Error:', error);
    return NextResponse.json({ exists: false });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, email, password } = body;

    if (!type || !email || !password) {
      return NextResponse.json(
        { error: 'Informations manquantes' },
        { status: 400 }
      );
    }

    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer automatiquement l'email
    });

    if (authError) {
      console.error('[Register] Auth error:', authError);

      // Message d'erreur plus clair pour l'utilisateur
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Un compte existe déjà avec cet email' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      );
    }

    // Inscription en fonction du type
    if (type === 'agency') {
      return await handleAgencyRegistration(userId, body);
    } else if (type === 'agency_join') {
      return await handleAgencyJoinRequest(userId, body);
    } else if (type === 'dmc') {
      return await handleDMCRegistration(userId, body);
    } else {
      // Supprimer l'utilisateur créé si type invalide
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Type de compte invalide' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Register] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Inscription Agence de voyage
async function handleAgencyRegistration(userId: string, data: {
  email: string;
  agencyName: string;
  registrationNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  contactName: string;
}) {
  const slug = generateSlug(data.agencyName);

  try {
    // 1. Créer ou mettre à jour le profil utilisateur
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: data.email,
        full_name: data.contactName,
        company_name: data.agencyName,
        role: 'agency',
        phone: data.phone || null,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('[Register] Profile error:', profileError);
      // Supprimer l'utilisateur auth si le profil échoue
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil' },
        { status: 500 }
      );
    }

    // 2. Créer l'agence
    const { error: agencyError } = await supabaseAdmin
      .from('agencies')
      .insert({
        user_id: userId,
        name: data.agencyName,
        slug,
        registration_number: data.registrationNumber || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country || 'France',
        email: data.email,
        phone: data.phone || null,
        commission_rate: 10, // Taux de base
        is_verified: false,
        is_active: true,
      });

    if (agencyError) {
      console.error('[Register] Agency error:', agencyError);
      // Supprimer le profil et l'utilisateur auth
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'agence' },
        { status: 500 }
      );
    }

    // 3. Créer les préférences de notification par défaut
    await supabaseAdmin
      .from('notification_preferences')
      .insert({
        user_id: userId,
        email_new_gir: true,
        email_booking_confirmation: true,
        email_price_changes: true,
        email_availability_alerts: true,
        email_commission_updates: true,
        email_newsletter: true,
        email_marketing: false,
        in_app_notifications: true,
      });

    // 4. Envoyer email de bienvenue
    try {
      const emailContent = await buildEmailFromTemplate('welcome_agency', {
        agency_name: data.agencyName,
        contact_name: data.contactName,
        login_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dmc-alliance.com'}/auth/login`,
      }, 'fr');

      if (emailContent) {
        await sendEmail({
          to: data.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      }
    } catch (emailError) {
      console.error('[Register] Email error:', emailError);
      // Ne pas bloquer l'inscription si l'email échoue
    }

    // 5. Ajouter le créateur comme "owner" dans agency_members
    const { data: agencyData } = await supabaseAdmin
      .from('agencies')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (agencyData) {
      await supabaseAdmin
        .from('agency_members')
        .insert({
          agency_id: agencyData.id,
          user_id: userId,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Compte agence créé avec succès',
      userId,
    });

  } catch (error) {
    console.error('[Register] Agency registration error:', error);
    // Nettoyage en cas d'erreur
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}

// Demande pour rejoindre une agence existante
async function handleAgencyJoinRequest(userId: string, data: {
  email: string;
  agencyId: string;
  contactName: string;
  message?: string;
}) {
  try {
    // 1. Vérifier que l'agence existe
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('id, name, user_id')
      .eq('id', data.agencyId)
      .single();

    if (agencyError || !agency) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Agence non trouvée' },
        { status: 404 }
      );
    }

    // 2. Créer ou mettre à jour le profil utilisateur (rôle member en attente)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: data.email,
        full_name: data.contactName,
        company_name: agency.name,
        role: 'member', // Rôle temporaire en attente
        pending_partner_approval: true,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('[Register] Profile error:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil' },
        { status: 500 }
      );
    }

    // 3. Créer la demande de rejoindre
    const { error: requestError } = await supabaseAdmin
      .from('agency_join_requests')
      .insert({
        agency_id: data.agencyId,
        user_id: userId,
        message: data.message || null,
        status: 'pending',
      });

    if (requestError) {
      console.error('[Register] Join request error:', requestError);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la demande' },
        { status: 500 }
      );
    }

    // 4. Notifier le propriétaire de l'agence
    try {
      // Récupérer l'email du propriétaire
      if (agency.user_id) {
        const { data: owner } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', agency.user_id)
          .single();

        if (owner?.email) {
          const emailContent = await buildEmailFromTemplate('agency_join_request', {
            agency_name: agency.name,
            user_name: data.contactName,
            user_email: data.email,
            message: data.message || 'Aucun message',
            dashboard_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dmc-alliance.com'}/agency/settings`,
          }, 'fr');

          if (emailContent) {
            await sendEmail({
              to: owner.email,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });
          }
        }
      }
    } catch (emailError) {
      console.error('[Register] Email notification error:', emailError);
      // Ne pas bloquer l'inscription
    }

    return NextResponse.json({
      success: true,
      message: 'Demande envoyée avec succès',
      pending: true,
    });

  } catch (error) {
    console.error('[Register] Agency join request error:', error);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: 'Erreur lors de la demande' },
      { status: 500 }
    );
  }
}

// Demande d'inscription DMC (en attente de validation)
async function handleDMCRegistration(userId: string, data: {
  email: string;
  partnerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  destinations: string[];
  specialties: string[];
  hasGir: boolean;
}) {
  const slug = generateSlug(data.partnerName);

  try {
    // 1. Créer ou mettre à jour le profil utilisateur avec rôle 'member' (en attente)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: data.email,
        full_name: data.contactName,
        company_name: data.partnerName,
        role: 'member', // Rôle temporaire en attente de validation
        phone: data.contactPhone || null,
        pending_partner_approval: true,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('[Register] Profile error:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil' },
        { status: 500 }
      );
    }

    // 2. Créer la demande d'inscription partenaire
    const { data: requestData, error: requestError } = await supabaseAdmin
      .from('partner_registration_requests')
      .insert({
        user_id: userId,
        partner_name: data.partnerName,
        partner_slug: slug,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone || null,
        website: data.website || null,
        description: data.description || null,
        destinations: data.destinations,
        specialties: data.specialties,
        has_gir: data.hasGir,
        status: 'pending',
      })
      .select('id')
      .single();

    if (requestError || !requestData) {
      console.error('[Register] Request error:', requestError);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la demande' },
        { status: 500 }
      );
    }

    // 3. Mettre à jour le profil avec l'ID de la demande
    await supabaseAdmin
      .from('profiles')
      .update({ partner_request_id: requestData.id })
      .eq('id', userId);

    // 4. Notifier les admins par email
    try {
      // Récupérer les admins
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('role', 'admin')
        .eq('is_active', true);

      if (admins && admins.length > 0) {
        const adminEmails = admins.map((a: { email: string }) => a.email).filter(Boolean);

        const emailContent = await buildEmailFromTemplate('new_partner_request', {
          partner_name: data.partnerName,
          contact_name: data.contactName,
          contact_email: data.contactEmail,
          website: data.website || 'Non renseigné',
          destinations: data.destinations.join(', '),
          admin_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dmc-alliance.com'}/admin/partner-requests`,
        }, 'fr');

        if (emailContent) {
          for (const adminEmail of adminEmails) {
            await sendEmail({
              to: adminEmail,
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });
          }
        }
      }
    } catch (emailError) {
      console.error('[Register] Admin notification error:', emailError);
      // Ne pas bloquer l'inscription
    }

    // 5. Envoyer email de confirmation au demandeur
    try {
      // Utiliser un email simple de confirmation
      await sendEmail({
        to: data.email,
        subject: 'DMC Alliance - Demande d\'inscription reçue',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #c75a3a;">Demande d'inscription reçue</h2>
            <p>Bonjour ${data.contactName},</p>
            <p>Nous avons bien reçu votre demande d'inscription à DMC Alliance pour <strong>${data.partnerName}</strong>.</p>
            <p>Notre équipe va examiner votre dossier et vous contactera sous 48h pour vous informer de la suite.</p>
            <p>En attendant, vous pouvez consulter notre site pour découvrir nos services.</p>
            <p style="margin-top: 30px;">Cordialement,<br>L'équipe DMC Alliance</p>
          </div>
        `,
        text: `Bonjour ${data.contactName},\n\nNous avons bien reçu votre demande d'inscription à DMC Alliance pour ${data.partnerName}.\n\nNotre équipe va examiner votre dossier et vous contactera sous 48h.\n\nCordialement,\nL'équipe DMC Alliance`,
      });
    } catch (emailError) {
      console.error('[Register] Confirmation email error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Demande d\'inscription envoyée avec succès',
      requestId: requestData.id,
    });

  } catch (error) {
    console.error('[Register] DMC registration error:', error);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}
