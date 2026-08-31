import React, { useState } from 'react';
import { 
  Calendar, 
  Sparkles, 
  Download, 
  Layers, 
  CheckCircle2, 
  BookOpen, 
  Sliders, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { 
  PlannerType, 
  PlannerConfig, 
  PLANNER_TEMPLATES 
} from '../../lib/studios/plannerEngine';
import { exportPlannerBookPdf } from '../../lib/toolsPdfExport';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';

interface PlannerGeneratorViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const PlannerGeneratorView: React.FC<PlannerGeneratorViewProps> = ({ onNavigate }) => {
  const [selectedType, setSelectedType] = useState<PlannerType>('daily-productivity');
  const [pageCount, setPageCount] = useState<number>(120);
  const [trimSize, setTrimSize] = useState<'6x9' | '8.5x11' | '5.5x8.5'>('6x9');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const template = PLANNER_TEMPLATES[selectedType];

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportPlannerBookPdf({
        type: selectedType,
        title: template.name,
        pageCount,
        trimSize,
        includeQuotes: true,
        themeStyle: 'minimal',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20 font-sans">
      <SEOHead
        pageKey="features"
        title="Low-Content Planner & Habit Journal Studio — KDP Studio"
        description="Generate 120-page commercial daily planners, habit trackers, gratitude journals, and dot grid interiors for Amazon KDP with strict 0.75-inch gutter margins and vector 300 DPI PDF exports."
        canonicalPath="/studios/planner"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider">
            <Calendar size={14} className="text-cyan-400" />
            <span>Low-Content Publishing Studio</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Low-Content Planner &amp; <span className="font-serif italic font-normal text-cyan-400">Journal Studio</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Parametric vector generators for daily productivity planners, habit trackers, and dot grid notebooks with strict 0.75" inside spine gutter margins.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT CONTROLS ── */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Interior Configuration
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                {pageCount} Interior Pages
              </span>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Planner Template
              </label>
              <div className="space-y-2">
                {(Object.keys(PLANNER_TEMPLATES) as PlannerType[]).map((typeKey) => {
                  const t = PLANNER_TEMPLATES[typeKey];
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setSelectedType(typeKey)}
                      className={`w-full p-3 rounded-2xl font-bold text-xs text-left transition-all cursor-pointer flex items-start gap-3 border ${
                        selectedType === typeKey
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <div className="space-y-0.5">
                        <div className="font-bold">{t.name}</div>
                        <p className={`text-[10px] leading-tight ${selectedType === typeKey ? 'text-cyan-100' : 'text-slate-500'}`}>
                          {t.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trim Size */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Target Trim Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['6x9', '8.5x11', '5.5x8.5'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setTrimSize(size)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                      trimSize === size
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {size}"
                  </button>
                ))}
              </div>
            </div>

            {/* Page Count Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="uppercase tracking-wider">Total Interior Pages</span>
                <span className="text-cyan-600 font-black">{pageCount} Pages</span>
              </div>
              <input
                type="range"
                min={24}
                max={200}
                step={10}
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                <span>50</span>
                <span>100</span>
                <span>120 (KDP Standard)</span>
                <span>150+</span>
              </div>
            </div>

            {/* Export Action */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-xl shadow-cyan-900/20 hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={16} />
                <span>{isExporting ? 'Generating PDF Manuscript...' : `Export Complete ${pageCount}-Page Planner PDF`}</span>
              </button>
            </div>

          </div>

          {/* ── RIGHT: LIVE VECTOR PAGE PREVIEW ── */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">{template.name}</h2>
                <p className="text-[11px] text-slate-500">
                  Mirrored 0.75" Spine Gutter Safe Margins • 300 DPI Prepress Vector
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
                {trimSize}" Standard
              </span>
            </div>

            {/* Live Interior Mockup Sheet */}
            <div className="w-full max-w-md bg-white rounded-2xl border-2 border-slate-300 shadow-2xl p-6 sm:p-8 space-y-5 aspect-[6/9] flex flex-col justify-between select-none">
              
              {selectedType === 'daily-productivity' && (
                <div className="space-y-4 text-slate-900 text-xs">
                  <div className="border-b border-slate-300 pb-2 flex justify-between items-center">
                    <span className="font-black text-sm uppercase">Daily Planner</span>
                    <span className="text-[10px] text-slate-400 font-bold">Date: __________</span>
                  </div>

                  {/* Priorities */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-700 block">Top 3 Priorities</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 border border-slate-400" /><div className="h-1.5 flex-1 bg-slate-200 rounded" /></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 border border-slate-400" /><div className="h-1.5 flex-1 bg-slate-200 rounded" /></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 border border-slate-400" /><div className="h-1.5 flex-1 bg-slate-200 rounded" /></div>
                    </div>
                  </div>

                  {/* Hourly + Checklist */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-700 block">Schedule</span>
                      {['7 AM', '9 AM', '11 AM', '1 PM', '3 PM', '5 PM', '7 PM'].map(h => (
                        <div key={h} className="flex items-center gap-1.5 text-[9px] text-slate-400">
                          <span className="w-7">{h}</span>
                          <div className="h-[1px] flex-1 bg-slate-200" />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-700 block">To-Do List</span>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 border border-slate-300 rounded-sm" />
                          <div className="h-1 flex-1 bg-slate-100 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Water Tracker */}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                    <span>Water: ○ ○ ○ ○ ○ ○ ○ ○</span>
                    <span>Page 1</span>
                  </div>
                </div>
              )}

              {selectedType === 'dot-grid' && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="grid grid-cols-12 gap-3.5 p-4 opacity-40">
                    {Array.from({ length: 144 }).map((_, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full bg-slate-600" />
                    ))}
                  </div>
                </div>
              )}

              {selectedType !== 'daily-productivity' && selectedType !== 'dot-grid' && (
                <div className="space-y-4 text-slate-900 text-xs">
                  <div className="border-b border-slate-300 pb-2">
                    <span className="font-bold text-slate-400">DATE: __________________</span>
                  </div>
                  <div className="space-y-3.5 pt-2">
                    {Array.from({ length: 14 }).map((_, idx) => (
                      <div key={idx} className="h-[1px] w-full bg-slate-200" />
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-100">
                Amazon KDP 0.75" Spine Margin Compliant
              </div>

            </div>

            {/* Footer Features */}
            <div className="w-full pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <CheckCircle2 size={14} />
                <span>Zero Trim Rejection Guarantee</span>
              </div>
              <div className="flex items-center gap-3 font-semibold">
                <span>Mirrored Gutter: Yes</span>
                <span>•</span>
                <span>Vector DPI: 300</span>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
