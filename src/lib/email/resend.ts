/**
 * Resend email service wrapper
 */

import { Resend } from 'resend';
import type { SendEmailOptions } from './types';

const DEFAULT_FROM = process.env.EMAIL_FROM || 'DMC Alliance <noreply@dmcalliance.com>';

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Send a single email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: options.from || DEFAULT_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      tags: options.tags,
    });

    if (error) {
      console.error('[Email] Send error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Sent successfully:', data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[Email] Exception:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send batch emails (up to 100 at a time)
 */
export async function sendBatchEmails(
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    text?: string;
  }>
): Promise<{ success: boolean; results?: Array<{ id?: string; error?: string }>; error?: string }> {
  try {
    // Resend batch API allows up to 100 emails at once
    const batches = [];
    for (let i = 0; i < emails.length; i += 100) {
      batches.push(emails.slice(i, i + 100));
    }

    const allResults: Array<{ id?: string; error?: string }> = [];

    const resend = getResendClient();

    for (const batch of batches) {
      const { data, error } = await resend.batch.send(
        batch.map((email) => ({
          from: DEFAULT_FROM,
          to: [email.to],
          subject: email.subject,
          html: email.html,
          text: email.text,
        }))
      );

      if (error) {
        console.error('[Email] Batch send error:', error);
        return { success: false, error: error.message };
      }

      if (data) {
        allResults.push(...data.data.map((d) => ({ id: d.id })));
      }
    }

    console.log(`[Email] Batch sent: ${allResults.length} emails`);
    return { success: true, results: allResults };
  } catch (err) {
    console.error('[Email] Batch exception:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured');
    return false;
  }

  try {
    // Try to get API key info
    const resend = getResendClient();
    const { data } = await resend.apiKeys.list();
    return !!data;
  } catch {
    return false;
  }
}
