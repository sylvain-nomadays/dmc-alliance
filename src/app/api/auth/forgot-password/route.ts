import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, locale: requestLocale } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Build the redirect URL to the reset-password page.
    // Derive from the request origin so it works on any deployment domain.
    const requestOrigin = new URL(request.url).origin;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || requestOrigin;
    const locale = requestLocale || 'fr';
    const redirectTo = `${baseUrl}/${locale}/auth/reset-password`;

    // Use the cookie-based server client (not supabaseAdmin) so that the
    // PKCE code_verifier is stored in a cookie and sent back to the browser.
    // When the user clicks the email link, exchangeCodeForSession can find it.
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
