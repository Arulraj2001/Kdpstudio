import { Mark, Extension, mergeAttributes } from '@tiptap/core';

/**
 * DropCapMark preserves drop cap spans with custom inline styles (font size, float, background, padding, stroke, etc.)
 */
export const DropCapMark = Mark.create({
  name: 'dropCap',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute('class'),
        renderHTML: (attributes) => {
          if (!attributes.class) return {};
          return { class: attributes.class };
        },
      },
      'data-dropcap': {
        default: 'true',
        parseHTML: (element) => element.getAttribute('data-dropcap') || 'true',
        renderHTML: (attributes) => ({ 'data-dropcap': attributes['data-dropcap'] || 'true' }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-dropcap]',
      },
      {
        tag: 'span[style]',
        getAttrs: (node) => {
          const style = (node as HTMLElement).getAttribute('style') || '';
          if (
            style.includes('float') ||
            style.includes('font-size:3') ||
            style.includes('font-size:2') ||
            style.includes('font-size: 3') ||
            style.includes('font-size: 2') ||
            style.includes('-webkit-text-stroke') ||
            style.includes('background')
          ) {
            return {};
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});

/**
 * StyledParagraph preserves inline styles on paragraphs and headings for centered scene breaks and dividers
 */
export const StyledParagraph = Extension.create({
  name: 'styledParagraph',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          style: {
            default: null,
            parseHTML: (element) => element.getAttribute('style'),
            renderHTML: (attributes) => {
              if (!attributes.style) return {};
              return { style: attributes.style };
            },
          },
        },
      },
    ];
  },
});
