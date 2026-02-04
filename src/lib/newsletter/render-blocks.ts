/**
 * Newsletter Block Renderer - Convertit les blocs en HTML pour emails
 */

import { NewsletterBlock, TemplateSettings, BlockType } from './types';

interface RenderOptions {
  unsubscribeUrl?: string;
  previewText?: string;
}

/**
 * Convertit les blocs en HTML email compatible
 */
export function renderBlocksToHtml(
  blocks: NewsletterBlock[],
  settings: TemplateSettings,
  options: RenderOptions = {}
): string {
  const { unsubscribeUrl = '#', previewText = '' } = options;

  const fontFamily = getFontFamily(settings.fontFamily);
  const fontSize = getFontSize(settings.fontSize);

  const bodyContent = blocks.map((block) => renderBlock(block, settings)).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Newsletter</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .fluid {
        max-width: 100% !important;
        height: auto !important;
      }
      .stack-column,
      .stack-column-center {
        display: block !important;
        width: 100% !important;
      }
      .stack-column-center {
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${settings.backgroundColor}; font-family: ${fontFamily}; font-size: ${fontSize};">
  ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>` : ''}

  <!-- Email wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${settings.backgroundColor};">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <!-- Email container -->
        <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff;">
          ${bodyContent}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Rend un bloc individuel en HTML
 */
function renderBlock(block: NewsletterBlock, templateSettings: TemplateSettings): string {
  const { type, content, settings } = block;

  switch (type) {
    case 'header':
      return renderHeaderBlock(content, settings);
    case 'text':
      return renderTextBlock(content, settings);
    case 'image':
      return renderImageBlock(content, settings);
    case 'button':
      return renderButtonBlock(content, settings, templateSettings);
    case 'footer':
      return renderFooterBlock(content, settings);
    case 'divider':
      return renderDividerBlock(settings);
    default:
      return '';
  }
}

function renderHeaderBlock(content: any, settings: any): string {
  const bgColor = settings.backgroundColor || 'transparent';
  const textColor = settings.textColor || '#333333';
  const padding = getPadding(settings.padding);
  const alignment = settings.alignment || 'center';

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: ${padding}; text-align: ${alignment};">
        ${content.logoUrl ? `<img src="${content.logoUrl}" alt="Logo" width="150" style="display: block; margin: 0 auto 16px;" />` : ''}
        <h1 style="margin: 0 0 8px; font-size: 28px; color: ${textColor}; font-weight: 700;">${content.title || ''}</h1>
        ${content.subtitle ? `<p style="margin: 0; font-size: 16px; color: ${textColor}; opacity: 0.8;">${content.subtitle}</p>` : ''}
      </td>
    </tr>
  `;
}

function renderTextBlock(content: any, settings: any): string {
  const bgColor = settings.backgroundColor || 'transparent';
  const textColor = settings.textColor || '#333333';
  const padding = getPadding(settings.padding);
  const alignment = settings.alignment || 'left';

  // Process HTML content to add inline styles
  let html = content.html || '';
  html = html
    .replace(/<p>/g, `<p style="margin: 8px 0; line-height: 1.6; color: ${textColor};">`)
    .replace(/<ul>/g, '<ul style="margin: 8px 0; padding-left: 24px;">')
    .replace(/<ol>/g, '<ol style="margin: 8px 0; padding-left: 24px;">')
    .replace(/<li>/g, '<li style="margin: 4px 0;">')
    .replace(/<a /g, `<a style="color: #c75a3a; text-decoration: underline;" `);

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: ${padding}; text-align: ${alignment}; color: ${textColor};">
        ${html}
      </td>
    </tr>
  `;
}

function renderImageBlock(content: any, settings: any): string {
  const bgColor = settings.backgroundColor || 'transparent';
  const padding = getPadding(settings.padding);
  const alignment = settings.alignment || 'center';
  const width = getImageWidth(settings.imageWidth);
  const borderRadius = getBorderRadius(settings.imageBorderRadius);

  if (!content.imageUrl) {
    return '';
  }

  const img = `<img src="${content.imageUrl}" alt="${content.alt || ''}" width="${width === '100%' ? '600' : width}" style="display: block; max-width: 100%; height: auto; border-radius: ${borderRadius};" />`;
  const imageHtml = content.linkUrl
    ? `<a href="${content.linkUrl}" target="_blank">${img}</a>`
    : img;

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: ${padding}; text-align: ${alignment};">
        ${imageHtml}
        ${content.caption ? `<p style="margin: 8px 0 0; font-size: 14px; color: #666666; font-style: italic;">${content.caption}</p>` : ''}
      </td>
    </tr>
  `;
}

function renderButtonBlock(content: any, settings: any, templateSettings: TemplateSettings): string {
  const bgColor = settings.backgroundColor || 'transparent';
  const padding = getPadding(settings.padding);
  const alignment = settings.alignment || 'center';
  const buttonColor = settings.buttonColor || templateSettings.primaryColor;
  const buttonTextColor = settings.buttonTextColor || '#ffffff';
  const borderRadius = getBorderRadius(settings.buttonBorderRadius);

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: ${padding}; text-align: ${alignment};">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: ${alignment === 'center' ? '0 auto' : alignment === 'right' ? '0 0 0 auto' : '0'};">
          <tr>
            <td style="background-color: ${buttonColor}; border-radius: ${borderRadius};">
              <a href="${content.url || '#'}" target="_blank" style="display: inline-block; padding: 14px 28px; color: ${buttonTextColor}; text-decoration: none; font-weight: 600; font-size: 16px;">
                ${content.text || 'Bouton'}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderFooterBlock(content: any, settings: any): string {
  const bgColor = settings.backgroundColor || '#f5f5f5';
  const textColor = settings.textColor || '#666666';
  const padding = getPadding(settings.padding);
  const alignment = settings.alignment || 'center';

  const socialLinksHtml = (content.socialLinks || [])
    .map((social: any) => {
      const iconUrl = getSocialIconUrl(social.type);
      return `<a href="${social.url}" target="_blank" style="display: inline-block; margin: 0 8px;"><img src="${iconUrl}" alt="${social.type}" width="24" height="24" style="opacity: 0.7;" /></a>`;
    })
    .join('');

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: ${padding}; text-align: ${alignment}; color: ${textColor};">
        <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600;">${content.companyName || ''}</p>
        <p style="margin: 0 0 16px; font-size: 14px;">${content.address || ''}</p>
        ${socialLinksHtml ? `<div style="margin-bottom: 16px;">${socialLinksHtml}</div>` : ''}
        <p style="margin: 0; font-size: 12px; opacity: 0.7;">
          <a href="{{unsubscribe_url}}" style="color: ${textColor}; text-decoration: underline;">${content.unsubscribeText || 'Se désinscrire'}</a>
        </p>
      </td>
    </tr>
  `;
}

function renderDividerBlock(settings: any): string {
  const bgColor = settings.backgroundColor || 'transparent';
  const padding = getPadding(settings.padding);
  const alignment = settings.alignment || 'center';
  const width = alignment === 'center' ? '66%' : '33%';
  const margin = alignment === 'center' ? '0 auto' : alignment === 'right' ? '0 0 0 auto' : '0 auto 0 0';

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: ${padding};">
        <hr style="border: none; border-top: 1px solid #d1d5db; width: ${width}; margin: ${margin};" />
      </td>
    </tr>
  `;
}

// Helper functions
function getFontFamily(fontFamily: string): string {
  switch (fontFamily) {
    case 'serif':
      return 'Georgia, Times, "Times New Roman", serif';
    case 'monospace':
      return '"Courier New", Courier, monospace';
    default:
      return 'Arial, Helvetica, sans-serif';
  }
}

function getFontSize(fontSize: string): string {
  switch (fontSize) {
    case 'small':
      return '14px';
    case 'large':
      return '18px';
    default:
      return '16px';
  }
}

function getPadding(padding: string): string {
  switch (padding) {
    case 'none':
      return '0';
    case 'small':
      return '12px';
    case 'large':
      return '32px';
    default:
      return '20px';
  }
}

function getImageWidth(width: string): string {
  switch (width) {
    case '50%':
      return '300';
    case '75%':
      return '450';
    case 'auto':
      return 'auto';
    default:
      return '100%';
  }
}

function getBorderRadius(borderRadius: string): string {
  switch (borderRadius) {
    case 'small':
      return '8px';
    case 'medium':
      return '12px';
    case 'large':
      return '16px';
    case 'full':
      return '50px';
    default:
      return '0';
  }
}

function getSocialIconUrl(type: string): string {
  // Using CDN icons for email compatibility
  const icons: Record<string, string> = {
    facebook: 'https://cdn-icons-png.flaticon.com/32/733/733547.png',
    instagram: 'https://cdn-icons-png.flaticon.com/32/2111/2111463.png',
    linkedin: 'https://cdn-icons-png.flaticon.com/32/3536/3536505.png',
    twitter: 'https://cdn-icons-png.flaticon.com/32/733/733579.png',
  };
  return icons[type] || '';
}

/**
 * Génère un aperçu HTML simplifié pour l'affichage dans le navigateur
 */
export function renderBlocksToPreview(
  blocks: NewsletterBlock[],
  settings: TemplateSettings
): string {
  return renderBlocksToHtml(blocks, settings, {
    previewText: 'Aperçu de la newsletter',
  });
}
