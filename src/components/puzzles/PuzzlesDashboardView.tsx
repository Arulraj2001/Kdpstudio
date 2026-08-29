import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Grid3X3, 
  Palette, 
  Hash, 
  Lock, 
  Plus, 
  FileText, 
  Download, 
  Trash2, 
  Clock, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Zap,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { getUserPuzzleBooks, deletePuzzleBook, savePuzzleBook } from '../../lib/puzzleService';
import { PuzzleBook, PuzzleBookType } from '../../types/puzzle';
import { generateWordSearchGrid, generateAnswerGrid } from '../../lib/puzzles/wordSearch';
import { generateWordFitGrid } from '../../lib/puzzles/wordFit';
import { generatePuzzleBookHtml } from '../../lib/puzzles/puzzlePdfRenderer';

interface PuzzlesDashboardViewProps {
  onNavigate?: (route: any, params?: any) => void;
  onOpenGenerator?: (type: PuzzleBookType) => void;
  onOpenPuzzleBook?: (bookId: string, type?: PuzzleBookType) => void;
}

export const PuzzlesDashboardView: React.FC<PuzzlesDashboardViewProps> = ({
  onNavigate,
  onOpenGenerator,
  onOpenPuzzleBook,
}) => {
  const { user, userDoc } = useAuthStore();
  const { open } = useCheckoutStore();

  const [puzzleBooks, setPuzzleBooks] = useState<PuzzleBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickGenerating, setQuickGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const plan = userDoc?.plan || 'free';
  const isFreePlan = plan === 'free';
  const canAccessPuzzles = !isFreePlan;

  useEffect(() => {
    loadBooks();
  }, [user]);

  const loadBooks = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const books = await getUserPuzzleBooks(user.uid);
      setPuzzleBooks(books);
    } catch (err) {
      console.warn('Error loading puzzle books:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSampleBook = async (type: PuzzleBookType) => {
    if (!canAccessPuzzles) {
      open('starter');
      return;
    }

    if (onOpenGenerator) {
      onOpenGenerator(type);
      return;
    }

    // Quick starter demo generation
    setQuickGenerating(true);
    try {
      const sampleWords = [
        'AMAZON', 'KINDLE', 'AUTHOR', 'PUBLISH', 'MANUSCRIPT',
        'CHAPTER', 'FORMAT', 'COVER', 'PRINT', 'PAPERBACK',
        'ROYALTY', 'BESTSELLER', 'KEYWORD', 'READER', 'FICTION'
      ];

      const pages = Array.from({ length: 5 }, (_, i) => {
        const pageNum = i + 1;
        if (type === 'word-search') {
          const ws = generateWordSearchGrid(sampleWords, 12);
          return {
            id: `p_${pageNum}`,
            pageNumber: pageNum,
            type,
            title: `Publishing Terms #${pageNum}`,
            puzzleData: ws,
            answerData: generateAnswerGrid(ws.grid, ws.placedWords),
            status: 'done' as const,
          };
        } else {
          const wf = generateWordFitGrid(sampleWords, 13);
          return {
            id: `p_${pageNum}`,
            pageNumber: pageNum,
            type: 'word-fit' as const,
            title: `Author Fit #${pageNum}`,
            puzzleData: wf,
            status: 'done' as const,
          };
        }
      });

      const newBook: PuzzleBook = {
        id: `puz_${Date.now()}`,
        uid: user?.uid || 'guest',
        settings: {
          type,
          title: `${type === 'word-search' ? 'Themed Word Search' : 'Word Fit Master'} Vol. 1`,
          subtitle: '50 Challenging Puzzles for Authors & Book Lovers',
          author: userDoc?.name || 'Kindle Creator',
          theme: 'Book Publishing & Writing',
          difficulty: 'medium',
          pageCount: 5,
          trimSize: '8.5x11',
          includeAnswers: true,
          includeCoverPage: true,
          includeInstructions: true,
          paperType: 'white',
        },
        pages,
        status: 'complete',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalPages: 7,
      };

      await savePuzzleBook(newBook);
      setSuccessMessage(`🎉 Created "${newBook.settings.title}" successfully!`);
      setTimeout(() => setSuccessMessage(null), 3500);
      await loadBooks();
    } catch (err) {
      console.error('Quick generation error:', err);
    } finally {
      setQuickGenerating(false);
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!window.confirm('Are you sure you want to delete this puzzle book?')) return;
    await deletePuzzleBook(bookId);
    await loadBooks();
  };

  const handleDownloadHtmlPreview = (book: PuzzleBook) => {
    const html = generatePuzzleBookHtml(book, book.settings, book.pages);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.settings.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_interior.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold mb-2">
            <Sparkles size={13} />
            <span>KDP Activity &amp; Puzzle Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Puzzle &amp; Activity Books
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Generate KDP-ready, high-demand puzzle and coloring books in minutes with print-perfect formatting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleCreateSampleBook('word-search')}
            disabled={quickGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Plus size={16} />
            <span>{quickGenerating ? 'Generating...' : '+ New Puzzle Book'}</span>
          </button>
        </div>
      </div>

      {/* Success alert notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Free Plan Lockout Banner */}
      {isFreePlan && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-purple-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 text-purple-300">
              <Lock size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-400/20 text-purple-200 text-[11px] font-bold mb-1.5 border border-purple-400/30">
                <Zap size={11} />
                <span>Starter Plan &amp; Above</span>
              </div>
              <h2 className="text-lg font-bold text-white">Unlock Puzzle &amp; Activity Book Generators</h2>
              <p className="text-xs text-purple-200 mt-1 max-w-xl leading-relaxed">
                Puzzle and coloring books are the #1 highest-converting low-content niche on Amazon KDP. Upgrade to Starter to generate complete multi-page interiors with solutions.
              </p>
            </div>
          </div>
          <button
            onClick={() => open('starter')}
            className="w-full md:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-purple-900 font-extrabold text-xs shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            Upgrade to Starter ($9/mo)
          </button>
        </div>
      )}

      {/* 4 Generator Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Word Search */}
        <div className="relative group bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
          {isFreePlan && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 rounded-3xl flex items-center justify-center p-6 text-center">
              <div className="bg-white/95 px-5 py-4 rounded-2xl border border-slate-200 shadow-xl space-y-2 max-w-xs">
                <Lock size={20} className="text-purple-600 mx-auto" />
                <div className="text-xs font-bold text-slate-900">Word Search Studio Locked</div>
                <div className="text-[11px] text-slate-500">Available on Starter plan and above.</div>
                <button
                  onClick={() => open('starter')}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                >
                  Unlock Generator
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Search size={24} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Instant Pure JS
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900">Word Search Books 🔍</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Generate themed word search puzzle books. Each book includes 20–50 unique puzzles with answer key grids. Perfect for all age groups and niches.
            </p>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-purple-500" />
                <span>Avg. 15 min for 30-page book</span>
              </div>
              <span className="font-semibold text-slate-700">8.5×11 &bull; 6×9</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => handleCreateSampleBook('word-search')}
              disabled={isFreePlan || quickGenerating}
              className="flex-1 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Create Single</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => onNavigate?.('bulk-template-new', { type: 'word-search' })}
              className="py-3 px-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Bulk Generate Word Search Batch"
            >
              <span>📦 Bulk →</span>
            </button>
          </div>
        </div>

        {/* Card 2: Word Fit */}
        <div className="relative group bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
          {isFreePlan && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 rounded-3xl flex items-center justify-center p-6 text-center">
              <div className="bg-white/95 px-5 py-4 rounded-2xl border border-slate-200 shadow-xl space-y-2 max-w-xs">
                <Lock size={20} className="text-indigo-600 mx-auto" />
                <div className="text-xs font-bold text-slate-900">Word Fit Studio Locked</div>
                <div className="text-[11px] text-slate-500">Available on Starter plan and above.</div>
                <button
                  onClick={() => open('starter')}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Unlock Generator
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Grid3X3 size={24} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Fill-In Crosswords
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900">Word Fit Books 🔤</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Create fill-in crossword puzzles where readers fit given words into a numbered grid. Relaxing, brain-stimulating, and zero writing required.
            </p>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-500" />
                <span>Avg. 20 min for 30-page book</span>
              </div>
              <span className="font-semibold text-slate-700">8.5×11 &bull; 6×9</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => handleCreateSampleBook('word-fit')}
              disabled={isFreePlan || quickGenerating}
              className="flex-1 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Create Single</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => onNavigate?.('bulk-template-new', { type: 'word-fit' })}
              className="py-3 px-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Bulk Generate Word Fit Batch"
            >
              <span>📦 Bulk →</span>
            </button>
          </div>
        </div>

        {/* Card 3: Coloring Books */}
        <div className="relative group bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
          {isFreePlan && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 rounded-3xl flex items-center justify-center p-6 text-center">
              <div className="bg-white/95 px-5 py-4 rounded-2xl border border-slate-200 shadow-xl space-y-2 max-w-xs">
                <Lock size={20} className="text-pink-600 mx-auto" />
                <div className="text-xs font-bold text-slate-900">Coloring Studio Locked</div>
                <div className="text-[11px] text-slate-500">Available on Starter plan and above.</div>
                <button
                  onClick={() => open('starter')}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                >
                  Unlock Generator
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
                <Palette size={24} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 flex items-center gap-1">
                <Zap size={11} />
                <span>Uses AI Line Art</span>
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900">Coloring Books 🎨</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              AI generates crisp, high-resolution line art illustrations for any theme (animals, mandalas, fantasy, kids, nature). Print-ready vector quality at 300 DPI.
            </p>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-pink-500" />
                <span>Avg. 30 min for 20-page book</span>
              </div>
              <span className="font-semibold text-slate-700">8.5×11 Single-Sided</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => handleCreateSampleBook('coloring')}
              disabled={isFreePlan || quickGenerating}
              className="flex-1 py-3 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Create Single</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => onNavigate?.('bulk-template-new', { type: 'coloring-book' })}
              className="py-3 px-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Bulk Generate Coloring Batch"
            >
              <span>📦 Bulk →</span>
            </button>
          </div>
        </div>

        {/* Card 4: Color by Number */}
        <div className="relative group bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
          {isFreePlan && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 rounded-3xl flex items-center justify-center p-6 text-center">
              <div className="bg-white/95 px-5 py-4 rounded-2xl border border-slate-200 shadow-xl space-y-2 max-w-xs">
                <Lock size={20} className="text-amber-600 mx-auto" />
                <div className="text-xs font-bold text-slate-900">Color by Number Locked</div>
                <div className="text-[11px] text-slate-500">Available on Starter plan and above.</div>
                <button
                  onClick={() => open('starter')}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                >
                  Unlock Generator
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Hash size={24} />
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Zap size={11} />
                <span>Numbered Palettes</span>
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900">Color by Number 🎨🔢</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Numbered regions and palettes that readers fill in. AI generates structured scenes and number-mapped zones. Extremely popular for relaxation &amp; kids.
            </p>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-amber-500" />
                <span>Avg. 25 min for 15-page book</span>
              </div>
              <span className="font-semibold text-slate-700">8.5×11 Full Bleed</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => handleCreateSampleBook('color-by-number')}
              disabled={isFreePlan || quickGenerating}
              className="flex-1 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Create Single</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => onNavigate?.('bulk-template-new', { type: 'color-by-number' })}
              className="py-3 px-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Bulk Generate Color by Number Batch"
            >
              <span>📦 Bulk →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Puzzle Books Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Puzzle Books</h2>
            <p className="text-xs text-slate-500">Manage and export your generated activity manuscripts</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {puzzleBooks.length} {puzzleBooks.length === 1 ? 'Book' : 'Books'}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading your puzzle library...</div>
        ) : puzzleBooks.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <BookOpen size={36} className="text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No puzzle books created yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Select one of the 4 generators above to start crafting your first KDP activity book!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <th className="pb-3 font-bold">Book Title</th>
                  <th className="pb-3 font-bold">Type</th>
                  <th className="pb-3 font-bold">Pages</th>
                  <th className="pb-3 font-bold">Trim Size</th>
                  <th className="pb-3 font-bold">Created</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {puzzleBooks.slice(0, 5).map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 font-bold text-slate-900">
                      <div>{book.settings.title}</div>
                      <div className="text-[11px] font-normal text-slate-500">{book.settings.theme}</div>
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                        {book.settings.type.replace(/-/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold text-slate-700">
                      {book.pages?.length || 0} puzzles ({book.totalPages || book.pages?.length || 0} pages)
                    </td>
                    <td className="py-3.5 text-slate-600 font-medium">{book.settings.trimSize}</td>
                    <td className="py-3.5 text-slate-500">
                      {new Date(book.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      {onOpenPuzzleBook && (
                        <button
                          onClick={() => onOpenPuzzleBook(book.id, book.settings.type)}
                          title="Open Studio Editor"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] transition-colors"
                        >
                          <BookOpen size={12} />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadHtmlPreview(book)}
                        title="Download Print HTML Preview"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                      >
                        <Download size={12} />
                        <span>Export HTML</span>
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        title="Delete Book"
                        className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
