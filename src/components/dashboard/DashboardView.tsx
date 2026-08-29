import React from 'react';
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
  Image as ImageIcon 
} from 'lucide-react';
import { PageRoute, Book } from '../../types';
import { useBookStore } from '../../lib/store';
import { UsageWidget } from './UsageWidget';

interface DashboardViewProps {
  onNavigate: (route: PageRoute) => void;
  onNewBook: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onNewBook }) => {
  const { books, setCurrentBook } = useBookStore();

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
      title: 'Interior Formatter',
      description: 'Set trim sizes, margins, headers, and generate print-ready PDFs',
      route: 'formatter' as PageRoute,
      icon: Layout,
      badge: 'Print Layouts',
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
    setCurrentBook(book);
    onNavigate(route);
  };

  return (
    <div id="dashboard-view" className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Welcome Banner */}
      <section 
        id="welcome-banner"
        className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#1a1a2e] via-[#241e45] to-[#3b1d60] p-6 sm:p-8 text-white shadow-lg shadow-purple-950/20 border border-slate-800"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-24 -mb-12 w-48 h-48 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30">
              <Sparkles size={14} className="text-purple-300" />
              <span>KDP Studio Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome to KDP Studio
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Your unified Amazon Kindle Direct Publishing command center. Write manuscripts, format print interiors, calculate cover spines, and optimize metadata in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="banner-start-book-btn"
              onClick={onNewBook}
              className="px-4 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold shadow-md shadow-purple-950/40 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle size={16} />
              <span>New Book Project</span>
            </button>
            <button
              id="banner-explore-formatter-btn"
              onClick={() => onNavigate('publish')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 text-sm font-medium border border-white/10 flex items-center gap-2 transition-colors"
            >
              <ShieldCheck size={16} />
              <span>Publish Checklist</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Stats Row */}
      <section id="stats-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Publishing Overview
          </h3>
          <span className="text-xs font-medium text-slate-500">Live Library Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                id={stat.id}
                className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">
                    {stat.label}
                  </span>
                  <div className={`p-2.5 rounded-xl border ${stat.color}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">books</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Quick Action Buttons */}
      <section id="quick-actions-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Publishing Tools
            </h3>
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
                onClick={() => onNavigate(action.route)}
                className="group relative bg-white rounded-xl p-5 border border-slate-200/90 hover:border-purple-300 shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center group-hover:scale-105 group-hover:bg-[#7c3aed] group-hover:text-white transition-all duration-200">
                      <Icon size={20} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {action.badge}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors flex items-center justify-between">
                    {action.title}
                    <ArrowUpRight size={16} className="text-slate-400 group-hover:text-purple-600 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-purple-700 group-hover:text-purple-800">
                  <span>Open tool</span>
                  <span className="ml-1">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Main Work Area: Manuscripts & Daily Quota */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Recent Books section */}
        <section id="recent-books-section" className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Recent Manuscripts
              </h3>
              <p className="text-xs text-slate-500">Your most recently updated manuscripts and titles</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('books')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 px-2 py-1"
              >
                View Library ({books.length})
              </button>
              <button
                id="create-book-empty-btn"
                onClick={onNewBook}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
              >
                <PlusCircle size={15} />
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
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          {book.genre}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {book.trimSize} · {book.paperType}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">
                        {book.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">by {book.author}</p>

                      <div className="text-xs text-slate-600 mt-2 font-medium">
                        {totalWords.toLocaleString()} words · {book.chapters.length} chapters
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleSelectBook(book, 'studio')}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Edit3 size={13} />
                        <span>Write</span>
                      </button>
                      <button
                        onClick={() => handleSelectBook(book, 'formatter')}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1"
                      >
                        <FileText size={13} />
                        <span>Format</span>
                      </button>
                      <button
                        onClick={() => handleSelectBook(book, 'cover')}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1"
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
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
                  <BookOpen size={30} className="stroke-[1.7]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#7c3aed] text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={12} />
                </div>
              </div>

              <h4 className="text-base font-bold text-slate-900 mb-1">
                No books yet. Start your first title.
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Create a manuscript draft, configure Amazon KDP trim sizes, calculate paper spine thicknesses, and export print-ready PDFs.
              </p>

              <button
                id="start-first-book-cta"
                onClick={onNewBook}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all"
              >
                <Pencil size={14} />
                <span>Start Your First Book</span>
              </button>
            </div>
          )}
        </section>

        {/* Daily Quota & Usage Widget */}
        <div className="space-y-4">
          <UsageWidget onNavigateToPricing={() => onNavigate('pricing')} />
        </div>
      </div>
    </div>
  );
};
