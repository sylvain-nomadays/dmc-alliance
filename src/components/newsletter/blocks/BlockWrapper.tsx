'use client';

/**
 * BlockWrapper - Conteneur pour tous les blocs avec actions
 * Gère la sélection, le drag handle et les actions (dupliquer, supprimer)
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NewsletterBlock } from '@/lib/newsletter/types';

interface BlockWrapperProps {
  block: NewsletterBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export function BlockWrapper({
  block,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
  children,
}: BlockWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'opacity-50 z-50',
        isSelected && 'ring-2 ring-terracotta-500 ring-offset-2'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Drag handle - visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2',
          'opacity-0 group-hover:opacity-100 transition-opacity cursor-grab',
          isDragging && 'cursor-grabbing'
        )}
      >
        <div className="p-1 bg-gray-100 rounded hover:bg-gray-200">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Actions - visible when selected */}
      <div
        className={cn(
          'absolute right-0 top-0 -translate-y-1/2 translate-x-1/2 flex gap-1',
          'opacity-0 transition-opacity',
          (isSelected || isDragging) && 'opacity-100'
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
          title="Dupliquer"
        >
          <Copy className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-red-50 hover:border-red-300 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
        </button>
      </div>

      {/* Block content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
