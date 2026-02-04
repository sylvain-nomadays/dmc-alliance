/**
 * Newsletter Templates - Modèles prédéfinis pour les newsletters
 */

import { NewsletterTemplate, NewsletterBlock, TemplateSettings } from './types';

// Placeholder for dynamic logo - will be replaced at runtime with actual logo from admin settings
export const LOGO_PLACEHOLDER = '__SITE_LOGO__';

/**
 * Template Minimal - Design épuré et moderne
 */
export const TEMPLATE_MINIMAL: NewsletterTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Un design épuré et moderne, parfait pour les communications professionnelles',
  blocks: [
    {
      id: 'header-1',
      type: 'header',
      content: {
        title: 'Newsletter',
        subtitle: '',
        logoUrl: LOGO_PLACEHOLDER,
      },
      settings: {
        backgroundColor: '#ffffff',
        textColor: '#1e3a5f',
        padding: 'large',
        alignment: 'center',
      },
    },
    {
      id: 'divider-1',
      type: 'divider',
      content: {},
      settings: {
        padding: 'small',
        alignment: 'center',
      },
    },
    {
      id: 'text-1',
      type: 'text',
      content: {
        html: '<p>Bonjour,</p><p>Votre contenu ici...</p>',
      },
      settings: {
        backgroundColor: 'transparent',
        textColor: '#333333',
        padding: 'medium',
        alignment: 'left',
      },
    },
    {
      id: 'button-1',
      type: 'button',
      content: {
        text: 'En savoir plus',
        url: 'https://dmc-alliance.org',
      },
      settings: {
        padding: 'medium',
        alignment: 'center',
        buttonColor: '#1e3a5f',
        buttonTextColor: '#ffffff',
        buttonBorderRadius: 'small',
      },
    },
    {
      id: 'footer-1',
      type: 'footer',
      content: {
        companyName: 'DMC Alliance',
        address: 'Paris, France',
        unsubscribeText: 'Se désinscrire',
        socialLinks: [
          { type: 'linkedin', url: 'https://linkedin.com/company/dmc-alliance' },
        ],
      },
      settings: {
        backgroundColor: '#f8f9fa',
        textColor: '#6c757d',
        padding: 'large',
        alignment: 'center',
      },
    },
  ],
  settings: {
    primaryColor: '#1e3a5f',
    secondaryColor: '#6c757d',
    backgroundColor: '#ffffff',
    fontFamily: 'sans-serif',
    fontSize: 'medium',
  },
  isDefault: false,
};

/**
 * Template DMC Classic - Design aux couleurs DMC Alliance
 */
export const TEMPLATE_DMC_CLASSIC: NewsletterTemplate = {
  id: 'dmc-classic',
  name: 'DMC Classic',
  description: 'Le design signature DMC Alliance avec les couleurs terracotta et deep blue',
  blocks: [
    {
      id: 'header-1',
      type: 'header',
      content: {
        title: 'Newsletter DMC Alliance',
        subtitle: 'Découvrez nos dernières actualités',
        logoUrl: LOGO_PLACEHOLDER,
      },
      settings: {
        backgroundColor: '#1e3a5f',
        textColor: '#ffffff',
        padding: 'large',
        alignment: 'center',
      },
    },
    {
      id: 'text-1',
      type: 'text',
      content: {
        html: '<h2>Titre de la section</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>',
      },
      settings: {
        backgroundColor: '#ffffff',
        textColor: '#333333',
        padding: 'large',
        alignment: 'left',
      },
    },
    {
      id: 'image-1',
      type: 'image',
      content: {
        imageUrl: '',
        alt: 'Image de destination',
        caption: '',
      },
      settings: {
        padding: 'medium',
        alignment: 'center',
        imageWidth: 'full',
        imageBorderRadius: 'medium',
      },
    },
    {
      id: 'text-2',
      type: 'text',
      content: {
        html: '<p>Continuez votre contenu ici...</p>',
      },
      settings: {
        backgroundColor: '#ffffff',
        textColor: '#333333',
        padding: 'medium',
        alignment: 'left',
      },
    },
    {
      id: 'button-1',
      type: 'button',
      content: {
        text: 'Découvrir nos circuits',
        url: 'https://dmc-alliance.org/gir',
      },
      settings: {
        padding: 'large',
        alignment: 'center',
        buttonColor: '#c75a3a',
        buttonTextColor: '#ffffff',
        buttonBorderRadius: 'small',
      },
    },
    {
      id: 'divider-1',
      type: 'divider',
      content: {},
      settings: {
        padding: 'medium',
        alignment: 'center',
      },
    },
    {
      id: 'footer-1',
      type: 'footer',
      content: {
        companyName: 'DMC Alliance',
        address: 'Paris, France',
        unsubscribeText: 'Se désinscrire de la newsletter',
        socialLinks: [
          { type: 'linkedin', url: 'https://linkedin.com/company/dmc-alliance' },
          { type: 'instagram', url: 'https://instagram.com/dmcalliance' },
        ],
      },
      settings: {
        backgroundColor: '#1e3a5f',
        textColor: '#ffffff',
        padding: 'large',
        alignment: 'center',
      },
    },
  ],
  settings: {
    primaryColor: '#c75a3a',
    secondaryColor: '#1e3a5f',
    backgroundColor: '#f5f5f5',
    fontFamily: 'sans-serif',
    fontSize: 'medium',
  },
  isDefault: true,
};

/**
 * Template Magazine - Design éditorial avec grandes images
 */
export const TEMPLATE_MAGAZINE: NewsletterTemplate = {
  id: 'magazine',
  name: 'Magazine',
  description: 'Un design éditorial inspiré des magazines de voyage',
  blocks: [
    {
      id: 'image-hero',
      type: 'image',
      content: {
        imageUrl: '',
        alt: 'Image principale',
        caption: '',
        linkUrl: '',
      },
      settings: {
        padding: 'none',
        alignment: 'center',
        imageWidth: 'full',
        imageBorderRadius: 'none',
      },
    },
    {
      id: 'header-1',
      type: 'header',
      content: {
        title: 'Titre Accrocheur',
        subtitle: 'Sous-titre descriptif',
        logoUrl: '',
      },
      settings: {
        backgroundColor: '#ffffff',
        textColor: '#1a1a1a',
        padding: 'large',
        alignment: 'center',
      },
    },
    {
      id: 'text-intro',
      type: 'text',
      content: {
        html: '<p style="font-size: 1.2em; font-style: italic;">Introduction captivante qui donne envie de lire la suite...</p>',
      },
      settings: {
        backgroundColor: '#ffffff',
        textColor: '#555555',
        padding: 'medium',
        alignment: 'center',
      },
    },
    {
      id: 'divider-1',
      type: 'divider',
      content: {},
      settings: {
        padding: 'small',
        alignment: 'center',
      },
    },
    {
      id: 'text-main',
      type: 'text',
      content: {
        html: '<p>Contenu principal de votre article...</p>',
      },
      settings: {
        backgroundColor: '#ffffff',
        textColor: '#333333',
        padding: 'large',
        alignment: 'left',
      },
    },
    {
      id: 'button-1',
      type: 'button',
      content: {
        text: 'Lire l\'article complet',
        url: '#',
      },
      settings: {
        padding: 'large',
        alignment: 'center',
        buttonColor: '#c75a3a',
        buttonTextColor: '#ffffff',
        buttonBorderRadius: 'full',
      },
    },
    {
      id: 'footer-1',
      type: 'footer',
      content: {
        companyName: 'DMC Alliance',
        address: 'Le réseau des DMC de confiance',
        unsubscribeText: 'Gérer mes préférences',
        socialLinks: [
          { type: 'instagram', url: 'https://instagram.com/dmcalliance' },
          { type: 'linkedin', url: 'https://linkedin.com/company/dmc-alliance' },
        ],
      },
      settings: {
        backgroundColor: '#f5f5f5',
        textColor: '#888888',
        padding: 'large',
        alignment: 'center',
      },
    },
  ],
  settings: {
    primaryColor: '#c75a3a',
    secondaryColor: '#1a1a1a',
    backgroundColor: '#ffffff',
    fontFamily: 'serif',
    fontSize: 'large',
  },
  isDefault: false,
};

/**
 * Liste de tous les templates disponibles
 */
export const NEWSLETTER_TEMPLATES: NewsletterTemplate[] = [
  TEMPLATE_DMC_CLASSIC,
  TEMPLATE_MINIMAL,
  TEMPLATE_MAGAZINE,
];

/**
 * Récupère un template par son ID
 */
export function getTemplateById(id: string): NewsletterTemplate | undefined {
  return NEWSLETTER_TEMPLATES.find((t) => t.id === id);
}

/**
 * Récupère le template par défaut
 */
export function getDefaultTemplate(): NewsletterTemplate {
  return NEWSLETTER_TEMPLATES.find((t) => t.isDefault) || TEMPLATE_DMC_CLASSIC;
}

/**
 * Clone un template pour créer une nouvelle newsletter
 */
export function cloneTemplateBlocks(template: NewsletterTemplate): NewsletterBlock[] {
  return template.blocks.map((block) => ({
    ...block,
    id: crypto.randomUUID(),
    content: { ...block.content },
    settings: { ...block.settings },
  }));
}

/**
 * Clone un template et remplace le placeholder logo par l'URL réelle
 */
export function cloneTemplateBlocksWithLogo(template: NewsletterTemplate, logoUrl: string): NewsletterBlock[] {
  return template.blocks.map((block) => {
    const clonedBlock = {
      ...block,
      id: crypto.randomUUID(),
      content: { ...block.content },
      settings: { ...block.settings },
    };

    // Replace logo placeholder in header blocks
    if (block.type === 'header' && block.content.logoUrl === LOGO_PLACEHOLDER) {
      clonedBlock.content = {
        ...clonedBlock.content,
        logoUrl: logoUrl,
      };
    }

    return clonedBlock;
  });
}

/**
 * Applique le logo aux blocs existants (remplace le placeholder)
 */
export function applyLogoToBlocks(blocks: NewsletterBlock[], logoUrl: string): NewsletterBlock[] {
  return blocks.map((block) => {
    if (block.type === 'header' && block.content.logoUrl === LOGO_PLACEHOLDER) {
      return {
        ...block,
        content: {
          ...block.content,
          logoUrl: logoUrl,
        },
      };
    }
    return block;
  });
}
