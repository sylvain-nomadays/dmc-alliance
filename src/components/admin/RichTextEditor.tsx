'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useEffect, useCallback, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CalloutExtension, type CalloutType } from './tiptap-extensions/CalloutExtension';
import { ImageBlockExtension } from './tiptap-extensions/ImageBlockExtension';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: string;
  outputFormat?: 'html' | 'markdown';
  disabled?: boolean;
  enableAdvancedFeatures?: boolean;
}

// Toolbar Button Component
function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded hover:bg-gray-100 transition-colors',
        isActive && 'bg-terracotta-100 text-terracotta-600',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

// Callout Dropdown Component
function CalloutDropdown({
  editor,
  isOpen,
  onToggle,
}: {
  editor: Editor;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) onToggle();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const calloutTypes: { type: CalloutType; icon: string; label: string; color: string }[] = [
    { type: 'tip', icon: '💡', label: 'Conseil', color: 'text-green-600' },
    { type: 'warning', icon: '⚠️', label: 'Attention', color: 'text-amber-600' },
    { type: 'info', icon: 'ℹ️', label: 'Info', color: 'text-blue-600' },
    { type: 'essential', icon: '⭐', label: 'Les essentiels', color: 'text-terracotta-600' },
  ];

  const insertCallout = (type: CalloutType) => {
    editor.chain().focus().setCallout(type).run();
    onToggle();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <ToolbarButton
        onClick={onToggle}
        title="Insérer un encadré"
        isActive={isOpen}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </ToolbarButton>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
          <div className="p-2">
            <p className="text-xs text-gray-500 px-2 mb-2 font-medium">Encadrés</p>
            {calloutTypes.map(({ type, icon, label, color }) => (
              <button
                key={type}
                type="button"
                onClick={() => insertCallout(type)}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm rounded hover:bg-gray-100 transition-colors"
              >
                <span>{icon}</span>
                <span className={color}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Image Insert Modal
function ImageInsertModal({
  isOpen,
  onClose,
  onInsert,
}: {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (src: string, alt: string, caption: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      onInsert(url, alt, caption);
      setUrl('');
      setAlt('');
      setCaption('');
      onClose();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'articles');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUrl(data.url);
      setAlt(file.name.replace(/\.[^/.]+$/, '').replace(/-|_/g, ' '));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading text-gray-900">Insérer une image</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-terracotta-400 hover:bg-terracotta-50 transition-colors flex items-center justify-center gap-2 text-gray-600"
            >
              {isUploading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Upload en cours...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Uploader une image</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-sm text-gray-500">ou</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de l&apos;image
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            />
          </div>

          {/* Preview */}
          {url && (
            <div className="bg-gray-50 rounded-lg p-3">
              <img
                src={url}
                alt="Preview"
                className="max-h-32 mx-auto rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Alt Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texte alternatif
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Description de l'image pour l'accessibilité"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Légende (optionnel)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Légende affichée sous l'image"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!url}
              className="px-4 py-2 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Insérer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Toolbar Component
function EditorToolbar({
  editor,
  enableAdvancedFeatures = false,
}: {
  editor: Editor | null;
  enableAdvancedFeatures?: boolean;
}) {
  const [showCalloutDropdown, setShowCalloutDropdown] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL du lien:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const insertImage = (src: string, alt: string, caption: string) => {
    if (enableAdvancedFeatures) {
      editor.chain().focus().setImageBlock({ src, alt, caption }).run();
    } else {
      editor.chain().focus().setImage({ src, alt }).run();
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        {/* Text Style */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Gras (Ctrl+B)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italique (Ctrl+I)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0v16m0 0h-4m4 0l4-16" />
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Barré"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5c-2.5 0-4 1.5-4 3.5 0 2 1.5 3.5 4 3.5m0-7c2.5 0 4 1.5 4 3.5M12 19c-2.5 0-4-1.5-4-3.5 0-2 1.5-3.5 4-3.5m0 7c2.5 0 4-1.5 4-3.5" />
            </svg>
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-300">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Titre 2"
          >
            <span className="text-sm font-bold">H2</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Titre 3"
          >
            <span className="text-sm font-bold">H3</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="Paragraphe"
          >
            <span className="text-sm">P</span>
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-300">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Liste à puces"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              <circle cx="2" cy="6" r="1" fill="currentColor" />
              <circle cx="2" cy="12" r="1" fill="currentColor" />
              <circle cx="2" cy="18" r="1" fill="currentColor" />
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Liste numérotée"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13" />
              <text x="1" y="8" fontSize="6" fill="currentColor">1</text>
              <text x="1" y="14" fontSize="6" fill="currentColor">2</text>
              <text x="1" y="20" fontSize="6" fill="currentColor">3</text>
            </svg>
          </ToolbarButton>
        </div>

        {/* Links & Quotes */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-300">
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Lien"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Citation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Ligne horizontale"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          </ToolbarButton>
        </div>

        {/* Advanced Features: Image & Callouts */}
        {enableAdvancedFeatures && (
          <div className="flex items-center gap-1 px-2 border-r border-gray-300">
            <ToolbarButton
              onClick={() => setShowImageModal(true)}
              title="Insérer une image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </ToolbarButton>

            <CalloutDropdown
              editor={editor}
              isOpen={showCalloutDropdown}
              onToggle={() => setShowCalloutDropdown(!showCalloutDropdown)}
            />
          </div>
        )}

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 pl-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Annuler (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Refaire (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </ToolbarButton>
        </div>
      </div>

      {/* Image Modal */}
      <ImageInsertModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onInsert={insertImage}
      />
    </>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Commencez à écrire...',
  label,
  minHeight = '200px',
  disabled = false,
  enableAdvancedFeatures = false,
}: RichTextEditorProps) {
  // Build extensions array based on features enabled
  const baseExtensions = [
    StarterKit.configure({
      heading: {
        levels: [2, 3],
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-terracotta-600 underline hover:text-terracotta-700',
      },
    }),
    Placeholder.configure({
      placeholder,
    }),
  ];

  // Add advanced extensions if enabled
  const extensions = enableAdvancedFeatures
    ? [
        ...baseExtensions,
        Image.configure({
          inline: false,
          HTMLAttributes: {
            class: 'rounded-lg shadow-md max-w-full mx-auto my-4',
          },
        }),
        CalloutExtension,
        ImageBlockExtension,
      ]
    : baseExtensions;

  const editor = useEditor({
    extensions,
    content: value || '',
    editable: !disabled,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none p-4',
          'prose-headings:font-heading prose-headings:text-gray-900',
          'prose-p:text-gray-600 prose-p:leading-relaxed',
          'prose-a:text-terracotta-600 prose-a:no-underline hover:prose-a:underline',
          'prose-ul:list-disc prose-ol:list-decimal',
          'prose-blockquote:border-l-4 prose-blockquote:border-terracotta-300 prose-blockquote:pl-4 prose-blockquote:italic',
          'prose-img:rounded-lg prose-img:shadow-md prose-img:mx-auto',
          disabled && 'opacity-50 cursor-not-allowed'
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && (value || '') !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-terracotta-500 focus-within:border-terracotta-500">
        <EditorToolbar editor={editor} enableAdvancedFeatures={enableAdvancedFeatures} />
        <EditorContent editor={editor} />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {enableAdvancedFeatures
          ? 'Utilisez la barre d\'outils pour formater votre texte, insérer des images et des encadrés'
          : 'Utilisez la barre d\'outils pour formater votre texte'
        }
      </p>
    </div>
  );
}

// Simple Markdown Editor (alternative for those who prefer Markdown)
export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Écrivez en Markdown...',
  label,
  rows = 10,
  disabled = false,
}: {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-terracotta-500 focus-within:border-terracotta-500">
        {/* Markdown Help Bar */}
        <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
          <span className="font-medium">Markdown:</span>
          <code className="bg-gray-100 px-1 rounded">**gras**</code>
          <code className="bg-gray-100 px-1 rounded">*italique*</code>
          <code className="bg-gray-100 px-1 rounded">[lien](url)</code>
          <code className="bg-gray-100 px-1 rounded">## Titre</code>
          <code className="bg-gray-100 px-1 rounded">- liste</code>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 font-mono text-sm focus:outline-none resize-y',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
          )}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Syntaxe Markdown supportée
      </p>
    </div>
  );
}

export default RichTextEditor;
