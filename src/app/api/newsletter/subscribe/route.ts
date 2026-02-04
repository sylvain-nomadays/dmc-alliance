/**
 * Newsletter Subscription API
 * POST /api/newsletter/subscribe
 *
 * Handles newsletter subscriptions with double opt-in (RGPD compliant)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { wrapInEmailLayout } from '@/lib/email/templates';
import { v4 as uuidv4 } from 'uuid';

interface SubscribeRequest {
  email: string;
  companyName?: string;
  locale?: 'fr' | 'en';
  interests?: string[]; // 'gir', 'destinations', 'offers', 'magazine'
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generate confirmation email content
function generateConfirmationEmail(token: string, locale: string = 'fr') {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dmcalliance.com';
  const confirmUrl = `${baseUrl}/${locale}/newsletter/confirm?token=${token}`;

  const translations = {
    fr: {
      subject: 'Confirmez votre inscription à la newsletter DMC Alliance',
      preheader: 'Un dernier clic pour recevoir nos actualités',
      title: 'Confirmez votre inscription',
      intro: 'Merci de votre intérêt pour DMC Alliance ! Pour finaliser votre inscription à notre newsletter, veuillez cliquer sur le bouton ci-dessous.',
      button: 'Confirmer mon inscription',
      ignore: 'Si vous n\'avez pas demandé cette inscription, vous pouvez ignorer cet email.',
      footer: 'Ce lien est valable 24 heures.',
    },
    en: {
      subject: 'Confirm your subscription to DMC Alliance newsletter',
      preheader: 'One more click to receive our updates',
      title: 'Confirm your subscription',
      intro: 'Thank you for your interest in DMC Alliance! To complete your newsletter subscription, please click the button below.',
      button: 'Confirm my subscription',
      ignore: 'If you did not request this subscription, you can ignore this email.',
      footer: 'This link is valid for 24 hours.',
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.fr;

  const content = `
    <h1 style="color: #1e3a5f; font-size: 24px; margin-bottom: 24px;">${t.title}</h1>
    <p style="margin-bottom: 24px;">${t.intro}</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${confirmUrl}"
         style="display: inline-block; background-color: #c45d3a; color: white; padding: 14px 32px;
                text-decoration: none; border-radius: 8px; font-weight: 600;">
        ${t.button}
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">${t.ignore}</p>
    <p style="color: #999; font-size: 12px; margin-top: 24px;">${t.footer}</p>
  `;

  return {
    subject: t.subject,
    html: wrapInEmailLayout(content, { preheader: t.preheader }),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeRequest = await request.json();
    const { email, companyName, locale = 'fr', interests = [] } = body;

    // Validate email
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: locale === 'fr' ? 'Adresse email invalide' : 'Invalid email address' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if email already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSubscriber } = await (supabase as any)
      .from('newsletter_subscribers')
      .select('id, is_active, confirmed_at')
      .eq('email', email.toLowerCase())
      .single();

    if (existingSubscriber) {
      // If already confirmed and active
      if (existingSubscriber.is_active && existingSubscriber.confirmed_at) {
        return NextResponse.json(
          {
            error: locale === 'fr'
              ? 'Cette adresse email est déjà inscrite à notre newsletter'
              : 'This email address is already subscribed to our newsletter'
          },
          { status: 409 }
        );
      }

      // If exists but not confirmed, resend confirmation email
      const confirmationToken = uuidv4();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('newsletter_subscribers')
        .update({
          confirmation_token: confirmationToken,
          locale,
          company_name: companyName || existingSubscriber.company_name,
          interests: interests.length > 0 ? interests : existingSubscriber.interests,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscriber.id);

      // Send confirmation email
      const emailContent = generateConfirmationEmail(confirmationToken, locale);
      await sendEmail({
        to: email.toLowerCase(),
        subject: emailContent.subject,
        html: emailContent.html,
      });

      return NextResponse.json({
        success: true,
        message: locale === 'fr'
          ? 'Un email de confirmation vous a été envoyé'
          : 'A confirmation email has been sent to you',
      });
    }

    // Create new subscriber
    const confirmationToken = uuidv4();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('newsletter_subscribers')
      .insert({
        email: email.toLowerCase(),
        company_name: companyName || null,
        locale,
        interests: interests.length > 0 ? interests : ['gir', 'destinations', 'offers', 'magazine'],
        is_active: false, // Will be activated after confirmation
        confirmation_token: confirmationToken,
        source: 'website',
        subscribed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[Newsletter] Insert error:', insertError);
      return NextResponse.json(
        { error: locale === 'fr' ? 'Erreur lors de l\'inscription' : 'Error during subscription' },
        { status: 500 }
      );
    }

    // Send confirmation email
    const emailContent = generateConfirmationEmail(confirmationToken, locale);
    const emailResult = await sendEmail({
      to: email.toLowerCase(),
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!emailResult.success) {
      console.error('[Newsletter] Email send error:', emailResult.error);
      // Don't fail the request, the subscriber is created
    }

    return NextResponse.json({
      success: true,
      message: locale === 'fr'
        ? 'Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception.'
        : 'A confirmation email has been sent to you. Please check your inbox.',
    });

  } catch (error) {
    console.error('[Newsletter] Subscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
