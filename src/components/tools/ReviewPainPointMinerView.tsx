import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Lightbulb, 
  BookOpen, 
  ShieldAlert, 
  Download, 
  Copy, 
  Check, 
  ArrowRight,
  TrendingUp,
  Layers
} from 'lucide-react';
import { mineCustomerReviews, ReviewMiningReport } from '../../lib/reviewMinerEngine';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';

interface ReviewPainPointMinerViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const ReviewPainPointMinerView: React.FC<ReviewPainPointMinerViewProps> = ({ onNavigate }) => {
  const [topic, setTopic] = useState<string>('Sudoku & Brain Puzzles for Seniors');
  const [report, setReport] = useState<ReviewMiningReport>(() => mineCustomerReviews('Sudoku & Brain Puzzles for Seniors'));
  const [isMining, setIsMining] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleMine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsMining(true);
    setTimeout(() => {
      setReport(mineCustomerReviews(topic));
      setIsMining(false);
    }, 450);
  };

  const handleQuickNiche = (niche: string) => {
    setTopic(niche);
    setReport(mineCustomerReviews(niche));
  };

  const handleCopyBlueprint = () => {
    const text = `AI Counter-Strategy Blueprint (${report.targetTopic})
Recommended Title: ${report.aiOpportunityBlueprint.recommendedTitleFormula}
Target Specs: ${report.aiOpportunityBlueprint.targetPageCount} Pages | ${report.aiOpportunityBlueprint.recommendedTrimSize}
Unfair Advantage Hook: "${report.aiOpportunityBlueprint.unfairAdvantageHook}"

Must-Have Solutions to Beat Competitors:
${report.aiOpportunityBlueprint.mustHaveFeatures.map(f => `• ${f}`).join('\n')}

Critical Pitfalls to Avoid:
${report.aiOpportunityBlueprint.criticalPitfallsToAvoid.map(p => `• ${p}`).join('\n')}

Mined with KDP Studio Review & Customer Pain-Point Engine`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20 font-sans">
      <SEOHead
        pageKey="features"
        title="Customer Pain-Point & Negative Review Miner — KDP Studio"
        description="Mine 1-star, 2-star, and 3-star reviews from competitor books. Turn reader complaints into bestselling book blueprints."
        canonicalPath="/tools/review-miner"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <AlertOctagon size={14} className="text-rose-400" />
            <span>Complaint Semantic Classifier</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Negative Review &amp; <span className="font-serif italic font-normal text-purple-400">Customer Pain-Point Miner</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Scan negative 1–3 star customer reviews on Amazon to discover why readers return competitor books. Turn their complaints into your unfair competitive advantage.
          </p>

          {/* Search Form */}
          <form onSubmit={handleMine} className="max-w-2xl mx-auto pt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter niche topic or genre (e.g. Coloring Book for Toddlers, Gratitude Journal)..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/15 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isMining}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95 shrink-0"
            >
              <span>{isMining ? 'Mining Reviews...' : 'Mine Pain Points'}</span>
              <Sparkles size={16} />
            </button>
          </form>

          {/* Quick Click Samples */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
            <span>Explore niches:</span>
            {[
              'Mindfulness Coloring Books',
              'Sudoku & Brain Puzzles for Seniors',
              'Guided Prayer Journal',
              'Beginner Mediterranean Cookbook',
              'Habit Tracker for ADHD Adults'
            ].map((niche) => (
              <button
                key={niche}
                type="button"
                onClick={() => handleQuickNiche(niche)}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-purple-300 transition-colors cursor-pointer"
              >
                {niche}
              </button>
            ))}
          </div>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-8">
        
        {/* Metric Summary Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Competitors Scanned</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{report.competitorsAnalyzed} Amazon Bestsellers</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Negative Reviews Analyzed</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{report.totalNegativeReviewsScanned} Critical Reviews</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Competitor Rating</span>
            <div className="text-2xl font-black text-amber-500 mt-1">⭐ {report.averageCompetitorRating} / 5.0</div>
          </div>
        </div>

        {/* ── SECTION 1: CLUSTERED PAIN POINTS ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-600" />
                <span>Top Recurring Customer Complaints in "{report.targetTopic}"</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real customer feedback patterns extracted from 1-star, 2-star, and 3-star Amazon reviews.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              {report.painPoints.length} Critical Faults Identified
            </span>
          </div>

          <div className="space-y-4">
            {report.painPoints.map((item, idx) => (
              <div key={item.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{item.categoryLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      item.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.severity} Impact ({item.frequencyPercentage}% of complaints)
                    </span>
                  </div>
                </div>

                {/* Sample Customer Quote */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs italic text-slate-700 leading-relaxed">
                  "{item.sampleQuote}"
                </div>

                {/* How KDP Studio Solves It */}
                <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-900">KDP Studio Counter-Strategy: </strong>
                    <span>{item.solutionBlueprint}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 2: AI WINNING BLUEPRINT ── */}
        <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-purple-800/40 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30">
                <Sparkles size={13} className="text-purple-400" />
                <span>AI Synthesized Counter-Strategy</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white mt-2 font-display">
                Your Bestseller <span className="font-serif italic font-normal text-purple-300">Winning Blueprint</span>
              </h3>
            </div>

            <button
              type="button"
              onClick={handleCopyBlueprint}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer inline-flex items-center gap-2 shrink-0"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Blueprint Copied!' : 'Copy Blueprint'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Must Have Features */}
            <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/10">
              <div className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Must-Have Competitive Features</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                {report.aiOpportunityBlueprint.mustHaveFeatures.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Pitfalls */}
            <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/10">
              <div className="font-bold text-rose-300 text-sm flex items-center gap-2">
                <XCircle size={16} />
                <span>Fatal Pitfalls to Avoid</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                {report.aiOpportunityBlueprint.criticalPitfallsToAvoid.map((pit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{pit}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Target Specifications */}
          <div className="p-4 rounded-2xl bg-purple-900/40 border border-purple-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-purple-200">Recommended Trim &amp; Size: </span>
              <strong className="text-white">{report.aiOpportunityBlueprint.recommendedTrimSize} ({report.aiOpportunityBlueprint.targetPageCount} Pages)</strong>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer inline-flex items-center gap-2 shrink-0"
              >
                <span>Generate This Book</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
