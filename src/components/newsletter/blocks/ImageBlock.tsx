'use client';

/**
 * ImageBlock - Bloc image avec upload et légende
 */

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ImageIcon, Link as LinkIcon, Upload, X } from 'lucide-react';
import { BlockComponentProps } from '@/lib/newsletter/types';
import { cn } from '@/lib/utils';

export function ImageBlock({ block, isSelected, isEditing, onChange }: BlockComponentProps) {
  const { content, settings } = block;
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUrlChange = () => {
    const url = window.prompt('URL de l\'image:', content.imageUrl || '');
    if (url !== null) {
      onChange({
        ...block,
        content: { ...content, imageUrl: url },
      });
    }
  };

  const handleLinkChange = () => {
    const url = window.prompt('URL du lien (laisser vide pour supprimer):', content.linkUrl || '');
    if (url !== null) {
      onChange({
        ...block,
        content: { ...content, linkUrl: url || undefined },
      });
    }
  };

  const handleAltChange = () => {
    const alt = window.prompt('Texte alternatif:', content.alt || '');
    if (alt !== null) {
      onChange({
        ...block,
        content: { ...content, alt },
      });
    }
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...block,
      content: { ...content, caption: e.target.value },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Implement actual file upload to Supabase storage
    // For now, create a local URL preview
    const localUrl = URL.createObjectURL(file);
    onChange({
      ...block,
      content: { ...content, imageUrl: localUrl },
    });
  };

  const widthClasses = {
    auto: 'w-auto max-w-full',
    full: 'w-full',
    '50%': 'w-1/2',
    '75%': 'w-3/4',
  };

  const borderRadiusClasses = {
    none: 'rounded-none',
    small: 'rounded-lg',
    medium: 'rounded-xl',
    large: 'rounded-2xl',
  };

  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const paddingClasses = {
    none: 'p-0',
    small: 'p-2',
    medium: 'p-4',
    large: 'p-6',
  };

  return (
    <div
      className={cn(
        'transition-all',
        paddingClasses[settings.padding || 'medium']
      )}
      style={{
        backgroundColor: settings.backgroundColor || 'transparent',
      }}
    >
      {/* Toolbar - visible when editing and selected */}
      {isEditing && isSelected && (
        <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-gray-200">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-100"
            title="Télécharger une image"
          >
            <Upload className="w-3 h-3" />
            Upload
          </button>
          <button
            onClick={handleImageUrlChange}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-100"
            title="URL de l'image"
          >
            <ImageIcon className="w-3 h-3" />
            URL
          </button>
          <button
            onClick={handleLinkChange}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-100',
              content.linkUrl && 'bg-gray-200'
            )}
            title="Ajouter un lien"
          >
            <LinkIcon className="w-3 h-3" />
            Lien
          </button>
          <button
            onClick={handleAltChange}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-100"
            title="Texte alternatif"
          >
            Alt
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Image container */}
      <div className={cn('flex', alignmentClasses[settings.alignment || 'center'])}>
        <div className={cn(widthClasses[settings.imageWidth || 'full'])}>
          {content.imageUrl ? (
            <div className="relative">
              <Image
                src={content.imageUrl}
                alt={content.alt || ''}
                width={600}
                height={400}
                className={cn(
                  'w-full h-auto object-cover',
                  borderRadiusClasses[settings.imageBorderRadius || 'small']
                )}
                unoptimized={content.imageUrl.startsWith('blob:')}
              />
              {content.linkUrl && (
                <div className="absolute top-2 right-2 bg-white/80 rounded-full p-1">
                  <LinkIcon className="w-4 h-4 text-terracotta-600" />
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                'flex flex-col items-center justify-center bg-gray-100 aspect-video',
                borderRadiusClasses[settings.imageBorderRadius || 'small'],
                isEditing && 'cursor-pointer hover:bg-gray-200'
              )}
              onClick={isEditing ? () => fileInputRef.current?.click() : undefined}
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
              {isEditing && (
                <span className="text-sm text-gray-500">
                  Cliquez pour ajouter une image
                </span>
              )}
            </div>
          )}

          {/* Caption */}
          {(content.caption || isEditing) && (
            <div className="mt-2 text-center">
              {isEditing && isSelected ? (
                <input
                  type="text"
                  value={content.caption || ''}
                  onChange={handleCaptionChange}
                  placeholder="Ajouter une légende..."
                  className="w-full text-sm text-gray-600 text-center bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-terracotta-500"
                  onFocus={() => setIsEditingCaption(true)}
                  onBlur={() => setIsEditingCaption(false)}
                />
              ) : content.caption ? (
                <p className="text-sm text-gray-600 italic">{content.caption}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Version pour preview email
export function ImageBlockPreview({ block }: { block: BlockComponentProps['block'] }) {
  const { content, settings } = block;

  const getWidth = () => {
    switch (settings.imageWidth) {
      case '50%': return '50%';
      case '75%': return '75%';
      case 'auto': return 'auto';
      default: return '100%';
    }
  };

  const getBorderRadius = () => {
    switch (settings.imageBorderRadius) {
      case 'small': return '8px';
      case 'medium': return '12px';
      case 'large': return '16px';
      default: return '0';
    }
  };

  const imageElement = content.imageUrl ? (
    <img
      src={content.imageUrl}
      alt={content.alt || ''}
      style={{
        width: getWidth(),
        maxWidth: '100%',
        height: 'auto',
        borderRadius: getBorderRadius(),
      }}
    />
  ) : null;

  return (
    <div
      style={{
        backgroundColor: settings.backgroundColor || 'transparent',
        padding: settings.padding === 'large' ? '24px' : settings.padding === 'small' ? '8px' : '16px',
        textAlign: settings.alignment || 'center',
      }}
    >
      {content.linkUrl ? (
        <a href={content.linkUrl} target="_blank" rel="noopener noreferrer">
          {imageElement}
        </a>
      ) : (
        imageElement
      )}
      {content.caption && (
        <p
          style={{
            fontSize: '14px',
            color: '#666666',
            fontStyle: 'italic',
            marginTop: '8px',
          }}
        >
          {content.caption}
        </p>
      )}
    </div>
  );
}
