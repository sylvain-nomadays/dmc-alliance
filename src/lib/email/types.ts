/**
 * Types for email and notification system
 */

export type NotificationType =
  | 'booking'
  | 'price_change'
  | 'availability'
  | 'commission'
  | 'newsletter'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject_fr: string;
  subject_en?: string;
  body_fr: string;
  body_en?: string;
  variables: string[];
  is_active: boolean;
}

export interface EmailLog {
  id: string;
  template_id?: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body?: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  error_message?: string;
  metadata: Record<string, unknown>;
  sent_at?: string;
  created_at: string;
}

export interface NewsletterCampaign {
  id: string;
  title: string;
  subject_fr: string;
  subject_en?: string;
  content_fr: string;
  content_en?: string;
  target_audience: 'all' | 'agencies' | 'partners' | 'custom';
  target_filters: Record<string, unknown>;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_at?: string;
  sent_at?: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
  };
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_new_gir: boolean;
  email_booking_confirmation: boolean;
  email_price_changes: boolean;
  email_availability_alerts: boolean;
  email_commission_updates: boolean;
  email_newsletter: boolean;
  email_marketing: boolean;
  in_app_notifications: boolean;
}

export interface GirWatchlistItem {
  id: string;
  agency_id: string;
  circuit_id: string;
  notify_on_booking: boolean;
  notify_on_price_change: boolean;
  notify_on_availability_change: boolean;
  notify_on_commission_change: boolean;
  created_at: string;
  circuit?: {
    id: string;
    title_fr: string;
    destination_id: string;
    departure_date: string;
    places_available: number;
    places_total: number;
    price_from: number;
    status: string;
  };
}

// Email sending types
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailTemplateVariables {
  [key: string]: string | number | undefined;
}

// Template slugs for type safety
export type EmailTemplateSlug =
  | 'booking_confirmation'
  | 'new_booking_alert'
  | 'commission_update'
  | 'availability_alert'
  | 'welcome_agency'
  | 'newsletter'
  | 'new_partner_request'
  | 'partner_request_approved'
  | 'partner_request_rejected'
  | 'agency_info_request'
  | 'agency_booking_request'
  | 'agency_join_approved'
  | 'agency_join_rejected'
  | 'agency_join_request';
