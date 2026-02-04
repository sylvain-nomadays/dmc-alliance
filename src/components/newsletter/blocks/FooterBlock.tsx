'use client';

/**
 * FooterBlock - Pied de page avec liens sociaux et désinscription
 */

import { useState } from 'react';
import { Facebook, Instagram, Linkedin, Twitter, Plus, X } from 'lucide-react';
import { BlockComponentProps } from '@/lib/newsletter/types';
import { cn } from '@/lib/utils';

type SocialType = 'facebook' | 'instagram' | 'linkedin' | 'twitter';

const socialIcons: Record<SocialType, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
};

const socialLabels: Record<SocialType, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
};

export function FooterBlock({ block, isSelected, isEditing, onChange }: BlockComponentProps) {
  const { content, settings } = block;
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleFieldChange = (field: string, value: string) => {
    onChange({
      ...block,
      content: { ...content, [field]: value },
    });
  };

  const handleSocialLinkChange = (type: SocialType, url: string) => {
    const socialLinks = [...(content.socialLinks || [])];
    const index = socialLinks.findIndex((s) => s.type === type);

    if (url) {
      if (index >= 0) {
        socialLinks[index] = { type, url };
      } else {
        socialLinks.push({ type, url });
      }
    } else if (index >= 0) {
      socialLinks.splice(index, 1);
    }

    onChange({
      ...block,
      content: { ...content, socialLinks },
    });
  };

  const handleAddSocialLink = () => {
    const availableTypes: SocialType[] = ['facebook', 'instagram', 'linkedin', 'twitter'];
    const existingTypes = (content.socialLinks || []).map((s) => s.type);
    const nextType = availableTypes.find((t) => !existingTypes.includes(t));

    if (nextType) {
      const url = window.prompt(`URL ${socialLabels[nextType]}:`, '');
      if (url) {
        handleSocialLinkChange(nextType, url);
      }
    }
  };

  const handleEditSocialLink = (type: SocialType, currentUrl: string) => {
    const url = window.prompt(`URL ${socialLabels[type]}:`, currentUrl);
    if (url !== null) {
      handleSocialLinkChange(type, url);
    }
  };

  const paddingClasses = {
    none: 'p-0',
    small: 'py-4 px-4',
    medium: 'py-6 px-6',
    large: 'py-8 px-8',
  };

  return (
    <div
      className={cn(
        'transition-all',
        paddingClasses[settings.padding || 'large']
      )}
      style={{
        backgroundColor: settings.backgroundColor || '#f5f5f5',
        color: settings.textColor || '#666666',
        textAlign: settings.alignment || 'center',
      }}
    >
      {/* Company name */}
      {isEditing && isSelected && editingField === 'companyName' ? (
        <input
          type="text"
          value={content.companyName || ''}
          onChange={(e) => handleFieldChange('companyName', e.target.value)}
          placeholder="Nom de l'entreprise"
          className="text-lg font-semibold bg-transparent border-b border-dashed border-current focus:outline-none text-center w-full mb-2"
          style={{ color: settings.textColor || '#666666' }}
          autoFocus
          onBlur={() => setEditingField(null)}
        />
      ) : (
        <h3
          className={cn(
            'text-lg font-semibold mb-2',
            isEditing && 'cursor-text hover:opacity-70'
          )}
          onClick={() => isEditing && setEditingField('companyName')}
        >
          {content.companyName || 'Nom de l\'entreprise'}
        </h3>
      )}

      {/* Address */}
      {isEditing && isSelected && editingField === 'address' ? (
        <input
          type="text"
          value={content.address || ''}
          onChange={(e) => handleFieldChange('address', e.target.value)}
          placeholder="Adresse"
          className="text-sm bg-transparent border-b border-dashed border-current focus:outline-none text-center w-full mb-4"
          style={{ color: settings.textColor || '#666666' }}
          autoFocus
          onBlur={() => setEditingField(null)}
        />
      ) : (
        <p
          className={cn(
            'text-sm mb-4',
            isEditing && 'cursor-text hover:opacity-70'
          )}
          onClick={() => isEditing && setEditingField('address')}
        >
          {content.address || 'Adresse'}
        </p>
      )}

      {/* Social links */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {(content.socialLinks || []).map((social) => {
          const Icon = socialIcons[social.type];
          return (
            <div key={social.type} className="relative group">
              <button
                onClick={() => isEditing && handleEditSocialLink(social.type, social.url)}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  isEditing ? 'hover:bg-black/10' : 'hover:opacity-70'
                )}
                style={{ color: settings.textColor || '#666666' }}
                title={socialLabels[social.type]}
              >
                <Icon className="w-5 h-5" />
              </button>
              {isEditing && isSelected && (
                <button
                  onClick={() => handleSocialLinkChange(social.type, '')}
                  className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Supprimer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        {isEditing && isSelected && (content.socialLinks || []).length < 4 && (
          <button
            onClick={handleAddSocialLink}
            className="p-2 rounded-full border-2 border-dashed border-current opacity-50 hover:opacity-100 transition-opacity"
            title="Ajouter un réseau social"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Unsubscribe link */}
      {isEditing && isSelected && editingField === 'unsubscribeText' ? (
        <input
          type="text"
          value={content.unsubscribeText || ''}
          onChange={(e) => handleFieldChange('unsubscribeText', e.target.value)}
          placeholder="Texte de désinscription"
          className="text-xs bg-transparent border-b border-dashed border-current focus:outline-none text-center w-full opacity-70"
          style={{ color: settings.textColor || '#666666' }}
          autoFocus
          onBlur={() => setEditingField(null)}
        />
      ) : (
        <p
          className={cn(
            'text-xs opacity-70 underline',
            isEditing && 'cursor-text hover:opacity-100'
          )}
          onClick={() => isEditing && setEditingField('unsubscribeText')}
        >
          {content.unsubscribeText || 'Se désinscrire'}
        </p>
      )}
    </div>
  );
}

// Version pour preview email
export function FooterBlockPreview({ block }: { block: BlockComponentProps['block'] }) {
  const { content, settings } = block;

  const getSocialIconUrl = (type: SocialType): string => {
    // Using simple social icons from a CDN for email compatibility
    const icons: Record<SocialType, string> = {
      facebook: 'https://cdn-icons-png.flaticon.com/32/733/733547.png',
      instagram: 'https://cdn-icons-png.flaticon.com/32/2111/2111463.png',
      linkedin: 'https://cdn-icons-png.flaticon.com/32/3536/3536505.png',
      twitter: 'https://cdn-icons-png.flaticon.com/32/733/733579.png',
    };
    return icons[type];
  };

  return (
    <div
      style={{
        backgroundColor: settings.backgroundColor || '#f5f5f5',
        color: settings.textColor || '#666666',
        padding: settings.padding === 'large' ? '32px' : settings.padding === 'small' ? '16px' : '24px',
        textAlign: (settings.alignment as 'left' | 'center' | 'right') || 'center',
      }}
    >
      {/* Company name */}
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '8px',
          color: settings.textColor || '#666666',
        }}
      >
        {content.companyName || 'Entreprise'}
      </h3>

      {/* Address */}
      <p
        style={{
          fontSize: '14px',
          marginBottom: '16px',
          color: settings.textColor || '#666666',
        }}
      >
        {content.address || 'Adresse'}
      </p>

      {/* Social links */}
      {content.socialLinks && content.socialLinks.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {content.socialLinks.map((social) => (
            <a
              key={social.type}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                margin: '0 8px',
              }}
            >
              <img
                src={getSocialIconUrl(social.type)}
                alt={socialLabels[social.type]}
                width="24"
                height="24"
                style={{
                  opacity: 0.7,
                }}
              />
            </a>
          ))}
        </div>
      )}

      {/* Unsubscribe link */}
      <p
        style={{
          fontSize: '12px',
          opacity: 0.7,
        }}
      >
        <a
          href="{{unsubscribe_url}}"
          style={{
            color: settings.textColor || '#666666',
            textDecoration: 'underline',
          }}
        >
          {content.unsubscribeText || 'Se désinscrire'}
        </a>
      </p>
    </div>
  );
}
