import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  FileText, 
  Image, 
  Sparkles, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ArrowUpDown, 
  Check, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  BookMarked,
  Camera,
  History,
} from 'lucide-react';
import { useBookStore } from '../../lib/store';
import { useAuthStore } from '../../lib/authStore';
import { Book, BookStatus, PageRoute } from '../../types';
import { VersionHistoryDrawer } from '../versions/VersionHistoryDrawer';

interface MyBooksViewProps {
  onNewBook: () => void;
  onNavigateToRoute: (route: PageRoute) => void;
  onOpenPublishChecklist?: (bookId: string) => void;
}

export const MyBooksView: React.FC<MyBooksViewProps> = ({ 
  onNewBook, 
  onNavigateToRoute,
  onOpenPublishChecklist 
}) => {
  const { books, currentBook, setCurrentBook, deleteBook, duplicateBook, resetToDefaultBooks } = useBookStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title' | 'words'>('updated');
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [activeHistoryBook, setActiveHistoryBook] = useState<Book | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Status filter
        if (statusFilter !== 'all' && book.status !== statusFilter) {
          if (statusFilter === 'in_progress' && (book.status === 'formatting' || book.status === 'draft')) {
            // Include in progress
          } else {
            return false;
          }
        }
        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchTitle = book.title.toLowerCase().includes(query);
          const matchAuthor = book.author.toLowerCase().includes(query);
          const matchGenre = book.genre.toLowerCase().includes(query);
          const matchSubtitle = (book.subtitle || '').toLowerCase().includes(query);
          return matchTitle || matchAuthor || matchGenre || matchSubtitle;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'updated') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        if (sortBy === 'created') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'words') {
          const aWords = a.chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
          const bWords = b.chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
          return bWords - aWords;
        }
        return 0;
      });
  }, [books, searchQuery, statusFilter, sortBy]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = books.length;
    const totalWords = books.reduce((sum, b) => sum + b.chapters.reduce((csum, c) => csum + (c.wordCount || 0), 0), 0);
    const draftCount = books.filter(b => b.status === 'draft').length;
    const formattingCount = books.filter(b => b.status === 'formatting').length;
    const readyCount = books.filter(b => b.status === 'ready').length;
    const publishedCount = books.filter(b => b.status === 'published').length;

    return { total, totalWords, draftCount, formattingCount, readyCount, publishedCount };
  }, [books]);

  const handleAction = (book: Book, route: PageRoute) => {
    if (!useAuthStore.getState().user) {
      onNavigateToRoute('signup');
      return;
    }
    setCurrentBook(book);
    if (route === 'publish' && onOpenPublishChecklist) {
      onOpenPublishChecklist(book.id);
    } else {
      onNavigateToRoute(route);
    }
  };

  const handleDuplicate = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!useAuthStore.getState().user) {
      onNavigateToRoute('signup');
      return;
    }
    const dup = duplicateBook(book.id);
    if (dup) {
      showToast(`Duplicated "${book.title}" successfully.`);
    }
  };

  const confirmDelete = () => {
    if (bookToDelete) {
      deleteBook(bookToDelete.id);
      showToast(`Deleted "${bookToDelete.title}".`);
      setBookToDelete(null);
    }
  };

  // Helper for progress calculations (4 segments: Writing, Formatting, Cover, Metadata)
  const getProgressDetails = (book: Book) => {
    const totalWords = book.chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
    const hasWriting = totalWords >= 200 || book.chapters.length >= 2;
    const hasFormatting = book.frontMatter.titlePage && book.frontMatter.copyrightPage;
    const hasCover = !!book.coverData || book.status === 'ready' || book.status === 'published';
    const hasMetadata = !!book.metadata?.description && (book.metadata?.keywords?.length || 0) >= 3;

    const segments = [
      { name: 'Writing', complete: hasWriting },
      { name: 'Formatting', complete: hasFormatting },
      { name: 'Cover', complete: hasCover },
      { name: 'Metadata', complete: hasMetadata },
    ];

    const completedCount = segments.filter(s => s.complete).length;
    const percentage = completedCount * 25;

    return { segments, percentage };
  };

  const getStatusBadge = (status: BookStatus) => {
    switch (status) {
      case 'published':
        return {
          label: 'Published',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
        };
      case 'ready':
        return {
          label: 'Ready to Publish',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'formatting':
        return {
          label: 'Formatting',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'draft':
      default:
        return {
          label: 'Draft',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const formatRelativeTime = (dateStr: string | Date) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div id="my-books-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 text-xs font-medium animate-fade-in">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
              Manuscript Library
            </span>
            <span className="text-xs text-slate-500">· {books.length} Active {books.length === 1 ? 'Project' : 'Projects'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Books</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage your full catalog of Kindle and Paperback titles across writing, formatting, cover design, and KDP upload.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateToRoute('bulk-template-new')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>📦 Bulk Generate →</span>
          </button>

          <button
            onClick={onNewBook}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Create New Book</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Books</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Words Written</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats.totalWords.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Progress</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{stats.draftCount + stats.formattingCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ready / Published</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats.readyCount + stats.publishedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All', count: books.length },
            { id: 'draft', label: 'Draft', count: stats.draftCount },
            { id: 'formatting', label: 'Formatting', count: stats.formattingCount },
            { id: 'ready', label: 'Ready', count: stats.readyCount },
            { id: 'published', label: 'Published', count: stats.publishedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id ? 'bg-purple-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by title, author, genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs font-medium p-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="updated">Last Edited</option>
              <option value="created">Date Created</option>
              <option value="title">Title (A-Z)</option>
              <option value="words">Word Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Books 3-Column Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            const totalWords = book.chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
            const estPages = Math.max(24, Math.ceil(totalWords / 250) + 6);
            const { segments, percentage } = getProgressDetails(book);
            const statusBadge = getStatusBadge(book.status);
            const isSelected = currentBook?.id === book.id;

            return (
              <div
                key={book.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col group hover:shadow-md ${
                  isSelected ? 'border-purple-300 ring-2 ring-purple-500/20' : 'border-slate-200'
                }`}
              >
                {/* Top Section: Miniature Cover Artwork & Badges */}
                <div className="relative h-44 bg-linear-to-br from-slate-900 via-purple-950 to-slate-900 p-4 flex flex-col justify-between overflow-hidden">
                  {/* Subtle Background Geometry */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                  
                  {/* Top Bar inside Cover */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                      <span>{statusBadge.label}</span>
                    </span>

                    <span className="text-[10px] font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {book.trimSize} · {book.paperType}
                    </span>
                  </div>

                  {/* Title & Author on Cover */}
                  <div className="relative z-10 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                      {book.genre}
                    </span>
                    <h3 className="text-base font-bold text-white leading-snug line-clamp-2 drop-shadow-xs">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium truncate">
                      by {book.author}
                    </p>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Meta Stats: Words, Pages, Last Edited */}
                  <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-1.5 font-medium">
                      <BookMarked size={14} className="text-purple-600" />
                      <span>{totalWords.toLocaleString()} words</span>
                      <span className="text-slate-400">·</span>
                      <span>~{estPages} pp</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock size={12} />
                      <span>{formatRelativeTime(book.updatedAt)}</span>
                    </div>
                  </div>

                  {/* 4-Segment Completion Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-slate-700">KDP Readiness</span>
                      <span className="text-[11px] font-bold text-purple-600">{percentage}%</span>
                    </div>

                    {/* 4 distinct segments */}
                    <div className="grid grid-cols-4 gap-1.5 h-2">
                      {segments.map((seg, idx) => (
                        <div
                          key={idx}
                          title={`${seg.name}: ${seg.complete ? 'Complete' : 'Pending'}`}
                          className={`rounded-full transition-colors ${
                            seg.complete ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span>1. Write</span>
                      <span>2. Format</span>
                      <span>3. Cover</span>
                      <span>4. Metadata</span>
                    </div>
                  </div>

                  {/* Quick Action Navigation Buttons */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {/* Primary Button */}
                    <button
                      onClick={() => handleAction(book, 'studio')}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <Edit3 size={14} />
                      <span>Continue Editing</span>
                    </button>

                    {/* Secondary Tool Shortcuts */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleAction(book, 'formatter')}
                        title="Format Interior"
                        className="py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <FileText size={12} />
                        <span>Format</span>
                      </button>
                      <button
                        onClick={() => handleAction(book, 'cover')}
                        title="Cover Builder"
                        className="py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Image size={12} />
                        <span>Cover</span>
                      </button>
                      <button
                        onClick={() => handleAction(book, 'kdp')}
                        title="KDP Assistant"
                        className="py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Sparkles size={12} />
                        <span>KDP</span>
                      </button>
                      <button
                        onClick={() => handleAction(book, 'publish')}
                        title="Publish Checklist"
                        className="py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <ShieldCheck size={12} />
                        <span>Publish</span>
                      </button>
                    </div>

                    {/* Duplicate, History & Delete Row */}
                    <div className="flex items-center justify-between pt-1 text-slate-500">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleDuplicate(book, e)}
                          className="text-[11px] text-slate-500 hover:text-purple-600 flex items-center gap-1 font-medium transition-colors"
                        >
                          <Copy size={12} />
                          <span>Duplicate</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!useAuthStore.getState().user) {
                              onNavigateToRoute('signup');
                              return;
                            }
                            setActiveHistoryBook(book);
                          }}
                          className="text-[11px] text-slate-500 hover:text-purple-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                          title="Version History & Snapshots"
                        >
                          <Camera size={12} />
                          <span>History</span>
                        </button>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBookToDelete(book);
                        }}
                        className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1 font-medium transition-colors"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mx-auto">
            <BookOpen size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery || statusFilter !== 'all' ? 'No matching books found' : 'No books in your library'}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {searchQuery || statusFilter !== 'all'
              ? 'Try resetting your filter or search query to find your manuscript.'
              : 'Create your first book project to write chapters, build print-ready interiors, and compute KDP cover dimensions.'}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onNewBook}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#7c3aed] text-white text-xs font-semibold hover:bg-[#6d28d9] transition-colors"
            >
              <Plus size={15} />
              <span>Create First Book</span>
            </button>
            <button
              onClick={() => resetToDefaultBooks()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              <Sparkles size={14} className="text-purple-600" />
              <span>Load Starter Sample</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl animate-scale-in">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Manuscript?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete <b>"{bookToDelete.title}"</b>? This will remove all chapters, covers, and metadata.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-xs"
              >
                Delete Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Drawer */}
      {activeHistoryBook && (
        <VersionHistoryDrawer
          book={activeHistoryBook}
          isOpen={Boolean(activeHistoryBook)}
          onClose={() => setActiveHistoryBook(null)}
          onRestored={() => {
            showToast('Manuscript restored successfully from snapshot!');
          }}
        />
      )}
    </div>
  );
};
