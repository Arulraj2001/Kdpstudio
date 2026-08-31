import React from 'react';
import {
  LayoutTemplate,
  X,
  Sparkles,
  Check,
  BookOpen,
} from 'lucide-react';
import { GENRE_TEMPLATES, GenreTemplatePreset } from '../../lib/coverTemplates';

interface CoverTemplatesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: GenreTemplatePreset) => void;
}

export const CoverTemplatesDrawer: React.FC<CoverTemplatesDrawerProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-20 w-88 bg-white border-r border-slate-200 shadow-2xl z-40 flex flex-col animate-in slide-in-from-left duration-200 text-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Genre Cover Presets</h3>
            <p className="text-[11px] text-slate-500 font-medium">1-Click High-Converting KDP Layouts</p>
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

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {GENRE_TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.id}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-purple-500 bg-white hover:bg-slate-50/50 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
          >
            {/* Visual Mini Mockup */}
            <div
              className="w-full h-28 rounded-xl p-2.5 flex flex-col justify-between shadow-inner relative overflow-hidden border border-black/20"
              style={{ backgroundColor: tmpl.bgColor }}
            >
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/20 text-white backdrop-blur-xs">
                  {tmpl.genre}
                </span>
                <span className="text-[9px] text-white/60 font-mono">KDP Ready</span>
              </div>

              <div className="text-center my-auto">
                <div
                  className="font-bold leading-tight truncate px-2 text-sm"
                  style={{ color: tmpl.titleColor, fontFamily: tmpl.titleFont }}
                >
                  {tmpl.titleText}
                </div>
                <div
                  className="text-[9px] truncate px-3 opacity-90 mt-0.5"
                  style={{ color: tmpl.subtitleColor, fontFamily: tmpl.subtitleFont }}
                >
                  {tmpl.subtitleText}
                </div>
              </div>

              <div className="text-center">
                <span
                  className="text-[9px] font-semibold tracking-wider"
                  style={{ color: tmpl.authorColor, fontFamily: tmpl.authorFont }}
                >
                  {tmpl.authorText}
                </span>
              </div>
            </div>

            {/* Template Info & Action */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-900">{tmpl.name}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1">{tmpl.description}</div>
              </div>
              <button
                type="button"
                onClick={() => onApplyTemplate(tmpl)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
