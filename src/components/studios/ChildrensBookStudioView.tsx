import React, { useState } from 'react';
import { 
  Baby, 
  Sparkles, 
  BookOpen, 
  Download, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Palette, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  ChildrensBookProject, 
  SAMPLE_CHILDRENS_BOOKS, 
  ART_STYLES, 
  buildConsistentPrompt 
} from '../../lib/studios/childrensBookEngine';
import { exportChildrensBookPdf } from '../../lib/toolsPdfExport';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';

interface ChildrensBookStudioViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const ChildrensBookStudioView: React.FC<ChildrensBookStudioViewProps> = ({ onNavigate }) => {
  const [project, setProject] = useState<ChildrensBookProject>(() => ({ ...SAMPLE_CHILDRENS_BOOKS[0] }));
  const [currentSpreadIdx, setCurrentSpreadIdx] = useState<number>(0);
  const [copiedPromptIdx, setCopiedPromptIdx] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const activeSpread = project.spreads[currentSpreadIdx];

  const handleUpdateStoryText = (text: string) => {
    const updatedSpreads = [...project.spreads];
    updatedSpreads[currentSpreadIdx] = {
      ...updatedSpreads[currentSpreadIdx],
      storyText: text,
    };
    setProject({ ...project, spreads: updatedSpreads });
  };

  const handleUpdateSceneDesc = (desc: string) => {
    const updatedSpreads = [...project.spreads];
    const newPrompt = buildConsistentPrompt(project.character, desc);
    updatedSpreads[currentSpreadIdx] = {
      ...updatedSpreads[currentSpreadIdx],
      sceneDescription: desc,
      imagePrompt: newPrompt,
    };
    setProject({ ...project, spreads: updatedSpreads });
  };

  const handleCopyPrompt = (prompt: string, idx: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPromptIdx(idx);
    setTimeout(() => setCopiedPromptIdx(null), 2000);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportChildrensBookPdf(project, project.trimSize);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20 font-sans">
      <SEOHead
        pageKey="features"
        title="Children's Illustrated Book Storyboard Studio — KDP Studio"
        description="Design 24-page and 32-page commercial children's picture books for Amazon KDP with character consistency locks and 300 DPI full-bleed vector PDF exports."
        canonicalPath="/studios/childrens-book"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-950/80 border border-pink-500/40 text-pink-300 text-xs font-bold uppercase tracking-wider">
            <Baby size={14} className="text-pink-400" />
            <span>Storybook Publishing Studio</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Children's Illustrated <span className="font-serif italic font-normal text-pink-400">Storyboard Studio</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Build 24-page and 32-page picture books with locked character attributes across spreads. Export complete ready-to-upload full-bleed PDF interiors.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT: CHARACTER CONSISTENCY ENGINE ── */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={13} className="text-pink-600" />
                <span>Character Consistency Lock</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Lock
              </span>
            </div>

            {/* Character Fields */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Protagonist Name</label>
                <input
                  type="text"
                  value={project.character.name}
                  onChange={(e) => setProject({
                    ...project,
                    character: { ...project.character, name: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:border-pink-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Species / Character Type</label>
                <input
                  type="text"
                  value={project.character.speciesOrType}
                  onChange={(e) => setProject({
                    ...project,
                    character: { ...project.character, speciesOrType: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-pink-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Signature Clothing / Accessories</label>
                <input
                  type="text"
                  value={project.character.clothing}
                  onChange={(e) => setProject({
                    ...project,
                    character: { ...project.character, clothing: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-pink-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Art Style Preset</label>
                <select
                  value={project.character.artStyle}
                  onChange={(e) => setProject({
                    ...project,
                    character: { ...project.character, artStyle: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 focus:bg-white focus:border-pink-500 transition-colors cursor-pointer"
                >
                  {ART_STYLES.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Trim Size</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['8.5x8.5', '8.5x11'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setProject({ ...project, trimSize: size })}
                      className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        project.trimSize === size
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {size}" Square
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Action */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl shadow-pink-900/20 hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={16} />
                <span>{isExporting ? 'Generating PDF Manuscript...' : 'Export 300 DPI Picture Book PDF'}</span>
              </button>
            </div>

          </div>

          {/* ── RIGHT: 2-PAGE SPREAD STORYBOARD CANVAS ── */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            {/* Spread Carousel Navigator */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Spread {activeSpread.spreadNumber} of {project.spreads.length}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Pages {activeSpread.leftPageNumber} &amp; {activeSpread.rightPageNumber} • Mood: {activeSpread.focusEmotion}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentSpreadIdx === 0}
                  onClick={() => setCurrentSpreadIdx((prev) => Math.max(0, prev - 1))}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-700 px-2">
                  {currentSpreadIdx + 1} / {project.spreads.length}
                </span>
                <button
                  type="button"
                  disabled={currentSpreadIdx === project.spreads.length - 1}
                  onClick={() => setCurrentSpreadIdx((prev) => Math.min(project.spreads.length - 1, prev + 1))}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Paired 2-Page Spread Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-100 p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-inner">
              
              {/* Left Page: Narrative Text */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Left Page ({activeSpread.leftPageNumber})</span>
                    <span>Story Verse</span>
                  </div>
                  <textarea
                    rows={6}
                    value={activeSpread.storyText}
                    onChange={(e) => handleUpdateStoryText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 font-serif text-sm sm:text-base leading-relaxed focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all resize-none"
                    placeholder="Enter rhyming verses or narrative prose..."
                  />
                </div>
                <div className="text-right text-[10px] font-bold text-slate-400">
                  Page {activeSpread.leftPageNumber}
                </div>
              </div>

              {/* Right Page: Visual Scene & Prompt */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Right Page ({activeSpread.rightPageNumber})</span>
                    <span className="text-pink-600 font-bold">Scene Frame</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Scene Description</label>
                    <textarea
                      rows={2}
                      value={activeSpread.sceneDescription}
                      onChange={(e) => handleUpdateSceneDesc(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-pink-500 transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                      <span>Midjourney / AI Image Prompt</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(activeSpread.imagePrompt, currentSpreadIdx)}
                        className="text-[10px] text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedPromptIdx === currentSpreadIdx ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10px] leading-relaxed max-h-24 overflow-y-auto">
                      {activeSpread.imagePrompt}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[10px] font-bold text-slate-400">
                  Page {activeSpread.rightPageNumber}
                </div>
              </div>

            </div>

            {/* Spread Thumbnails Strip */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-2">
              {project.spreads.map((s, idx) => (
                <button
                  key={s.spreadNumber}
                  type="button"
                  onClick={() => setCurrentSpreadIdx(idx)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                    currentSpreadIdx === idx
                      ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Spread {s.spreadNumber} ({s.leftPageNumber}-{s.rightPageNumber})
                </button>
              ))}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
