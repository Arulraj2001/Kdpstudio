/**
 * KDP Studio — Individual Book Analytics Detail View
 * Phase 15B
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  DollarSign,
  Package,
  Trophy,
  TrendingUp,
  BookOpen,
  Calendar,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Download,
  Sparkles,
  Info,
  CheckCircle2,
  BarChart3,
  Copy,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
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
  SalesPeriod,
} from '../../types/analytics';
import {
  getPublishedBook,
  getBookPerformanceHistory,
  deletePublishedBook,
  canEditPerformanceEntry,
} from '../../lib/analyticsService';
import {
  calculateFullRoyalty,
  calculatePaperbackRoyalty,
  calculateEbookRoyalty,
} from '../../lib/royaltyCalculator';
import { useAuthStore } from '../../lib/authStore';
import { useToastStore } from '../../lib/toastStore';
import { AddEntryModal } from './AddEntryModal';

interface BookDetailAnalyticsViewProps {
  bookId: string;
  onBack: () => void;
  onNavigate?: (route: PageRoute) => void;
}

export const BookDetailAnalyticsView: React.FC<BookDetailAnalyticsViewProps> = ({
  bookId,
  onBack,
  onNavigate,
}) => {
  const { user, userDoc } = useAuthStore();
  const uid = user?.uid || userDoc?.uid || 'demo-user-123';

  const [book, setBook] = useState<PublishedBook | null>(null);
  const [entries, setEntries] = useState<BookPerformanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState<'revenue' | 'units' | 'bsr' | 'kenp'>('revenue');
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [copiedAsin, setCopiedAsin] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const loadBookData = async () => {
    setIsLoading(true);
    try {
      const [b, history] = await Promise.all([
        getPublishedBook(bookId),
        getBookPerformanceHistory(bookId, 'monthly'),
      ]);
      setBook(b);
      setEntries(history);
    } catch (err) {
      console.error('Failed to load book detail analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookData();
  }, [bookId]);

  // Chart data aggregation by month/date
  const monthlyChartData = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; units: number; bsr: number | null; kenpPages: number; kenpRoyalty: number }> = {};

    for (const e of entries) {
      const key = e.date || 'Recent';
      if (!map[key]) {
        map[key] = {
          date: key.substring(5), // MM-DD
          revenue: 0,
          units: 0,
          bsr: e.bsr || null,
          kenpPages: 0,
          kenpRoyalty: 0,
        };
      }
      map[key].revenue += e.revenueUSD || 0;
      map[key].units += e.netUnitsSold || 0;
      map[key].kenpPages += e.kenpPageReads || 0;
      map[key].kenpRoyalty += e.kenpRoyalty || 0;
      if (e.bsr && e.bsr > 0) {
        map[key].bsr = e.bsr;
      }
    }

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  // Royalty calculation breakdown
  const royaltyBreakdown = useMemo(() => {
    if (!book) return null;
    return calculateFullRoyalty({
      royaltyType: book.royaltyType,
      listPrice: book.listPrice || 9.99,
      marketplace: book.marketplace,
      royaltyPlan: book.royaltyPlan || '70',
      pageCount: book.pageCount || 100,
    });
  }, [book]);

  const handleCopyAsin = () => {
    if (book?.asin) {
      navigator.clipboard.writeText(book.asin);
      setCopiedAsin(true);
      setTimeout(() => setCopiedAsin(false), 2000);
      useToastStore.getState().addToast({ message: 'ASIN copied to clipboard! 📋', type: 'info' });
    }
  };

  const handleExportCsv = () => {
    if (!entries.length) {
      alert('No performance entries to export.');
      return;
    }

    const headers = ['Date', 'Marketplace', 'Format', 'Units Sold', 'Returns', 'Net Units', 'Gross Revenue', 'Royalty Earned', 'Currency', 'Revenue USD', 'BSR', 'Notes'];
    const rows = entries.map((e) => [
      e.date,
      e.marketplace,
      e.royaltyType,
      e.unitsSold,
      e.unitsReturned,
      e.netUnitsSold,
      e.grossRevenue,
      e.royaltyEarned,
      e.currency,
      e.revenueUSD,
      e.bsr || '',
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${book?.title.replace(/[^a-zA-Z0-9]/g, '_')}_sales_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteBook = async () => {
    if (!book) return;
    if (!confirm(`Are you sure you want to remove "${book.title}" and its history from analytics?`)) return;
    await deletePublishedBook(book.id);
    useToastStore.getState().addToast({ message: `Removed "${book.title}".`, type: 'info' });
    onBack();
  };

  // Pagination slice
  const paginatedEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const start = (currentPage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [entries, currentPage]);

  const totalPages = Math.ceil(entries.length / PAGE_SIZE) || 1;

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs">Loading book performance history...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
        <BookOpen size={32} className="text-slate-600 mx-auto" />
        <h3 className="text-sm font-bold text-white">Book Record Not Found</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer"
        >
          Return to Overview
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HEADER WITH BOOK IDENTITY */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Analytics Dashboard</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Book Cover Thumbnail */}
            <div className="w-16 h-24 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen size={24} className="text-purple-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded">
                  {book.marketplace.replace('amazon-', '')}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded capitalize">
                  {book.royaltyType}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    book.status === 'live'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {book.status}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-white tracking-tight line-clamp-1">
                {book.title}
              </h1>

              {book.subtitle && (
                <p className="text-xs text-slate-400 italic line-clamp-1">{book.subtitle}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                <span>By <strong>{book.author}</strong></span>
                {book.asin && (
                  <button
                    onClick={handleCopyAsin}
                    className="flex items-center gap-1 font-mono text-purple-400 hover:text-purple-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 cursor-pointer"
                    title="Click to Copy ASIN"
                  >
                    <span>ASIN: {book.asin}</span>
                    {copiedAsin ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                )}
                {book.amazonUrl && (
                  <a
                    href={book.amazonUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                  >
                    <span>View Listing</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddEntryOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>Record Sales</span>
            </button>
            <button
              onClick={handleDeleteBook}
              className="p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors cursor-pointer"
              title="Delete Book Record"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* LIFETIME METRICS ROW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Units Sold
          </span>
          <div className="text-2xl font-extrabold text-white font-mono">
            {book.totalUnitsSold || 0}
          </div>
          <span className="text-[11px] text-slate-500 block">Lifetime net orders</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Royalties
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            ${book.totalRoyalties || 0}
          </div>
          <span className="text-[11px] text-slate-500 block">~USD total earned</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Best BSR Peak
          </span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            {book.bestBsr ? `#${book.bestBsr.toLocaleString()}` : 'Unranked'}
          </div>
          <span className="text-[11px] text-slate-500 block">
            {book.bestBsrDate ? `Achieved ${book.bestBsrDate}` : 'Log BSR rank in sales entry'}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Average BSR
          </span>
          <div className="text-2xl font-extrabold text-purple-400 font-mono">
            {book.averageBsr ? `#${book.averageBsr.toLocaleString()}` : '—'}
          </div>
          <span className="text-[11px] text-slate-500 block">Across all recorded entries</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PERFORMANCE CHARTS WITH TABS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveChartTab('revenue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'revenue'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              💰 Revenue USD
            </button>
            <button
              onClick={() => setActiveChartTab('units')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'units'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              📦 Units Sold
            </button>
            <button
              onClick={() => setActiveChartTab('bsr')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'bsr'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🏆 BSR Trend
            </button>
            <button
              onClick={() => setActiveChartTab('kenp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'kenp'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              📖 KENP Page Reads
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {monthlyChartData.length} entries plotted
          </span>
        </div>

        {/* Chart Render */}
        {monthlyChartData.length > 0 ? (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'revenue' ? (
                <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="revenue" name="Royalties ($)" stroke="#a855f7" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              ) : activeChartTab === 'units' ? (
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="units" name="Units Sold" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : activeChartTab === 'bsr' ? (
                <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} reversed />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="bsr" name="BSR Rank (Lower is Better)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              ) : (
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="kenpPages" name="KENP Pages Read" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
            <BarChart3 size={32} className="text-slate-600 mb-2" />
            <span className="text-xs font-bold text-slate-300">No Sales History Plotted</span>
            <p className="text-[11px] text-slate-500 max-w-sm mt-1">
              Add your first daily sales record for this book to visualize revenue trends.
            </p>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2-COLUMN SECTION: DATA TABLE & ROYALTY OPTIMIZATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Data Table (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Sales Data History</h3>
              <p className="text-xs text-slate-400">
                Log of all manual entries &amp; imported reports for this title
              </p>
            </div>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500">
              No sales records for this book yet.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Market</th>
                      <th className="p-3 text-right">Sold</th>
                      <th className="p-3 text-right">Ret</th>
                      <th className="p-3 text-right">Royalty</th>
                      <th className="p-3 text-center">BSR</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {paginatedEntries.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-850/60 transition-colors">
                        <td className="p-3 font-mono text-slate-300 font-semibold">{e.date}</td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold uppercase">
                            {e.marketplace.replace('amazon-', '')}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-200">
                          {e.unitsSold}
                        </td>
                        <td className="p-3 text-right font-mono text-rose-400">
                          {e.unitsReturned || 0}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-emerald-400">
                          ${e.revenueUSD || 0}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-300 text-[11px]">
                          {e.bsr ? `#${e.bsr.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">
                          {e.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
                  <span>
                    Showing page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Royalty Breakdown & Optimization (1 Col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800/60 text-purple-400 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Royalty Breakdown</h3>
                <span className="text-[10px] text-slate-400">KDP Print &amp; Distribution Economics</span>
              </div>
            </div>

            {royaltyBreakdown && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>List Price:</span>
                    <span className="font-mono font-bold text-white">${book.listPrice}</span>
                  </div>
                  {royaltyBreakdown.printingCost !== undefined && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Printing Cost:</span>
                      <span className="font-mono text-rose-400">-${royaltyBreakdown.printingCost}</span>
                    </div>
                  )}
                  {royaltyBreakdown.deliveryCost > 0 && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>eBook Delivery Fee:</span>
                      <span className="font-mono text-rose-400">-${royaltyBreakdown.deliveryCost}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold">
                    <span className="text-purple-300">Net Royalty / Sale:</span>
                    <span className="text-base text-emerald-400 font-mono">
                      ${royaltyBreakdown.royaltyPerSale}
                    </span>
                  </div>
                </div>

                {/* Optimization Tip Box */}
                <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/60 space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                    <Sparkles size={12} />
                    <span>Margin Optimization</span>
                  </div>
                  <p className="leading-relaxed">
                    At your current price of <strong>${book.listPrice}</strong>, you keep <strong>{royaltyBreakdown.profitMargin || 60}% margin</strong>.
                    Increasing list price to <strong>${(book.listPrice + 2).toFixed(2)}</strong> would increase your royalty to <strong>${(royaltyBreakdown.royaltyPerSale + 1.2).toFixed(2)}</strong> (+{(1.2 / royaltyBreakdown.royaltyPerSale * 100).toFixed(0)}%).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Entry Modal */}
      {isAddEntryOpen && (
        <AddEntryModal
          book={book}
          uid={uid}
          isOpen={isAddEntryOpen}
          onClose={() => setIsAddEntryOpen(false)}
          onSaved={() => loadBookData()}
        />
      )}
    </div>
  );
};
