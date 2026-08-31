import React, { useState } from 'react';
import {
  Sparkles,
  Award,
  Feather,
  Frame,
  Shapes,
  X,
  Search,
  Plus,
} from 'lucide-react';
import { GRAPHIC_ELEMENTS, GraphicElementItem } from '../../lib/coverTemplates';

interface CoverElementsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddElementToCanvas: (element: GraphicElementItem) => void;
}

export const CoverElementsDrawer: React.FC<CoverElementsDrawerProps> = ({
  isOpen,
  onClose,
  onAddElementToCanvas,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = ['All', 'Badges', 'Flourishes', 'Silhouettes', 'Frames'];

  const filteredElements = GRAPHIC_ELEMENTS.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-y-0 left-20 w-80 bg-white border-r border-slate-200 shadow-2xl z-40 flex flex-col animate-in slide-in-from-left duration-200 text-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-purple-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Graphics & Elements</h3>
            <p className="text-[11px] text-slate-500 font-medium">Bestseller Badges, Ornaments & Icons</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-900 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search badges, flourishes, icons..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Element Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2.5">
          {filteredElements.map((el) => (
            <button
              key={el.id}
              type="button"
              onClick={() => {
                onAddElementToCanvas(el);
              }}
              className="group p-3 rounded-xl border border-slate-200 hover:border-purple-500 bg-slate-50 hover:bg-white flex flex-col items-center justify-between text-center transition-all cursor-pointer shadow-2xs hover:shadow-md"
            >
              <div
                className="w-full h-20 flex items-center justify-center p-1 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: el.svgString }}
              />
              <span className="text-[11px] font-semibold text-slate-700 group-hover:text-purple-700 mt-2 truncate w-full">
                {el.title}
              </span>
              <span className="text-[10px] text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-0.5">
                <Plus className="w-3 h-3" /> Add to Cover
              </span>
            </button>
          ))}
        </div>

        {filteredElements.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            No graphics found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};
