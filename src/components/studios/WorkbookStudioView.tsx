import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Layers, 
  CheckCircle2, 
  BookOpen, 
  Sliders, 
  HelpCircle, 
  Edit3, 
  ArrowRight
} from 'lucide-react';
import { 
  WorkbookProject, 
  SAMPLE_WORKBOOK_PROJECT, 
  WorkbookSection 
} from '../../lib/studios/workbookEngine';
import { exportWorkbookPdf } from '../../lib/toolsPdfExport';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';

interface WorkbookStudioViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const WorkbookStudioView: React.FC<WorkbookStudioViewProps> = ({ onNavigate }) => {
  const [project, setProject] = useState<WorkbookProject>(() => ({ ...SAMPLE_WORKBOOK_PROJECT }));
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [trimSize, setTrimSize] = useState<'8.5x11' | '6x9'>('8.5x11');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const activeSection = project.sections[activeSectionIdx] || project.sections[0];

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportWorkbookPdf(project, trimSize);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20 font-sans">
      <SEOHead
        pageKey="features"
        title="Interactive Workbook & Quiz Creator Studio — KDP Studio"
        description="Build educational companion workbooks, self-assessments, reflection prompt worksheets, and multiple-choice quizzes for Amazon KDP with 300 DPI vector PDF exports."
        canonicalPath="/studios/workbook"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-950/80 border border-sky-500/40 text-sky-300 text-xs font-bold uppercase tracking-wider">
            <FileText size={14} className="text-sky-400" />
            <span>Interactive Learning Studio</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Interactive Workbook &amp; <span className="font-serif italic font-normal text-sky-400">Quiz Creator Studio</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Design companion workbooks with 1–5 Likert self-assessments, deep reflection ruled worksheets, and multiple-choice knowledge checks with answer keys.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT: WORKBOOK SECTION MANAGER ── */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Section Modules
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                {project.sections.length} Module
              </span>
            </div>

            {/* Sections Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Section
              </label>
              <div className="space-y-1.5">
                {project.sections.map((sec, idx) => (
                  <button
                    key={sec.sectionNumber}
                    type="button"
                    onClick={() => setActiveSectionIdx(idx)}
                    className={`w-full py-2.5 px-3 rounded-2xl font-bold text-xs text-left transition-all cursor-pointer flex items-center justify-between border ${
                      activeSectionIdx === idx
                        ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">Sec. {sec.sectionNumber}: {sec.title}</span>
                    <span className={`text-[10px] ${activeSectionIdx === idx ? 'text-sky-200' : 'text-slate-400'}`}>
                      {sec.assessments.length} Matrix Qs
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section Settings */}
            <div className="space-y-4 pt-2 border-t border-slate-100 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Section Title</label>
                <input
                  type="text"
                  value={activeSection.title}
                  onChange={(e) => {
                    const updated = [...project.sections];
                    updated[activeSectionIdx].title = e.target.value;
                    setProject({ ...project, sections: updated });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Learning Objective</label>
                <textarea
                  rows={2}
                  value={activeSection.learningObjective}
                  onChange={(e) => {
                    const updated = [...project.sections];
                    updated[activeSectionIdx].learningObjective = e.target.value;
                    setProject({ ...project, sections: updated });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:border-sky-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Trim Size</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['8.5x11', '6x9'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTrimSize(size)}
                      className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        trimSize === size
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {size}" Standard
                    </button>
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
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-sky-900/20 hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={16} />
                <span>{isExporting ? 'Generating PDF Workbook...' : 'Export 300 DPI Printable Workbook PDF'}</span>
              </button>
            </div>

          </div>

          {/* ── RIGHT: LIVE INTERACTIVE WORKBOOK CANVAS PREVIEW ── */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  Section {activeSection.sectionNumber}
                </span>
                <h2 className="text-2xl font-serif font-black text-slate-900">{activeSection.title}</h2>
                <p className="text-xs text-slate-500">Objective: {activeSection.learningObjective}</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {trimSize}" Workbook
              </span>
            </div>

            {/* 1. Likert Self-Assessment Matrix */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={15} className="text-sky-600" />
                  <span>Exercise 1: Self-Assessment Matrix</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">1 = Disagree • 5 = Agree</span>
              </div>

              <div className="space-y-2 text-xs">
                {activeSection.assessments.map((a, idx) => (
                  <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                    <span className="text-slate-800 leading-snug">{a.statement}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <div key={val} className="w-6 h-6 rounded-full border border-slate-300 bg-white flex items-center justify-center font-bold text-[10px] text-slate-600">
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Deep Reflection Prompts */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 size={15} className="text-indigo-600" />
                <span>Exercise 2: Guided Reflection Prompts</span>
              </h3>

              <div className="space-y-4 text-xs">
                {activeSection.reflections.map((r) => (
                  <div key={r.id} className="space-y-2">
                    <div className="font-bold text-slate-900">{r.promptQuestion}</div>
                    {r.subHint && <div className="text-[11px] text-slate-500 italic">{r.subHint}</div>}
                    <div className="space-y-3 pt-1">
                      {Array.from({ length: r.lineCount }).map((_, lIdx) => (
                        <div key={lIdx} className="h-[1px] w-full bg-slate-200" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Knowledge Check */}
            {activeSection.quizzes.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle size={15} className="text-emerald-600" />
                  <span>Exercise 3: Knowledge Check Quiz</span>
                </h3>

                <div className="space-y-3 text-xs">
                  {activeSection.quizzes.map((q) => (
                    <div key={q.id} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                      <div className="font-bold text-emerald-950">{q.question}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="p-2 rounded-xl bg-white border border-emerald-100 text-slate-700 text-[11px] flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
};
