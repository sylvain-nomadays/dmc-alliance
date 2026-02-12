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

    // Generate recovery link via Supabase admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (error || !data) {
      // Don't reveal whether the email exists or not
      return NextResponse.json({ success: true });
    }

    const tokenHash = data.properties?.hashed_token;
    if (!tokenHash) {
      console.error('[Forgot Password] No hashed_token in generateLink response');
      return NextResponse.json({ success: true });
    }

    // Build the reset URL that goes through our callback route
    const resetUrl = `${origin}/${locale}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&redirect=/${locale}/auth/reset-password`;

    // Build beautiful email HTML
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

    // Send via Resend
    await sendEmail({
      to: email,
      subject: isFr
        ? 'Réinitialisation de votre mot de passe - DMC Alliance'
        : 'Reset your password - DMC Alliance',
      html,
      text: isFr
        ? `Réinitialisation de votre mot de passe\n\nCliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}\n\nCe lien est valable pendant 24 heures.`
        : `Reset your password\n\nClick this link to reset your password: ${resetUrl}\n\nThis link is valid for 24 hours.`,
    });

    // Always return success to avoid leaking email existence
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Forgot Password] Error:', err);
    return NextResponse.json({ success: true });
  }
}
