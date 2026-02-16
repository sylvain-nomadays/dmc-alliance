import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, locale: requestLocale } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Build the redirect URL to the reset-password page.
    // Derive from the request origin so it works on any deployment domain.
    // If this URL is in Supabase's redirect allowlist, the code arrives directly
    // on the reset-password page. Otherwise, Supabase falls back to the Site URL
    // and the middleware redirects to reset-password with the code.
    const requestOrigin = new URL(request.url).origin;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || requestOrigin;
    const locale = requestLocale || 'fr';
    const redirectTo = `${baseUrl}/${locale}/auth/reset-password`;

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error('[Forgot Password] Supabase error:', error.message);
    }

    // Always return success to avoid leaking email existence
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Forgot Password] Unexpected error:', err);
    return NextResponse.json({ success: true });
  }
}
