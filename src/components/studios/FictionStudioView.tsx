import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Download, 
  User, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Flame, 
  HeartHandshake, 
  ArrowRight
} from 'lucide-react';
import { 
  FictionProject, 
  SAMPLE_FICTION_PROJECT, 
  StoryBeat, 
  CharacterArc 
} from '../../lib/studios/fictionEngine';
import { exportFictionBeatSheetPdf } from '../../lib/toolsPdfExport';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';

interface FictionStudioViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const FictionStudioView: React.FC<FictionStudioViewProps> = ({ onNavigate }) => {
  const [project, setProject] = useState<FictionProject>(() => ({ ...SAMPLE_FICTION_PROJECT }));
  const [viewMode, setViewMode] = useState<'beats' | 'characters'>('beats');
  const [activeBeatIdx, setActiveBeatIdx] = useState<number>(0);
  const [trimSize, setTrimSize] = useState<'6x9' | '5.5x8.5'>('6x9');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const activeBeat = project.beats[activeBeatIdx] || project.beats[0];

  const handleUpdateBeat = (summary: string) => {
    const updated = [...project.beats];
    updated[activeBeatIdx] = {
      ...updated[activeBeatIdx],
      sceneSummary: summary,
    };
    setProject({ ...project, beats: updated });
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportFictionBeatSheetPdf(project, trimSize);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20 font-sans">
      <SEOHead
        pageKey="features"
        title="Fiction & Novel Beat Sheet Storyboard Studio — KDP Studio"
        description="Craft bestselling fiction and novels with 3-Act Save-the-Cat 15-beat story structure, character arc flaw/want/need matrices, and 300 DPI Story Bible PDF exports."
        canonicalPath="/studios/fiction"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <BookOpen size={14} className="text-rose-400" />
            <span>Narrative Story Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Fiction &amp; Novel <span className="font-serif italic font-normal text-rose-400">Storyboard Studio</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Structure irresistible novels with 15-beat narrative pacing, deep character wound/need arcs, and export ready-to-write Story Bible dossiers.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT: BEAT SHEET CONTROLS & TIMELINE ── */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('beats')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'beats'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  15 Beats
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('characters')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'characters'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Character Arcs
                </button>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {project.genre}
              </span>
            </div>

            {viewMode === 'beats' && (
              <div className="space-y-4">
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {project.beats.map((beat, idx) => (
                    <button
                      key={beat.beatNumber}
                      type="button"
                      onClick={() => setActiveBeatIdx(idx)}
                      className={`w-full py-2.5 px-3 rounded-2xl font-bold text-xs text-left transition-all cursor-pointer flex items-center justify-between border ${
                        activeBeatIdx === idx
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{beat.beatName}</span>
                      <span className={`text-[10px] ${activeBeatIdx === idx ? 'text-rose-200' : 'text-slate-400'}`}>
                        {beat.targetPercentage}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-bold">{activeBeat.act}</span>
                    <span>Pacing: {activeBeat.targetPercentage}</span>
                  </div>
                  <label className="font-bold text-slate-700 block">Scene Outline</label>
                  <textarea
                    rows={4}
                    value={activeBeat.sceneSummary}
                    onChange={(e) => handleUpdateBeat(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-rose-500 resize-none font-serif leading-relaxed"
                  />
                </div>
              </div>
            )}

            {viewMode === 'characters' && (
              <div className="space-y-4 text-xs">
                {project.characters.map((char, cIdx) => (
                  <div key={cIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-900 text-sm">{char.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {char.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong className="text-red-600">Flaw:</strong> {char.internalFlaw}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <strong className="text-blue-600">Want:</strong> {char.externalWant}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <strong className="text-emerald-600">Need:</strong> {char.soulNeed}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Export Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-rose-900/20 hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={16} />
                <span>{isExporting ? 'Generating Story Bible PDF...' : 'Export Complete Story Bible & Beat Sheet PDF'}</span>
              </button>
            </div>

          </div>

          {/* ── RIGHT: LIVE NOVEL TIMELINE & STORY BIBLE PREVIEW ── */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  Novel Story Bible
                </span>
                <h2 className="text-2xl font-serif font-black text-slate-900">{project.title}</h2>
                <p className="text-xs font-serif italic text-slate-500">{project.logline}</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {trimSize}" Trim
              </span>
            </div>

            {/* Beat Card Detail */}
            <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-rose-900 uppercase tracking-wider">
                  {activeBeat.beatName}
                </span>
                <span className="text-[11px] font-bold text-rose-600">
                  Target: {activeBeat.targetPercentage}
                </span>
              </div>
              <p className="text-xs text-rose-800 italic">
                {activeBeat.description}
              </p>
              <div className="pt-2 border-t border-rose-200/60 text-slate-800 font-serif text-sm leading-relaxed">
                "{activeBeat.sceneSummary}"
              </div>
            </div>

            {/* Character Arc Summary Matrix */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <User size={15} className="text-rose-600" />
                <span>Active Cast Conflicts</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.characters.map((char, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>{char.name}</span>
                      <span className="text-[10px] text-slate-400">{char.role}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 leading-snug">
                      <span className="text-rose-600 font-bold">Ghost Wound:</span> {char.backstoryGhost}
                    </div>
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
