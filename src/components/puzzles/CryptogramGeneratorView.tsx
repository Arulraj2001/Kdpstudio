import React, { useState } from 'react';
import { 
  KeyRound, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Download, 
  Layers, 
  BookOpen, 
  Check, 
  Copy,
  ArrowRight
} from 'lucide-react';
import { 
  generateCryptogram, 
  CRYPTOGRAM_QUOTE_BANKS, 
  CryptogramPuzzle 
} from '../../lib/puzzles/cryptogramEngine';
import { exportCryptogramBookPdf } from '../../lib/toolsPdfExport';
import { SEOHead } from '../seo/SEOHead';
import { PageRoute } from '../../types';

interface CryptogramGeneratorViewProps {
  onNavigate?: (route: PageRoute) => void;
}

export const CryptogramGeneratorView: React.FC<CryptogramGeneratorViewProps> = ({ onNavigate }) => {
  const [customText, setCustomText] = useState<string>('');
  const [author, setAuthor] = useState<string>('Steve Jobs');
  const [hintCount, setHintCount] = useState<number>(2);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [puzzle, setPuzzle] = useState<CryptogramPuzzle>(() => generateCryptogram(undefined, 'Steve Jobs', 'Inspiration', 2));
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleGenerate = () => {
    setPuzzle(generateCryptogram(customText, author, 'Custom', hintCount));
  };

  const handleSelectPreset = (quote: typeof CRYPTOGRAM_QUOTE_BANKS[0]) => {
    setCustomText(quote.text);
    setAuthor(quote.author);
    setPuzzle(generateCryptogram(quote.text, quote.author, quote.category, hintCount));
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportCryptogramBookPdf(20, '8.5x11');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-20 font-sans">
      <SEOHead
        pageKey="features"
        title="Cryptogram & Cipher Puzzle Studio — KDP Studio"
        description="Generate monoalphabetic cryptogram puzzle books with letter frequencies, hints, and matching answer keys for Amazon KDP."
        canonicalPath="/puzzles/cryptograms"
      />

      {/* Header */}
      <div className="bg-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <KeyRound size={14} className="text-purple-400" />
            <span>Cipher Puzzle Suite</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display">
            Cryptogram &amp; <span className="font-serif italic font-normal text-purple-400">Cipher Puzzle Studio</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Create bestselling substitution cipher puzzle books. Features automatic letter frequency hints, quote libraries, clean typography, and formatted back-of-book solution sheets.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT: PUZZLE CONTROLS ── */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Sparkles size={18} className="text-purple-600" />
              <span>Quote &amp; Cipher Setup</span>
            </h2>

            {/* Custom Quote Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Puzzle Quote Text
              </label>
              <textarea
                rows={3}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type or paste any quote to turn into a substitution cipher..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all leading-relaxed"
              />
            </div>

            {/* Author Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Author / Attributed Source
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
              />
            </div>

            {/* Preset Quotes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Or Pick From Quote Library
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {CRYPTOGRAM_QUOTE_BANKS.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectPreset(q)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-purple-50 hover:border-purple-300 text-left transition-all cursor-pointer text-xs"
                  >
                    <div className="font-semibold text-slate-900 truncate">"{q.text}"</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">— {q.author} ({q.category})</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hint Letter Count Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="uppercase tracking-wider">Pre-Revealed Hint Letters</span>
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 rounded-full font-black text-xs">
                  {hintCount} Hints
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                value={hintCount}
                onChange={(e) => setHintCount(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw size={16} />
                <span>Regenerate Cipher Map</span>
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
                {showSolution ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showSolution ? 'Hide Solution Key' : 'Reveal Solution Key'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isExporting ? 'Generating PDF Manuscript...' : 'Export 20-Page Cryptogram Book PDF'}</span>
              </button>
            </div>

          </div>

          {/* ── RIGHT: PUZZLE WORKSHEET CANVAS ── */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Print-Ready Worksheet Layout
                </span>
                <p className="text-[11px] text-slate-500">
                  Category: {puzzle.category} • Pre-Revealed Hints: {puzzle.hints.length}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                showSolution ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {showSolution ? 'Solution Revealed' : 'Puzzle Sheet'}
              </span>
            </div>

            {/* Cipher Box Presentation */}
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-8 min-h-[380px] flex flex-col justify-between">
              
              {/* Words Layout */}
              <div className="flex flex-wrap gap-x-6 gap-y-8 justify-center max-w-xl mx-auto pt-4">
                {puzzle.cipherText.split(' ').map((word, wIdx) => (
                  <div key={wIdx} className="flex gap-1.5">
                    {word.split('').map((char, cIdx) => {
                      const isLetter = /[A-Z]/.test(char);
                      const originalChar = isLetter ? puzzle.reverseMap[char] : char;
                      const isHint = puzzle.hints.some(h => h.cipher === char);

                      return (
                        <div key={cIdx} className="flex flex-col items-center">
                          {/* Upper Answer Slot */}
                          <div className={`w-7 h-7 flex items-center justify-center text-sm font-black border-b-2 ${
                            isHint
                              ? 'border-purple-600 text-purple-700'
                              : showSolution
                              ? 'border-emerald-600 text-emerald-600'
                              : 'border-slate-400 text-transparent'
                          }`}>
                            {isLetter ? (isHint ? originalChar : (showSolution ? originalChar : '')) : char}
                          </div>
                          {/* Lower Cipher Letter */}
                          <div className="text-xs font-bold text-slate-700 mt-1 font-mono">
                            {char}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Hints Box */}
              <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-900">Pre-Revealed Clues:</span>
                  <div className="flex gap-2">
                    {puzzle.hints.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-900 font-mono font-black rounded">
                        {h.cipher} = {h.original}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-slate-500 font-medium italic">
                  — {puzzle.authorOrSource}
                </div>
              </div>

            </div>

            {/* Frequency Table */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Letter Frequency Reference Table:
              </span>
              <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                {Object.entries(puzzle.letterFrequencies).map(([letter, count]) => (
                  <span key={letter} className="px-2 py-1 bg-white rounded border border-slate-200 text-slate-700">
                    <strong>{letter}:</strong> {count}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
