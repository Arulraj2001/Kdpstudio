import React, { useState } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  Download, 
  Layers, 
  CheckCircle2, 
  BookOpen, 
  Plus, 
  Lightbulb, 
  CheckSquare, 
  ArrowRight
} from 'lucide-react';
import { 
  NonFictionProject, 
  SAMPLE_NONFICTION_PROJECT, 
  NonFictionChapter 
} from '../../lib/studios/nonfictionEngine';
import { exportNonFictionBookPdf } from '../../lib/toolsPdfExport';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';

interface NonFictionStudioViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const NonFictionStudioView: React.FC<NonFictionStudioViewProps> = ({ onNavigate }) => {
  const [project, setProject] = useState<NonFictionProject>(() => ({ ...SAMPLE_NONFICTION_PROJECT }));
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [trimSize, setTrimSize] = useState<'6x9' | '5.5x8.5'>('6x9');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const activeChap = project.chapters[activeChapterIdx] || project.chapters[0];

  const handleUpdateChapter = <K extends keyof NonFictionChapter>(field: K, value: NonFictionChapter[K]) => {
    const updated = [...project.chapters];
    updated[activeChapterIdx] = {
      ...updated[activeChapterIdx],
      [field]: value,
    };
    setProject({ ...project, chapters: updated });
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportNonFictionBookPdf(project, trimSize);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20 font-sans">
      <SEOHead
        pageKey="features"
        title="Non-Fiction & Business Book Blueprint Studio — KDP Studio"
        description="Design high-authority non-fiction, business, and self-help book manuscripts for Amazon KDP with proven chapter frameworks, case studies, takeaway callouts, and 300 DPI PDF exports."
        canonicalPath="/studios/non-fiction"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Briefcase size={14} className="text-indigo-400" />
            <span>Authority Book Blueprint Studio</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Non-Fiction &amp; Business <span className="font-serif italic font-normal text-indigo-400">Blueprint Studio</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Build chapter-by-chapter authority blueprints with thesis hooks, actionable multi-step frameworks, real case studies, and implementation worksheets.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT: CHAPTER BLUEPRINT BUILDER ── */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Chapter Architecture
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {project.chapters.length} Chapters
              </span>
            </div>

            {/* Chapter Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Chapter
              </label>
              <div className="space-y-1.5">
                {project.chapters.map((chap, idx) => (
                  <button
                    key={chap.chapterNumber}
                    type="button"
                    onClick={() => setActiveChapterIdx(idx)}
                    className={`w-full py-2.5 px-3 rounded-2xl font-bold text-xs text-left transition-all cursor-pointer flex items-center justify-between border ${
                      activeChapterIdx === idx
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">Ch. {chap.chapterNumber}: {chap.title}</span>
                    <span className={`text-[10px] ${activeChapterIdx === idx ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {chap.frameworkSteps.length} Steps
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Edit Fields */}
            <div className="space-y-4 pt-2 border-t border-slate-100 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Chapter Title</label>
                <input
                  type="text"
                  value={activeChap.title}
                  onChange={(e) => handleUpdateChapter('title', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Core Hook / Thesis</label>
                <textarea
                  rows={2}
                  value={activeChap.hook}
                  onChange={(e) => handleUpdateChapter('hook', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Proprietary Framework Name</label>
                <input
                  type="text"
                  value={activeChap.frameworkName}
                  onChange={(e) => handleUpdateChapter('frameworkName', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-indigo-700 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Framework Steps</label>
                <div className="space-y-1.5">
                  {activeChap.frameworkSteps.map((step, sIdx) => (
                    <input
                      key={sIdx}
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const newSteps = [...activeChap.frameworkSteps];
                        newSteps[sIdx] = e.target.value;
                        handleUpdateChapter('frameworkSteps', newSteps);
                      }}
                      className="w-full p-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-indigo-500"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl shadow-indigo-900/20 hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={16} />
                <span>{isExporting ? 'Generating PDF Manuscript...' : 'Export Complete Non-Fiction Manuscript PDF'}</span>
              </button>
            </div>

          </div>

          {/* ── RIGHT: LIVE MANUSCRIPT CHAPTER PREVIEW ── */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Chapter {activeChap.chapterNumber}
                </span>
                <h2 className="text-2xl font-serif font-black text-slate-900">{activeChap.title}</h2>
                <p className="text-xs font-serif italic text-slate-500">{activeChap.subtitle}</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {trimSize}" Standard
              </span>
            </div>

            {/* Core Thesis Callout Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">The Core Thesis</span>
              <p className="text-xs sm:text-sm font-serif italic text-slate-800 leading-relaxed">
                "{activeChap.hook}"
              </p>
            </div>

            {/* Framework Steps */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500" />
                <span>{activeChap.frameworkName}</span>
              </h3>
              <div className="space-y-2 text-xs">
                {activeChap.frameworkSteps.map((st, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 leading-relaxed font-medium">{st}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Takeaways Callout */}
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2">
              <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-indigo-600" />
                <span>Key Chapter Takeaways</span>
              </span>
              <ul className="space-y-1.5 text-xs text-indigo-950">
                {activeChap.keyTakeaways.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Checklist */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare size={14} className="text-emerald-600" />
                <span>Action Implementation Checklist</span>
              </h4>
              <div className="space-y-1.5">
                {activeChap.actionChecklist.map((act, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-3.5 h-3.5 rounded border border-slate-300 bg-white" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
