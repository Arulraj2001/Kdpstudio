import React, { useState } from 'react';
import { 
  Grid, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Eye, 
  EyeOff, 
  BookOpen, 
  CheckCircle2, 
  Layers, 
  ArrowRight
} from 'lucide-react';
import { 
  generateCrossword, 
  CROSSWORD_THEMES, 
  CrosswordPuzzle 
} from '../../lib/puzzles/crosswordEngine';
import { exportCrosswordBookPdf } from '../../lib/toolsPdfExport';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';

interface CrosswordGeneratorViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const CrosswordGeneratorView: React.FC<CrosswordGeneratorViewProps> = ({ onNavigate }) => {
  const [theme, setTheme] = useState<string>('science');
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [batchCount, setBatchCount] = useState<number>(10);
  const [trimSize, setTrimSize] = useState<'8.5x11' | '6x9'>('8.5x11');
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle>(() => generateCrossword('science', 13));
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleRegenerate = () => {
    setPuzzle(generateCrossword(theme, 13));
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setPuzzle(generateCrossword(newTheme, 13));
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportCrosswordBookPdf(batchCount, theme, trimSize);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20 font-sans">
      <SEOHead
        pageKey="features"
        title="Free Clued Crossword Puzzle Generator — KDP Studio"
        description="Generate commercial-ready clued crossword puzzle books for Amazon KDP. Themed vocabulary banks, automatic Across & Down numbering, and ready-to-publish 300 DPI vector PDF exports."
        canonicalPath="/puzzles/crosswords"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Grid size={14} className="text-purple-400" />
            <span>Clued Puzzle Engine</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Clued Crossword <span className="font-serif italic font-normal text-purple-400">Puzzle Studio</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Create intersecting crossword puzzles with authentic Across &amp; Down clues. Export complete multi-page activity book manuscripts with formatted solution grids.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT CONTROLS ── */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Crossword Settings
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {puzzle.wordCount} Intersecting Clues
              </span>
            </div>

            {/* Theme Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Vocabulary Theme
              </label>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(CROSSWORD_THEMES).map(([key, data]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleThemeChange(key)}
                    className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer border ${
                      theme === key
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{data.icon}</span>
                      <span>{data.name}</span>
                    </span>
                    <span className={`text-[10px] ${theme === key ? 'text-purple-200' : 'text-slate-400'}`}>
                      {data.pairs.length} words
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Count */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="uppercase tracking-wider">Book Batch Size</span>
                <span className="text-purple-600 font-black">{batchCount} Crosswords</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                <span>5</span>
                <span>10 (Standard)</span>
                <span>25</span>
                <span>50 Puzzles</span>
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
                <span>Regenerate Crossword Grid</span>
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
                <span>{showSolution ? 'Hide Solution Overlay' : 'Reveal Solution Letters'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-900/20 hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={16} />
                <span>{isExporting ? 'Generating PDF Manuscript...' : `Export Complete ${batchCount}-Page Book PDF`}</span>
              </button>
            </div>

          </div>

          {/* ── RIGHT: INTERACTIVE CROSSWORD CANVAS & CLUES ── */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">{puzzle.title}</h2>
                <p className="text-[11px] text-slate-500">
                  Standard 13×13 Intersecting Grid • Ready to publish at 300 DPI
                </p>
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                Across &amp; Down
              </span>
            </div>

            {/* Crossword Grid Preview */}
            <div className="p-4 bg-slate-900 rounded-3xl shadow-xl flex justify-center overflow-x-auto">
              <div 
                className="grid gap-[1px] bg-slate-950 p-2 rounded-2xl border border-slate-700"
                style={{ gridTemplateColumns: `repeat(${puzzle.gridSize}, minmax(0, 1fr))` }}
              >
                {puzzle.grid.map((row, rIdx) =>
                  row.map((cell, cIdx) => (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`w-6 h-6 sm:w-8 sm:h-8 relative flex items-center justify-center text-xs sm:text-sm font-bold select-none transition-all ${
                        cell.isBlocked
                          ? 'bg-slate-900'
                          : 'bg-white text-slate-900'
                      }`}
                    >
                      {cell.number !== null && !cell.isBlocked && (
                        <span className="absolute top-0.5 left-0.5 text-[8px] sm:text-[9px] font-bold text-slate-500 leading-none">
                          {cell.number}
                        </span>
                      )}
                      {!cell.isBlocked && (
                        <span className={`font-black ${showSolution ? 'text-emerald-600' : 'text-transparent'}`}>
                          {cell.letter}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clues Breakdown (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              
              {/* Across */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <span>Across ({puzzle.acrossClues.length})</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 max-h-60 overflow-y-auto pr-2">
                  {puzzle.acrossClues.map((c) => (
                    <li key={`across-${c.number}`} className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-black text-purple-700 w-5 shrink-0">{c.number}.</span>
                      <span className="text-slate-600 leading-tight">{c.clue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Down */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>Down ({puzzle.downClues.length})</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 max-h-60 overflow-y-auto pr-2">
                  {puzzle.downClues.map((c) => (
                    <li key={`down-${c.number}`} className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-black text-indigo-700 w-5 shrink-0">{c.number}.</span>
                      <span className="text-slate-600 leading-tight">{c.clue}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
