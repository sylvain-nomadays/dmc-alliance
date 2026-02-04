'use client';

/**
 * NewsletterEditor - Éditeur principal drag & drop pour les newsletters
 */

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  NewsletterBlock,
  TemplateSettings,
  DEFAULT_TEMPLATE_SETTINGS,
  createBlock,
  duplicateBlock,
  BlockType,
} from '@/lib/newsletter/types';
import { BlockPalette } from './BlockPalette';
import { BlockCanvas } from './BlockCanvas';
import { BlockSettings } from './BlockSettings';
import { cn } from '@/lib/utils';
import {
  Eye,
  Save,
  ArrowLeft,
  Languages,
  Loader2,
} from 'lucide-react';

interface NewsletterEditorProps {
  initialBlocks?: NewsletterBlock[];
  initialSettings?: TemplateSettings;
  language?: 'fr' | 'en';
  onLanguageChange?: (lang: 'fr' | 'en') => void;
  onSave?: (blocks: NewsletterBlock[], settings: TemplateSettings) => Promise<void>;
  onPreview?: () => void;
  onBack?: () => void;
  title?: string;
}

export function NewsletterEditor({
  initialBlocks = [],
  initialSettings = DEFAULT_TEMPLATE_SETTINGS,
  language = 'fr',
  onLanguageChange,
  onSave,
  onPreview,
  onBack,
  title = 'Nouvelle newsletter',
}: NewsletterEditorProps) {
  const [blocks, setBlocks] = useState<NewsletterBlock[]>(initialBlocks);
  const [templateSettings, setTemplateSettings] = useState<TemplateSettings>(initialSettings);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // If dragging from palette
    if (active.data.current?.type === 'palette-item') {
      const blockType = active.data.current.blockType as BlockType;
      const newBlock = createBlock(blockType);

      // Find insert position
      if (over.id === 'canvas') {
        // Add at the end
        setBlocks((prev) => [...prev, newBlock]);
      } else {
        // Insert before the over block
        const overIndex = blocks.findIndex((b) => b.id === over.id);
        if (overIndex >= 0) {
          setBlocks((prev) => {
            const newBlocks = [...prev];
            newBlocks.splice(overIndex, 0, newBlock);
            return newBlocks;
          });
        } else {
          setBlocks((prev) => [...prev, newBlock]);
        }
      }

      // Select the new block
      setSelectedBlockId(newBlock.id);
      return;
    }

    // If reordering existing blocks
    if (active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleBlockChange = useCallback((updatedBlock: NewsletterBlock) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b))
    );
  }, []);

  const handleBlockDuplicate = useCallback((id: string) => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      if (index === -1) return prev;
      const newBlock = duplicateBlock(prev[index]);
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
  }, []);

  const handleBlockDelete = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(blocks, templateSettings);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Retour"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Language selector */}
            {onLanguageChange && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onLanguageChange('fr')}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    language === 'fr'
                      ? 'bg-white text-terracotta-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  🇫🇷 FR
                </button>
                <button
                  onClick={() => onLanguageChange('en')}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    language === 'en'
                      ? 'bg-white text-terracotta-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  🇬🇧 EN
                </button>
              </div>
            )}

            {/* Preview button */}
            {onPreview && (
              <button
                onClick={onPreview}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Aperçu
              </button>
            )}

            {/* Save button */}
            {onSave && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Sauvegarder
              </button>
            )}
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Block palette */}
          <aside className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <BlockPalette />
          </aside>

          {/* Center - Canvas */}
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <BlockCanvas
                blocks={blocks}
                selectedBlockId={selectedBlockId}
                isEditing={true}
                onSelectBlock={setSelectedBlockId}
                onBlockChange={handleBlockChange}
                onBlockDuplicate={handleBlockDuplicate}
                onBlockDelete={handleBlockDelete}
              />
            </div>
          </main>

          {/* Right sidebar - Settings */}
          <aside className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <BlockSettings
              block={selectedBlock}
              templateSettings={templateSettings}
              onBlockChange={handleBlockChange}
              onTemplateSettingsChange={setTemplateSettings}
            />
          </aside>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeId && activeId.startsWith('palette-') && (
          <div className="bg-white rounded-lg shadow-lg border-2 border-terracotta-500 p-3 opacity-80">
            <span className="text-sm font-medium text-gray-700">
              {activeId.replace('palette-', '')}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
