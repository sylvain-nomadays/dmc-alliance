import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { wrapInEmailLayout } from '@/lib/email/templates';

export async function POST(request: Request) {
  try {
    const { email, locale = 'fr' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
    const isFr = locale === 'fr';
    const callbackUrl = `${origin}/${locale}/auth/callback?redirect=/${locale}/auth/reset-password`;

    // Generate recovery link via Supabase admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (linkError || !linkData) {
      // Don't reveal whether the email exists or not
      return NextResponse.json({ success: true });
    }

    const tokenHash = linkData.properties?.hashed_token;
    if (!tokenHash) {
      return NextResponse.json({ success: true });
    }

    // Build the reset URL that goes directly to our callback (bypasses Supabase redirect allowlist)
    const resetUrl = `${origin}/${locale}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&redirect=/${locale}/auth/reset-password`;

    // Try sending a beautiful email via Resend
    const sent = await trySendViaResend(email, resetUrl, isFr);

    if (!sent) {
      // Fallback: use Supabase's built-in email (less pretty, but arrives)
      console.log('[Forgot Password] Resend failed, falling back to Supabase email');
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl,
      });
    }

    // Always return success to avoid leaking email existence
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Forgot Password] Unexpected error:', err);
    return NextResponse.json({ success: true });
  }
}

async function trySendViaResend(email: string, resetUrl: string, isFr: boolean): Promise<boolean> {
  try {
    const emailContent = `
      <h2 style="color: #1e3a5f; margin-top: 0;">
        ${isFr ? 'Réinitialisation de votre mot de passe' : 'Reset your password'}
      </h2>
      <p>
        ${isFr
          ? 'Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.'
          : 'You requested a password reset. Click the button below to choose a new password.'}
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" class="button" style="display: inline-block; background-color: #c17d5e; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          ${isFr ? 'Réinitialiser mon mot de passe' : 'Reset my password'}
        </a>
      </div>
      <div class="info-box" style="background-color: #f8f9fa; border-left: 4px solid #c17d5e; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          ${isFr
            ? 'Ce lien est valable pendant 24 heures. Si vous n\'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.'
            : 'This link is valid for 24 hours. If you did not request this reset, you can safely ignore this email.'}
        </p>
      </div>
      <p style="font-size: 13px; color: #999; margin-top: 24px;">
        ${isFr
          ? 'Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :'
          : 'If the button doesn\'t work, copy and paste this link into your browser:'}
        <br>
        <a href="${resetUrl}" style="color: #c17d5e; word-break: break-all;">${resetUrl}</a>
      </p>
    `;

    const html = wrapInEmailLayout(emailContent, {
      preheader: isFr
        ? 'Réinitialisation de votre mot de passe DMC Alliance'
        : 'Reset your DMC Alliance password',
    });

    const result = await sendEmail({
      to: email,
      subject: isFr
        ? 'Réinitialisation de votre mot de passe - DMC Alliance'
        : 'Reset your password - DMC Alliance',
      html,
      text: isFr
        ? `Réinitialisation de votre mot de passe\n\nCliquez sur ce lien : ${resetUrl}\n\nCe lien est valable 24 heures.`
        : `Reset your password\n\nClick this link: ${resetUrl}\n\nThis link is valid for 24 hours.`,
    });

    if (result.success) {
      console.log('[Forgot Password] Email sent via Resend. ID:', result.id);
      return true;
    }

    console.warn('[Forgot Password] Resend failed:', result.error);
    return false;
  } catch (err) {
    console.warn('[Forgot Password] Resend exception:', err);
    return false;
  }
}
