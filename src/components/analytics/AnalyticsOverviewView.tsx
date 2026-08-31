/**
 * KDP Studio — Analytics & Royalties Overview Dashboard
 * Phase 15B
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Package,
  BookOpen,
  Trophy,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Lock,
  Plus,
  FileSpreadsheet,
  Calculator,
  Target,
  RefreshCw,
  AlertTriangle,
  Info,
  Calendar,
  ChevronRight,
  ExternalLink,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Edit,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { PageRoute } from '../../types';
import {
  PublishedBook,
  BookPerformanceEntry,
  AnalyticsSummary,
  AIAnalyticsInsights,
  PublishingStreak,
  SalesPeriod,
  MarketPlace,
} from '../../types/analytics';
import {
  getUserPublishedBooks,
  getAnalyticsSummary,
  getUserStreak,
  getAllUserPerformanceEntries,
  deletePublishedBook,
} from '../../lib/analyticsService';
import { useAuthStore } from '../../lib/authStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { useToastStore } from '../../lib/toastStore';
import { AddEntryModal } from './AddEntryModal';
import { AddBookModal } from './AddBookModal';
import { CsvImportModal } from './CsvImportModal';

interface AnalyticsOverviewViewProps {
  onNavigate?: (route: PageRoute) => void;
  onSelectBook?: (bookId: string) => void;
}

const LINE_COLORS = [
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f97316', // orange
];

export const AnalyticsOverviewView: React.FC<AnalyticsOverviewViewProps> = ({
  onNavigate,
  onSelectBook,
}) => {
  const { user, userDoc } = useAuthStore();
  const { open } = useCheckoutStore();
  const plan = userDoc?.plan || 'free';
  const isPro = plan === 'pro' || plan === 'agency' || plan === 'lifetime';
  const uid = user?.uid || userDoc?.uid || 'demo-user-123';

  // Period state
  const [period, setPeriod] = useState<SalesPeriod>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));

  // Data states
  const [books, setBooks] = useState<PublishedBook[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [streak, setStreak] = useState<PublishingStreak | null>(null);
  const [allEntries, setAllEntries] = useState<BookPerformanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // AI Insights State
  const [insights, setInsights] = useState<AIAnalyticsInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Modals state
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [entryBookTarget, setEntryBookTarget] = useState<PublishedBook | null>(null);

  // Chart hidden book toggles
  const [hiddenBookIds, setHiddenBookIds] = useState<string[]>([]);

  // Sorting
  const [sortField, setSortField] = useState<'royalties' | 'units' | 'bsr' | 'title'>('royalties');
  const [sortAsc, setSortAsc] = useState(false);

  // Load core data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedBooks, fetchedSummary, fetchedStreak, fetchedEntries] = await Promise.all([
        getUserPublishedBooks(uid),
        getAnalyticsSummary(uid, period, selectedDate),
        getUserStreak(uid),
        getAllUserPerformanceEntries(uid),
      ]);

      setBooks(fetchedBooks);
      setSummary(fetchedSummary);
      setStreak(fetchedStreak);
      setAllEntries(fetchedEntries);
    } catch (err) {
      console.error('Failed to load analytics overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [uid, period, selectedDate]);

  // Trigger AI insights when summary or books change (Pro only)
  const fetchAIInsights = async (forceRefresh = false) => {
    if (!isPro || !summary) return;
    setIsLoadingInsights(true);
    try {
      const res = await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          summary,
          books,
          streak,
        }),
      });

      const data = await res.json();
      if (data.success && data.insights) {
        setInsights(data.insights);
        if (forceRefresh) {
          useToastStore.getState().addToast({
            message: 'AI Performance Insights refreshed! 🤖',
            type: 'success',
          });
        }
      }
    } catch (err) {
      console.warn('AI Insights fetch error:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (isPro && summary && !insights) {
      fetchAIInsights();
    }
  }, [isPro, summary]);

  // Multi-line chart data aggregation
  const chartData = useMemo(() => {
    if (!summary || !allEntries.length) return [];

    // Group dates in period
    const dateMap: Record<string, any> = {};
    const filteredEntries = allEntries.filter((e) => {
      if (period === 'monthly') {
        return e.date?.startsWith(selectedDate.substring(0, 7));
      } else if (period === 'yearly') {
        return e.date?.startsWith(selectedDate.substring(0, 4));
      }
      return true;
    });

    for (const e of filteredEntries) {
      const d = e.date || 'Recent';
      if (!dateMap[d]) {
        dateMap[d] = { date: d.substring(5) }; // MM-DD
      }
      const bTitle = books.find((b) => b.id === e.bookId)?.title || 'Book';
      dateMap[d][bTitle] = (dateMap[d][bTitle] || 0) + (e.revenueUSD || 0);
      dateMap[d]['Total'] = (dateMap[d]['Total'] || 0) + (e.revenueUSD || 0);
    }

    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [summary, allEntries, books, period, selectedDate]);

  // Sorted books
  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      let diff = 0;
      if (sortField === 'royalties') diff = (b.totalRoyalties || 0) - (a.totalRoyalties || 0);
      else if (sortField === 'units') diff = (b.totalUnitsSold || 0) - (a.totalUnitsSold || 0);
      else if (sortField === 'bsr') diff = (a.averageBsr || 9999999) - (b.averageBsr || 9999999);
      else diff = a.title.localeCompare(b.title);
      return sortAsc ? -diff : diff;
    });
  }, [books, sortField, sortAsc]);

  // Best BSR book title
  const bestBsrOverall = useMemo(() => {
    let best: { bsr: number; title: string; date: string } | null = null;
    for (const b of books) {
      if (b.bestBsr && (!best || b.bestBsr < best.bsr)) {
        best = { bsr: b.bestBsr, title: b.title, date: b.bestBsrDate || 'Recent' };
      }
    }
    return best;
  }, [books]);

  // Streak progress calculation (milestones: 7, 30, 100, 365)
  const streakMilestoneProgress = useMemo(() => {
    const current = streak?.currentStreak || 0;
    let nextTarget = 7;
    let label = '7-Day Author Habit';

    if (current >= 100) {
      nextTarget = 365;
      label = '365-Day Legend';
    } else if (current >= 30) {
      nextTarget = 100;
      label = '100-Day Master';
    } else if (current >= 7) {
      nextTarget = 30;
      label = '30-Day Power';
    }

    const pct = Math.min(100, Math.round((current / nextTarget) * 100));
    return { current, nextTarget, label, pct };
  }, [streak]);

  // 7-day sparkline helper
  const getBookSparkline = (bookId: string) => {
    const bookEntries = allEntries
      .filter((e) => e.bookId === bookId && e.bsr && e.bsr > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);

    if (bookEntries.length < 2) return null;

    const bsrs = bookEntries.map((e) => e.bsr!);
    const min = Math.min(...bsrs);
    const max = Math.max(...bsrs);
    const range = max - min || 1;

    const isImproving = bsrs[bsrs.length - 1] < bsrs[0]; // Lower BSR = better rank
    const points = bsrs
      .map((b, i) => {
        const x = (i / (bsrs.length - 1)) * 56 + 2;
        const y = 18 - ((b - min) / range) * 14;
        return `${x},${y}`;
      })
      .join(' ');

    return { points, isImproving };
  };

  const handleSortToggle = (field: 'royalties' | 'units' | 'bsr' | 'title') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from analytics tracking?`)) return;
    await deletePublishedBook(bookId);
    useToastStore.getState().addToast({ message: `Removed "${title}" from catalog.`, type: 'info' });
    loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-slate-900">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TOP HEADER & TIME PERIOD SELECTOR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
              <BarChart3 size={12} />
              <span>Royalties &amp; BSR Tracker</span>
            </span>
            <span className="text-xs text-slate-500">· {books.length} Published Titles</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            KDP Publishing Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Track daily sales, Amazon Best Seller Rank (BSR) velocity, and forecast recurring royalty streams across all 12 marketplaces.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddBookOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Book</span>
          </button>

          <button
            onClick={() => setIsCsvImportOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => onNavigate?.('analytics-calculator')}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Calculator size={14} className="text-amber-600" />
            <span>Calculator</span>
          </button>

          <button
            onClick={() => onNavigate?.('analytics-goals')}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Target size={14} className="text-blue-600" />
            <span>Goals</span>
          </button>
        </div>
      </div>

      {/* Manual Data Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Info size={15} className="text-purple-600 shrink-0" />
          <span>
            ℹ️ Data is manually entered or CSV imported. KDP Studio does not connect directly to your Amazon KDP account. All exchange rates &amp; rankings are estimates.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {/* Time Period Tabs */}
          {(['daily', 'weekly', 'monthly', 'yearly'] as SalesPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                period === p
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PLAN GATE BANNER (IF FREE / STARTER) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {!isPro && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-purple-950/60 to-slate-900 border border-amber-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
              <Lock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  Pro Feature
                </span>
                <h3 className="text-sm font-bold text-white">Full Analytics Dashboard is Locked</h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Unlock multi-line revenue charts, AI performance insights, BSR velocity sparklines, and goal progress tracking.
              </p>
            </div>
          </div>

          <button
            onClick={() => open('pro')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold shadow-md transition-all shrink-0 cursor-pointer"
          >
            Upgrade to Pro ➔
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* OVERVIEW METRIC CARDS ROW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Royalties */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Royalties
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ${summary?.totalRoyalties || 0} <span className="text-xs text-slate-500 font-sans font-normal">USD</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {(summary?.vsLastPeriod?.royalties || 0) >= 0 ? (
              <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                <ArrowUpRight size={14} />
                +{summary?.vsLastPeriod?.royalties || 0}%
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-0.5 font-bold">
                <ArrowDownRight size={14} />
                {summary?.vsLastPeriod?.royalties || 0}%
              </span>
            )}
            <span className="text-slate-500">vs prior period</span>
          </div>
        </div>

        {/* Card 2: Units Sold */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Units Sold
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {summary?.totalUnitsSold || 0} <span className="text-xs text-slate-500 font-sans font-normal">books</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {(summary?.vsLastPeriod?.units || 0) >= 0 ? (
              <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                <ArrowUpRight size={14} />
                +{summary?.vsLastPeriod?.units || 0}%
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-0.5 font-bold">
                <ArrowDownRight size={14} />
                {summary?.vsLastPeriod?.units || 0}%
              </span>
            )}
            <span className="text-slate-500">net orders</span>
          </div>
        </div>

        {/* Card 3: Books Tracked */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Books Tracked
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {books.length} <span className="text-xs text-slate-500 font-sans font-normal">titles</span>
          </div>
          <div className="text-xs text-slate-500">
            Across {new Set(books.map((b) => b.marketplace)).size || 1} Amazon marketplace(s)
          </div>
        </div>

        {/* Card 4: Best BSR Rank */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Best BSR Peak
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <Trophy size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">
            {bestBsrOverall ? `#${bestBsrOverall.bsr.toLocaleString()}` : 'Unranked'}
          </div>
          <div className="text-xs text-slate-500 line-clamp-1">
            {bestBsrOverall ? `"${bestBsrOverall.title}"` : 'Record BSR rank in sales entry'}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STREAK WIDGET */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
            <Flame size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                🔥 {streak?.currentStreak || 1} Day Publishing Streak!
              </h3>
              <span className="text-[10px] text-orange-800 font-bold bg-orange-100 px-2 py-0.5 rounded-full border border-orange-300">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Add data or publish books daily to maintain momentum. Broken streaks cannot be restored.
            </p>
          </div>
        </div>

        {/* Milestone Progress Meter */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-700 block">
              {streakMilestoneProgress.current} / {streakMilestoneProgress.nextTarget} Days
            </span>
            <span className="text-[10px] text-slate-500">
              Next badge: {streakMilestoneProgress.label}
            </span>
          </div>

          <div className="w-32 h-2.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${streakMilestoneProgress.pct}%` }}
            />
          </div>

          {/* Badges strip */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span title="7-Day Streak" className={`text-base ${streakMilestoneProgress.current >= 7 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
              🥉
            </span>
            <span title="30-Day Streak" className={`text-base ${streakMilestoneProgress.current >= 30 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
              🥈
            </span>
            <span title="100-Day Streak" className={`text-base ${streakMilestoneProgress.current >= 100 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
              🥇
            </span>
            <span title="365-Day Streak" className={`text-base ${streakMilestoneProgress.current >= 365 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
              💎
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2-COLUMN MAIN BODY: CHARTS & AI INSIGHTS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Revenue Over Time Chart (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Line Chart Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Revenue Over Time</h3>
                <p className="text-xs text-slate-500">
                  Daily &amp; periodic royalties aggregated across your active catalog
                </p>
              </div>

              {chartData.length > 0 && (
                <div className="text-right">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Total Period</span>
                  <span className="text-sm font-extrabold text-purple-700 block font-mono">
                    ${summary?.totalRoyalties || 0}
                  </span>
                </div>
              )}
            </div>

            {/* Recharts Line Chart Container */}
            {isPro ? (
              chartData.length > 0 ? (
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '1rem',
                          color: '#0f172a',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line
                        type="monotone"
                        dataKey="Total"
                        stroke="#a855f7"
                        strokeWidth={3}
                        dot={{ r: 3, fill: '#a855f7' }}
                        activeDot={{ r: 6 }}
                      />
                      {books.slice(0, 5).map((b, idx) => (
                        <Line
                          key={b.id}
                          type="monotone"
                          dataKey={b.title}
                          stroke={LINE_COLORS[(idx + 1) % LINE_COLORS.length]}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
                  <BarChart3 size={32} className="text-slate-600 mb-2" />
                  <span className="text-xs font-bold text-slate-300">No Sales Data for this Period</span>
                  <p className="text-[11px] text-slate-500 max-w-sm mt-1">
                    Record your first daily sales or import your KDP royalty report to populate interactive trends.
                  </p>
                  <button
                    onClick={() => {
                      if (books.length > 0) setEntryBookTarget(books[0]);
                      else setIsAddBookOpen(true);
                    }}
                    className="mt-3 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    + Record Sales Entry
                  </button>
                </div>
              )
            ) : (
              /* Locked Chart Placeholder */
              <div className="h-64 relative rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center overflow-hidden p-6 text-center">
                <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                  <BarChart3 size={180} />
                </div>
                <div className="relative z-10 max-w-sm space-y-2">
                  <Lock size={24} className="text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Revenue Timeline Locked</h4>
                  <p className="text-xs text-slate-400">
                    Upgrade to Pro to visualize royalties over time, filter by title, and compare performance trends.
                  </p>
                  <button
                    onClick={() => open('pro')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Unlock Pro Charts ➔
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* BOOKS PERFORMANCE TABLE */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Book Catalog Performance</h3>
                <p className="text-xs text-slate-500">
                  Click any book to inspect lifetime stats, royalty breakdowns, and BSR history
                </p>
              </div>

              <button
                onClick={() => setIsAddBookOpen(true)}
                className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Book</span>
              </button>
            </div>

            {books.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                <BookOpen size={28} className="text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-900">No Published Books Tracked</h4>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Add your first published paperback, hardcover, or eBook to begin logging sales entries and tracking BSR trends.
                </p>
                <button
                  onClick={() => setIsAddBookOpen(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Track First Book ➔
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th
                        onClick={() => handleSortToggle('title')}
                        className="p-3.5 cursor-pointer hover:text-slate-900"
                      >
                        Book Details
                      </th>
                      <th className="p-3.5">Marketplace</th>
                      <th
                        onClick={() => handleSortToggle('units')}
                        className="p-3.5 cursor-pointer hover:text-slate-900 text-right"
                      >
                        Units
                      </th>
                      <th
                        onClick={() => handleSortToggle('royalties')}
                        className="p-3.5 cursor-pointer hover:text-slate-900 text-right"
                      >
                        Royalties
                      </th>
                      <th
                        onClick={() => handleSortToggle('bsr')}
                        className="p-3.5 cursor-pointer hover:text-slate-900 text-center"
                      >
                        Avg BSR
                      </th>
                      <th className="p-3.5 text-center">7-Day Trend</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedBooks.map((b) => {
                      const sparkline = getBookSparkline(b.id);

                      return (
                        <tr
                          key={b.id}
                          onClick={() => onSelectBook?.(b.id)}
                          className="hover:bg-slate-850/60 transition-colors cursor-pointer group"
                        >
                          {/* Title & Cover */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-12 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                                {b.coverImageUrl ? (
                                  <img
                                    src={b.coverImageUrl}
                                    alt={b.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <BookOpen size={14} className="text-purple-400" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                                  {b.title}
                                </h4>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {b.asin || b.trimSize || 'eBook'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Marketplace Badge */}
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-950 border border-slate-800 text-slate-300">
                              {b.marketplace.replace('amazon-', '')}
                            </span>
                          </td>

                          {/* Units Sold */}
                          <td className="p-3.5 text-right font-mono font-bold text-slate-200">
                            {b.totalUnitsSold || 0}
                          </td>

                          {/* Royalties USD */}
                          <td className="p-3.5 text-right font-mono font-extrabold text-purple-400">
                            ${b.totalRoyalties || 0}
                          </td>

                          {/* Avg BSR */}
                          <td className="p-3.5 text-center font-mono text-slate-300 text-[11px]">
                            {b.averageBsr ? `#${b.averageBsr.toLocaleString()}` : '—'}
                          </td>

                          {/* 7-Day Trend Sparkline */}
                          <td className="p-3.5 text-center">
                            {sparkline ? (
                              <svg width="60" height="20" className="inline-block">
                                <polyline
                                  fill="none"
                                  stroke={sparkline.isImproving ? '#10b981' : '#f43f5e'}
                                  strokeWidth="1.5"
                                  points={sparkline.points}
                                />
                              </svg>
                            ) : (
                              <span className="text-slate-600 text-[10px]">No trend</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEntryBookTarget(b)}
                                className="px-2 py-1 rounded bg-purple-600/80 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                title="Add Sales Entry"
                              >
                                <Plus size={11} />
                                <span>Add Entry</span>
                              </button>

                              <button
                                onClick={() => onSelectBook?.(b.id)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                title="View Details"
                              >
                                <Eye size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Insights Panel (1 Col) */}
        <div className="space-y-6">
          {/* AI Insights Card */}
          <div className="p-6 rounded-3xl bg-white border border-purple-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">🤖 AI Insights</h3>
                  <span className="text-[10px] text-slate-500">Claude AI Performance Strategist</span>
                </div>
              </div>

              {isPro && (
                <button
                  onClick={() => fetchAIInsights(true)}
                  disabled={isLoadingInsights}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Refresh AI Insights"
                >
                  <RefreshCw size={13} className={isLoadingInsights ? 'animate-spin' : ''} />
                </button>
              )}
            </div>

            {isPro ? (
              isLoadingInsights ? (
                <div className="space-y-3 py-4 animate-pulse">
                  <div className="h-10 bg-slate-100 rounded-2xl" />
                  <div className="h-20 bg-slate-100 rounded-2xl" />
                  <div className="h-16 bg-slate-100 rounded-2xl" />
                </div>
              ) : insights ? (
                <div className="space-y-4 text-xs">
                  {/* Health Score Indicator */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Catalog Health</span>
                      <p className="text-xs text-slate-700 mt-0.5">{insights.healthReason}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] shrink-0 border ${
                        insights.overallHealth === 'excellent'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : insights.overallHealth === 'good'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : insights.overallHealth === 'fair'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {insights.overallHealth}
                    </span>
                  </div>

                  {/* Biggest Opportunity Highlight Box */}
                  <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-purple-800 font-bold">
                      <Sparkles size={13} className="text-purple-600" />
                      <span>Top Growth Opportunity</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {insights.biggestOpportunity}
                    </p>
                  </div>

                  {/* Top Insights List */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Tactical Recommendations
                    </span>
                    {insights.topInsights?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white line-clamp-1">{item.title}</span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                              item.priority === 'high'
                                ? 'bg-rose-950 text-rose-400'
                                : item.priority === 'medium'
                                ? 'bg-amber-950 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">{item.detail}</p>
                        <div className="pt-1 text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                          <ArrowRight size={11} />
                          <span>Action: {item.actionItem}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warning Flags (if any) */}
                  {insights.warningFlags && insights.warningFlags.length > 0 && (
                    <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle size={13} className="text-rose-400" />
                        <span>Watch Points</span>
                      </div>
                      <p className="text-rose-200/80 leading-normal">
                        {insights.warningFlags[0]}
                      </p>
                    </div>
                  )}

                  {/* Encouragement Quote */}
                  <p className="text-[11px] text-slate-500 italic pt-1 text-center">
                    "{insights.encouragement}"
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                  <p>Add sales entries to generate your first AI publishing performance review.</p>
                </div>
              )
            ) : (
              /* Locked AI Panel */
              <div className="p-6 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                <Lock size={20} className="text-amber-400 mx-auto" />
                <h4 className="text-xs font-bold text-white">AI Insights Exclusive to Pro</h4>
                <p className="text-[11px] text-slate-400">
                  Receive personalized AI audits on keyword velocity, international price adjustments, and catalog health.
                </p>
                <button
                  onClick={() => open('pro')}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Upgrade to Pro ➔
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODALS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AddBookModal
        uid={uid}
        isOpen={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        onSaved={() => loadData()}
      />

      <CsvImportModal
        uid={uid}
        publishedBooks={books}
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onImportComplete={() => loadData()}
      />

      {entryBookTarget && (
        <AddEntryModal
          book={entryBookTarget}
          uid={uid}
          isOpen={!!entryBookTarget}
          onClose={() => setEntryBookTarget(null)}
          onSaved={() => loadData()}
        />
      )}
    </div>
  );
};
