import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Send password reset email via Supabase's built-in SMTP.
    // No redirectTo: Supabase will redirect to the Site URL with ?code=xxx
    // The middleware intercepts ?code= on public routes, exchanges the code,
    // and redirects to /auth/reset-password automatically.
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email);

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
