import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ChevronRight,
  Check,
  Sparkles,
  Target,
  Info,
  Layers,
  Sliders,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Compass,
  Zap,
} from 'lucide-react';
import {
  ALL_FRAMEWORKS,
  StoryFramework,
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
  currentWordTarget,
  onApplyFramework,
}) => {
  const [selectedFramework, setSelectedFramework] = useState<StoryFramework>(ALL_FRAMEWORKS[0]);
  const [expandedBeatId, setExpandedBeatId] = useState<string | null>(null);
  const [wordTarget, setWordTarget] = useState(currentWordTarget || 60000);
  const [step, setStep] = useState<'pick' | 'preview'>('pick');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const previewChapters = generateChaptersFromFramework(selectedFramework, bookTitle, wordTarget);

  const genreBadges: Record<string, { bg: string; text: string }> = {
    'Fiction (Any)': { bg: 'bg-purple-100', text: 'text-purple-700' },
    'Fantasy, Adventure, Epic Fiction': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'All Fiction': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    'Romance, Contemporary, RomCom': { bg: 'bg-pink-100', text: 'text-pink-700' },
    'Self-Help, Business, How-To': { bg: 'bg-amber-100', text: 'text-amber-700' },
    'Thriller, Mystery, Suspense, Crime': { bg: 'bg-rose-100', text: 'text-rose-700' },
  };

  const handleApply = () => {
    onApplyFramework(
      previewChapters.map((c) => ({
        title: c.title,
        targetWords: c.targetWords,
        beatPrompt: c.beatPrompt,
      }))
    );
    setConfirmed(true);
    setTimeout(() => {
      onClose();
      setConfirmed(false);
      setStep('pick');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full sm:max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">Story Beat Frameworks</h2>
              <p className="text-xs text-slate-500 truncate">
                Plotting structures &amp; chapter pacing for <span className="font-semibold text-purple-700">{bookTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 text-xs sm:text-sm">
          <button
            onClick={() => setStep('pick')}
            className={`flex-1 py-2.5 sm:py-3 font-semibold transition-colors border-b-2 px-3 ${
              step === 'pick'
                ? 'border-purple-600 text-purple-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
          >
            1. Select Framework
          </button>
          <button
            onClick={() => setStep('preview')}
            className={`flex-1 py-2.5 sm:py-3 font-semibold transition-colors border-b-2 px-3 ${
              step === 'preview'
                ? 'border-purple-600 text-purple-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}
          >
            2. Pacing &amp; Chapter Preview ({selectedFramework.beats.length} Beats)
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 'pick' && (
            <div className="space-y-5">
              {/* Framework Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_FRAMEWORKS.map((fw) => {
                  const badge = genreBadges[fw.genre] || { bg: 'bg-slate-100', text: 'text-slate-700' };
                  const isSelected = selectedFramework.id === fw.id;

                  return (
                    <button
                      key={fw.id}
                      onClick={() => {
                        setSelectedFramework(fw);
                        setExpandedBeatId(null);
                      }}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between overflow-hidden relative ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 shadow-sm ring-1 ring-purple-200'
                          : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">{fw.name}</h3>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2">by {fw.creditedTo}</p>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-3">{fw.description}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-auto">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} truncate max-w-[150px]`}>
                          {fw.genre}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono font-semibold shrink-0">
                          {fw.totalBeats} beats
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Framework Highlights Banner */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50/60 rounded-xl p-4 border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Compass className="w-4 h-4 text-purple-600 shrink-0" />
                    <h4 className="text-xs font-bold text-slate-900 truncate">Selected: {selectedFramework.name}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Includes {selectedFramework.totalBeats} structured story beats with built-in AI writing prompts.
                  </p>
                </div>

                <button
                  onClick={() => setStep('preview')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow transition-colors shrink-0"
                >
                  <span>Customize Pacing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-5">
              {/* Target Word Count Control Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">Manuscript Word Target</h3>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg self-start sm:self-auto font-mono">
                    {wordTarget.toLocaleString()} words total (~{Math.round(wordTarget / selectedFramework.beats.length).toLocaleString()}w / chapter)
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="range"
                    min={10000}
                    max={120000}
                    step={5000}
                    value={wordTarget}
                    onChange={(e) => setWordTarget(Number(e.target.value))}
                    className="flex-1 accent-purple-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                  <span className="text-slate-400 font-medium">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setWordTarget(15000)}
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-colors ${
                      wordTarget === 15000 ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Short Story (15K)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWordTarget(35000)}
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-colors ${
                      wordTarget === 35000 ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Novella (35K)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWordTarget(60000)}
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-colors ${
                      wordTarget === 60000 ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Standard Novel (60K)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWordTarget(90000)}
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-colors ${
                      wordTarget === 90000 ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Epic Novel (90K)
                  </button>
                </div>
              </div>

              {/* Notice */}
              <div className="flex items-start gap-2.5 bg-purple-50/80 border border-purple-200 rounded-xl p-3 text-xs">
                <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-purple-900 leading-relaxed">
                  <strong>Non-destructive:</strong> Applying will generate {previewChapters.length} outline chapters equipped with beat prompts. Your existing chapters remain completely intact.
                </p>
              </div>

              {/* Beat & Chapter Breakdown List */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Chapter Outline Breakdown ({selectedFramework.shortName})
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">Click to inspect AI writing prompts</span>
                </div>

                <div className="space-y-2">
                  {selectedFramework.beats.map((beat, idx) => {
                    const ch = previewChapters[idx] || { targetWords: Math.round(wordTarget / selectedFramework.beats.length) };
                    const isExpanded = expandedBeatId === beat.id;

                    return (
                      <div
                        key={beat.id}
                        className={`rounded-xl border transition-all overflow-hidden bg-white ${
                          isExpanded ? 'border-purple-300 shadow-sm ring-1 ring-purple-200' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedBeatId(isExpanded ? null : beat.id)}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">{beat.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                ~{beat.percentageIn}% in story
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{beat.description}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-semibold text-purple-700 font-mono">
                              ~{ch.targetWords.toLocaleString()}w
                            </span>
                          </div>

                          <ChevronRight
                            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                              isExpanded ? 'rotate-90 text-purple-600' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-3 pt-1 border-t border-slate-100 bg-purple-50/30 space-y-2 text-xs">
                            <p className="text-slate-700 leading-relaxed">{beat.description}</p>
                            <div className="bg-white rounded-lg p-2.5 border border-purple-200 flex items-start gap-2 shadow-2xs">
                              <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="font-bold text-purple-800 text-[11px] block mb-0.5">
                                  AI Chapter Writing Prompt:
                                </span>
                                <p className="text-slate-800 leading-relaxed">{beat.prompt}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('pick')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Choose Another</span>
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={confirmed}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all ${
                    confirmed ? 'bg-emerald-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {confirmed ? (
                    <>
                      <Check className="w-4 h-4" /> Framework Applied!
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>
                        Apply {selectedFramework.shortName} ({previewChapters.length} Chapters)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
