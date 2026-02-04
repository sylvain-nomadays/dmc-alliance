import { Node, mergeAttributes } from '@tiptap/core';

export type CalloutType = 'tip' | 'warning' | 'info' | 'essential';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type: CalloutType) => ReturnType;
      toggleCallout: (type: CalloutType) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

export const CalloutExtension = Node.create({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'tip',
        parseHTML: (element) => element.getAttribute('data-callout-type') || 'tip',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.type as CalloutType;

    // Define styles for each callout type
    const styles: Record<CalloutType, { bg: string; border: string; icon: string; title: string }> = {
      tip: {
        bg: 'bg-green-50',
        border: 'border-green-500',
        icon: '💡',
        title: 'Conseil',
      },
      warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-500',
        icon: '⚠️',
        title: 'Attention',
      },
      info: {
        bg: 'bg-blue-50',
        border: 'border-blue-500',
        icon: 'ℹ️',
        title: 'Info',
      },
      essential: {
        bg: 'bg-terracotta-50',
        border: 'border-terracotta-500',
        icon: '⭐',
        title: 'Les essentiels',
      },
    };

    const style = styles[type];

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-callout': '',
        'data-callout-type': type,
        class: `callout callout-${type} ${style.bg} ${style.border} border-l-4 rounded-r-lg p-4 my-4`,
      }),
      [
        'div',
        { class: 'callout-header flex items-center gap-2 font-semibold text-gray-800 mb-2' },
        [
          'span',
          { class: 'callout-icon' },
          style.icon,
        ],
        [
          'span',
          { class: 'callout-title' },
          style.title,
        ],
      ],
      ['div', { class: 'callout-content text-gray-700' }, 0],
    ];
  },

  addCommands() {
    return {
      setCallout:
        (type: CalloutType) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { type });
        },
      toggleCallout:
        (type: CalloutType) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, { type });
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },
});

export default CalloutExtension;
