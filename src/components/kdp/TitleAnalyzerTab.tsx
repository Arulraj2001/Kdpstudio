import React, { useState, useEffect } from 'react';
import { Type, Sparkles, Check, TrendingUp, AlertCircle, Award, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { useBookStore } from '../../lib/store';

interface AlternativeTitle {
  title: string;
  subtitle: string;
  rationale: string;
  conversionFactor: string;
}

export const TitleAnalyzerTab: React.FC = () => {
  const { currentBook, updateBook } = useBookStore();

  const [title, setTitle] = useState(currentBook?.title || 'Echoes of Eternity');
  const [subtitle, setSubtitle] = useState(currentBook?.subtitle || '');
  const [genre, setGenre] = useState(currentBook?.genre || 'Fantasy & Sci-Fi');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  // Analysis state
  const [overallScore, setOverallScore] = useState<number>(88);
  const [scores, setScores] = useState({
    memorability: 90,
    searchability: 82,
    genreClarity: 92,
    emotionalAppeal: 88,
  });
  const [verdict, setVerdict] = useState(
    'Strong, evocative title with immediate genre punch and high reader intrigue.'
  );
  const [strengths, setStrengths] = useState<string[]>([
    'Immediate atmospheric tone matches current bestseller trends',
    'Concise rhythm makes it easy to remember and recommend',
    'Strong visual imagery creates instant curiosity',
  ]);
  const [improvements, setImprovements] = useState<string[]>([
    'Adding a targeted subtitle will boost Amazon organic search ranking',
    'Consider testing keyword-rich subtitle phrases for specific tropes',
  ]);
  const [alternatives, setAlternatives] = useState<AlternativeTitle[]>([
    {
      title: 'Echoes of the Forgotten',
      subtitle: 'A Gripping Dark Fantasy Novel',
      rationale: 'Clarifies subgenre immediately on search result thumbnail cards.',
      conversionFactor: '+18% search CTR',
    },
    {
      title: 'The Last Chronicle',
      subtitle: 'An Epic Tale of Betrayal and Destiny',
      rationale: 'Elevates stakes and promises high drama.',
      conversionFactor: '+24% emotional resonance',
    },
    {
      title: 'Shadows of Eternity',
      subtitle: 'Book 1 of the Awakening Series',
      rationale: 'Prepares readers for a lucrative multi-book series experience.',
      conversionFactor: '+30% read-through value',
    },
    {
      title: 'The Silent Threshold',
      subtitle: 'A Novel of Ancient Magic and Ruin',
      rationale: 'Deepens mystery and appeals directly to high-fantasy enthusiasts.',
      conversionFactor: '+15% buyer conversion',
    },
  ]);

  // Sync with current book
  useEffect(() => {
    if (currentBook) {
      setTitle(currentBook.title);
      setSubtitle(currentBook.subtitle || '');
      setGenre(currentBook.genre);
    }
  }, [currentBook?.id]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/kdp/analyze-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          genre,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.overallScore !== undefined) setOverallScore(data.overallScore);
        if (data.scores) setScores(data.scores);
        if (data.verdict) setVerdict(data.verdict);
        if (data.strengths) setStrengths(data.strengths);
        if (data.improvements) setImprovements(data.improvements);
        if (data.suggestedAlternatives) setAlternatives(data.suggestedAlternatives);
      }
    } catch (err) {
      console.error('Error analyzing title:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAlternative = (alt: AlternativeTitle, index: number) => {
    setTitle(alt.title);
    setSubtitle(alt.subtitle);
    if (currentBook) {
      updateBook(currentBook.id, {
        title: alt.title,
        subtitle: alt.subtitle,
      });
    }
    setAppliedIndex(index);
    setTimeout(() => setAppliedIndex(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div id="kdp-title-analyzer-tab" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Type size={18} className="text-purple-600" />
            <span>AI Book Title & Hook Optimizer</span>
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Analyzes title marketability, Amazon thumbnail click-through potential, subgenre signaling, and memorability
            against current bestselling titles.
          </p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 self-start md:self-center"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Evaluating Marketability...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>AI Analyze Title & Hook</span>
            </>
          )}
        </button>
      </div>

      {/* Input Box */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Book Title to Test</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Subtitle (Optional)</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. A Gripping Epic Fantasy Adventure"
            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Target Genre</label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Results Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Scores & Diagnostic Gaps (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* Overall Score Circle/Badge */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100">
            <div className="w-16 h-16 rounded-2xl bg-white border border-purple-200 flex flex-col items-center justify-center shadow-xs">
              <span className="text-2xl font-black text-purple-700">{overallScore}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">/ 100</span>
            </div>
            <div>
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} className="text-purple-600" />
                <span>Marketability Score</span>
              </span>
              <p className="text-xs text-slate-700 font-medium mt-0.5">{verdict}</p>
            </div>
          </div>

          {/* 4 Sub-Scores */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Algorithmic Sub-Metrics</h4>

            {/* 1. Memorability */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Memorability & Rhythm</span>
                <span className="text-slate-900">{scores.memorability}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${getProgressColor(scores.memorability)}`} style={{ width: `${scores.memorability}%` }}></div>
              </div>
            </div>

            {/* 2. Searchability */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Amazon SEO & Searchability</span>
                <span className="text-slate-900">{scores.searchability}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${getProgressColor(scores.searchability)}`} style={{ width: `${scores.searchability}%` }}></div>
              </div>
            </div>

            {/* 3. Genre Clarity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Genre Clarity & Tone</span>
                <span className="text-slate-900">{scores.genreClarity}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${getProgressColor(scores.genreClarity)}`} style={{ width: `${scores.genreClarity}%` }}></div>
              </div>
            </div>

            {/* 4. Emotional Appeal */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Emotional Appeal & Hook</span>
                <span className="text-slate-900">{scores.emotionalAppeal}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${getProgressColor(scores.emotionalAppeal)}`} style={{ width: `${scores.emotionalAppeal}%` }}></div>
              </div>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Key Title Strengths</span>
              </span>
              <ul className="space-y-1 text-slate-600 pl-5 list-disc">
                {strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-bold text-amber-800 flex items-center gap-1.5 mb-1.5">
                <AlertCircle size={13} className="text-amber-600" />
                <span>Optimization Opportunities</span>
              </span>
              <ul className="space-y-1 text-slate-600 pl-5 list-disc">
                {improvements.map((imp, idx) => (
                  <li key={idx}>{imp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: High-Converting Alternative Titles (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-600" />
                <span>AI Suggested High-Converting Variations</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Alternative title + subtitle pairs engineered for higher Amazon search click-through rates.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {alternatives.map((alt, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-purple-300 transition-all space-y-2 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="text-sm font-black text-slate-900 group-hover:text-purple-900">
                      {alt.title}
                    </h5>
                    {alt.subtitle && (
                      <p className="text-xs font-medium text-slate-600 italic mt-0.5">{alt.subtitle}</p>
                    )}
                  </div>

                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 self-start sm:self-center">
                    {alt.conversionFactor}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-snug">{alt.rationale}</p>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => handleApplyAlternative(alt, index)}
                    className="px-3 py-1.5 bg-white hover:bg-purple-600 hover:text-white text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    {appliedIndex === index ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span>Applied to Book!</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight size={13} />
                        <span>Apply to Book</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
