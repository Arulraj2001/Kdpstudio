import React, { useState } from 'react';
import { 
  Grid3X3, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Eye, 
  EyeOff, 
  Layers, 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { 
  generateSudoku, 
  SudokuDifficulty, 
  SudokuPuzzle, 
  DIFFICULTY_CLUES 
} from '../../lib/puzzles/sudokuEngine';
import { exportSudokuBookPdf } from '../../lib/toolsPdfExport';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';

interface SudokuGeneratorViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const SudokuGeneratorView: React.FC<SudokuGeneratorViewProps> = ({ onNavigate }) => {
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>('medium');
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [batchCount, setBatchCount] = useState<number>(20);
  const [trimSize, setTrimSize] = useState<'8.5x11' | '6x9' | '5.5x8.5'>('8.5x11');
  const [puzzle, setPuzzle] = useState<SudokuPuzzle>(() => generateSudoku('medium'));
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleRegenerate = () => {
    setPuzzle(generateSudoku(difficulty));
  };

  const handleDifficultyChange = (d: SudokuDifficulty) => {
    setDifficulty(d);
    setPuzzle(generateSudoku(d));
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportSudokuBookPdf(batchCount, difficulty, trimSize);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20 font-sans">
      <SEOHead
        pageKey="features"
        title="Free 9x9 Sudoku Generator with Solutions — KDP Studio"
        description="Generate 100% valid, commercial-ready 9x9 Sudoku puzzle books for Amazon KDP. 4 difficulty levels with ready-to-publish 300 DPI vector PDF exports and answer keys."
        canonicalPath="/puzzles/sudoku"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Grid3X3 size={14} className="text-purple-400" />
            <span>Classic Logic Engine</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Classic 9×9 <span className="font-serif italic font-normal text-purple-400">Sudoku Generator Studio</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Create commercial-grade Sudoku puzzle books with guaranteed unique solutions. Export complete, ready-to-upload multi-page PDF interiors with formatted solution keys.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT CONTROLS ── */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Puzzle Parameters
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {puzzle.clueCount} Clues Remaining
              </span>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Difficulty Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['easy', 'medium', 'hard', 'expert'] as SudokuDifficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDifficultyChange(d)}
                    className={`py-3 px-3 rounded-2xl font-bold text-xs capitalize transition-all cursor-pointer border ${
                      difficulty === d
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-900/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {DIFFICULTY_CLUES[d].label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 italic">
                {DIFFICULTY_CLUES[difficulty].description}
              </p>
            </div>

            {/* Trim Size */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Target Trim Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['8.5x11', '6x9', '5.5x8.5'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setTrimSize(size)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                      trimSize === size
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {size}"
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Count */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="uppercase tracking-wider">Book Batch Size</span>
                <span className="text-purple-600 font-black">{batchCount} Puzzles</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                <span>10 Puzzles</span>
                <span>20 (Standard)</span>
                <span>50</span>
                <span>100 (Full Book)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleRegenerate}
                className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw size={15} />
                <span>Regenerate Board Seed</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSolution(!showSolution)}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  showSolution
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {showSolution ? <EyeOff size={15} /> : <Eye size={15} />}
                <span>{showSolution ? 'Hide Solution Overlay' : 'Reveal Solution Key'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-900/20 hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={16} />
                <span>{isExporting ? 'Generating PDF Manuscript...' : `Export Complete ${batchCount}-Page Sudoku Book PDF`}</span>
              </button>
            </div>

          </div>

          {/* ── RIGHT: INTERACTIVE 9x9 SUDOKU BOARD CANVAS ── */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Live 9×9 Vector Grid Preview
                </span>
                <p className="text-[11px] text-slate-500">
                  Ready to print at 300 DPI • Amazon KDP Gutter Margin Compliant
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                100% Unique Solution
              </span>
            </div>

            {/* 9x9 Board */}
            <div className="p-4 sm:p-6 bg-slate-900 rounded-3xl shadow-2xl inline-block max-w-full overflow-hidden">
              <div className="grid grid-cols-9 gap-[1px] bg-slate-400 p-[3px] rounded-2xl border-4 border-slate-950">
                {puzzle.puzzleGrid.map((row, rIdx) =>
                  row.map((cellVal, cIdx) => {
                    const isGiven = cellVal !== null;
                    const solutionVal = puzzle.solutionGrid[rIdx][cIdx];
                    const isBoxBorderRight = (cIdx + 1) % 3 === 0 && cIdx !== 8;
                    const isBoxBorderBottom = (rIdx + 1) % 3 === 0 && rIdx !== 8;

                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={`w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-base sm:text-xl transition-all select-none ${
                          isGiven 
                            ? 'bg-white text-slate-900 font-black' 
                            : showSolution
                            ? 'bg-emerald-50 text-emerald-600 font-bold'
                            : 'bg-slate-50 text-transparent'
                        } ${isBoxBorderRight ? 'border-r-2 border-r-slate-900' : ''} ${
                          isBoxBorderBottom ? 'border-b-2 border-b-slate-900' : ''
                        }`}
                      >
                        {isGiven ? cellVal : showSolution ? solutionVal : ''}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer Specifications */}
            <div className="w-full pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <CheckCircle2 size={14} />
                <span>Zero Duplicate Solution Guarantee</span>
              </div>
              <div className="flex items-center gap-3 font-semibold">
                <span>Trim: {trimSize}"</span>
                <span>•</span>
                <span>Solutions Section: Included</span>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
