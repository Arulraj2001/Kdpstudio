import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Edit3, 
  Plus, 
  Save, 
  Check, 
  Palette, 
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { getPuzzleBook, updatePuzzleBook, updatePuzzlePage } from '../../lib/puzzleService';
import { PuzzleBook, PuzzlePage, ColoringSettings } from '../../types/puzzle';
import { generateColoringLineArtFallback } from '../../lib/puzzles/coloringHelper';
import { useBookStore } from '../../lib/store';

interface ColoringDetailViewProps {
  bookId: string;
  onBack: () => void;
  onNavigateToBooks?: () => void;
}

export const ColoringDetailView: React.FC<ColoringDetailViewProps> = ({
  bookId,
  onBack,
  onNavigateToBooks,
}) => {
  const [book, setBook] = useState<PuzzleBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingToBooks, setIsSavingToBooks] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit single prompt state
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editPromptValue, setEditPromptValue] = useState('');
  const [isRegeneratingPage, setIsRegeneratingPage] = useState(false);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  const loadBook = async () => {
    setLoading(true);
    try {
      const b = await getPuzzleBook(bookId);
      if (b) {
        setBook(b);
      }
    } catch (err) {
      console.error('Error loading coloring book:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPage = book?.pages?.[selectedPageIndex];

  useEffect(() => {
    if (selectedPage?.puzzleData?.prompt) {
      setEditPromptValue(selectedPage.puzzleData.prompt);
      setIsEditingPrompt(false);
    }
  }, [selectedPageIndex, selectedPage]);

  // Regenerate selected page
  const handleRegenerateCurrentPage = async () => {
    if (!book || !selectedPage) return;
    setIsRegeneratingPage(true);
    try {
      const promptToUse = editPromptValue || selectedPage.title || book.settings.theme;
      const newImageUrl = generateColoringLineArtFallback(promptToUse, book.settings.theme, selectedPage.pageNumber);

      const updatedPage: PuzzlePage = {
        ...selectedPage,
        imageUrl: newImageUrl,
        puzzleData: {
          ...selectedPage.puzzleData,
          imageUrl: newImageUrl,
          prompt: promptToUse,
        },
        status: 'done',
      };

      await updatePuzzlePage(book.id, selectedPage.id, updatedPage);
      await loadBook();
      setIsEditingPrompt(false);
    } catch (err) {
      console.error('Error regenerating page:', err);
    } finally {
      setIsRegeneratingPage(false);
    }
  };

  // Add one more coloring page
  const handleAddPage = async () => {
    if (!book) return;
    const nextNum = (book.pages?.length || 0) + 1;
    const title = `Enchanted ${book.settings.theme} Plate #${nextNum}`;
    const newImageUrl = generateColoringLineArtFallback(title, book.settings.theme, nextNum);

    const newPage: PuzzlePage = {
      id: `page_col_${nextNum}_${Date.now()}`,
      pageNumber: nextNum,
      type: 'coloring',
      title,
      imageUrl: newImageUrl,
      puzzleData: {
        imageUrl: newImageUrl,
        prompt: title,
      },
      status: 'done',
    };

    const updatedPages = [...book.pages, newPage];
    await updatePuzzleBook(book.id, {
      pages: updatedPages,
      totalPages: updatedPages.length * 2 + 2,
    });
    await loadBook();
    setSelectedPageIndex(updatedPages.length - 1);
  };

  const handleExportPdf = async () => {
    if (!book) return;
    setIsExporting(true);
    try {
      const res = await fetch('/api/puzzles/coloring/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id }),
      });

      if (!res.ok) throw new Error('PDF export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.settings.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_interior.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export error:', err);
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
        genre: 'Coloring & Art Books',
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
        Loading Coloring Book Studio...
      </div>
    );
  }

  if (!book) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="text-sm font-bold text-slate-700">Coloring Book Not Found</div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-pink-600 text-white font-bold text-xs"
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
              <span>{book.pages?.length || 0} Artwork Plates ({book.totalPages || book.pages?.length * 2} Pages)</span>
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            <span>{isExporting ? 'Generating PDF...' : 'Export KDP PDF'}</span>
          </button>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Thumbnail Grid */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Coloring Sheets ({book.pages?.length || 0})
            </h2>
            <button
              onClick={handleAddPage}
              className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Sheet</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
            {book.pages.map((p, idx) => {
              const active = idx === selectedPageIndex;
              const img = p.imageUrl || p.puzzleData?.imageUrl;

              return (
                <div
                  key={p.id || idx}
                  onClick={() => setSelectedPageIndex(idx)}
                  className={`p-2 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center gap-2 ${
                    active
                      ? 'border-pink-600 bg-pink-50/70 shadow-xs ring-2 ring-pink-200'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-full aspect-[3/4] bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-1">
                    {img ? (
                      <img src={img} alt={p.title} className="w-full h-full object-contain" />
                    ) : (
                      <Palette size={24} className="text-slate-300" />
                    )}
                  </div>
                  <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-700 px-1">
                    <span className="truncate max-w-[80px]">Sheet #{p.pageNumber}</span>
                    <span className="text-emerald-600">✓ Ready</span>
                  </div>
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
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedPage.title || `Coloring Plate #${selectedPage.pageNumber}`}
                  </h3>
                  <div className="text-xs text-slate-400">Sheet {selectedPage.pageNumber} of {book.pages.length} (Single-Sided Print)</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRegenerateCurrentPage}
                    disabled={isRegeneratingPage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs border border-pink-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isRegeneratingPage ? 'animate-spin' : ''} />
                    <span>{isRegeneratingPage ? 'Generating...' : 'Regenerate Art'}</span>
                  </button>
                </div>
              </div>

              {/* Full Artwork Frame */}
              <div className="my-6 p-4 sm:p-8 rounded-2xl bg-slate-50/50 border border-slate-200/80 flex flex-col items-center justify-center min-h-[480px]">
                <div className="w-full max-w-md aspect-[3/4] bg-white rounded-2xl border-2 border-slate-900/80 p-2 shadow-sm overflow-hidden flex items-center justify-center">
                  {selectedPage.imageUrl || selectedPage.puzzleData?.imageUrl ? (
                    <img
                      src={selectedPage.imageUrl || selectedPage.puzzleData?.imageUrl}
                      alt={selectedPage.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-slate-400">Loading artwork preview...</div>
                  )}
                </div>
              </div>

              {/* Prompt Inspector Drawer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                    className="text-xs font-bold text-slate-800 hover:text-pink-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>{isEditingPrompt ? 'Hide Prompt Editor' : 'Edit Prompt for This Sheet'}</span>
                  </button>
                  <span className="text-[11px] text-slate-400">
                    Crisp black and white line art
                  </span>
                </div>

                {isEditingPrompt && (
                  <div className="space-y-3 pt-2">
                    <textarea
                      rows={3}
                      value={editPromptValue}
                      onChange={(e) => setEditPromptValue(e.target.value)}
                      placeholder="Enter new illustration description..."
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-sans text-slate-900 outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleRegenerateCurrentPage}
                        className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Re-Synthesize Illustration
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              Select an artwork plate from the left panel to preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
