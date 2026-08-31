import React, { useState } from 'react';
import { X, BookOpen, ChevronRight, Check, Sparkles, Target, Info, Layers } from 'lucide-react';
import {
  ALL_FRAMEWORKS,
  StoryFramework,
  BeatItem,
  generateChaptersFromFramework,
} from '../../lib/storyBeatTemplates';

interface StoryBeatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  bookGenre: string;
  currentWordTarget: number;
  onApplyFramework: (chapters: { title: string; targetWords: number; beatPrompt: string }[]) => void;
}

export const StoryBeatsModal: React.FC<StoryBeatsModalProps> = ({
  isOpen,
  onClose,
  bookTitle,
  bookGenre,
  currentWordTarget,
  onApplyFramework,
}) => {
  const [selectedFramework, setSelectedFramework] = useState<StoryFramework | null>(null);
  const [expandedBeat, setExpandedBeat] = useState<string | null>(null);
  const [wordTarget, setWordTarget] = useState(currentWordTarget || 60000);
  const [step, setStep] = useState<'pick' | 'preview'>('pick');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const previewChapters = selectedFramework
    ? generateChaptersFromFramework(selectedFramework, bookTitle, wordTarget)
    : [];

  const genreColors: Record<string, string> = {
    'Fiction (Any)': 'bg-violet-100 text-violet-700',
    'Fantasy, Adventure, Epic Fiction': 'bg-blue-100 text-blue-700',
    'All Fiction': 'bg-slate-100 text-slate-700',
    'Romance, Contemporary, RomCom': 'bg-pink-100 text-pink-700',
    'Self-Help, Business, How-To': 'bg-amber-100 text-amber-700',
    'Thriller, Mystery, Suspense, Crime': 'bg-red-100 text-red-700',
  };

  const handleApply = () => {
    if (!selectedFramework) return;
    onApplyFramework(previewChapters.map((c) => ({ title: c.title, targetWords: c.targetWords, beatPrompt: c.beatPrompt })));
    setConfirmed(true);
    setTimeout(() => {
      onClose();
      setConfirmed(false);
      setStep('pick');
      setSelectedFramework(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Story Beat Frameworks</h2>
              <p className="text-xs text-slate-500">Industry-standard plotting structures for <span className="font-semibold text-violet-700">{bookTitle}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 shrink-0 bg-slate-50">
          <button
            onClick={() => setStep('pick')}
            className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 px-2 ${step === 'pick' ? 'border-violet-600 text-violet-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <span className="hidden sm:inline">1. Choose Framework</span>
            <span className="sm:hidden">Choose</span>
          </button>
          <button
            onClick={() => { if (selectedFramework) setStep('preview'); }}
            disabled={!selectedFramework}
            className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 px-2 ${step === 'preview' ? 'border-violet-600 text-violet-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <span className="hidden sm:inline">2. Preview &amp; Apply</span>
            <span className="sm:hidden">Preview</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {step === 'pick' && (
            <div className="h-full overflow-y-auto p-3 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_FRAMEWORKS.map((fw) => (
                  <button
                    key={fw.id}
                    onClick={() => { setSelectedFramework(fw); setExpandedBeat(null); }}
                    className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      selectedFramework?.id === fw.id
                        ? 'border-violet-500 bg-violet-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{fw.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">by {fw.creditedTo}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {selectedFramework?.id === fw.id && (
                          <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{fw.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${genreColors[fw.genre] || 'bg-slate-100 text-slate-700'}`}>
                        {fw.genre}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{fw.totalBeats} beats</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedFramework && (
                <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900">Beat Preview — {selectedFramework.name}</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {selectedFramework.beats.map((beat) => (
                      <div key={beat.id} className="px-4">
                        <button
                          onClick={() => setExpandedBeat(expandedBeat === beat.id ? null : beat.id)}
                          className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-slate-50 transition-colors -mx-4 px-4 rounded"
                        >
                          <span className="w-10 text-xs font-mono text-slate-400 shrink-0">{beat.percentageIn}%</span>
                          <span className="flex-1 text-xs font-semibold text-slate-800">{beat.name}</span>
                          <span className="text-xs text-slate-500 hidden sm:inline truncate max-w-[200px]">{beat.chapterHint}</span>
                          <ChevronRight className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${expandedBeat === beat.id ? 'rotate-90' : ''}`} />
                        </button>
                        {expandedBeat === beat.id && (
                          <div className="pb-3 pl-10 space-y-2">
                            <p className="text-xs text-slate-600">{beat.description}</p>
                            <div className="bg-violet-50 border border-violet-200 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Sparkles className="w-3 h-3 text-violet-600" />
                                <span className="text-xs font-semibold text-violet-700">AI Writing Prompt</span>
                              </div>
                              <p className="text-xs text-violet-900 leading-relaxed">{beat.prompt}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFramework && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setStep('preview')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow transition-colors"
                  >
                    Preview Chapters <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && selectedFramework && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                {/* Config */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-violet-600" />
                    <h3 className="text-sm font-bold text-slate-900">Manuscript Word Target</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={10000}
                      max={120000}
                      step={5000}
                      value={wordTarget}
                      onChange={(e) => setWordTarget(Number(e.target.value))}
                      className="flex-1 accent-violet-600"
                    />
                    <span className="w-20 text-sm font-bold text-violet-700 font-mono text-right">
                      {wordTarget.toLocaleString()}w
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Novella (10K)</span>
                    <span>Novel (60K)</span>
                    <span>Epic (120K)</span>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-800"><strong>Note:</strong> Applying this framework will add {previewChapters.length} new chapters to your manuscript. Your existing chapters will remain untouched.</p>
                </div>

                {/* Chapter list */}
                <div className="space-y-2">
                  {previewChapters.map((ch, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-violet-200 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{ch.title}</p>
                        <p className="text-xs text-slate-500">Target: ~{ch.targetWords.toLocaleString()} words</p>
                      </div>
                      <BookOpen className="w-4 h-4 text-slate-300 shrink-0" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={() => setStep('pick')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={confirmed}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold shadow transition-all min-w-0 ${
                      confirmed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-violet-600 hover:bg-violet-700 text-white'
                    }`}
                  >
                    {confirmed ? (
                      <><Check className="w-4 h-4" /> Framework Applied!</>
                    ) : (
                      <span className="truncate px-1">
                        Apply {selectedFramework.shortName}
                        <span className="hidden sm:inline"> to "{bookTitle}"</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
