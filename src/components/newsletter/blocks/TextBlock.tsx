'use client';

/**
 * TextBlock - Bloc de texte riche avec TipTap
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Undo, Redo } from 'lucide-react';
import { BlockComponentProps } from '@/lib/newsletter/types';
import { cn } from '@/lib/utils';

export function TextBlock({ block, isSelected, isEditing, onChange }: BlockComponentProps) {
  const { content, settings } = block;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-terracotta-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Commencez à écrire...',
      }),
    ],
    content: content.html || '',
    editable: isEditing,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange({
        ...block,
        content: { ...content, html: editor.getHTML() },
      });
    },
  });

  // Update editor content when block changes externally
  useEffect(() => {
    if (editor && content.html !== editor.getHTML()) {
      editor.commands.setContent(content.html || '');
    }
  }, [content.html, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  const paddingClasses = {
    none: 'p-0',
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  };

  const setLink = () => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL du lien:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div
      className={cn(
        'rounded-lg transition-all',
        paddingClasses[settings.padding || 'medium']
      )}
      style={{
        backgroundColor: settings.backgroundColor || 'transparent',
        color: settings.textColor || '#333333',
        textAlign: settings.alignment || 'left',
      }}
    >
      {/* Toolbar - visible when editing and selected */}
      {isEditing && isSelected && editor && (
        <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-gray-200">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'p-1.5 rounded hover:bg-gray-100',
              editor.isActive('bold') && 'bg-gray-200'
            )}
            title="Gras"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'p-1.5 rounded hover:bg-gray-100',
              editor.isActive('italic') && 'bg-gray-200'
            )}
            title="Italique"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px bg-gray-200 mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'p-1.5 rounded hover:bg-gray-100',
              editor.isActive('bulletList') && 'bg-gray-200'
            )}
            title="Liste à puces"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'p-1.5 rounded hover:bg-gray-100',
              editor.isActive('orderedList') && 'bg-gray-200'
            )}
            title="Liste numérotée"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className="w-px bg-gray-200 mx-1" />
          <button
            onClick={setLink}
            className={cn(
              'p-1.5 rounded hover:bg-gray-100',
              editor.isActive('link') && 'bg-gray-200'
            )}
            title="Lien"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <div className="w-px bg-gray-200 mx-1" />
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
            title="Annuler"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
            title="Rétablir"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm max-w-none',
          'prose-p:my-2 prose-p:leading-relaxed',
          'prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2',
          'prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2',
          'prose-li:my-1',
          'prose-a:text-terracotta-600 prose-a:underline',
          '[&_.ProseMirror]:outline-none',
          '[&_.ProseMirror]:min-h-[60px]',
          isEditing && '[&_.ProseMirror]:cursor-text'
        )}
      />
    </div>
  );
}

// Version pour preview email
export function TextBlockPreview({ block }: { block: BlockComponentProps['block'] }) {
  const { content, settings } = block;

  return (
    <div
      style={{
        backgroundColor: settings.backgroundColor || 'transparent',
        color: settings.textColor || '#333333',
        textAlign: settings.alignment || 'left',
        padding: settings.padding === 'large' ? '24px' : settings.padding === 'small' ? '12px' : '16px',
      }}
      dangerouslySetInnerHTML={{ __html: content.html || '' }}
    />
  );
}
