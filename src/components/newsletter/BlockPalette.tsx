'use client';

/**
 * BlockPalette - Sidebar avec les blocs disponibles à glisser
 */

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PALETTE_BLOCKS, PaletteBlock, BlockType } from '@/lib/newsletter/types';
import { cn } from '@/lib/utils';
import {
  FileText,
  Image as ImageIcon,
  MousePointerClick,
  Minus,
  LayoutTemplate,
  Newspaper,
  Mail
} from 'lucide-react';

const blockIcons: Record<BlockType, React.ComponentType<{ className?: string }>> = {
  header: Newspaper,
  text: FileText,
  image: ImageIcon,
  button: MousePointerClick,
  footer: Mail,
  divider: Minus,
  columns: LayoutTemplate,
};

interface PaletteItemProps {
  block: PaletteBlock;
}

function PaletteItem({ block }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${block.type}`,
    data: {
      type: 'palette-item',
      blockType: block.type,
    },
  });

  const Icon = blockIcons[block.type];

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white',
        'cursor-grab hover:border-terracotta-300 hover:shadow-sm transition-all',
        isDragging && 'opacity-50 shadow-lg border-terracotta-500'
      )}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-medium text-sm text-gray-900">{block.label}</p>
        <p className="text-xs text-gray-500">
          {block.type === 'header' && 'Logo + titre'}
          {block.type === 'text' && 'Texte riche'}
          {block.type === 'image' && 'Image + légende'}
          {block.type === 'button' && 'Bouton CTA'}
          {block.type === 'footer' && 'Pied de page'}
          {block.type === 'divider' && 'Ligne horizontale'}
          {block.type === 'columns' && '2-3 colonnes'}
        </p>
      </div>
    </div>
  );
}

interface BlockPaletteProps {
  className?: string;
}

export function BlockPalette({ className }: BlockPaletteProps) {
  // Filter to show only MVP blocks (no columns for now)
  const mvpBlocks = PALETTE_BLOCKS.filter(
    (block) => ['header', 'text', 'image', 'button', 'footer', 'divider'].includes(block.type)
  );

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
        Blocs
      </h3>
      <div className="space-y-2">
        {mvpBlocks.map((block) => (
          <PaletteItem key={block.type} block={block} />
        ))}
      </div>
    </div>
  );
}
