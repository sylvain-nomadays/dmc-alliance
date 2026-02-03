'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: string;
  outputFormat?: 'html' | 'markdown';
  disabled?: boolean;
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

// Toolbar Component
function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL du lien:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
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

      {/* Other */}
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
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Commencez à écrire...',
  label,
  minHeight = '200px',
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
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
    ],
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
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Utilisez la barre d&apos;outils pour formater votre texte
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
