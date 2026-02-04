'use client';

/**
 * HeaderBlock - Bloc d'en-tête de newsletter
 * Contient le logo, titre et sous-titre
 */

import { useState } from 'react';
import Image from 'next/image';
import { BlockComponentProps } from '@/lib/newsletter/types';
import { cn } from '@/lib/utils';

export function HeaderBlock({ block, isSelected, isEditing, onChange }: BlockComponentProps) {
  const [editingField, setEditingField] = useState<'title' | 'subtitle' | null>(null);
  const { content, settings } = block;

  const paddingClasses = {
    none: 'p-0',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  const handleContentChange = (field: string, value: string) => {
    onChange({
      ...block,
      content: { ...content, [field]: value },
    });
  };

  return (
    <div
      className={cn(
        'rounded-lg transition-all',
        paddingClasses[settings.padding || 'medium']
      )}
      style={{
        backgroundColor: settings.backgroundColor || '#1e3a5f',
        color: settings.textColor || '#ffffff',
        textAlign: settings.alignment || 'center',
      }}
    >
      {/* Logo */}
      {content.logoUrl && (
        <div className="mb-4 flex justify-center">
          <Image
            src={content.logoUrl}
            alt="Logo"
            width={180}
            height={60}
            className="h-12 w-auto object-contain"
          />
        </div>
      )}

      {/* Title */}
      {editingField === 'title' && isEditing ? (
        <input
          type="text"
          value={content.title || ''}
          onChange={(e) => handleContentChange('title', e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
          autoFocus
          className="w-full bg-transparent border-b-2 border-white/50 focus:border-white text-2xl md:text-3xl font-heading font-bold outline-none text-center"
          placeholder="Titre de la newsletter"
        />
      ) : (
        <h1
          onClick={() => isEditing && setEditingField('title')}
          className={cn(
            'text-2xl md:text-3xl font-heading font-bold',
            isEditing && 'cursor-text hover:bg-white/10 rounded px-2 py-1'
          )}
        >
          {content.title || 'Titre de la newsletter'}
        </h1>
      )}

      {/* Subtitle */}
      {editingField === 'subtitle' && isEditing ? (
        <input
          type="text"
          value={content.subtitle || ''}
          onChange={(e) => handleContentChange('subtitle', e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
          autoFocus
          className="w-full bg-transparent border-b border-white/30 focus:border-white/60 text-lg opacity-90 outline-none text-center mt-2"
          placeholder="Sous-titre (optionnel)"
        />
      ) : (
        content.subtitle && (
          <p
            onClick={() => isEditing && setEditingField('subtitle')}
            className={cn(
              'text-lg opacity-90 mt-2',
              isEditing && 'cursor-text hover:bg-white/10 rounded px-2 py-1'
            )}
          >
            {content.subtitle}
          </p>
        )
      )}

      {!content.subtitle && isEditing && (
        <p
          onClick={() => setEditingField('subtitle')}
          className="text-lg opacity-50 mt-2 cursor-text hover:bg-white/10 rounded px-2 py-1"
        >
          + Ajouter un sous-titre
        </p>
      )}
    </div>
  );
}

// Version pour preview email (sans interactions)
export function HeaderBlockPreview({ block }: { block: BlockComponentProps['block'] }) {
  const { content, settings } = block;

  return (
    <div
      style={{
        backgroundColor: settings.backgroundColor || '#1e3a5f',
        color: settings.textColor || '#ffffff',
        textAlign: settings.alignment || 'center',
        padding: settings.padding === 'large' ? '32px' : settings.padding === 'small' ? '16px' : '24px',
      }}
    >
      {content.logoUrl && (
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.logoUrl}
            alt="Logo"
            style={{ height: '48px', width: 'auto', display: 'inline-block' }}
          />
        </div>
      )}
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
        {content.title || 'Newsletter'}
      </h1>
      {content.subtitle && (
        <p style={{ fontSize: '18px', opacity: 0.9, marginTop: '8px', margin: '8px 0 0' }}>
          {content.subtitle}
        </p>
      )}
    </div>
  );
}
