'use client';

/**
 * BlockSettings - Panel de configuration du bloc sélectionné
 */

import { NewsletterBlock, BlockSettings as BlockSettingsType, TemplateSettings } from '@/lib/newsletter/types';
import { cn } from '@/lib/utils';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface BlockSettingsProps {
  block: NewsletterBlock | null;
  templateSettings: TemplateSettings;
  onBlockChange: (block: NewsletterBlock) => void;
  onTemplateSettingsChange: (settings: TemplateSettings) => void;
  className?: string;
}

export function BlockSettings({
  block,
  templateSettings,
  onBlockChange,
  onTemplateSettingsChange,
  className,
}: BlockSettingsProps) {
  const updateBlockSettings = (updates: Partial<BlockSettingsType>) => {
    if (!block) return;
    onBlockChange({
      ...block,
      settings: { ...block.settings, ...updates },
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Block-specific settings */}
      {block ? (
        <>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Bloc: {block.type}
            </h3>

            {/* Background color */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                Couleur de fond
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={block.settings.backgroundColor || '#ffffff'}
                  onChange={(e) =>
                    updateBlockSettings({ backgroundColor: e.target.value })
                  }
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={block.settings.backgroundColor || 'transparent'}
                  onChange={(e) =>
                    updateBlockSettings({ backgroundColor: e.target.value })
                  }
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  placeholder="transparent"
                />
              </div>
            </div>

            {/* Text color (for blocks that have text) */}
            {['header', 'text', 'footer'].includes(block.type) && (
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">
                  Couleur du texte
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={block.settings.textColor || '#333333'}
                    onChange={(e) =>
                      updateBlockSettings({ textColor: e.target.value })
                    }
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={block.settings.textColor || '#333333'}
                    onChange={(e) =>
                      updateBlockSettings({ textColor: e.target.value })
                    }
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
            )}

            {/* Button colors */}
            {block.type === 'button' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1">
                    Couleur du bouton
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={block.settings.buttonColor || '#c75a3a'}
                      onChange={(e) =>
                        updateBlockSettings({ buttonColor: e.target.value })
                      }
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={block.settings.buttonColor || '#c75a3a'}
                      onChange={(e) =>
                        updateBlockSettings({ buttonColor: e.target.value })
                      }
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1">
                    Couleur texte bouton
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={block.settings.buttonTextColor || '#ffffff'}
                      onChange={(e) =>
                        updateBlockSettings({ buttonTextColor: e.target.value })
                      }
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={block.settings.buttonTextColor || '#ffffff'}
                      onChange={(e) =>
                        updateBlockSettings({ buttonTextColor: e.target.value })
                      }
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1">
                    Arrondi du bouton
                  </label>
                  <select
                    value={block.settings.buttonBorderRadius || 'small'}
                    onChange={(e) =>
                      updateBlockSettings({
                        buttonBorderRadius: e.target.value as any,
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="none">Aucun</option>
                    <option value="small">Petit</option>
                    <option value="medium">Moyen</option>
                    <option value="full">Arrondi complet</option>
                  </select>
                </div>
              </>
            )}

            {/* Image settings */}
            {block.type === 'image' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1">
                    Largeur de l'image
                  </label>
                  <select
                    value={block.settings.imageWidth || 'full'}
                    onChange={(e) =>
                      updateBlockSettings({ imageWidth: e.target.value as any })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="auto">Auto</option>
                    <option value="50%">50%</option>
                    <option value="75%">75%</option>
                    <option value="full">100%</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1">
                    Arrondi de l'image
                  </label>
                  <select
                    value={block.settings.imageBorderRadius || 'small'}
                    onChange={(e) =>
                      updateBlockSettings({
                        imageBorderRadius: e.target.value as any,
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="none">Aucun</option>
                    <option value="small">Petit</option>
                    <option value="medium">Moyen</option>
                    <option value="large">Grand</option>
                  </select>
                </div>
              </>
            )}

            {/* Padding */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                Espacement
              </label>
              <select
                value={block.settings.padding || 'medium'}
                onChange={(e) =>
                  updateBlockSettings({ padding: e.target.value as any })
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="none">Aucun</option>
                <option value="small">Petit</option>
                <option value="medium">Moyen</option>
                <option value="large">Grand</option>
              </select>
            </div>

            {/* Alignment */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                Alignement
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => updateBlockSettings({ alignment: 'left' })}
                  className={cn(
                    'flex-1 p-2 rounded border transition-colors',
                    block.settings.alignment === 'left'
                      ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  )}
                  title="Gauche"
                >
                  <AlignLeft className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => updateBlockSettings({ alignment: 'center' })}
                  className={cn(
                    'flex-1 p-2 rounded border transition-colors',
                    block.settings.alignment === 'center' ||
                      !block.settings.alignment
                      ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  )}
                  title="Centre"
                >
                  <AlignCenter className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => updateBlockSettings({ alignment: 'right' })}
                  className={cn(
                    'flex-1 p-2 rounded border transition-colors',
                    block.settings.alignment === 'right'
                      ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  )}
                  title="Droite"
                >
                  <AlignRight className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />
        </>
      ) : (
        <div className="text-center text-gray-400 py-8">
          <p className="text-sm">Sélectionnez un bloc pour le configurer</p>
        </div>
      )}

      {/* Global template settings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Paramètres globaux
        </h3>

        {/* Primary color */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">
            Couleur primaire
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={templateSettings.primaryColor}
              onChange={(e) =>
                onTemplateSettingsChange({
                  ...templateSettings,
                  primaryColor: e.target.value,
                })
              }
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={templateSettings.primaryColor}
              onChange={(e) =>
                onTemplateSettingsChange({
                  ...templateSettings,
                  primaryColor: e.target.value,
                })
              }
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Secondary color */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">
            Couleur secondaire
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={templateSettings.secondaryColor}
              onChange={(e) =>
                onTemplateSettingsChange({
                  ...templateSettings,
                  secondaryColor: e.target.value,
                })
              }
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={templateSettings.secondaryColor}
              onChange={(e) =>
                onTemplateSettingsChange({
                  ...templateSettings,
                  secondaryColor: e.target.value,
                })
              }
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Background color */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">
            Fond de l'email
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={templateSettings.backgroundColor}
              onChange={(e) =>
                onTemplateSettingsChange({
                  ...templateSettings,
                  backgroundColor: e.target.value,
                })
              }
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={templateSettings.backgroundColor}
              onChange={(e) =>
                onTemplateSettingsChange({
                  ...templateSettings,
                  backgroundColor: e.target.value,
                })
              }
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Font family */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">Police</label>
          <select
            value={templateSettings.fontFamily}
            onChange={(e) =>
              onTemplateSettingsChange({
                ...templateSettings,
                fontFamily: e.target.value as any,
              })
            }
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="sans-serif">Sans-serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>

        {/* Font size */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">
            Taille de texte
          </label>
          <select
            value={templateSettings.fontSize}
            onChange={(e) =>
              onTemplateSettingsChange({
                ...templateSettings,
                fontSize: e.target.value as any,
              })
            }
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="small">Petit</option>
            <option value="medium">Moyen</option>
            <option value="large">Grand</option>
          </select>
        </div>
      </div>
    </div>
  );
}
