'use client';

/**
 * ButtonBlock - Bloc CTA (Call-to-Action)
 */

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { BlockComponentProps } from '@/lib/newsletter/types';
import { cn } from '@/lib/utils';

export function ButtonBlock({ block, isSelected, isEditing, onChange }: BlockComponentProps) {
  const { content, settings } = block;
  const [isEditingText, setIsEditingText] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...block,
      content: { ...content, text: e.target.value },
    });
  };

  const handleUrlChange = () => {
    const url = window.prompt('URL du bouton:', content.url || '');
    if (url !== null) {
      onChange({
        ...block,
        content: { ...content, url },
      });
    }
  };

  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const paddingClasses = {
    none: 'p-0',
    small: 'py-2 px-4',
    medium: 'py-4 px-6',
    large: 'py-6 px-8',
  };

  const borderRadiusClasses = {
    none: 'rounded-none',
    small: 'rounded-md',
    medium: 'rounded-lg',
    full: 'rounded-full',
  };

  const buttonStyle = {
    backgroundColor: settings.buttonColor || '#c75a3a',
    color: settings.buttonTextColor || '#ffffff',
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
            onClick={handleUrlChange}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-100',
              content.url && 'bg-gray-200'
            )}
            title="Modifier l'URL"
          >
            <ExternalLink className="w-3 h-3" />
            {content.url ? 'Modifier URL' : 'Ajouter URL'}
          </button>
          {content.url && (
            <span className="text-xs text-gray-500 flex items-center px-2">
              → {content.url.length > 30 ? content.url.substring(0, 30) + '...' : content.url}
            </span>
          )}
        </div>
      )}

      {/* Button container */}
      <div className={cn('flex', alignmentClasses[settings.alignment || 'center'])}>
        {isEditing && isSelected ? (
          <div className="relative">
            <input
              type="text"
              value={content.text || ''}
              onChange={handleTextChange}
              placeholder="Texte du bouton..."
              className={cn(
                'font-semibold text-center min-w-[120px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terracotta-500',
                borderRadiusClasses[settings.buttonBorderRadius || 'small']
              )}
              style={{
                ...buttonStyle,
                padding: '12px 24px',
              }}
              onFocus={() => setIsEditingText(true)}
              onBlur={() => setIsEditingText(false)}
            />
          </div>
        ) : (
          <button
            className={cn(
              'font-semibold transition-opacity hover:opacity-90',
              borderRadiusClasses[settings.buttonBorderRadius || 'small'],
              isEditing && 'cursor-pointer'
            )}
            style={{
              ...buttonStyle,
              padding: '12px 24px',
            }}
            onClick={isEditing ? () => {} : undefined}
          >
            {content.text || 'Bouton'}
          </button>
        )}
      </div>

      {/* URL indicator when not editing */}
      {!isEditing && content.url && (
        <div className="flex justify-center mt-2">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            {content.url}
          </span>
        </div>
      )}
    </div>
  );
}

// Version pour preview email
export function ButtonBlockPreview({ block }: { block: BlockComponentProps['block'] }) {
  const { content, settings } = block;

  const getBorderRadius = () => {
    switch (settings.buttonBorderRadius) {
      case 'small': return '6px';
      case 'medium': return '8px';
      case 'full': return '50px';
      default: return '0';
    }
  };

  const getAlignment = () => {
    switch (settings.alignment) {
      case 'left': return 'left';
      case 'right': return 'right';
      default: return 'center';
    }
  };

  return (
    <div
      style={{
        backgroundColor: settings.backgroundColor || 'transparent',
        padding: settings.padding === 'large' ? '24px' : settings.padding === 'small' ? '8px' : '16px',
        textAlign: getAlignment(),
      }}
    >
      {/* Table-based button for better email client compatibility */}
      <table
        role="presentation"
        cellPadding="0"
        cellSpacing="0"
        style={{
          margin: getAlignment() === 'center' ? '0 auto' : getAlignment() === 'right' ? '0 0 0 auto' : '0',
        }}
      >
        <tbody>
          <tr>
            <td>
              <a
                href={content.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: settings.buttonColor || '#c75a3a',
                  color: settings.buttonTextColor || '#ffffff',
                  textDecoration: 'none',
                  fontWeight: 600,
                  borderRadius: getBorderRadius(),
                }}
              >
                {content.text || 'Bouton'}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
