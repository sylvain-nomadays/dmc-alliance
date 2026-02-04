import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (options: { src: string; alt?: string; caption?: string }) => ReturnType;
    };
  }
}

export const ImageBlockExtension = Node.create({
  name: 'imageBlock',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.querySelector('img')?.getAttribute('src'),
        renderHTML: (attributes) => ({}),
      },
      alt: {
        default: '',
        parseHTML: (element) => element.querySelector('img')?.getAttribute('alt') || '',
        renderHTML: (attributes) => ({}),
      },
      caption: {
        default: '',
        parseHTML: (element) => element.querySelector('figcaption')?.textContent || '',
        renderHTML: (attributes) => ({}),
      },
      alignment: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-alignment') || 'center',
        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-image-block]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { src, alt, caption, alignment } = node.attrs;

    const alignmentClasses: Record<string, string> = {
      left: 'mr-auto',
      center: 'mx-auto',
      right: 'ml-auto',
    };

    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-image-block': '',
        'data-alignment': alignment,
        class: `image-block my-6 max-w-2xl ${alignmentClasses[alignment] || 'mx-auto'}`,
      }),
      [
        'img',
        {
          src,
          alt: alt || '',
          class: 'rounded-lg shadow-md w-full',
        },
      ],
      caption
        ? [
            'figcaption',
            { class: 'text-sm text-gray-500 text-center mt-2 italic' },
            caption,
          ]
        : '',
    ];
  },

  addCommands() {
    return {
      setImageBlock:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

export default ImageBlockExtension;
