/**
 * Email template rendering and management
 */

import { createStaticClient } from '@/lib/supabase/server';
import type { EmailTemplate, EmailTemplateVariables, EmailTemplateSlug } from './types';

/**
 * Get an email template by slug
 */
export async function getEmailTemplate(slug: EmailTemplateSlug): Promise<EmailTemplate | null> {
  const supabase = createStaticClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('email_templates')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error(`[Email] Template not found: ${slug}`, error);
    return null;
  }

  return {
    ...data,
    variables: data.variables || [],
  } as EmailTemplate;
}

/**
 * Render an email template with variables
 */
export function renderTemplate(
  template: string,
  variables: EmailTemplateVariables
): string {
  let rendered = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(placeholder, String(value ?? ''));
  }

  // Remove any remaining unmatched placeholders
  rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');

  return rendered;
}

/**
 * Wrap content in a styled HTML email template
 */
export function wrapInEmailLayout(content: string, options?: {
  preheader?: string;
  footerText?: string;
}): string {
  const preheader = options?.preheader || '';
  const footerText = options?.footerText || '© 2024 DMC Alliance. Tous droits réservés.';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>DMC Alliance</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #1e3a5f;
      padding: 24px;
      text-align: center;
    }
    .header img {
      max-width: 180px;
      height: auto;
    }
    .header h1 {
      color: #ffffff;
      font-size: 24px;
      margin: 12px 0 0;
    }
    .content {
      padding: 32px 24px;
      color: #333333;
    }
    .content h2 {
      color: #1e3a5f;
      font-size: 20px;
      margin-top: 0;
    }
    .content p {
      margin: 0 0 16px;
    }
    .button {
      display: inline-block;
      background-color: #c17d5e;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background-color: #a66b4e;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #c17d5e;
      padding: 16px;
      margin: 16px 0;
    }
    .footer {
      background-color: #1e3a5f;
      padding: 24px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
    .footer a {
      color: #c17d5e;
      text-decoration: none;
    }
    .social-links {
      margin: 16px 0;
    }
    .social-links a {
      margin: 0 8px;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .content {
        padding: 24px 16px;
      }
    }
  </style>
</head>
<body>
  <!-- Preheader text (hidden but shown in email previews) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${preheader}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table class="email-container" role="presentation" width="600" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td class="header">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">DMC Alliance</h1>
              <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Votre réseau de réceptifs</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer">
              <p style="margin: 0 0 8px;">${footerText}</p>
              <p style="margin: 0;">
                <a href="https://dmcalliance.com">Site web</a> |
                <a href="https://dmcalliance.com/contact">Contact</a> |
                <a href="https://dmcalliance.com/unsubscribe">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Convert plain text email to HTML (basic formatting)
 */
export function textToHtml(text: string): string {
  return text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/- (.+?)(<br>|<\/p>)/g, '<li>$1</li>')
    .replace(/<li>(.+?)<\/li>/g, (match) => `<ul>${match}</ul>`)
    .replace(/<\/ul>\s*<ul>/g, '');
}

/**
 * Build email content from template
 */
export async function buildEmailFromTemplate(
  templateSlug: EmailTemplateSlug,
  variables: EmailTemplateVariables,
  locale: 'fr' | 'en' = 'fr'
): Promise<{ subject: string; html: string; text: string } | null> {
  const template = await getEmailTemplate(templateSlug);

  if (!template) {
    return null;
  }

  const subject = renderTemplate(
    locale === 'fr' ? template.subject_fr : (template.subject_en || template.subject_fr),
    variables
  );

  const bodyText = renderTemplate(
    locale === 'fr' ? template.body_fr : (template.body_en || template.body_fr),
    variables
  );

  const bodyHtml = textToHtml(bodyText);
  const html = wrapInEmailLayout(bodyHtml, { preheader: subject });

  return {
    subject,
    html,
    text: bodyText,
  };
}
