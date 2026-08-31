import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Edit3, 
  Plus, 
  Trash2, 
  Check, 
  BookOpen, 
  Eye, 
  EyeOff, 
  Sliders, 
  FileText,
  Sparkles,
  Save
} from 'lucide-react';
import { getPuzzleBook, updatePuzzleBook, updatePuzzlePage } from '../../lib/puzzleService';
import { PuzzleBook, PuzzlePage, WordSearchSettings } from '../../types/puzzle';
import { generateWordSearchGrid, generateAnswerGrid, WordSearchResult } from '../../lib/puzzles/wordSearch';
import { exportPuzzleBookPdfClient } from '../../lib/puzzles/puzzleClientExport';
import { useBookStore } from '../../lib/store';

interface WordSearchDetailViewProps {
  bookId: string;
  onBack: () => void;
  onNavigateToBooks?: () => void;
}

export const WordSearchDetailView: React.FC<WordSearchDetailViewProps> = ({
  bookId,
  onBack,
  onNavigateToBooks,
}) => {
  const [book, setBook] = useState<PuzzleBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingToBooks, setIsSavingToBooks] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editing state for current puzzle
  const [isEditingWords, setIsEditingWords] = useState(false);
  const [editWordInput, setEditWordInput] = useState('');

  useEffect(() => {
    loadBook();
  }, [bookId]);

  const loadBook = async () => {
    setLoading(true);
    try {
      let b = await getPuzzleBook(bookId);
      if (b) {
        if (!b.pages || b.pages.length === 0) {
          const { runPuzzleBookGeneration } = await import('../../lib/puzzles/puzzleGenerationEngine');
          const genPages = await runPuzzleBookGeneration(bookId, b.settings);
          b = { ...b, pages: genPages, status: 'complete' };
        }
        setBook(b);
      }
    } catch (err) {
      console.error('Error loading puzzle book:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPage = book?.pages?.[selectedPageIndex];
  const pageData = selectedPage?.puzzleData as WordSearchResult | undefined;

  // Initialize edit words when switching page
  useEffect(() => {
    if (pageData?.placedWords) {
      setEditWordInput(pageData.placedWords.map((pw) => pw.word).join(', '));
      setIsEditingWords(false);
    }
  }, [selectedPageIndex, pageData]);

  // Regenerate only the selected puzzle
  const handleRegenerateCurrentPuzzle = async () => {
    if (!book || !selectedPage) return;
    const settings = book.settings as WordSearchSettings;

    const wordsToUse = isEditingWords && editWordInput
      ? editWordInput.split(/[\n,]+/).map((w) => w.trim().toUpperCase().replace(/[^A-Z]/g, '')).filter((w) => w.length >= 3)
      : (pageData?.placedWords?.map((pw) => pw.word) || [
          'AMAZON', 'KINDLE', 'AUTHOR', 'PUBLISH', 'MANUSCRIPT', 'FORMAT', 'COVER', 'PRINT'
        ]);

    const newResult = generateWordSearchGrid(wordsToUse, settings.gridSize || 12, settings.directions);
    const newAnswerGrid = generateAnswerGrid(newResult.grid, newResult.placedWords);

    const updatedPage: PuzzlePage = {
      ...selectedPage,
      puzzleData: newResult,
      answerData: newAnswerGrid,
      status: 'done',
    };

    await updatePuzzlePage(book.id, selectedPage.id, updatedPage);
    await loadBook();
    setIsEditingWords(false);
  };

  // Inline update title of current puzzle
  const handleUpdatePageTitle = async (newTitle: string) => {
    if (!book || !selectedPage) return;
    await updatePuzzlePage(book.id, selectedPage.id, { title: newTitle });
    await loadBook();
  };

  // Add one more puzzle
  const handleAddMorePuzzle = async () => {
    if (!book) return;
    const settings = book.settings as WordSearchSettings;
    const nextNum = (book.pages?.length || 0) + 1;

    const sampleWords = [
      'WRITER', 'EDITOR', 'CHAPTER', 'LIBRARY', 'FICTION', 'POETRY',
      'PAPERBACK', 'STORY', 'CHARACTER', 'JOURNAL', 'NOTEBOOK', 'VOLUME'
    ];

    const res = generateWordSearchGrid(sampleWords, settings.gridSize || 12, settings.directions);
    const ans = generateAnswerGrid(res.grid, res.placedWords);

    const newPage: PuzzlePage = {
      id: `page_${nextNum}_${Date.now()}`,
      pageNumber: nextNum,
      type: 'word-search',
      title: `Puzzle #${nextNum}: ${settings.theme || 'Enrichment'}`,
      puzzleData: res,
      answerData: ans,
      status: 'done',
    };

    const updatedPages = [...book.pages, newPage];
    await updatePuzzleBook(book.id, {
      pages: updatedPages,
      totalPages: updatedPages.length + 3,
    });
    await loadBook();
    setSelectedPageIndex(updatedPages.length - 1);
  };

  // Export PDF with client-side 300 DPI engine
  const handleExportPdf = async () => {
    if (!book) return;
    setIsExporting(true);
    try {
      await exportPuzzleBookPdfClient(book);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Could not export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Save as main Book project in My Books
  const handleSaveToMyBooks = async () => {
    if (!book) return;
    setIsSavingToBooks(true);
    try {
      useBookStore.getState().addBook({
        title: book.settings.title,
        subtitle: book.settings.subtitle,
        author: book.settings.author,
        genre: 'Activity & Puzzle Books',
        language: 'English',
        trimSize: (book.settings.trimSize === '8.5x11' ? '8.5x11' : '6x9') as any,
        paperType: (book.settings.paperType || 'white') as any,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed saving to My Books:', err);
    } finally {
      setIsSavingToBooks(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        Loading puzzle book studio...
      </div>
    );
  }

  if (!book) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="text-sm font-bold text-slate-700">Puzzle Book Not Found</div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Back to Puzzles"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
              {book.settings.title}
            </h1>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Theme: <strong className="text-slate-800">{book.settings.theme}</strong></span>
              <span>&bull;</span>
              <span>{book.pages?.length || 0} Puzzles ({book.totalPages || book.pages?.length} Pages)</span>
              <span>&bull;</span>
              <span>Trim: {book.settings.trimSize}</span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSaveToMyBooks}
            disabled={isSavingToBooks}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            {saveSuccess ? <Check size={14} className="text-emerald-600" /> : <Save size={14} />}
            <span>{saveSuccess ? 'Saved to Library!' : isSavingToBooks ? 'Saving...' : 'Save to My Books'}</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            <span>{isExporting ? 'Generating PDF...' : 'Export KDP PDF'}</span>
          </button>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Pages List (35%) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Puzzle Pages ({book.pages?.length || 0})
            </h2>
            <button
              onClick={handleAddMorePuzzle}
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Puzzle</span>
            </button>
          </div>

          {/* Scrollable list */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {book.pages.map((p, idx) => {
              const active = idx === selectedPageIndex;
              const pwCount = (p.puzzleData as WordSearchResult)?.placedWords?.length || 0;

              return (
                <div
                  key={p.id || idx}
                  onClick={() => setSelectedPageIndex(idx)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    active
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 shadow-2xs'
                      : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{p.title || `Puzzle #${p.pageNumber}`}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{pwCount} Words to Find</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${active ? 'bg-purple-200/60 text-purple-800' : 'bg-slate-100 text-slate-500'}`}>
                    #{p.pageNumber}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Print Layout Preview (65%) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          {selectedPage ? (
            <div>
              {/* Selected Page Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex-1">
                  <input
                    type="text"
                    value={selectedPage.title}
                    onChange={(e) => handleUpdatePageTitle(e.target.value)}
                    className="text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-600 outline-none w-full"
                  />
                  <div className="text-xs text-slate-400">Page {selectedPage.pageNumber} of {book.pages.length}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      showAnswerKey
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {showAnswerKey ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showAnswerKey ? 'Show Puzzle' : 'Show Solution'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRegenerateCurrentPuzzle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span>Re-Roll Grid</span>
                  </button>
                </div>
              </div>

              {/* Print Interior Simulator Frame */}
              <div className="my-6 p-6 sm:p-10 rounded-2xl bg-slate-50/50 border border-slate-200/80 flex flex-col items-center justify-between min-h-[460px]">
                {/* Title */}
                <div className="text-center mb-6">
                  <h3 className="font-extrabold text-sm sm:text-base tracking-widest uppercase text-slate-900">
                    {selectedPage.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">
                    {showAnswerKey ? 'Solution Grid' : 'Find all the hidden words below'}
                  </p>
                </div>

                {/* Grid Table */}
                <div className="my-auto">
                  <table className="border-collapse select-none">
                    <tbody>
                      {(showAnswerKey
                        ? (Array.isArray(selectedPage.answerData)
                            ? selectedPage.answerData
                            : (selectedPage.answerData as any)?.grid || pageData?.grid)
                        : pageData?.grid
                      )?.map(
                        (row: string[], rIdx: number) => (
                          <tr key={rIdx}>
                            {row.map((cell: string, cIdx: number) => {
                              const isDot = cell === '·' || cell === '.';
                              return (
                                <td
                                  key={cIdx}
                                  className={`w-7 h-7 sm:w-8 sm:h-8 text-center font-mono font-bold text-xs sm:text-sm ${
                                    showAnswerKey
                                      ? isDot
                                        ? 'text-slate-300'
                                        : 'bg-purple-100 text-purple-900 rounded-xs'
                                      : 'text-slate-800'
                                  }`}
                                >
                                  {cell}
                                </td>
                              );
                            })}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Word List 3-Column Checklist */}
                {!showAnswerKey && pageData?.placedWords && (
                  <div className="w-full mt-8 pt-4 border-t border-slate-200/80">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {pageData.placedWords.map((pw, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-slate-800 font-semibold text-[11px]">
                          <span className="w-3 h-3 rounded-xs border border-slate-400 inline-block shrink-0" />
                          <span className="truncate">{pw.word}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Words Collapsible Drawer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsEditingWords(!isEditingWords)}
                    className="text-xs font-bold text-slate-800 hover:text-purple-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>{isEditingWords ? 'Hide Word Editor' : 'Edit Words in This Puzzle'}</span>
                  </button>
                  <span className="text-[11px] text-slate-400">
                    {pageData?.placedWords?.length || 0} placed words
                  </span>
                </div>

                {isEditingWords && (
                  <div className="space-y-3 pt-2">
                    <textarea
                      rows={3}
                      value={editWordInput}
                      onChange={(e) => setEditWordInput(e.target.value)}
                      placeholder="Enter custom words separated by commas..."
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleRegenerateCurrentPuzzle}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Update &amp; Re-Solve Grid
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              Select a puzzle from the left panel to preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
