import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  BookCheck, 
  Clock, 
  Palette, 
  Pencil, 
  Layout, 
  Tag, 
  ArrowUpRight, 
  PlusCircle, 
  Sparkles, 
  ShieldCheck, 
  Edit3, 
  FileText, 
  Image as ImageIcon,
  Home,
  Search,
  Lock,
  Flame,
  TrendingUp,
  ArrowRight,
  BarChart3,
  DollarSign,
} from 'lucide-react';
import { PageRoute, Book } from '../../types';
import { useBookStore } from '../../lib/store';
import { useAuthStore } from '../../lib/authStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { useUpgradeModal } from '../../lib/upgradeModalStore';
import { UsageWidget } from './UsageWidget';
import { getAnalyticsSummary, getUserStreak } from '../../lib/analyticsService';
import { AnalyticsSummary, PublishingStreak } from '../../types/analytics';

interface DashboardViewProps {
  onNavigate: (route: PageRoute, params?: Record<string, string>) => void;
  onNewBook: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onNewBook }) => {
  const { books, setCurrentBook } = useBookStore();
  const { user, userDoc } = useAuthStore();
  const plan = userDoc?.plan || 'free';
  const isPro = ['pro', 'agency', 'lifetime'].includes(plan);

  const [nicheSearch, setNicheSearch] = useState('');
  const [trendingChips, setTrendingChips] = useState<Array<{ title: string; badge: string }>>([
    { title: 'Anxiety Journals', badge: '🔥' },
    { title: 'Keto Planners', badge: '📈' },
    { title: 'Dog Training', badge: '⭐' },
  ]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [userStreak, setUserStreak] = useState<PublishingStreak | null>(null);

  useEffect(() => {
    const uid = userDoc?.uid || 'demo-user-123';
    getAnalyticsSummary(uid, 'monthly').then(setAnalyticsSummary).catch(() => {});
    getUserStreak(uid).then(setUserStreak).catch(() => {});
  }, [userDoc?.uid]);

  useEffect(() => {
    // 6-hour cached fetch of trending niches
    const CACHE_KEY = 'kdp_dashboard_trending_niches';
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < SIX_HOURS && parsed.chips?.length) {
          setTrendingChips(parsed.chips);
          return;
        }
      }
    } catch {}

    fetch('/api/niche/trending')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.niches)) {
          const chips = data.niches.slice(0, 3).map((n: any) => ({
            title: n.title,
            badge: n.badgeText?.split(' ')[0] || '🔥',
          }));
          setTrendingChips(chips);
          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ chips, timestamp: Date.now() })
            );
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const totalBooks = books.length;
  const publishedBooks = books.filter(b => b.status === 'published').length;
  const inProgressBooks = books.filter(b => b.status === 'formatting' || b.status === 'draft').length;
  const totalCovers = books.filter(b => !!b.coverData || b.status === 'ready' || b.status === 'published').length;

  const stats = [
    {
      id: 'stat-total-books',
      label: 'Total Books',
      value: totalBooks.toString(),
      icon: BookOpen,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      id: 'stat-published-books',
      label: 'Published Titles',
      value: publishedBooks.toString(),
      icon: BookCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      id: 'stat-in-progress',
      label: 'In Progress',
      value: inProgressBooks.toString(),
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      id: 'stat-total-covers',
      label: 'Cover Spreads',
      value: totalCovers.toString(),
      icon: Palette,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
  ];

  const quickActions = [
    {
      id: 'action-start-book',
      title: 'Book Studio',
      description: 'Write chapters, generate outlines, and organize manuscript draft',
      route: 'studio' as PageRoute,
      icon: Pencil,
      badge: 'Writer AI',
    },
    {
      id: 'action-format-interior',
      title: 'KDP Formatter',
      description: 'Turn your manuscript into a KDP-ready DOCX in one click with mirror margins',
      route: 'formatter' as PageRoute,
      icon: Layout,
      badge: 'DOCX Engine',
    },
    {
      id: 'action-design-cover',
      title: 'Cover Builder',
      description: 'Create spine, front & back paperback covers with KDP calculations',
      route: 'cover' as PageRoute,
      icon: Palette,
      badge: 'Cover Specs',
    },
    {
      id: 'action-kdp-metadata',
      title: 'KDP Assistant',
      description: 'Optimize Amazon search keywords, categories, and list pricing',
      route: 'kdp' as PageRoute,
      icon: Tag,
      badge: 'SEO & Metadata',
    },
  ];

  const handleSelectBook = (book: Book, route: PageRoute) => {
    if (!user) {
      onNavigate('signup');
      return;
    }
    setCurrentBook(book);
    onNavigate(route);
  };

  return (
    <div id="dashboard-view" className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Welcome Banner */}
      <section 
        id="welcome-banner"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white shadow-xl shadow-indigo-950/20 border border-slate-800/80"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-12 w-64 h-64 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles size={14} className="text-indigo-400" />
              <span>KDP Studio Creator OS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome to KDP Studio
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
              Your unified Amazon Kindle Direct Publishing command center. Write manuscripts, format print interiors, calculate cover spines, and optimize metadata in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="banner-start-book-btn"
              onClick={onNewBook}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-900/40 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>New Book Project</span>
            </button>
            <button
              id="banner-explore-formatter-btn"
              onClick={() => onNavigate(user ? 'publish' : 'signup')}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 text-xs sm:text-sm font-semibold border border-white/15 flex items-center gap-2 transition-all cursor-pointer backdrop-blur-xs"
            >
              <ShieldCheck size={15} />
              <span>Publish Checklist</span>
            </button>
            <button
              id="banner-view-homepage-btn"
              onClick={() => onNavigate('home')}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs sm:text-sm font-bold border border-indigo-400/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Home size={15} />
              <span>Home</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Stats Row */}
      <section id="stats-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
            Publishing Overview
          </h2>
          <span className="text-xs font-semibold text-slate-500">Live Library Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                id={stat.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div className={`p-2.5 rounded-xl border ${stat.color}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">books</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. The 4-Stage Publishing Lifecycle GPS */}
      <section id="publishing-gps-section" className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Publishing Lifecycle GPS
              </h2>
            </div>
            <p className="text-xs text-slate-500">Your step-by-step pipeline from blank outline to Amazon bestseller</p>
          </div>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 self-start sm:self-auto">
            Stage-by-Stage Guide
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Stage 1 */}
          <div 
            onClick={() => onNavigate(user ? 'studio' : 'signup')}
            className="p-4 rounded-xl bg-purple-50/40 border border-purple-200/80 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-purple-700 font-mono">STAGE 01</span>
              <span className="text-[10px] bg-purple-200/60 text-purple-900 px-1.5 py-0.2 rounded font-bold">Write</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Manuscript Draft</h3>
            <p className="text-[11px] text-slate-500 leading-snug">Claude AI outline, chapter drafting, or 1-click Word (.docx) &amp; EPUB import.</p>
          </div>

          {/* Stage 2 */}
          <div 
            onClick={() => onNavigate(user ? 'formatter' : 'signup')}
            className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200/80 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-indigo-700 font-mono">STAGE 02</span>
              <span className="text-[10px] bg-indigo-200/60 text-indigo-900 px-1.5 py-0.2 rounded font-bold">Format</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Interior &amp; Wrap Cover</h3>
            <p className="text-[11px] text-slate-500 leading-snug">Auto-calculated 0.750″ binding gutters, drop-caps &amp; 300 DPI spine wraps.</p>
          </div>

          {/* Stage 3 */}
          <div 
            onClick={() => onNavigate(user ? 'publish' : 'signup')}
            className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-amber-700 font-mono">STAGE 03</span>
              <span className="text-[10px] bg-amber-200/60 text-amber-900 px-1.5 py-0.2 rounded font-bold">Validate</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">Pre-Flight Quality Audit</h3>
            <p className="text-[11px] text-slate-500 leading-snug">Amazon 7-keywords, BISAC categories, and 100-point KDP print audit.</p>
          </div>

          {/* Stage 4 */}
          <div 
            onClick={() => onNavigate(user ? 'arc-manager' : 'signup')}
            className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-emerald-700 font-mono">STAGE 04</span>
              <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-1.5 py-0.2 rounded font-bold">Promote</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">ARC Lounge &amp; Swaps</h3>
            <p className="text-[11px] text-slate-500 leading-snug">FTC-compliant advance reader copies, newsletter swaps &amp; BSR sales spikes.</p>
          </div>
        </div>
      </section>

      {/* 4. Quick Action Buttons */}
      <section id="quick-actions-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
              Publishing Tools
            </h2>
            <p className="text-xs text-slate-500">Jump directly into any publishing workflow</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                id={action.id}
                onClick={() => onNavigate(user ? action.route : 'signup')}
                className="group relative bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md hover:-translate-y-1 cursor-pointer transition-all duration-200 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-105 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-indigo-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                      <Icon size={20} />
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                      {action.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                    {action.title}
                    <ArrowUpRight size={16} className="text-slate-400 group-hover:text-indigo-600 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed font-normal">
                    {action.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                  <span>Open workspace</span>
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Main Work Area: Manuscripts & Daily Quota */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Recent Books section */}
        <section id="recent-books-section" className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Recent Manuscripts
              </h3>
              <p className="text-xs text-slate-500">Your most recently updated manuscripts and titles</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate(user ? 'books' : 'signup')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-2 py-1 cursor-pointer"
              >
                View Library ({books.length})
              </button>
              <button
                id="create-book-empty-btn"
                onClick={onNewBook}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
              >
                <PlusCircle size={14} />
                <span>New Book</span>
              </button>
            </div>
          </div>

          {books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {books.slice(0, 4).map((book) => {
                const totalWords = book.chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
                return (
                  <div
                    key={book.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {book.genre}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {book.trimSize} · {book.paperType}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">
                        {book.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">by {book.author}</p>

                      <div className="text-xs text-slate-600 mt-1.5 font-medium">
                        {totalWords.toLocaleString()} words · {book.chapters.length} chapters
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleSelectBook(book, 'studio')}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>Write</span>
                      </button>
                      <button
                        onClick={() => handleSelectBook(book, 'formatter')}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileText size={13} />
                        <span>Format</span>
                      </button>
                      <button
                        onClick={() => handleSelectBook(book, 'cover')}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ImageIcon size={13} />
                        <span>Cover</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div 
              id="empty-books-state"
              className="py-10 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto"
            >
              <div className="relative mb-3.5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                  <BookOpen size={26} className="stroke-[1.7]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={11} />
                </div>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                No books yet. Start your first title.
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 font-normal">
                Create a manuscript draft, configure Amazon KDP trim sizes, calculate paper spine thicknesses, and export print-ready PDFs.
              </p>

              <button
                id="start-first-book-cta"
                onClick={onNewBook}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-950/20 transition-all cursor-pointer"
              >
                <Pencil size={14} />
                <span>Start Your First Book</span>
              </button>
            </div>
          )}
        </section>

        {/* Right Sidebar Widgets: Niche Research & Usage */}
        <div className="space-y-5">
          {/* Niche Research Widget */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Search size={16} className="text-indigo-600" />
                <span>Niche Research</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold uppercase">
                  Pro
                </span>
              </h3>
            </div>

            {isPro ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Search profitable Amazon KDP niches with live AI web data.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (nicheSearch.trim()) {
                      onNavigate('research', { q: nicheSearch.trim() });
                    }
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={nicheSearch}
                    onChange={(e) => setNicheSearch(e.target.value)}
                    placeholder="Search niche... e.g. 'gratitude journal'"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-slate-900 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                  >
                    <ArrowRight size={14} />
                  </button>
                </form>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Trending Right Now:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {trendingChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => onNavigate('research', { q: chip.title })}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-medium transition-colors text-left cursor-pointer"
                      >
                        {chip.badge} {chip.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onNavigate('research')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Full Research Tool</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                  <Lock size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Unlock Niche Research with Pro</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Analyze Amazon demand, calculate opportunity scores, and uncover competitor gaps.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!user) {
                      onNavigate('signup');
                    } else {
                      useCheckoutStore.getState().open('pro', 'annual');
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>

          {/* Analytics & Royalties Widget */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-600" />
                <span>Monthly Royalties</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                  {userStreak?.currentStreak ? `🔥 ${userStreak.currentStreak}d` : 'Live'}
                </span>
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">
                    ${analyticsSummary?.totalRoyalties || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-medium ml-1">USD (this month)</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {analyticsSummary?.totalUnitsSold || 0}
                  </span>
                  <span className="text-[11px] text-slate-400 block">units sold</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onNavigate(user ? 'analytics' : 'signup')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View Full Analytics</span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => onNavigate('analytics-calculator')}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Calculator
                </button>
              </div>
            </div>
          </div>

          <UsageWidget onNavigateToPricing={() => onNavigate('pricing')} />
        </div>
      </div>
    </div>
  );
};
