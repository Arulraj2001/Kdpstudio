import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Download, 
  RefreshCw, 
  Layers, 
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { getPuzzleBook } from '../../lib/puzzleService';
import { PuzzleBook } from '../../types/puzzle';

import { runPuzzleBookGeneration, GenerationProgressUpdate } from '../../lib/puzzles/puzzleGenerationEngine';
import { exportPuzzleBookPdfClient } from '../../lib/puzzles/puzzleClientExport';

interface WordSearchGeneratingViewProps {
  bookId: string;
  onPreviewBook: (bookId: string) => void;
  onExportPdf?: (bookId: string) => void;
}

export const WordSearchGeneratingView: React.FC<WordSearchGeneratingViewProps> = ({
  bookId,
  onPreviewBook,
  onExportPdf,
}) => {
  const [book, setBook] = useState<PuzzleBook | null>(null);
  const [progress, setProgress] = useState(0.05);
  const [actionText, setActionText] = useState('Initializing puzzle engine...');
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(25);
  const [isComplete, setIsComplete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const isGeneratingRef = React.useRef(false);

  // 1. Initial load & client generation engine execution
  useEffect(() => {
    let isMounted = true;

    const startOrPollGeneration = async () => {
      const b = await getPuzzleBook(bookId);
      if (!b || !isMounted) return;

      setBook(b);
      const count = b.settings?.pageCount || 25;
      setTotalCount(count);

      if (b.status === 'complete' && b.pages && b.pages.length > 0) {
        setIsComplete(true);
        setProgress(1.0);
        setCompletedCount(b.pages.length);
        setActionText('Your book is ready! 🎉');
        return;
      }

      // If not yet generated, run client-side puzzle generation engine
      if (!isGeneratingRef.current && (b.status === 'generating' || !b.pages || b.pages.length === 0)) {
        isGeneratingRef.current = true;
        try {
          const generatedPages = await runPuzzleBookGeneration(bookId, b.settings, (update: GenerationProgressUpdate) => {
            if (!isMounted) return;
            setProgress(update.progress);
            setActionText(update.currentAction);
            setCompletedCount(update.completedCount);
            setTotalCount(update.totalCount);
            if (update.status === 'complete') {
              setIsComplete(true);
              setProgress(1.0);
              setActionText('Your book is ready! 🎉');
            }
          });

          if (isMounted) {
            const updated = await getPuzzleBook(bookId);
            if (updated) setBook(updated);
            setIsComplete(true);
            setProgress(1.0);
            setCompletedCount(generatedPages.length);
          }
        } catch (err) {
          console.error('Client generation error:', err);
        } finally {
          isGeneratingRef.current = false;
        }
      }
    };

    startOrPollGeneration();

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  // Export PDF directly with 300 DPI client engine
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

  // Remaining time calculation
  const remainingPuzzles = Math.max(0, totalCount - completedCount);
  const estimatedSecondsLeft = remainingPuzzles * 2;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs text-center space-y-8">
        {/* Animated Icon */}
        <div className="relative w-20 h-20 mx-auto">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${
            isComplete
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-purple-50 text-purple-600 border border-purple-200 animate-pulse'
          }`}>
            {isComplete ? (
              <CheckCircle2 size={40} className="text-emerald-600 animate-scale-in" />
            ) : (
              <RefreshCw size={36} className="text-purple-600 animate-spin" />
            )}
          </div>
        </div>

        {/* Title & Theme */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isComplete ? 'Word Search Book Complete!' : 'Generating Your Word Search Book'}
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {book?.settings.title || 'Generating themed puzzles & solutions...'}
          </p>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="max-w-lg mx-auto space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-600 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-purple-500 animate-ping'}`} />
              <span>{actionText}</span>
            </span>
            <span className="text-purple-700 font-extrabold">
              {completedCount}/{totalCount} puzzles
            </span>
          </div>

          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600'
              }`}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>

          {!isComplete && (
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Clock size={12} />
              <span>Estimated time remaining: ~{estimatedSecondsLeft}s</span>
            </div>
          )}
        </div>

        {/* Action Buttons on completion */}
        {isComplete && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => onPreviewBook(bookId)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Eye size={16} />
              <span>Preview &amp; Edit Puzzles</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Download size={16} />
              <span>{isExporting ? 'Preparing PDF...' : 'Download KDP Interior PDF'}</span>
            </button>
          </div>
        )}

        {/* Puzzle Cards Live Generation Matrix */}
        <div className="pt-6 text-left">
          <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Layers size={14} className="text-purple-600" />
            <span>Puzzle Pages Queue</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {Array.from({ length: totalCount }, (_, i) => {
              const pageNum = i + 1;
              const isPageDone = pageNum <= completedCount;
              const isCurrent = pageNum === completedCount + 1 && !isComplete;

              return (
                <div
                  key={pageNum}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isPageDone
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : isCurrent
                      ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-100'
                      : 'bg-slate-50/60 border-slate-200/80 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider">
                    Puzzle #{pageNum}
                  </div>
                  <div className="mt-2 flex justify-center">
                    {isPageDone ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : isCurrent ? (
                      <RefreshCw size={14} className="text-purple-600 animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
