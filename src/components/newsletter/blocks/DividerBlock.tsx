'use client';

/**
 * DividerBlock - Séparateur horizontal simple
 */

import { BlockComponentProps } from '@/lib/newsletter/types';
import { cn } from '@/lib/utils';

export function DividerBlock({ block, isSelected, isEditing }: BlockComponentProps) {
  const { settings } = block;

  const paddingClasses = {
    none: 'py-0',
    small: 'py-2',
    medium: 'py-4',
    large: 'py-6',
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
      <hr
        className={cn(
          'border-t border-gray-300',
          settings.alignment === 'left' && 'w-1/3 mr-auto',
          settings.alignment === 'right' && 'w-1/3 ml-auto',
          settings.alignment === 'center' && 'w-2/3 mx-auto',
          !settings.alignment && 'w-2/3 mx-auto'
        )}
      />
    </div>
  );
}

// Version pour preview email
export function DividerBlockPreview({ block }: { block: BlockComponentProps['block'] }) {
  const { settings } = block;

  const getWidth = () => {
    switch (settings.alignment) {
      case 'left':
      case 'right':
        return '33%';
      default:
        return '66%';
    }
  };

  const getMargin = () => {
    switch (settings.alignment) {
      case 'left':
        return '0 auto 0 0';
      case 'right':
        return '0 0 0 auto';
      default:
        return '0 auto';
    }
  };

  return (
    <div
      style={{
        backgroundColor: settings.backgroundColor || 'transparent',
        padding: settings.padding === 'large' ? '24px 0' : settings.padding === 'small' ? '8px 0' : '16px 0',
      }}
    >
      <hr
        style={{
          border: 'none',
          borderTop: '1px solid #d1d5db',
          width: getWidth(),
          margin: getMargin(),
        }}
      />
    </div>
  );
}
