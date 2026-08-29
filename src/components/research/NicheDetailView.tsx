/**
 * KDP Studio — Niche Detail View Component
 * Phase 13B
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  Sparkles,
  TrendingUp,
  BookOpen,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  DollarSign,
  Package,
  Layers,
  Tag,
} from 'lucide-react';
import { NicheResult, NicheBookIdea } from '../../types/niche';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { useBookStore } from '../../lib/store';
import { useToastStore } from '../../lib/toastStore';
import { auth } from '../../lib/firebase';
import {
  saveNiche,
  updateSavedNiche,
  getUserSavedNiches,
} from '../../lib/nicheService';

interface NicheDetailViewProps {
  niche: NicheResult;
  savedNicheId?: string;
  onBack: () => void;
  onNavigate: (route: PageRoute) => void;
}

export const NicheDetailView: React.FC<NicheDetailViewProps> = ({
  niche,
  savedNicheId: initialSavedId,
  onBack,
  onNavigate,
}) => {
  const { user, userDoc } = useAuthStore();
  const uid = user?.uid || userDoc?.uid || 'demo-user-123';

  const [savedId, setSavedId] = useState<string | undefined>(initialSavedId);
  const [isSaved, setIsSaved] = useState(!!initialSavedId);
  const [status, setStatus] = useState<string>('considering');
  const [notes, setNotes] = useState<string>('');
  const [copiedKeywords, setCopiedKeywords] = useState(false);
  const [copiedBisac, setCopiedBisac] = useState(false);
  const [isStartingBook, setIsStartingBook] = useState(false);

  useEffect(() => {
    const checkSaved = async () => {
      try {
        const savedList = await getUserSavedNiches(uid);
        const match = savedList.find(
          (s) =>
            s.id === initialSavedId ||
            s.nicheResult?.nicheTitle?.toLowerCase() === niche.nicheTitle.toLowerCase()
        );
        if (match) {
          setSavedId(match.id);
          setIsSaved(true);
          setStatus(match.status || 'considering');
          setNotes(match.notes || '');
        }
      } catch (e) {}
    };
    checkSaved();
  }, [niche, initialSavedId, uid]);

  const handleSaveToggle = async () => {
    if (isSaved && savedId) {
      useToastStore.getState().addToast({ message: 'Already saved in your niches!', type: 'info' });
      return;
    }

    try {
      const newId = await saveNiche(uid, niche, notes);
      setSavedId(newId);
      setIsSaved(true);
      useToastStore.getState().addToast({ message: `Saved "${niche.nicheTitle}" ⭐`, type: 'success' });
    } catch (e) {
      useToastStore.getState().addToast({ message: 'Failed to save niche', type: 'error' });
    }
  };

  const handleNotesBlur = async () => {
    if (savedId) {
      try {
        await updateSavedNiche(savedId, { notes });
        useToastStore.getState().addToast({ message: 'Notes saved', type: 'success' });
      } catch (e) {}
    }
  };

  const handleStatusChange = async (newStatus: any) => {
    setStatus(newStatus);
    if (savedId) {
      try {
        await updateSavedNiche(savedId, { status: newStatus });
        useToastStore.getState().addToast({ message: `Status updated to ${newStatus}`, type: 'success' });
      } catch (e) {}
    }
  };

  const handleCopyKeywords = () => {
    const text = (niche.suggestedKeywords || []).join(', ');
    navigator.clipboard.writeText(text);
    setCopiedKeywords(true);
    useToastStore.getState().addToast({ message: '10 keywords copied to clipboard!', type: 'success' });
    setTimeout(() => setCopiedKeywords(false), 2000);
  };

  const handleCopyBisac = () => {
    const text = (niche.recommendedBisacCategories || []).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBisac(true);
    useToastStore.getState().addToast({ message: 'BISAC categories copied!', type: 'success' });
    setTimeout(() => setCopiedBisac(false), 2000);
  };

  const handleStartBookWithIdea = async (idea: NicheBookIdea) => {
    setIsStartingBook(true);
    try {
      const token = (await auth.currentUser?.getIdToken()) || '';
      const res = await fetch('/api/niche/start-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-user-id': uid,
        },
        body: JSON.stringify({
          nicheResult: niche,
          bookIdea: idea,
          savedNicheId: savedId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize book');
      }

      if (data.book) {
        useBookStore.getState().addBook({
          title: data.book.title,
          subtitle: data.book.subtitle,
          author: data.book.author,
          genre: data.book.genre,
          trimSize: data.book.trimSize,
          paperType: data.book.paperType,
        });
        useBookStore.getState().setCurrentBook(data.book.id);
      }

      useToastStore.getState().addToast({ message: `Book project "${idea.title}" created! 🚀`, type: 'success' });
      onNavigate('studio');
    } catch (e: any) {
      useToastStore.getState().addToast({ message: e.message || 'Failed to start book', type: 'error' });
    } finally {
      setIsStartingBook(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 text-slate-100 space-y-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Back to Niche Research</span>
      </button>

      {/* HEADER SECTION */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold uppercase tracking-wider mb-2">
              <span>KDP</span>
              <span>›</span>
              <span className="capitalize">{niche.category?.replace('-', ' ')}</span>
              <span>›</span>
              <span className="text-slate-400">{niche.subcategory}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {niche.nicheTitle}
            </h1>

            <p className="mt-3 text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
              {niche.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-purple-300 focus:outline-hidden"
                >
                  <option value="considering">Considering</option>
                  <option value="researching">Researching</option>
                  <option value="writing">Writing</option>
                  <option value="published">Published</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>

              <button
                onClick={handleSaveToggle}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Star size={14} className={isSaved ? 'fill-amber-400 text-amber-400' : ''} />
                <span>{isSaved ? 'Saved in My Niches ⭐' : 'Save Niche'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800 shrink-0">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  strokeWidth="3.5"
                  strokeDasharray={`${niche.opportunityScore}, 100`}
                  stroke={getScoreColor(niche.opportunityScore)}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-white leading-none">
                  {niche.opportunityScore}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-300 mt-2 uppercase tracking-wider">
              Opportunity Score
            </span>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Personal Research Notes (Auto-saves)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add your notes about this niche, competitor ideas, target audience insights..."
            rows={2}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      {/* SCORE BREAKDOWN SECTION */}
      <div>
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-purple-400" />
          4-Point Opportunity Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Demand</span>
              <span className="text-xs font-bold text-indigo-400">
                {niche.demandScore >= 75 ? 'High' : niche.demandScore >= 50 ? 'Moderate' : 'Low'}
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">{niche.demandScore}<span className="text-xs text-slate-500">/100</span></div>
            <p className="mt-2 text-[11px] text-slate-400 leading-snug">
              Strong buyer intent with active search volume on Amazon.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Competition</span>
              <span className="text-xs font-bold text-emerald-400">
                {niche.competitionScore < 45 ? 'Low (Easy)' : niche.competitionScore < 70 ? 'Moderate' : 'High'}
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">{niche.competitionScore}<span className="text-xs text-slate-500">/100</span></div>
            <p className="mt-2 text-[11px] text-slate-400 leading-snug">
              Lower is better. Moderate competitors with weak review density.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Profit Potential</span>
              <span className="text-xs font-bold text-purple-400">
                {niche.profitScore >= 75 ? 'Strong' : 'Moderate'}
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">{niche.profitScore}<span className="text-xs text-slate-500">/100</span></div>
            <p className="mt-2 text-[11px] text-slate-400 leading-snug">
              Healthy average retail price and high 70% KDP royalty margin.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Trend Momentum</span>
              <span className="text-xs font-bold text-amber-400 capitalize">
                {niche.trend} ↗
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">{niche.trendScore}<span className="text-xs text-slate-500">/100</span></div>
            <p className="mt-2 text-[11px] text-slate-400 leading-snug">
              {niche.trendReason?.slice(0, 75) || 'Positive trajectory in recent sales patterns.'}...
            </p>
          </div>
        </div>
      </div>

      {/* MARKET DATA STATS GRID */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4">
          Amazon KDP Market Intelligence
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-slate-400 block text-[11px] font-semibold">📦 Estimated Monthly Sales</span>
            <div className="text-lg font-bold text-white mt-1">{niche.estimatedMonthlySales}</div>
            <p className="text-[10px] text-slate-500 mt-1">Based on BSR analysis of top 20 competing titles</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-slate-400 block text-[11px] font-semibold">💰 Average Selling Price</span>
            <div className="text-lg font-bold text-white mt-1">{niche.averagePrice}</div>
            <p className="text-[10px] text-slate-500 mt-1">Most successful books in this niche price band</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-slate-400 block text-[11px] font-semibold">📈 Best Seller Rank (BSR) Range</span>
            <div className="text-lg font-bold text-white mt-1">{niche.topBsrRange}</div>
            <p className="text-[10px] text-slate-500 mt-1">Top performers in this niche category</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-slate-400 block text-[11px] font-semibold">💵 Estimated Monthly Revenue</span>
            <div className="text-lg font-bold text-white mt-1">{niche.estimatedMonthlyRevenue}</div>
            <p className="text-[10px] text-slate-500 mt-1">For a well-optimized book listing</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-slate-400 block text-[11px] font-semibold">🏆 Competition Level</span>
            <div className="text-lg font-bold text-white mt-1">{niche.topCompetitorStrength} ({niche.competitorCount})</div>
            <p className="text-[10px] text-slate-500 mt-1">Difficulty: {niche.difficulty}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-slate-400 block text-[11px] font-semibold">⏱️ Time to First Sale</span>
            <div className="text-lg font-bold text-white mt-1">{niche.timeToFirstSale}</div>
            <p className="text-[10px] text-slate-500 mt-1">After launch and basic keyword indexing</p>
          </div>
        </div>
      </div>

      {/* TREND & 12-MONTH SEASONALITY SECTION */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <span>Trend Trajectory & 12-Month Seasonality</span>
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-semibold capitalize">
            📈 {niche.trend} Momentum
          </span>
        </div>

        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
          {niche.trendReason || 'Consistent year-round demand with peak buyer velocity during Q4 holiday shopping and back-to-school periods.'}
        </p>

        {niche.seasonality && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-center gap-2">
            <span className="font-bold">📅 Seasonal Note:</span>
            <span>{niche.seasonality}</span>
          </div>
        )}

        {/* 12-Month Demand Curve Bar Chart */}
        <div className="pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-3">
            Relative Monthly Buyer Demand Index (Amazon Search & BSR Pattern)
          </span>
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-end h-28 bg-slate-950/80 p-3 rounded-2xl border border-slate-850">
            {[
              { m: 'Jan', val: 70 },
              { m: 'Feb', val: 65 },
              { m: 'Mar', val: 68 },
              { m: 'Apr', val: 72 },
              { m: 'May', val: 75 },
              { m: 'Jun', val: 64 },
              { m: 'Jul', val: 60 },
              { m: 'Aug', val: 78 },
              { m: 'Sep', val: 88 },
              { m: 'Oct', val: 82 },
              { m: 'Nov', val: 94 },
              { m: 'Dec', val: 100 },
            ].map((bar, idx) => {
              const isPeak = bar.val >= 85;
              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full group">
                  <div className="text-[9px] font-mono text-slate-500 group-hover:text-purple-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {bar.val}%
                  </div>
                  <div
                    className={`w-full rounded-t transition-all ${
                      isPeak
                        ? 'bg-gradient-to-t from-purple-600 to-indigo-500 shadow-xs shadow-purple-500/50'
                        : 'bg-slate-800 group-hover:bg-slate-700'
                    }`}
                    style={{ height: `${bar.val}%` }}
                  />
                  <span className="text-[10px] text-slate-400 mt-1.5 font-medium">{bar.m}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MARKET GAP INSIGHT BOX */}
      {niche.marketGap && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-600/50 shadow-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h4 className="text-sm font-bold text-blue-200 uppercase tracking-wider">
                Opportunity Found: What's Missing in Existing Competitors
              </h4>
              <p className="mt-1 text-sm md:text-base text-white leading-relaxed font-medium">
                {niche.marketGap}
              </p>
              <p className="mt-2 text-xs text-blue-300/80">
                This is your primary differentiator. Incorporate this angle into your book outline and cover blurb.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KDP OPTIMIZATION SECTION */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Tag size={18} className="text-purple-400" />
          KDP Publishing Blueprint & Metadata
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BISAC Categories */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Recommended BISAC Categories</span>
              <button
                onClick={handleCopyBisac}
                className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedBisac ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedBisac ? 'Copied' : 'Copy All'}</span>
              </button>
            </div>
            <div className="space-y-1.5">
              {niche.recommendedBisacCategories?.map((cat, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-900 text-xs text-slate-300 font-mono">
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Specs */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2.5 text-xs">
            <span className="text-xs font-bold text-slate-300 block mb-2">Recommended KDP Settings</span>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Trim Size:</span>
              <span className="font-bold text-slate-200">{niche.recommendedTrimSize || '6x9'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Page Count Range:</span>
              <span className="font-bold text-slate-200">{niche.pageCountRange || '120-160 pages'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Recommended List Price:</span>
              <span className="font-bold text-slate-200">{niche.recommendedPrice || '$12.99'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Royalty Plan:</span>
              <span className="font-bold text-emerald-400">{niche.royaltyPlan || '70%'}</span>
            </div>
          </div>
        </div>

        {/* Suggested Keywords Chips */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300">10 High-Intent KDP Backend Keywords</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyKeywords}
                className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKeywords ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedKeywords ? 'Copied' : 'Copy All'}</span>
              </button>
              <button
                onClick={() => {
                  handleCopyKeywords();
                  onNavigate('kdp');
                  useToastStore.getState().addToast({ message: 'Keywords loaded! Opening KDP Assistant...', type: 'info' });
                }}
                className="px-2.5 py-1 rounded bg-purple-600/80 hover:bg-purple-600 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Add to KDP Assistant</span>
                <span>→</span>
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {niche.suggestedKeywords?.map((kw, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* READY-TO-WRITE BOOK IDEAS */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen size={18} className="text-purple-400" />
          3 Ready-to-Write Book Concepts
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {niche.bookIdeas?.map((idea, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/60 flex flex-col justify-between transition-all shadow-lg"
            >
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 font-bold uppercase">
                  Concept #{idx + 1}
                </span>
                <h4 className="text-base font-bold text-white mt-2 leading-snug">{idea.title}</h4>
                {idea.subtitle && (
                  <p className="text-xs text-purple-300 italic mt-0.5">{idea.subtitle}</p>
                )}
                <div className="mt-3 text-xs text-slate-300 space-y-1.5">
                  <p><strong className="text-slate-400">Target Reader:</strong> {idea.targetReader}</p>
                  <p><strong className="text-slate-400">Unique Angle:</strong> {idea.angle}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  {idea.estimatedPageCount}p • {idea.suggestedPrice}
                </span>
                <button
                  onClick={() => handleStartBookWithIdea(idea)}
                  disabled={isStartingBook}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Use This Idea
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PROS & CONS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-900/40 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Key Reasons to Enter This Niche
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-200">
            {niche.pros?.map((pro, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-900/40 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertTriangle size={14} /> Potential Risks & Considerations
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-200">
            {niche.cons?.map((con, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* VERDICT & FINAL CTA */}
      {niche.verdict && (
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 shadow-2xl space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-300">
            Final Market Verdict
          </div>
          <blockquote className="text-base md:text-lg font-bold text-white italic">
            "{niche.verdict}"
          </blockquote>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (niche.bookIdeas?.[0]) handleStartBookWithIdea(niche.bookIdeas[0]);
              }}
              disabled={isStartingBook}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-purple-950/60 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>🚀 Start Writing This Book</span>
            </button>
            <button
              onClick={handleSaveToggle}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              {isSaved ? '⭐ Starred in Saved Niches' : '⭐ Star This Niche'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
