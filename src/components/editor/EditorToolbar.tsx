import React from 'react';
import { Bold, Italic, Heading1, Heading2, List, Sparkles } from 'lucide-react';

export const EditorToolbar: React.FC = () => {
  return (
    <div className="flex items-center gap-1.5 p-2 bg-slate-50 border-b border-slate-200 rounded-t-xl">
      <button className="p-1.5 rounded hover:bg-slate-200 text-slate-700 font-bold" title="Bold">
        <Bold size={15} />
      </button>
      <button className="p-1.5 rounded hover:bg-slate-200 text-slate-700 italic" title="Italic">
        <Italic size={15} />
      </button>
      <div className="h-4 w-px bg-slate-300 mx-1" />
      <button className="p-1.5 rounded hover:bg-slate-200 text-slate-700" title="Heading 1">
        <Heading1 size={15} />
      </button>
      <button className="p-1.5 rounded hover:bg-slate-200 text-slate-700" title="Heading 2">
        <Heading2 size={15} />
      </button>
      <button className="p-1.5 rounded hover:bg-slate-200 text-slate-700" title="List">
        <List size={15} />
      </button>
    </div>
  );
};
