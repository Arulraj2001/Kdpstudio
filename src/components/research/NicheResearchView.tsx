/**
 * KDP Studio — Niche Research Main Workspace View
 * Phase 13B
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  TrendingUp,
  Flame,
  Star,
  BookOpen,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  BarChart2,
  Copy,
  Trash2,
  RotateCcw,
  Zap,
  Tag,
  ExternalLink,
} from 'lucide-react';
import {
  NicheResult,
  NicheCategory,
  NicheTargetMarket,
  NicheBookIdea,
  TrendingNichePreview,
  SavedNiche,
  NicheSearchHistory,
  NICHE_CATEGORIES,
} from '../../types/niche';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { useBookStore } from '../../lib/store';
import { useToastStore } from '../../lib/toastStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { useUpgradeModal } from '../../lib/upgradeModalStore';
import { auth } from '../../lib/firebase';
import {
  getUserSavedNiches,
  getUserSearchHistory,
  saveNiche,
  deleteSavedNiche,
  updateSavedNiche,
  checkHourlyRateLimit,
} from '../../lib/nicheService';

interface NicheResearchViewProps {
  onNavigate: (route: PageRoute, params?: Record<string, string>) => void;
  initialQuery?: string;
  initialCategory?: NicheCategory | 'all';
  onSelectNicheDetail?: (niche: NicheResult, savedNicheId?: string) => void;
}

const LOADING_STEPS = [
  'Searching Amazon categories...',
  'Analyzing competition levels...',
  'Calculating opportunity scores...',
  'Finding profitable angles...',
  'Generating book ideas...',
];

const MARKETPLACES: { id: NicheTargetMarket; label: string; flag: string }[] = [
  { id: 'amazon-us', label: 'Amazon US', flag: '🇺🇸' },
  { id: 'amazon-uk', label: 'Amazon UK', flag: '🇬🇧' },
  { id: 'amazon-ca', label: 'Amazon CA', flag: '🇨🇦' },
  { id: 'amazon-in', label: 'Amazon IN', flag: '🇮🇳' },
];

export const NicheResearchView: React.FC<NicheResearchViewProps> = ({
  onNavigate,
  initialQuery = '',
  initialCategory = 'all',
  onSelectNicheDetail,
}) => {
  const { user, userDoc } = useAuthStore();
  const plan = userDoc?.plan || 'free';
  const isPro = ['pro', 'agency', 'lifetime'].includes(plan);

  // Search Controls State
  const [queryText, setQueryText] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<NicheCategory | 'all'>(initialCategory);
  const [targetMarket, setTargetMarket] = useState<NicheTargetMarket>('amazon-us');
  const [resultCount, setResultCount] = useState<number>(5);

  // Quick Score State
  const [quickInput, setQuickInput] = useState('');
  const [isQuickLoading, setIsQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState<NicheResult | null>(null);

  // Main Analysis State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [activeQuery, setActiveQuery] = useState('');
  const [results, setResults] = useState<NicheResult[]>([]);
  const [sortBy, setSortBy] = useState<'opportunity' | 'demand' | 'competition' | 'profit'>('opportunity');
  const [expandedIdeas, setExpandedIdeas] = useState<Record<string, boolean>>({});

  // Right Column: Saved Niches & History
  const [savedNiches, setSavedNiches] = useState<SavedNiche[]>([]);
  const [savedFilter, setSavedFilter] = useState<'all' | 'considering' | 'researching' | 'writing' | 'published'>('all');
  const [searchHistory, setSearchHistory] = useState<NicheSearchHistory[]>([]);

  // Trending Niches
  const [trendingNiches, setTrendingNiches] = useState<TrendingNichePreview[]>([]);
  const [trendingUpdatedAt, setTrendingUpdatedAt] = useState<string>('');

  // Start Book Modal State
  const [selectedIdeaModal, setSelectedIdeaModal] = useState<{
    niche: NicheResult;
    idea: NicheBookIdea;
    savedNicheId?: string;
  } | null>(null);
  const [isStartingBook, setIsStartingBook] = useState(false);

  const uid = user?.uid || userDoc?.uid || 'demo-user-123';

  useEffect(() => {
    loadSavedNiches();
    loadSearchHistory();
    loadTrendingNiches();
  }, [uid]);

  // Handle URL param initial search
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length > 0 && !results.length && !isLoading) {
      setQueryText(initialQuery);
      if (isPro) {
        handleAnalyze(initialQuery, initialCategory);
      }
    }
  }, [initialQuery, isPro]);

  // Loading animation message cycler
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2500);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const loadSavedNiches = async () => {
    try {
      const data = await getUserSavedNiches(uid);
      setSavedNiches(data);
    } catch (e) {
      console.warn('Failed to load saved niches:', e);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const history = await getUserSearchHistory(uid);
      setSearchHistory(history);
    } catch (e) {
      console.warn('Failed to load search history:', e);
    }
  };

  const loadTrendingNiches = async () => {
    const CACHE_KEY = 'kdp_trending_niches_browser_cache';
    const SIX_HOURS = 6 * 60 * 60 * 1000;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < SIX_HOURS && parsed.niches?.length) {
          setTrendingNiches(parsed.niches);
          setTrendingUpdatedAt(parsed.updatedAt || 'Recent');
          return;
        }
      }
    } catch {}

    try {
      const res = await fetch('/api/niche/trending');
      const data = await res.json();
      if (data.success && Array.isArray(data.niches)) {
        setTrendingNiches(data.niches);
        setTrendingUpdatedAt(data.updatedAt);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            niches: data.niches,
            updatedAt: data.updatedAt,
            timestamp: Date.now(),
          })
        );
      }
    } catch (e) {
      console.warn('Failed to load trending niches:', e);
    }
  };

  const handleAnalyze = async (searchTopic?: string, categoryFilter?: NicheCategory | 'all') => {
    const q = searchTopic !== undefined ? searchTopic : queryText;
    const cat = categoryFilter !== undefined ? categoryFilter : selectedCategory;

    if (!q || q.trim().length === 0) {
      useToastStore.getState().addToast({ message: 'Please enter a niche or topic to analyze.', type: 'warning' });
      return;
    }

    if (!isPro) {
      useUpgradeModal.getState().open({ trigger: 'feature_locked', feature: 'nicheResearch', requiredPlan: 'pro' });
      return;
    }

    const rate = await checkHourlyRateLimit(uid);
    if (!rate.allowed) {
      useToastStore.getState().addToast({
        message: `Hourly limit reached (max 5 searches/hr). Resets in ~${rate.resetMinutes} min.`,
        type: 'warning',
      });
      return;
    }

    setIsLoading(true);
    setActiveQuery(q);
    setQuickResult(null);

    try {
      const token = (await auth.currentUser?.getIdToken()) || '';
      const response = await fetch('/api/niche/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-user-id': uid,
        },
        body: JSON.stringify({
          query: q,
          category: cat,
          targetMarket,
          resultCount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.code === 'HOURLY_RATE_LIMIT') {
          useToastStore.getState().addToast({ message: data.error || 'Hourly search rate limit reached', type: 'warning' });
        } else {
          throw new Error(data.error || 'Failed to analyze niche');
        }
        return;
      }

      setResults(data.results || []);
      useToastStore.getState().addToast({ message: `Found ${data.results?.length || 0} profitable niches!`, type: 'success' });
      loadSearchHistory();
    } catch (err: any) {
      console.error('Analysis error:', err);
      useToastStore.getState().addToast({ message: err.message || 'Failed to complete niche analysis.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickScore = async () => {
    if (!quickInput.trim()) return;

    if (!isPro) {
      useUpgradeModal.getState().open({ trigger: 'feature_locked', feature: 'nicheResearch', requiredPlan: 'pro' });
      return;
    }

    setIsQuickLoading(true);
    try {
      const token = (await auth.currentUser?.getIdToken()) || '';
      const response = await fetch('/api/niche/quick-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-user-id': uid,
        },
        body: JSON.stringify({ niche: quickInput }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Quick score failed');
      }

      setQuickResult(data.result);
      useToastStore.getState().addToast({ message: 'Quick Score ready!', type: 'success' });
    } catch (err: any) {
      console.error('Quick score error:', err);
      useToastStore.getState().addToast({ message: err.message || 'Quick score failed', type: 'error' });
    } finally {
      setIsQuickLoading(false);
    }
  };

  const isNicheSaved = (title: string): boolean => {
    return savedNiches.some((s) => s.nicheResult?.nicheTitle?.toLowerCase() === title.toLowerCase());
  };

  const handleSaveNiche = async (niche: NicheResult) => {
    if (isNicheSaved(niche.nicheTitle)) {
      useToastStore.getState().addToast({ message: 'Already saved in your niches!', type: 'info' });
      return;
    }

    try {
      await saveNiche(uid, niche);
      await loadSavedNiches();
      useToastStore.getState().addToast({ message: `Saved "${niche.nicheTitle}" ⭐`, type: 'success' });
    } catch (e: any) {
      useToastStore.getState().addToast({ message: 'Failed to save niche', type: 'error' });
    }
  };

  const handleSaveAllResults = async () => {
    let savedCount = 0;
    for (const r of results) {
      if (!isNicheSaved(r.nicheTitle)) {
        await saveNiche(uid, r);
        savedCount++;
      }
    }
    await loadSavedNiches();
    useToastStore.getState().addToast({ message: `Saved ${savedCount} new niches to your starred list!`, type: 'success' });
  };

  const handleDeleteSavedNiche = async (savedId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSavedNiche(savedId);
      setSavedNiches((prev) => prev.filter((s) => s.id !== savedId));
      useToastStore.getState().addToast({ message: 'Niche removed from saved.', type: 'info' });
    } catch (e) {
      useToastStore.getState().addToast({ message: 'Failed to delete saved niche', type: 'error' });
    }
  };

  const handleUpdateStatus = async (savedId: string, status: any, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    try {
      await updateSavedNiche(savedId, { status });
      setSavedNiches((prev) =>
        prev.map((s) => (s.id === savedId ? { ...s, status } : s))
      );
      useToastStore.getState().addToast({ message: `Status updated to ${status}`, type: 'success' });
    } catch (e) {
      useToastStore.getState().addToast({ message: 'Failed to update status', type: 'error' });
    }
  };

  const handleStartBookConfirm = async () => {
    if (!selectedIdeaModal) return;
    const { niche, idea, savedNicheId } = selectedIdeaModal;

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
          savedNicheId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to start book');
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

      useToastStore.getState().addToast({ message: `Book project "${idea.title}" initialized! 🚀`, type: 'success' });
      setSelectedIdeaModal(null);

      if (niche.category === 'coloring-books') {
        onNavigate('coloring');
      } else if (niche.category === 'puzzle-books') {
        onNavigate('puzzles');
      } else {
        onNavigate('studio');
      }
    } catch (err: any) {
      console.error('Error starting book from niche:', err);
      useToastStore.getState().addToast({ message: err.message || 'Failed to start book', type: 'error' });
    } finally {
      setIsStartingBook(false);
    }
  };

  const sortedResults = useMemo(() => {
    const list = [...results];
    switch (sortBy) {
      case 'opportunity':
        return list.sort((a, b) => b.opportunityScore - a.opportunityScore);
      case 'demand':
        return list.sort((a, b) => b.demandScore - a.demandScore);
      case 'competition':
        return list.sort((a, b) => a.competitionScore - b.competitionScore);
      case 'profit':
        return list.sort((a, b) => b.profitScore - a.profitScore);
      default:
        return list;
    }
  }, [results, sortBy]);

  const filteredSavedNiches = useMemo(() => {
    if (savedFilter === 'all') return savedNiches;
    return savedNiches.filter((s) => s.status === savedFilter);
  }, [savedNiches, savedFilter]);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 bg-emerald-950/80 border-emerald-600/60';
    if (score >= 40) return 'text-amber-400 bg-amber-950/80 border-amber-600/60';
    return 'text-rose-400 bg-rose-950/80 border-rose-600/60';
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'very-easy':
      case 'easy':
        return 'text-emerald-400 bg-emerald-950/50 border-emerald-700/50';
      case 'medium':
        return 'text-amber-400 bg-amber-950/50 border-amber-700/50';
      default:
        return 'text-rose-400 bg-rose-950/50 border-rose-700/50';
    }
  };

  return (
    <div className="min-h-screen pb-16 text-slate-100">
      {/* PLAN GATE BANNER */}
      {!isPro && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-950/90 border border-purple-500/40 p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Search size={220} />
          </div>
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Lock size={13} /> Pro Feature
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Niche Research is a Pro Feature
            </h1>
            <p className="mt-2 text-sm md:text-base text-purple-200/90 max-w-2xl leading-relaxed">
              Find profitable KDP niches before you write a single word. Powered by Gemini AI with live Amazon web data grounding to pinpoint buyer demand and competition gaps.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm text-purple-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Opportunity scores & demand metrics for any niche</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Real Amazon competition & pricing analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>3 customized book ideas per niche, ready to write</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>12 trending KDP niches updated daily</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => useCheckoutStore.getState().open('pro', 'annual')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold shadow-lg shadow-purple-900/50 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={18} />
                <span>Upgrade to Pro — Unlock Full Research</span>
              </button>
              <button
                onClick={() => onNavigate('pricing')}
                className="px-4 py-3 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-400/30 text-purple-200 text-sm font-medium transition-colors cursor-pointer"
              >
                View Plans & Features
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40">
              <Search size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                AI Niche Research
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300 font-semibold uppercase">
                  Pro Engine
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                Discover high-demand, low-competition Amazon KDP book niches with real-time web grounding.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => onNavigate('research-saved')}
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Star size={14} className="text-amber-400 fill-amber-400/20" />
            <span>Manage Saved Niches ({savedNiches.length})</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${!isPro ? 'opacity-70 pointer-events-none select-none' : ''}`}>
        
        {/* LEFT COLUMN (65% -> col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECTION 1: SEARCH BAR CARD */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 md:p-6 shadow-xl backdrop-blur-md">
            <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-2">
              Market Intelligence Search
            </label>

            <div className="relative flex items-center">
              <Search className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="Search any niche... e.g. 'anxiety journals', 'keto recipes', 'kids mindfulness'"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-950/80 border border-slate-700/90 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm md:text-base font-medium shadow-inner transition-all"
              />
            </div>

            {/* Filters Row */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Category Filter</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                >
                  <option value="all">All Categories</option>
                  {NICHE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Amazon Marketplace</label>
                <select
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                >
                  {MARKETPLACES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.flag} {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Depth & Speed</label>
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setResultCount(num)}
                      className={`flex-1 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        resultCount === num
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {num} {num === 3 ? '(fast)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => handleAnalyze()}
                disabled={isLoading}
                className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-purple-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Live Market Data...</span>
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    <span>Analyze Niches with Web Grounding</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Score Section */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-medium shrink-0">
                <Zap size={15} className="text-amber-400 fill-amber-400" />
                <span>Instant Quick Score:</span>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickScore()}
                  placeholder="Type specific niche... e.g. 'nursing pharmacology flashcards'"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-amber-500"
                />
                <button
                  onClick={handleQuickScore}
                  disabled={isQuickLoading || !quickInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold shrink-0 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {isQuickLoading ? 'Scoring...' : 'Score'}
                </button>
              </div>
            </div>

            {/* Inline Quick Score Card Result */}
            {quickResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-amber-500/40 shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                        Quick Evaluation
                      </span>
                      <h4 className="text-sm font-bold text-white">{quickResult.nicheTitle}</h4>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{quickResult.verdict}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl border text-center font-bold ${getScoreBadgeColor(quickResult.opportunityScore)}`}>
                    <div className="text-base leading-none">{quickResult.opportunityScore}</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400">/ 100</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                    <span className="text-slate-500 block">Demand:</span>
                    <span className="font-semibold text-slate-200">{quickResult.demandScore}/100</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                    <span className="text-slate-500 block">Competition:</span>
                    <span className="font-semibold text-slate-200">{quickResult.competitionScore}/100</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                    <span className="text-slate-500 block">Difficulty:</span>
                    <span className="font-semibold capitalize text-slate-200">{quickResult.difficulty}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                    <span className="text-slate-500 block">Est. Sales:</span>
                    <span className="font-semibold text-slate-200">{quickResult.estimatedMonthlySales}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleSaveNiche(quickResult)}
                    className="px-3 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  >
                    ⭐ Save
                  </button>
                  <button
                    onClick={() => {
                      if (quickResult.bookIdeas?.[0]) {
                        setSelectedIdeaModal({ niche: quickResult, idea: quickResult.bookIdeas[0] });
                      }
                    }}
                    className="px-3 py-1 text-xs font-semibold rounded bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
                  >
                    🚀 Start Book
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: TRENDING NICHES */}
          {!results.length && !isLoading && trendingNiches.length > 0 && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 md:p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Flame size={18} className="text-orange-400 fill-orange-400/30" />
                    Trending Right Now on Amazon KDP
                  </h3>
                  <p className="text-xs text-slate-400">
                    Updated daily · Based on Amazon bestseller algorithms and buyer search trends
                  </p>
                </div>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  {trendingUpdatedAt ? `Updated ${new Date(trendingUpdatedAt).toLocaleDateString()}` : 'Live cache'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {trendingNiches.map((chip, idx) => {
                  const isRising = chip.trendDirection === 'rising';
                  const isHigh = chip.opportunityScore >= 85;

                  let badgeColor = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-purple-500';
                  if (chip.badgeText?.includes('Hot') || isHigh) {
                    badgeColor = 'bg-orange-950/40 border-orange-700/60 text-orange-200 hover:bg-orange-900/60';
                  } else if (isRising) {
                    badgeColor = 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200 hover:bg-emerald-900/60';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setQueryText(chip.title);
                        setSelectedCategory(chip.category || 'all');
                        handleAnalyze(chip.title, chip.category);
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-left group shadow-xs cursor-pointer ${badgeColor}`}
                    >
                      <span className="font-bold">{chip.badgeText || (isRising ? '📈' : '🔥')}</span>
                      <span className="font-semibold">{chip.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 font-mono text-slate-300">
                        {chip.opportunityScore}/100
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: LOADING STATE */}
          {isLoading && (
            <div className="space-y-4">
              <div className="p-8 rounded-2xl bg-slate-900/90 border border-purple-500/30 text-center shadow-xl backdrop-blur-md">
                <div className="w-12 h-12 border-3 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-base font-bold text-white tracking-wide">
                  Grounding Market Intelligence
                </h3>
                <p className="text-sm text-purple-300 font-medium mt-1 animate-pulse">
                  {LOADING_STEPS[loadingStepIndex]}
                </p>
                <p className="text-xs text-slate-500 mt-3 max-w-md mx-auto">
                  Gemini 2.0 Flash is querying live Amazon search indexes and competitor BSR velocity.
                </p>
              </div>

              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse space-y-4">
                  <div className="h-5 bg-slate-800 rounded w-1/3" />
                  <div className="h-4 bg-slate-800/60 rounded w-3/4" />
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <div className="h-8 bg-slate-800/40 rounded" />
                    <div className="h-8 bg-slate-800/40 rounded" />
                    <div className="h-8 bg-slate-800/40 rounded" />
                    <div className="h-8 bg-slate-800/40 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 4: RESULTS DISPLAY */}
          {!isLoading && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {results.length} niches analyzed for "{activeQuery}"
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated using Google Search market grounding on {targetMarket.toUpperCase()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium hidden md:inline">Sort by:</span>
                  <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                    {(['opportunity', 'demand', 'competition', 'profit'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSortBy(tab)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                          sortBy === tab ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab === 'competition' ? 'Low Comp' : tab}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveAllResults}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shrink-0 cursor-pointer"
                  >
                    Save All
                  </button>
                </div>
              </div>

              {sortedResults.map((niche) => {
                const isSaved = isNicheSaved(niche.nicheTitle);
                const isExpanded = !!expandedIdeas[niche.id];

                return (
                  <div
                    key={niche.id}
                    className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 p-5 md:p-6 shadow-xl transition-all relative overflow-hidden group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 capitalize">
                            {niche.category?.replace('-', ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • {niche.subcategory}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border capitalize ${getDifficultyColor(niche.difficulty)}`}>
                            {niche.difficulty} to rank
                          </span>
                        </div>

                        <h3
                          onClick={() => onSelectNicheDetail && onSelectNicheDetail(niche)}
                          className="text-lg md:text-xl font-extrabold text-white tracking-tight hover:text-purple-300 transition-colors cursor-pointer"
                        >
                          {niche.nicheTitle}
                        </h3>

                        <p className="mt-2 text-xs md:text-sm text-slate-300 leading-relaxed">
                          {niche.description}
                        </p>
                      </div>

                      <div className={`px-4 py-2.5 rounded-2xl border text-center shrink-0 shadow-lg ${getScoreBadgeColor(niche.opportunityScore)}`}>
                        <div className="text-xs uppercase font-bold tracking-wider text-slate-400">Score</div>
                        <div className="text-2xl md:text-3xl font-extrabold leading-tight">{niche.opportunityScore}</div>
                        <div className="text-[10px] text-slate-400 font-mono">/100</div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1">
                          <span>Demand</span>
                          <span className="text-slate-200 font-bold">{niche.demandScore}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${niche.demandScore}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1">
                          <span>Competition</span>
                          <span className="text-slate-200 font-bold">{niche.competitionScore}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${niche.competitionScore > 60 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${niche.competitionScore}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1">
                          <span>Profit Potential</span>
                          <span className="text-slate-200 font-bold">{niche.profitScore}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${niche.profitScore}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1">
                          <span>Trend Velocity</span>
                          <span className="text-slate-200 font-bold">{niche.trendScore}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${niche.trendScore}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">📦 Est. Monthly Sales</span>
                        <span className="font-bold text-slate-200 mt-0.5 block truncate">{niche.estimatedMonthlySales}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">💰 Avg. Price</span>
                        <span className="font-bold text-slate-200 mt-0.5 block">{niche.averagePrice}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">📚 Competition</span>
                        <span className="font-bold text-slate-200 mt-0.5 block truncate">{niche.topCompetitorStrength} ({niche.competitorCount})</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">📈 Trend</span>
                        <span className="font-bold text-emerald-400 mt-0.5 block capitalize truncate">
                          {niche.trend} ↗
                        </span>
                      </div>
                    </div>

                    {niche.marketGap && (
                      <div className="mt-3.5 p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 flex items-start gap-2">
                        <span className="text-blue-400 font-bold shrink-0">🎯 Market Gap:</span>
                        <span>{niche.marketGap}</span>
                      </div>
                    )}

                    <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        {niche.pros?.slice(0, 2).map((pro, pIdx) => (
                          <div key={pIdx} className="flex items-center gap-1.5 text-emerald-300">
                            <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
                            <span>{pro}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {niche.cons?.slice(0, 1).map((con, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-1.5 text-amber-300">
                            <AlertTriangle size={13} className="shrink-0 text-amber-400" />
                            <span>{con}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {niche.verdict && (
                      <div className="mt-4 p-3 rounded-xl bg-purple-950/20 border-l-4 border-purple-500 text-xs text-purple-200 italic">
                        "{niche.verdict}"
                      </div>
                    )}

                    <div className="mt-3 text-[10px] text-slate-500 italic">
                      * Estimates based on AI analysis of market patterns. Not guaranteed sales data.
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() =>
                          setExpandedIdeas((prev) => ({ ...prev, [niche.id]: !prev[niche.id] }))
                        }
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span>{isExpanded ? 'Hide Book Ideas' : `See ${niche.bookIdeas?.length || 3} Book Ideas`}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {onSelectNicheDetail && (
                          <button
                            onClick={() => onSelectNicheDetail(niche)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Full Report</span>
                            <ExternalLink size={12} />
                          </button>
                        )}

                        <button
                          onClick={() => handleSaveNiche(niche)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isSaved
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                        >
                          <Star size={13} className={isSaved ? 'fill-amber-400 text-amber-400' : ''} />
                          <span>{isSaved ? 'Saved ⭐' : 'Save'}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (niche.bookIdeas?.[0]) {
                              setSelectedIdeaModal({ niche, idea: niche.bookIdeas[0] });
                            }
                          }}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>🚀 Start Book</span>
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED BOOK IDEAS */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                          <BookOpen size={14} /> Ready-to-Write Book Concepts for This Niche
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {niche.bookIdeas?.map((idea, iIdx) => (
                            <div
                              key={iIdx}
                              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 flex flex-col justify-between transition-colors"
                            >
                              <div>
                                <h5 className="text-sm font-bold text-white leading-tight">
                                  {idea.title}
                                </h5>
                                {idea.subtitle && (
                                  <p className="text-[11px] text-purple-300 mt-0.5 italic">
                                    {idea.subtitle}
                                  </p>
                                )}
                                <div className="mt-2 text-[11px] text-slate-300 space-y-1">
                                  <p><strong className="text-slate-400">Target:</strong> {idea.targetReader}</p>
                                  <p><strong className="text-slate-400">Angle:</strong> {idea.angle}</p>
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-850 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {idea.estimatedPageCount}p • {idea.suggestedPrice}
                                </span>
                                <button
                                  onClick={() => setSelectedIdeaModal({ niche, idea })}
                                  className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  Use This Idea
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (35% -> col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SAVED NICHES CARD */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                Saved Niches ({savedNiches.length})
              </h3>
              <button
                onClick={() => onNavigate('research-saved')}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-[10px] mb-3 overflow-x-auto">
              {(['all', 'considering', 'writing', 'published'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSavedFilter(tab)}
                  className={`px-2 py-1 rounded font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                    savedFilter === tab ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {filteredSavedNiches.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <Star size={24} className="mx-auto mb-2 opacity-30" />
                <p>No saved niches in this category.</p>
                <p className="mt-1 text-[11px]">Star any result card to save it here.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredSavedNiches.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectNicheDetail && onSelectNicheDetail(item.nicheResult, item.id)}
                    className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 hover:border-purple-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                          {item.nicheResult?.nicheTitle}
                        </h5>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {item.nicheResult?.category?.replace('-', ' ')}
                        </p>
                      </div>

                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${getScoreBadgeColor(item.nicheResult?.opportunityScore || 70)}`}>
                        {item.nicheResult?.opportunityScore}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-slate-900">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value, e)}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 focus:outline-hidden"
                      >
                        <option value="considering">Considering</option>
                        <option value="researching">Researching</option>
                        <option value="writing">Writing</option>
                        <option value="published">Published</option>
                        <option value="abandoned">Abandoned</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleDeleteSavedNiche(item.id, e)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECENT SEARCHES CARD */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw size={15} className="text-purple-400" />
                Recent Searches
              </h3>
            </div>

            {searchHistory.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent searches yet.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {searchHistory.slice(0, 10).map((h) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      setQueryText(h.query);
                      setSelectedCategory(h.category || 'all');
                      handleAnalyze(h.query, h.category);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850 hover:border-purple-500/40 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-purple-300 truncate">
                        {h.query}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {h.results?.length || 0} niches found • {new Date(h.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Repeat →
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* USE THIS IDEA / START BOOK MODAL */}
      {selectedIdeaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-purple-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <h3 className="text-lg font-bold text-white">Start a Book with This Idea</h3>
              </div>
              <button
                onClick={() => setSelectedIdeaModal(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Book Title</label>
                <div className="text-sm font-bold text-white">{selectedIdeaModal.idea.title}</div>
              </div>
              {selectedIdeaModal.idea.subtitle && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Subtitle</label>
                  <div className="text-xs text-purple-300">{selectedIdeaModal.idea.subtitle}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Genre:</span>
                  <span className="font-semibold text-slate-200 capitalize">
                    {selectedIdeaModal.niche.category.replace('-', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Trim Size:</span>
                  <span className="font-semibold text-slate-200">
                    {selectedIdeaModal.niche.recommendedTrimSize || '6x9'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Suggested Price:</span>
                  <span className="font-semibold text-slate-200">
                    {selectedIdeaModal.idea.suggestedPrice || '$12.99'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Reader:</span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {selectedIdeaModal.idea.targetReader}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              This will create a new draft manuscript project in Book Studio with pre-populated KDP metadata, search keywords, and BISAC categories.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedIdeaModal(null)}
                disabled={isStartingBook}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartBookConfirm}
                disabled={isStartingBook}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/50 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isStartingBook ? 'Creating Project...' : 'Create Book Now 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
