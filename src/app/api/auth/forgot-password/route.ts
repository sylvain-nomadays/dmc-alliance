import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { email, locale = 'fr' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
    const callbackUrl = `${origin}/${locale}/auth/callback?redirect=/${locale}/auth/reset-password`;

    console.log('[Forgot Password] Sending reset email for:', email, '| redirectTo:', callbackUrl);

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl,
    });

    if (error) {
      console.error('[Forgot Password] Supabase error:', error.message);
    } else {
      console.log('[Forgot Password] Reset email sent successfully');
    }

    // Always return success to avoid leaking email existence
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Forgot Password] Unexpected error:', err);
    return NextResponse.json({ success: true });
  }
}
