/**
 * Newsletter Block Types
 * Définit la structure des blocs pour l'éditeur drag & drop
 */

// Types de blocs disponibles
export type BlockType = 'header' | 'text' | 'image' | 'button' | 'footer' | 'divider' | 'columns';

// Alignement du contenu
export type ContentAlignment = 'left' | 'center' | 'right';

// Bloc de base
export interface NewsletterBlock {
  id: string;
  type: BlockType;
  content: BlockContent;
  settings: BlockSettings;
}

// Contenu selon le type de bloc
export interface BlockContent {
  // Header
  title?: string;
  subtitle?: string;
  logoUrl?: string;

  // Text
  html?: string;

  // Image
  imageUrl?: string;
  alt?: string;
  caption?: string;
  linkUrl?: string;

  // Button
  text?: string;
  url?: string;

  // Footer
  companyName?: string;
  address?: string;
  unsubscribeText?: string;
  socialLinks?: Array<{
    type: 'facebook' | 'instagram' | 'linkedin' | 'twitter';
    url: string;
  }>;

  // Columns
  columns?: NewsletterBlock[][];
}

// Paramètres de style du bloc
export interface BlockSettings {
  backgroundColor?: string;
  textColor?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  alignment?: ContentAlignment;

  // Spécifique aux boutons
  buttonColor?: string;
  buttonTextColor?: string;
  buttonBorderRadius?: 'none' | 'small' | 'medium' | 'full';

  // Spécifique aux images
  imageWidth?: 'auto' | 'full' | '50%' | '75%';
  imageBorderRadius?: 'none' | 'small' | 'medium' | 'large';
}

// Template de newsletter
export interface NewsletterTemplate {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  blocks: NewsletterBlock[];
  settings: TemplateSettings;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Paramètres globaux du template
export interface TemplateSettings {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: 'sans-serif' | 'serif' | 'monospace';
  fontSize: 'small' | 'medium' | 'large';
}

// Campagne newsletter avec blocs
export interface NewsletterCampaignWithBlocks {
  id: string;
  title: string;
  subject_fr: string;
  subject_en?: string;
  blocks_fr: NewsletterBlock[];
  blocks_en: NewsletterBlock[];
  template_id?: string;
  target_audience: 'all' | 'fr' | 'en' | 'agencies' | 'partners' | 'custom';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_at?: string;
  sent_at?: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
  };
  created_at: string;
  updated_at: string;
}

// Props pour les composants de blocs
export interface BlockComponentProps {
  block: NewsletterBlock;
  isSelected: boolean;
  isEditing: boolean;
  onChange: (block: NewsletterBlock) => void;
  onSelect: () => void;
}

// Bloc disponible dans la palette
export interface PaletteBlock {
  type: BlockType;
  label: string;
  icon: string;
  defaultContent: BlockContent;
  defaultSettings: BlockSettings;
}

// Valeurs par défaut pour les nouveaux blocs
export const DEFAULT_BLOCK_SETTINGS: BlockSettings = {
  backgroundColor: 'transparent',
  textColor: '#333333',
  padding: 'medium',
  alignment: 'left',
};

export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  primaryColor: '#c75a3a', // Terracotta DMC
  secondaryColor: '#1e3a5f', // Deep blue DMC
  backgroundColor: '#ffffff',
  fontFamily: 'sans-serif',
  fontSize: 'medium',
};

// Blocs disponibles dans la palette
export const PALETTE_BLOCKS: PaletteBlock[] = [
  {
    type: 'header',
    label: 'En-tête',
    icon: '📰',
    defaultContent: {
      title: 'Newsletter DMC Alliance',
      subtitle: 'Découvrez nos dernières actualités',
      logoUrl: '/images/logo-dmc-alliance.svg',
    },
    defaultSettings: {
      backgroundColor: '#1e3a5f',
      textColor: '#ffffff',
      padding: 'large',
      alignment: 'center',
    },
  },
  {
    type: 'text',
    label: 'Texte',
    icon: '📝',
    defaultContent: {
      html: '<p>Votre contenu ici...</p>',
    },
    defaultSettings: {
      ...DEFAULT_BLOCK_SETTINGS,
      padding: 'medium',
    },
  },
  {
    type: 'image',
    label: 'Image',
    icon: '🖼️',
    defaultContent: {
      imageUrl: '',
      alt: '',
      caption: '',
    },
    defaultSettings: {
      ...DEFAULT_BLOCK_SETTINGS,
      alignment: 'center',
      imageWidth: 'full',
      imageBorderRadius: 'small',
    },
  },
  {
    type: 'button',
    label: 'Bouton',
    icon: '🔘',
    defaultContent: {
      text: 'En savoir plus',
      url: 'https://dmc-alliance.org',
    },
    defaultSettings: {
      ...DEFAULT_BLOCK_SETTINGS,
      alignment: 'center',
      buttonColor: '#c75a3a',
      buttonTextColor: '#ffffff',
      buttonBorderRadius: 'small',
    },
  },
  {
    type: 'footer',
    label: 'Pied de page',
    icon: '📋',
    defaultContent: {
      companyName: 'DMC Alliance',
      address: 'Paris, France',
      unsubscribeText: 'Se désinscrire',
      socialLinks: [
        { type: 'linkedin', url: 'https://linkedin.com/company/dmc-alliance' },
        { type: 'instagram', url: 'https://instagram.com/dmcalliance' },
      ],
    },
    defaultSettings: {
      backgroundColor: '#f5f5f5',
      textColor: '#666666',
      padding: 'large',
      alignment: 'center',
    },
  },
  {
    type: 'divider',
    label: 'Séparateur',
    icon: '━',
    defaultContent: {},
    defaultSettings: {
      padding: 'medium',
      alignment: 'center',
    },
  },
];

// Helper pour créer un nouveau bloc
export function createBlock(type: BlockType): NewsletterBlock {
  const paletteBlock = PALETTE_BLOCKS.find(b => b.type === type);

  if (!paletteBlock) {
    throw new Error(`Unknown block type: ${type}`);
  }

  return {
    id: crypto.randomUUID(),
    type,
    content: { ...paletteBlock.defaultContent },
    settings: { ...paletteBlock.defaultSettings },
  };
}

// Helper pour dupliquer un bloc
export function duplicateBlock(block: NewsletterBlock): NewsletterBlock {
  return {
    ...block,
    id: crypto.randomUUID(),
    content: { ...block.content },
    settings: { ...block.settings },
  };
}
