import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Edit3, 
  Plus, 
  Save, 
  Check, 
  Palette, 
  Eye, 
  EyeOff, 
  Layers
} from 'lucide-react';
import { getPuzzleBook, updatePuzzleBook, updatePuzzlePage } from '../../lib/puzzleService';
import { PuzzleBook, PuzzlePage, ColorByNumberSettings } from '../../types/puzzle';
import { 
  generateFallbackColorByNumberScene, 
  generateColorByNumberSvg, 
  generateAnswerSvg,
  ColorByNumberPageData
} from '../../lib/puzzles/colorByNumber';
import { exportPuzzleBookPdfClient } from '../../lib/puzzles/puzzleClientExport';
import { useBookStore } from '../../lib/store';

interface ColorByNumberDetailViewProps {
  bookId: string;
  onBack: () => void;
  onNavigateToBooks?: () => void;
}

export const ColorByNumberDetailView: React.FC<ColorByNumberDetailViewProps> = ({
  bookId,
  onBack,
  onNavigateToBooks,
}) => {
  const [book, setBook] = useState<PuzzleBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [showColorSolution, setShowColorSolution] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingToBooks, setIsSavingToBooks] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit single scene
  const [isEditingScene, setIsEditingScene] = useState(false);
  const [editSceneTitle, setEditSceneTitle] = useState('');
  const [isRegeneratingScene, setIsRegeneratingScene] = useState(false);

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
      console.error('Error loading Color by Number book:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPage = book?.pages?.[selectedPageIndex];
  const sceneData = selectedPage?.puzzleData?.scene as ColorByNumberPageData | undefined;

  useEffect(() => {
    if (selectedPage?.title) {
      setEditSceneTitle(selectedPage.title);
      setIsEditingScene(false);
    }
  }, [selectedPageIndex, selectedPage]);

  // Regenerate current scene
  const handleRegenerateCurrentScene = async () => {
    if (!book || !selectedPage) return;
    setIsRegeneratingScene(true);
    try {
      const settings = book.settings as ColorByNumberSettings;
      const newScene = generateFallbackColorByNumberScene(
        editSceneTitle || settings.theme,
        selectedPage.pageNumber,
        settings.complexity || 'medium'
      );

      const puzzleSvg = generateColorByNumberSvg(newScene);
      const answerSvg = generateAnswerSvg(newScene);
      const puzzleDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(puzzleSvg)}`;
      const answerDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(answerSvg)}`;

      const updatedPage: PuzzlePage = {
        ...selectedPage,
        title: editSceneTitle || newScene.title,
        imageUrl: puzzleDataUrl,
        puzzleData: {
          scene: newScene,
          svg: puzzleSvg,
          answerSvg: answerSvg,
          imageUrl: puzzleDataUrl,
          answerImageUrl: answerDataUrl,
          palette: newScene.colorKey,
        },
        answerData: {
          palette: newScene.colorKey,
          svg: answerSvg,
          imageUrl: answerDataUrl,
        },
        status: 'done',
      };

      await updatePuzzlePage(book.id, selectedPage.id, updatedPage);
      await loadBook();
      setIsEditingScene(false);
    } catch (err) {
      console.error('Error regenerating scene:', err);
    } finally {
      setIsRegeneratingScene(false);
    }
  };

  // Add one more scene
  const handleAddScene = async () => {
    if (!book) return;
    const settings = book.settings as ColorByNumberSettings;
    const nextNum = (book.pages?.length || 0) + 1;
    const title = `${settings.theme} Plate #${nextNum}`;
    const newScene = generateFallbackColorByNumberScene(settings.theme, nextNum, settings.complexity || 'medium');

    const puzzleSvg = generateColorByNumberSvg(newScene);
    const answerSvg = generateAnswerSvg(newScene);
    const puzzleDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(puzzleSvg)}`;
    const answerDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(answerSvg)}`;

    const newPage: PuzzlePage = {
      id: `page_cbn_${nextNum}_${Date.now()}`,
      pageNumber: nextNum,
      type: 'color-by-number',
      title,
      imageUrl: puzzleDataUrl,
      puzzleData: {
        scene: newScene,
        svg: puzzleSvg,
        answerSvg: answerSvg,
        imageUrl: puzzleDataUrl,
        answerImageUrl: answerDataUrl,
        palette: newScene.colorKey,
      },
      answerData: {
        palette: newScene.colorKey,
        svg: answerSvg,
        imageUrl: answerDataUrl,
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
        genre: 'Coloring & Activity Books',
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

  const activeSvgString = useMemo(() => {
    if (!selectedPage?.puzzleData) return '';
    return showColorSolution
      ? selectedPage.puzzleData.answerSvg || generateAnswerSvg(sceneData || generateFallbackColorByNumberScene('Art', 1))
      : selectedPage.puzzleData.svg || generateColorByNumberSvg(sceneData || generateFallbackColorByNumberScene('Art', 1));
  }, [selectedPage, showColorSolution, sceneData]);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        Loading Color by Number Studio...
      </div>
    );
  }

  if (!book) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="text-sm font-bold text-slate-700">Color by Number Book Not Found</div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
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
              <span>{book.pages?.length || 0} Vector Scenes ({book.totalPages || book.pages?.length * 2} Pages)</span>
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
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
              Mosaic Scenes ({book.pages?.length || 0})
            </h2>
            <button
              onClick={handleAddScene}
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Scene</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {book.pages.map((p, idx) => {
              const active = idx === selectedPageIndex;
              const regionsCount = (p.puzzleData?.scene as ColorByNumberPageData)?.regions?.length || 8;

              return (
                <div
                  key={p.id || idx}
                  onClick={() => setSelectedPageIndex(idx)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    active
                      ? 'border-teal-600 bg-teal-50/70 text-teal-900 shadow-2xs'
                      : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{p.title || `Scene #${p.pageNumber}`}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{regionsCount} Numbered Regions</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${active ? 'bg-teal-200/60 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>
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
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedPage.title || `Color by Number #${selectedPage.pageNumber}`}
                  </h3>
                  <div className="text-xs text-slate-400">Scene {selectedPage.pageNumber} of {book.pages.length}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowColorSolution(!showColorSolution)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      showColorSolution
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {showColorSolution ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showColorSolution ? 'Show Numbered Grid' : 'Show Full Color'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRegenerateCurrentScene}
                    disabled={isRegeneratingScene}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs border border-teal-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isRegeneratingScene ? 'animate-spin' : ''} />
                    <span>{isRegeneratingScene ? 'Generating...' : 'Re-Design Scene'}</span>
                  </button>
                </div>
              </div>

              {/* Print Simulator Frame */}
              <div className="my-6 p-4 sm:p-8 rounded-2xl bg-slate-50/50 border border-slate-200/80 flex flex-col items-center justify-between min-h-[480px]">
                <div className="text-center mb-4">
                  <h4 className="font-extrabold text-sm sm:text-base tracking-widest uppercase text-slate-900">
                    {selectedPage.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider">
                    {showColorSolution ? 'Full Color Key Solution' : 'Match the numbers to the color palette below'}
                  </p>
                </div>

                {/* SVG Vector Canvas */}
                <div className="w-full max-w-md aspect-[4/5] bg-white rounded-2xl border border-slate-300 p-2 shadow-xs flex items-center justify-center overflow-hidden">
                  <div
                    className="w-full h-full flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: activeSvgString }}
                  />
                </div>

                {/* Color Palette Table Footer */}
                <div className="w-full mt-6 pt-4 border-t border-slate-200 space-y-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                    Color Palette Key:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(sceneData?.colorKey || selectedPage.puzzleData?.palette || []).map((ck: any) => (
                      <div key={ck.number} className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                        <span
                          className="w-5 h-5 rounded-md border border-slate-900/40 inline-block shrink-0"
                          style={{ backgroundColor: ck.color }}
                        />
                        <div className="truncate">
                          <div className="text-[11px] font-extrabold text-slate-900 leading-none">#{ck.number}</div>
                          <div className="text-[10px] text-slate-500 font-medium truncate">{ck.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Edit Scene Drawer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsEditingScene(!isEditingScene)}
                    className="text-xs font-bold text-slate-800 hover:text-teal-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>{isEditingScene ? 'Hide Scene Editor' : 'Edit Scene Description'}</span>
                  </button>
                  <span className="text-[11px] text-slate-400">
                    {(sceneData?.regions?.length || 8)} geometric regions
                  </span>
                </div>

                {isEditingScene && (
                  <div className="space-y-3 pt-2">
                    <input
                      type="text"
                      value={editSceneTitle}
                      onChange={(e) => setEditSceneTitle(e.target.value)}
                      placeholder="Enter new scene description or subject..."
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleRegenerateCurrentScene}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Re-Generate Vector Scene
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              Select a scene from the left panel to preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
