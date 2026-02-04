'use client';

/**
 * BlockCanvas - Zone centrale où les blocs sont déposés et organisés
 */

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { NewsletterBlock, BlockType } from '@/lib/newsletter/types';
import {
  BlockWrapper,
  HeaderBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  FooterBlock,
  DividerBlock,
} from './blocks';
import { cn } from '@/lib/utils';

interface BlockCanvasProps {
  blocks: NewsletterBlock[];
  selectedBlockId: string | null;
  isEditing: boolean;
  onSelectBlock: (id: string | null) => void;
  onBlockChange: (block: NewsletterBlock) => void;
  onBlockDuplicate: (id: string) => void;
  onBlockDelete: (id: string) => void;
}

const blockComponents: Record<BlockType, React.ComponentType<any>> = {
  header: HeaderBlock,
  text: TextBlock,
  image: ImageBlock,
  button: ButtonBlock,
  footer: FooterBlock,
  divider: DividerBlock,
  columns: () => null, // TODO: implement columns
};

export function BlockCanvas({
  blocks,
  selectedBlockId,
  isEditing,
  onSelectBlock,
  onBlockChange,
  onBlockDuplicate,
  onBlockDelete,
}: BlockCanvasProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas',
  });

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas background
    if (e.target === e.currentTarget) {
      onSelectBlock(null);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[600px] bg-white rounded-lg shadow-inner border-2 border-dashed transition-colors p-4',
        isOver ? 'border-terracotta-400 bg-terracotta-50' : 'border-gray-200',
        blocks.length === 0 && 'flex items-center justify-center'
      )}
      onClick={handleBackgroundClick}
    >
      {blocks.length === 0 ? (
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium mb-2">Glissez des blocs ici</p>
          <p className="text-sm">
            Commencez par ajouter un bloc depuis la palette à gauche
          </p>
        </div>
      ) : (
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {blocks.map((block) => {
              const BlockComponent = blockComponents[block.type];
              const isSelected = selectedBlockId === block.id;

              return (
                <BlockWrapper
                  key={block.id}
                  block={block}
                  isSelected={isSelected}
                  onSelect={() => onSelectBlock(block.id)}
                  onDuplicate={() => onBlockDuplicate(block.id)}
                  onDelete={() => onBlockDelete(block.id)}
                >
                  <BlockComponent
                    block={block}
                    isSelected={isSelected}
                    isEditing={isEditing}
                    onChange={onBlockChange}
                    onSelect={() => onSelectBlock(block.id)}
                  />
                </BlockWrapper>
              );
            })}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
