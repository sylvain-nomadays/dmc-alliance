/**
 * Newsletter Confirmation API
 * GET /api/newsletter/confirm/[token]
 *
 * Validates email confirmation token and activates subscriber
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.redirect(new URL('/fr/newsletter/confirm?error=invalid', request.url));
    }

    const supabase = await createClient();

    // Find subscriber by token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriber, error: findError } = await (supabase as any)
      .from('newsletter_subscribers')
      .select('id, email, locale, confirmed_at')
      .eq('confirmation_token', token)
      .single();

    if (findError || !subscriber) {
      console.error('[Newsletter] Token not found:', token);
      return NextResponse.redirect(new URL('/fr/newsletter/confirm?error=invalid', request.url));
    }

    // Check if already confirmed
    if (subscriber.confirmed_at) {
      const locale = subscriber.locale || 'fr';
      return NextResponse.redirect(new URL(`/${locale}/newsletter/confirm?status=already`, request.url));
    }

    // Activate subscriber
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('newsletter_subscribers')
      .update({
        is_active: true,
        confirmed_at: new Date().toISOString(),
        confirmation_token: null, // Clear token after use
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('[Newsletter] Confirmation update error:', updateError);
      return NextResponse.redirect(new URL('/fr/newsletter/confirm?error=server', request.url));
    }

    // Redirect to success page
    const locale = subscriber.locale || 'fr';
    return NextResponse.redirect(new URL(`/${locale}/newsletter/confirm?status=success`, request.url));

  } catch (error) {
    console.error('[Newsletter] Confirm error:', error);
    return NextResponse.redirect(new URL('/fr/newsletter/confirm?error=server', request.url));
  }
}
