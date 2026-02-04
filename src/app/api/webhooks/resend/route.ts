/**
 * Resend Webhook Handler
 * Receives email events from Resend for tracking opens, clicks, bounces, etc.
 *
 * Configure in Resend Dashboard:
 * 1. Go to https://resend.com/webhooks
 * 2. Add webhook URL: https://your-domain.com/api/webhooks/resend
 * 3. Select events: email.delivered, email.opened, email.clicked, email.bounced, email.complained
 * 4. Copy the signing secret and add to env: RESEND_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // For click events
    click?: {
      link: string;
      timestamp: string;
    };
  };
}

// Verify webhook signature (optional but recommended)
function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return true; // Skip verification if no secret configured

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('resend-signature');
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
      console.error('[Resend Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: ResendWebhookPayload = JSON.parse(rawBody);
    const { type, data } = payload;

    console.log(`[Resend Webhook] Received event: ${type}`);

    const supabase = await createClient();

    switch (type) {
      case 'email.delivered': {
        // Log delivery
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('email_logs')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString(),
          })
          .eq('resend_id', data.email_id);
        break;
      }

      case 'email.opened': {
        // Update email logs with open timestamp
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: emailLog } = await (supabase as any)
          .from('email_logs')
          .select('campaign_id')
          .eq('resend_id', data.email_id)
          .single();

        if (emailLog?.campaign_id) {
          // Increment campaign opens
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).rpc('increment_campaign_opens', {
            campaign_id: emailLog.campaign_id,
          });
        }

        // Update log
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('email_logs')
          .update({
            opened_at: new Date().toISOString(),
          })
          .eq('resend_id', data.email_id);
        break;
      }

      case 'email.clicked': {
        // Update email logs with click data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: emailLog } = await (supabase as any)
          .from('email_logs')
          .select('campaign_id')
          .eq('resend_id', data.email_id)
          .single();

        if (emailLog?.campaign_id) {
          // Increment campaign clicks
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).rpc('increment_campaign_clicks', {
            campaign_id: emailLog.campaign_id,
          });
        }

        // Update log
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('email_logs')
          .update({
            clicked_at: new Date().toISOString(),
            clicked_link: data.click?.link || null,
          })
          .eq('resend_id', data.email_id);
        break;
      }

      case 'email.bounced': {
        // Mark subscriber as bounced
        const email = data.to?.[0];
        if (email) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('newsletter_subscribers')
            .update({
              is_active: false,
              unsubscribed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('email', email.toLowerCase());

          // Update log
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('email_logs')
            .update({
              status: 'bounced',
              bounced_at: new Date().toISOString(),
            })
            .eq('resend_id', data.email_id);
        }
        console.log(`[Resend Webhook] Email bounced: ${email}`);
        break;
      }

      case 'email.complained': {
        // User marked as spam - unsubscribe immediately
        const email = data.to?.[0];
        if (email) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('newsletter_subscribers')
            .update({
              is_active: false,
              unsubscribed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('email', email.toLowerCase());

          // Update log
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('email_logs')
            .update({
              status: 'complained',
              complained_at: new Date().toISOString(),
            })
            .eq('resend_id', data.email_id);
        }
        console.log(`[Resend Webhook] Spam complaint: ${email}`);
        break;
      }

      default:
        console.log(`[Resend Webhook] Unhandled event type: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Resend Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Resend sends HEAD request to verify webhook URL
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
