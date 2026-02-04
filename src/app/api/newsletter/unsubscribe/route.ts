/**
 * Newsletter Unsubscribe API
 * POST /api/newsletter/unsubscribe
 * GET /api/newsletter/unsubscribe?email=xxx&token=xxx
 *
 * Handles newsletter unsubscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Generate unsubscribe token from email (deterministic)
function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'dmc-alliance-secret-key';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32);
}

// Verify unsubscribe token
function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expectedToken = generateUnsubscribeToken(email);
  return token === expectedToken;
}

// GET handler - for direct unsubscribe links in emails
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const locale = searchParams.get('locale') || 'fr';

  if (!email || !token) {
    return NextResponse.redirect(new URL(`/${locale}/newsletter/unsubscribe?error=invalid`, request.url));
  }

  // Verify token
  if (!verifyUnsubscribeToken(email, token)) {
    return NextResponse.redirect(new URL(`/${locale}/newsletter/unsubscribe?error=invalid`, request.url));
  }

  const supabase = await createClient();

  // Find and unsubscribe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscriber, error: findError } = await (supabase as any)
    .from('newsletter_subscribers')
    .select('id, is_active')
    .eq('email', email.toLowerCase())
    .single();

  if (findError || !subscriber) {
    return NextResponse.redirect(new URL(`/${locale}/newsletter/unsubscribe?error=notfound`, request.url));
  }

  if (!subscriber.is_active) {
    return NextResponse.redirect(new URL(`/${locale}/newsletter/unsubscribe?status=already`, request.url));
  }

  // Unsubscribe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('newsletter_subscribers')
    .update({
      is_active: false,
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriber.id);

  if (updateError) {
    console.error('[Newsletter] Unsubscribe error:', updateError);
    return NextResponse.redirect(new URL(`/${locale}/newsletter/unsubscribe?error=server`, request.url));
  }

  return NextResponse.redirect(new URL(`/${locale}/newsletter/unsubscribe?status=success&email=${encodeURIComponent(email)}`, request.url));
}

// POST handler - for form submissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, locale = 'fr', deleteData = false } = body;

    if (!email) {
      return NextResponse.json(
        { error: locale === 'fr' ? 'Email requis' : 'Email required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find subscriber
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriber, error: findError } = await (supabase as any)
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (findError || !subscriber) {
      return NextResponse.json(
        {
          error: locale === 'fr'
            ? 'Cette adresse email n\'est pas inscrite à notre newsletter'
            : 'This email address is not subscribed to our newsletter'
        },
        { status: 404 }
      );
    }

    if (deleteData) {
      // RGPD: Complete data deletion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from('newsletter_subscribers')
        .delete()
        .eq('id', subscriber.id);

      if (deleteError) {
        console.error('[Newsletter] Delete error:', deleteError);
        return NextResponse.json(
          { error: locale === 'fr' ? 'Erreur lors de la suppression' : 'Error during deletion' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: locale === 'fr'
          ? 'Vos données ont été supprimées de notre base'
          : 'Your data has been deleted from our database',
      });
    } else {
      // Simple unsubscribe (keep data but deactivate)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('newsletter_subscribers')
        .update({
          is_active: false,
          unsubscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriber.id);

      if (updateError) {
        console.error('[Newsletter] Unsubscribe error:', updateError);
        return NextResponse.json(
          { error: locale === 'fr' ? 'Erreur lors de la désinscription' : 'Error during unsubscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: locale === 'fr'
          ? 'Vous avez été désinscrit de notre newsletter'
          : 'You have been unsubscribed from our newsletter',
      });
    }

  } catch (error) {
    console.error('[Newsletter] Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export token generator for use in email templates
export { generateUnsubscribeToken };
