import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
} from 'lucide-react';

interface TiptapToolbarProps {
  editor: Editor | null;
}

export const TiptapToolbar: React.FC<TiptapToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-white border-b border-slate-200 text-slate-700 shadow-2xs">
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 pr-1.5 mr-1.5 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 hover:text-slate-900 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 hover:text-slate-900 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Text Formatting: Bold, Italic, Underline */}
      <div className="flex items-center gap-0.5 pr-1.5 mr-1.5 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('bold')
              ? 'bg-purple-100 text-purple-700 font-bold'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('italic')
              ? 'bg-purple-100 text-purple-700'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('underline')
              ? 'bg-purple-100 text-purple-700'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 pr-1.5 mr-1.5 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-purple-100 text-purple-700 font-bold'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-purple-100 text-purple-700 font-bold'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-purple-100 text-purple-700 font-bold'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-0.5 pr-1.5 mr-1.5 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-purple-100 text-purple-700'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-purple-100 text-purple-700'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      {/* Blockquote & Horizontal Rule */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-purple-100 text-purple-700'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          title="Horizontal Divider"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
