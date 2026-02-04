/**
 * Notification service - handles in-app and email notifications
 */

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from './resend';
import { buildEmailFromTemplate } from './templates';
import type { NotificationType, EmailTemplateSlug, EmailTemplateVariables } from './types';

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
  emailTemplate?: EmailTemplateSlug;
  emailVariables?: EmailTemplateVariables;
}

/**
 * Create an in-app notification
 */
export async function createNotification(options: CreateNotificationOptions): Promise<string | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('notifications')
    .insert({
      user_id: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      link: options.link,
      metadata: options.metadata || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Notification] Failed to create:', error);
    return null;
  }

  // Send email if requested
  if (options.sendEmail && options.emailTemplate) {
    await sendNotificationEmail(options.userId, options.emailTemplate, options.emailVariables || {});
  }

  return data?.id || null;
}

/**
 * Send notification email to a user
 */
async function sendNotificationEmail(
  userId: string,
  templateSlug: EmailTemplateSlug,
  variables: EmailTemplateVariables
): Promise<boolean> {
  const supabase = await createClient();

  // Get user email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('email, locale')
    .eq('id', userId)
    .single();

  if (!profile?.email) {
    console.error('[Notification] User email not found:', userId);
    return false;
  }

  // Check notification preferences
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prefs } = await (supabase as any)
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Map template to preference (partial - some templates are always sent)
  const templateToPreference: Partial<Record<EmailTemplateSlug, string>> = {
    booking_confirmation: 'email_booking_confirmation',
    new_booking_alert: 'email_availability_alerts',
    commission_update: 'email_commission_updates',
    availability_alert: 'email_availability_alerts',
    welcome_agency: 'email_new_gir', // Always send welcome emails
    newsletter: 'email_newsletter',
    // Admin/system emails are always sent:
    // new_partner_request, partner_request_approved, partner_request_rejected
    // agency_info_request, agency_booking_request
    // agency_join_approved, agency_join_rejected, agency_join_request
  };

  const prefKey = templateToPreference[templateSlug];
  if (prefs && prefKey && prefs[prefKey] === false) {
    console.log('[Notification] Email disabled by user preference:', templateSlug);
    return false;
  }

  // Build and send email
  const locale = (profile.locale === 'en' ? 'en' : 'fr') as 'fr' | 'en';
  const email = await buildEmailFromTemplate(templateSlug, variables, locale);

  if (!email) {
    console.error('[Notification] Failed to build email template:', templateSlug);
    return false;
  }

  const result = await sendEmail({
    to: profile.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  // Log email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('email_logs').insert({
    recipient_email: profile.email,
    subject: email.subject,
    body: email.text,
    status: result.success ? 'sent' : 'failed',
    error_message: result.error,
    metadata: { template: templateSlug, variables },
    sent_at: result.success ? new Date().toISOString() : null,
  });

  return result.success;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('user_id', userId);

  return !error;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  return !error;
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase as any)
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
}

/**
 * Delete old notifications (older than 30 days)
 */
export async function cleanupOldNotifications(): Promise<number> {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('notifications')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString())
    .eq('is_read', true)
    .select('id');

  if (error) return 0;
  return data?.length || 0;
}

// ============ GIR-specific notification helpers ============

/**
 * Notify agencies watching a circuit about a new booking
 */
export async function notifyWatchersOfBooking(
  circuitId: string,
  excludeAgencyId?: string
): Promise<void> {
  const supabase = await createClient();

  // Get circuit info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: circuit } = await (supabase as any)
    .from('circuits')
    .select('title_fr, places_available, places_total, departure_date')
    .eq('id', circuitId)
    .single();

  if (!circuit) return;

  // Get watchers who want booking notifications
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('gir_watchlist')
    .select(`
      agency:agencies(id, user_id, name)
    `)
    .eq('circuit_id', circuitId)
    .eq('notify_on_booking', true);

  if (excludeAgencyId) {
    query = query.neq('agency_id', excludeAgencyId);
  }

  const { data: watchers } = await query;

  if (!watchers || watchers.length === 0) return;

  // Create notifications for each watcher
  for (const watcher of watchers) {
    if (!watcher.agency?.user_id) continue;

    await createNotification({
      userId: watcher.agency.user_id,
      type: 'booking',
      title: 'Nouvelle réservation',
      message: `Une nouvelle réservation a été effectuée sur "${circuit.title_fr}". Places restantes: ${circuit.places_available}/${circuit.places_total}`,
      link: `/espace-pro/circuits/${circuitId}`,
      metadata: { circuit_id: circuitId },
      sendEmail: true,
      emailTemplate: 'new_booking_alert',
      emailVariables: {
        agency_name: watcher.agency.name,
        circuit_title: circuit.title_fr,
        places_available: circuit.places_available,
        places_total: circuit.places_total,
      },
    });
  }
}

/**
 * Notify agencies watching a circuit about availability change
 */
export async function notifyWatchersOfAvailability(
  circuitId: string,
  placesAvailable: number,
  placesTotal: number
): Promise<void> {
  const supabase = await createClient();

  // Only notify if low availability (< 5 places or < 20%)
  const lowThreshold = Math.min(5, Math.floor(placesTotal * 0.2));
  if (placesAvailable > lowThreshold) return;

  // Get circuit info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: circuit } = await (supabase as any)
    .from('circuits')
    .select('title_fr, departure_date')
    .eq('id', circuitId)
    .single();

  if (!circuit) return;

  // Get watchers who want availability notifications
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: watchers } = await (supabase as any)
    .from('gir_watchlist')
    .select(`
      agency:agencies(id, user_id, name)
    `)
    .eq('circuit_id', circuitId)
    .eq('notify_on_availability_change', true);

  if (!watchers || watchers.length === 0) return;

  for (const watcher of watchers) {
    if (!watcher.agency?.user_id) continue;

    await createNotification({
      userId: watcher.agency.user_id,
      type: 'availability',
      title: 'Alerte disponibilité',
      message: `Plus que ${placesAvailable} places disponibles sur "${circuit.title_fr}" !`,
      link: `/espace-pro/circuits/${circuitId}`,
      metadata: { circuit_id: circuitId, places_available: placesAvailable },
      sendEmail: true,
      emailTemplate: 'availability_alert',
      emailVariables: {
        agency_name: watcher.agency.name,
        circuit_title: circuit.title_fr,
        places_available: placesAvailable,
        places_total: placesTotal,
        departure_date: new Date(circuit.departure_date).toLocaleDateString('fr-FR'),
      },
    });
  }
}

/**
 * Notify agency of commission rate change
 */
export async function notifyCommissionChange(
  agencyId: string,
  oldRate: number,
  newRate: number
): Promise<void> {
  const supabase = await createClient();

  // Get agency info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agency } = await (supabase as any)
    .from('agencies')
    .select('user_id, name')
    .eq('id', agencyId)
    .single();

  if (!agency?.user_id) return;

  await createNotification({
    userId: agency.user_id,
    type: 'commission',
    title: 'Taux de commission mis à jour',
    message: `Félicitations ! Votre taux de commission passe de ${oldRate}% à ${newRate}%.`,
    link: '/espace-pro/dashboard',
    metadata: { old_rate: oldRate, new_rate: newRate },
    sendEmail: true,
    emailTemplate: 'commission_update',
    emailVariables: {
      agency_name: agency.name,
      old_rate: oldRate,
      new_rate: newRate,
    },
  });
}
