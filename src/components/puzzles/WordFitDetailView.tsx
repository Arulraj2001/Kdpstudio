import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Edit3, 
  Plus, 
  Eye, 
  EyeOff, 
  Save, 
  Check 
} from 'lucide-react';
import { getPuzzleBook, updatePuzzleBook, updatePuzzlePage } from '../../lib/puzzleService';
import { PuzzleBook, PuzzlePage, WordFitSettings } from '../../types/puzzle';
import { generateWordFitGrid, groupWordsByLength, WordFitResult } from '../../lib/puzzles/wordFit';
import { exportPuzzleBookPdfClient } from '../../lib/puzzles/puzzleClientExport';
import { useBookStore } from '../../lib/store';

interface WordFitDetailViewProps {
  bookId: string;
  onBack: () => void;
  onNavigateToBooks?: () => void;
}

export const WordFitDetailView: React.FC<WordFitDetailViewProps> = ({
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

  // Edit words drawer
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
      console.error('Error loading Word Fit book:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPage = book?.pages?.[selectedPageIndex];
  const pageData = selectedPage?.puzzleData as WordFitResult | undefined;

  useEffect(() => {
    if (pageData?.placedWords) {
      setEditWordInput(pageData.placedWords.join(', '));
      setIsEditingWords(false);
    }
  }, [selectedPageIndex, pageData]);

  const groupedWords = useMemo(() => {
    if (!pageData?.placedWords) return {};
    return groupWordsByLength(pageData.placedWords);
  }, [pageData?.placedWords]);

  const handleRegenerateCurrentPuzzle = async () => {
    if (!book || !selectedPage) return;
    const settings = book.settings as WordFitSettings;

    const wordsToUse = isEditingWords && editWordInput
      ? editWordInput.split(/[\n,]+/).map((w) => w.trim().toUpperCase().replace(/[^A-Z]/g, '')).filter((w) => w.length >= 3)
      : (pageData?.placedWords || [
          'SUN', 'SEA', 'BOAT', 'SHIP', 'OCEAN', 'BEACH', 'CORAL', 'SHARK',
          'DOLPHIN', 'TURTLE', 'SEAHORSE', 'OCTOPUS', 'SUBMARINE'
        ]);

    const newResult = generateWordFitGrid(wordsToUse, settings.gridSize || 15);

    const updatedPage: PuzzlePage = {
      ...selectedPage,
      puzzleData: {
        grid: newResult.grid,
        slots: newResult.slots,
        placedWords: newResult.placedWords,
        unplacedWords: newResult.unplacedWords,
        gridSize: settings.gridSize || 15,
      },
      answerData: {
        grid: newResult.grid,
        slots: newResult.slots,
      },
      status: 'done',
    };

    await updatePuzzlePage(book.id, selectedPage.id, updatedPage);
    await loadBook();
    setIsEditingWords(false);
  };

  const handleUpdatePageTitle = async (newTitle: string) => {
    if (!book || !selectedPage) return;
    await updatePuzzlePage(book.id, selectedPage.id, { title: newTitle });
    await loadBook();
  };

  const handleAddMorePuzzle = async () => {
    if (!book) return;
    const settings = book.settings as WordFitSettings;
    const nextNum = (book.pages?.length || 0) + 1;

    const sampleWords = [
      'WRITER', 'EDITOR', 'CHAPTER', 'LIBRARY', 'FICTION', 'POETRY',
      'PAPERBACK', 'STORY', 'CHARACTER', 'JOURNAL', 'NOTEBOOK', 'VOLUME',
      'BOOK', 'READ', 'AUTHOR', 'PUBLISH'
    ];

    const res = generateWordFitGrid(sampleWords, settings.gridSize || 15);

    const newPage: PuzzlePage = {
      id: `page_wf_${nextNum}_${Date.now()}`,
      pageNumber: nextNum,
      type: 'word-fit',
      title: `Word Fit #${nextNum}: ${settings.theme || 'Enrichment'}`,
      puzzleData: {
        grid: res.grid,
        slots: res.slots,
        placedWords: res.placedWords,
        unplacedWords: res.unplacedWords,
        gridSize: settings.gridSize || 15,
      },
      answerData: {
        grid: res.grid,
        slots: res.slots,
      },
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
        Loading Word Fit crossword studio...
      </div>
    );
  }

  if (!book) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="text-sm font-bold text-slate-700">Word Fit Book Not Found</div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
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
              <span>{book.pages?.length || 0} Crosswords ({book.totalPages || book.pages?.length} Pages)</span>
              <span>&bull;</span>
              <span>Trim: {book.settings.trimSize}</span>
            </div>
          </div>
        </div>

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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            <span>{isExporting ? 'Generating PDF...' : 'Export KDP PDF'}</span>
          </button>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Pages List */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Crossword Pages ({book.pages?.length || 0})
            </h2>
            <button
              onClick={handleAddMorePuzzle}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Crossword</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {book.pages.map((p, idx) => {
              const active = idx === selectedPageIndex;
              const pwCount = (p.puzzleData as WordFitResult)?.placedWords?.length || 0;

              return (
                <div
                  key={p.id || idx}
                  onClick={() => setSelectedPageIndex(idx)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    active
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-2xs'
                      : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{p.title || `Word Fit #${p.pageNumber}`}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{pwCount} Words Interlocked</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${active ? 'bg-indigo-200/60 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                    #{p.pageNumber}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Print Layout Preview */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          {selectedPage ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex-1">
                  <input
                    type="text"
                    value={selectedPage.title}
                    onChange={(e) => handleUpdatePageTitle(e.target.value)}
                    className="text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 outline-none w-full"
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
                    <span>{showAnswerKey ? 'Show Grid' : 'Show Solution'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRegenerateCurrentPuzzle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span>Re-Roll Grid</span>
                  </button>
                </div>
              </div>

              {/* Print Interior Simulator Frame */}
              <div className="my-6 p-6 sm:p-10 rounded-2xl bg-slate-50/50 border border-slate-200/80 flex flex-col items-center justify-between min-h-[460px]">
                <div className="text-center mb-6">
                  <h3 className="font-extrabold text-sm sm:text-base tracking-widest uppercase text-slate-900">
                    {selectedPage.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">
                    {showAnswerKey ? 'Solution Grid' : 'Fit all words into the matching numbered crossword slots'}
                  </p>
                </div>

                {/* Crossword Grid */}
                <div className="my-auto">
                  <table className="border-collapse select-none">
                    <tbody>
                      {pageData?.grid?.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => {
                            if (cell.isBlocked) {
                              return <td key={cIdx} className="w-6 h-6 sm:w-7 sm:h-7 bg-slate-900 border border-slate-800" />;
                            }
                            return (
                              <td
                                key={cIdx}
                                className={`w-6 h-6 sm:w-7 sm:h-7 bg-white border border-slate-400 relative text-center text-xs font-bold ${
                                  showAnswerKey ? 'text-indigo-900 bg-indigo-50/40' : 'text-transparent'
                                }`}
                              >
                                {cell.number && (
                                  <span className="absolute top-0 left-0.5 text-[7px] text-slate-500 font-extrabold leading-none">
                                    {cell.number}
                                  </span>
                                )}
                                {showAnswerKey ? cell.letter : ''}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Word List by Length */}
                {!showAnswerKey && (
                  <div className="w-full mt-8 pt-4 border-t border-slate-200/80 space-y-2">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Fill these words into the grid:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.keys(groupedWords)
                        .sort((a, b) => Number(a) - Number(b))
                        .map((len) => (
                          <div key={len} className="space-y-1">
                            <div className="font-extrabold text-[11px] text-indigo-900">{len} Letters:</div>
                            <div className="text-[11px] text-slate-600 font-medium leading-relaxed">
                              {groupedWords[Number(len)].join(', ')}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Words Drawer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsEditingWords(!isEditingWords)}
                    className="text-xs font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>{isEditingWords ? 'Hide Word Editor' : 'Edit Words in This Crossword'}</span>
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
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Update &amp; Re-Solve Crossword
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              Select a Word Fit puzzle from the left panel to preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
