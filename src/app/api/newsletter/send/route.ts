/**
 * API route to send newsletter campaigns
 * POST /api/newsletter/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendBatchEmails } from '@/lib/email/resend';
import { wrapInEmailLayout, textToHtml } from '@/lib/email/templates';

interface Recipient {
  email: string;
  full_name: string | null;
  locale: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    // Get campaign
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return NextResponse.json({ error: 'Campaign already sent or cancelled' }, { status: 400 });
    }

    // Update status to sending
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('newsletter_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    // Get recipients based on target audience
    let recipients: Recipient[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('profiles')
      .select('email, full_name, locale')
      .eq('is_active', true);

    // Join with notification preferences to check email_newsletter
    // For simplicity, we'll filter later

    if (campaign.target_audience === 'agencies') {
      query = query.eq('role', 'agency');
    } else if (campaign.target_audience === 'partners') {
      query = query.eq('role', 'partner');
    }
    // 'all' or 'custom' - get all active users

    const { data: users } = await query;

    if (users) {
      // Filter users who have newsletter enabled
      const userIds = users.map((u: { email: string }) => u.email);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: prefs } = await (supabase as any)
        .from('notification_preferences')
        .select('user_id')
        .in('user_id', users.map((u: { id: string }) => u.id))
        .eq('email_newsletter', false);

      const disabledUserIds = new Set(prefs?.map((p: { user_id: string }) => p.user_id) || []);

      recipients = users.filter((u: { id: string }) => !disabledUserIds.has(u.id));
    }

    if (recipients.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('newsletter_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          stats: { sent: 0, opened: 0, clicked: 0 },
        })
        .eq('id', campaignId);

      return NextResponse.json({ success: true, sent: 0 });
    }

    // Build emails
    const emails = recipients.map((recipient) => {
      const locale = recipient.locale === 'en' ? 'en' : 'fr';
      const subject = locale === 'en' && campaign.subject_en
        ? campaign.subject_en
        : campaign.subject_fr;
      const content = locale === 'en' && campaign.content_en
        ? campaign.content_en
        : campaign.content_fr;

      const html = wrapInEmailLayout(textToHtml(content), {
        preheader: subject,
      });

      return {
        to: recipient.email,
        subject,
        html,
        text: content,
      };
    });

    // Send emails in batches
    const result = await sendBatchEmails(emails);

    // Update campaign status
    const sentCount = result.success ? emails.length : 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('newsletter_campaigns')
      .update({
        status: result.success ? 'sent' : 'draft',
        sent_at: result.success ? new Date().toISOString() : null,
        stats: {
          sent: sentCount,
          opened: 0,
          clicked: 0,
        },
      })
      .eq('id', campaignId);

    // Log emails
    for (const email of emails) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('email_logs').insert({
        recipient_email: email.to,
        subject: email.subject,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error,
        metadata: { campaign_id: campaignId },
        sent_at: result.success ? new Date().toISOString() : null,
      });
    }

    return NextResponse.json({
      success: result.success,
      sent: sentCount,
      error: result.error,
    });
  } catch (error) {
    console.error('[API] Newsletter send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
