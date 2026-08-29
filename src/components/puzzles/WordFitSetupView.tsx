import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Grid3X3, 
  Sliders, 
  BookOpen, 
  Check, 
  RefreshCw, 
  Layers, 
  Zap,
  Info
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { WordFitSettings, PuzzleTrimSize } from '../../types/puzzle';
import { generateWordFitGrid, groupWordsByLength, WordFitResult } from '../../lib/puzzles/wordFit';
import { callGemini } from '../../lib/gemini';
import { savePuzzleBook } from '../../lib/puzzleService';

interface WordFitSetupViewProps {
  onBack?: () => void;
  onStartGenerating?: (bookId: string) => void;
}

export const WordFitSetupView: React.FC<WordFitSetupViewProps> = ({
  onBack,
  onStartGenerating,
}) => {
  const { user, userDoc } = useAuthStore();
  const { open } = useCheckoutStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Book Settings
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [theme, setTheme] = useState('');
  const [pageCount, setPageCount] = useState(25);
  const [trimSize, setTrimSize] = useState<PuzzleTrimSize>('8.5x11');
  const [gridSize, setGridSize] = useState<13 | 15 | 17>(15);
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [includeInstructions, setIncludeInstructions] = useState(true);

  // Step 2: Words & Distribution
  const [wordSourceTab, setWordSourceTab] = useState<'ai' | 'manual'>('ai');
  const [shortPct, setShortPct] = useState(25);
  const [medPct, setMedPct] = useState(50);
  const [longPct, setLongPct] = useState(25);
  const [sampleChips, setSampleChips] = useState<string[]>([]);
  const [customWordListRaw, setCustomWordListRaw] = useState('');
  const [newChipInput, setNewChipInput] = useState('');

  // Status flags
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userDoc?.name && !author) {
      setAuthor(userDoc.name);
    }
  }, [userDoc]);

  // Adjust sliders helper
  const handleShortPctChange = (val: number) => {
    setShortPct(val);
    const rem = 100 - val;
    setMedPct(Math.round(rem * 0.65));
    setLongPct(rem - Math.round(rem * 0.65));
  };

  const handleSuggestTitle = async () => {
    if (!theme) {
      alert('Please enter a theme first to generate relevant titles!');
      return;
    }
    setIsSuggestingTitle(true);
    try {
      const prompt = `Suggest a catchy Amazon KDP bestselling book title for a Word Fit / Fill-In crossword puzzle book with the theme "${theme}". Return ONLY the title text, nothing else.`;
      const res = await callGemini(prompt);
      const cleanTitle = res.replace(/["'\n\r]/g, '').trim();
      if (cleanTitle) {
        setTitle(cleanTitle);
        if (!subtitle) {
          setSubtitle(`${pageCount} Themed Fill-In Crossword Puzzles with Solutions`);
        }
      }
    } catch {
      setTitle(`${theme.charAt(0).toUpperCase() + theme.slice(1)} Word Fit Crosswords`);
    } finally {
      setIsSuggestingTitle(false);
    }
  };

  // Generate sample words for Step 2
  const handleGenerateSampleWords = async () => {
    if (!theme) return;
    setIsGeneratingSamples(true);
    try {
      const res = await fetch('/api/puzzles/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          count: 18,
          wordLength: `Mixed (${shortPct}% 3-5L, ${medPct}% 6-8L, ${longPct}% 9+L)`,
          includeProperNouns: true,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.words)) {
        setSampleChips(data.words);
      }
    } catch (err) {
      console.warn('Sample generation error:', err);
    } finally {
      setIsGeneratingSamples(false);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && sampleChips.length === 0 && theme) {
      handleGenerateSampleWords();
    }
  }, [currentStep]);

  const customWordsParsed = useMemo(() => {
    return customWordListRaw
      .split(/[\n,]+/)
      .map((w) => w.trim().toUpperCase().replace(/[^A-Z]/g, ''))
      .filter((w) => w.length >= 3);
  }, [customWordListRaw]);

  // Live preview words & crossword grid
  const previewWords = useMemo(() => {
    if (wordSourceTab === 'manual' && customWordsParsed.length >= 10) {
      return customWordsParsed.slice(0, 18);
    }
    if (sampleChips.length >= 10) {
      return sampleChips.slice(0, 18);
    }
    return [
      'SUN', 'SEA', 'BOAT', 'SHIP', 'OCEAN', 'BEACH', 'CORAL', 'SHARK',
      'DOLPHIN', 'TURTLE', 'SEAHORSE', 'OCTOPUS', 'SUBMARINE', 'BARNACLE', 'NAVIGATION'
    ];
  }, [wordSourceTab, customWordsParsed, sampleChips]);

  const livePreviewResult = useMemo<WordFitResult>(() => {
    return generateWordFitGrid(previewWords, gridSize);
  }, [previewWords, gridSize]);

  const groupedWords = useMemo(() => {
    return groupWordsByLength(livePreviewResult.placedWords);
  }, [livePreviewResult.placedWords]);

  // Submit and start full generation
  const handleStartGeneration = async () => {
    const isFreePlan = (userDoc?.plan || 'free') === 'free';
    if (isFreePlan) {
      open('starter');
      return;
    }

    setIsSubmitting(true);
    const bookId = `puz_wf_${Date.now()}`;

    const settings: WordFitSettings = {
      type: 'word-fit',
      title: title || `${theme || 'Themed'} Word Fit Puzzles`,
      subtitle: subtitle || `${pageCount} Puzzles for Enthusiasts`,
      author: author || userDoc?.name || 'Kindle Author',
      theme: theme || 'General Knowledge',
      difficulty: gridSize === 13 ? 'easy' : gridSize === 15 ? 'medium' : 'hard',
      pageCount,
      trimSize,
      gridSize,
      wordCount: 18,
      includeAnswers,
      includeCoverPage: true,
      includeInstructions,
      paperType: 'white',
      aiGenerateWords: wordSourceTab === 'ai',
      wordList: wordSourceTab === 'manual' ? customWordsParsed : sampleChips,
    };

    try {
      await savePuzzleBook({
        id: bookId,
        uid: user?.uid || 'guest',
        settings,
        pages: [],
        status: 'generating',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalPages: pageCount + 4,
      });

      fetch('/api/puzzles/word-fit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, settings }),
      }).catch(console.error);

      if (onStartGenerating) {
        onStartGenerating(bookId);
      }
    } catch (err) {
      console.error('Error starting Word Fit generation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Puzzles Dashboard</span>
        </button>

        <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
          Word Fit Generator
        </div>
      </div>

      {/* 3-Step Progress Indicator */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-200 z-0">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <button
              onClick={() => setCurrentStep(1)}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep >= 1 ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-sm' : 'bg-slate-100 text-slate-400'
              }`}
            >
              1
            </button>
            <span className="text-[11px] font-bold text-slate-700">Book Details</span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <button
              onClick={() => theme && setCurrentStep(2)}
              disabled={!theme}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep >= 2 ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-sm' : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </button>
            <span className="text-[11px] font-bold text-slate-700">Length Mix &amp; Words</span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <button
              onClick={() => theme && setCurrentStep(3)}
              disabled={!theme}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep === 3 ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-sm' : 'bg-slate-100 text-slate-400'
              }`}
            >
              3
            </button>
            <span className="text-[11px] font-bold text-slate-700">Preview &amp; Create</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STEP 1: Book Settings
         ───────────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600" />
              <span>Book Details</span>
            </h2>

            {/* Theme */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Book Theme <span className="text-rose-500">* (Required)</span>
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. World Travel, Garden Flowers, Movie Classics, Vintage Cars..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            {/* Title + AI Suggest Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Book Title</label>
                <button
                  type="button"
                  onClick={handleSuggestTitle}
                  disabled={!theme || isSuggestingTitle}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>{isSuggestingTitle ? 'Crafting title...' : 'AI Suggest Title'}</span>
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. World Travel Word Fit: 50 Fill-In Crossword Puzzles"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Subtitle (Optional)</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Challenging Crossword Grids with Solutions"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Author Name</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author or Publishing Brand"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Book Structure & Grid Size */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              <span>Crossword Structure &amp; Grid Matrix</span>
            </h2>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Number of Puzzles</span>
                <span className="text-indigo-600 font-extrabold text-sm">{pageCount} Puzzles</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
              />
            </div>

            {/* Grid Size Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Crossword Grid Size</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { size: 13, title: '13 × 13 (Compact)', desc: 'Easier to solve, fast filling' },
                  { size: 15, title: '15 × 15 (Standard)', desc: 'Bestseller KDP format (Recommended)' },
                  { size: 17, title: '17 × 17 (Large)', desc: 'Higher challenge and interlocking density' },
                ].map((g) => (
                  <button
                    key={g.size}
                    type="button"
                    onClick={() => setGridSize(g.size as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      gridSize === g.size
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">{g.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trim Size */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Trim Size</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: '8.5x11', title: '8.5" × 11" Large Print', desc: 'Optimal for fill-in crossword boxes' },
                  { id: '6x9', title: '6" × 9" Standard', desc: 'Compact travel size' },
                  { id: '8x5', title: '8" × 8" Square', desc: 'Modern activity format' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTrimSize(item.id as PuzzleTrimSize)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      trimSize === item.id
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Explanatory badge */}
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs flex items-center gap-2">
              <Info size={16} className="text-indigo-600 shrink-0" />
              <span>
                <strong>Words per puzzle:</strong> 15–20 words automatically calculated and balanced per puzzle to maximize crossword letter intersections.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={includeAnswers}
                  onChange={(e) => setIncludeAnswers(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Include Solution Answer Key in back</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={includeInstructions}
                  onChange={(e) => setIncludeInstructions(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Include Instructions Page (How to play)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!theme}
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <span>Next: Length Mix &amp; Words</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 2: Words & Length Distribution
         ───────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Word Fit Length Distribution</h2>
                <p className="text-xs text-slate-500">
                  Crossword grids require a balanced spectrum of word lengths to intersect seamlessly.
                </p>
              </div>

              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setWordSourceTab('ai')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    wordSourceTab === 'ai' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  AI Word Mix
                </button>
                <button
                  type="button"
                  onClick={() => setWordSourceTab('manual')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    wordSourceTab === 'manual' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Enter Word Pool
                </button>
              </div>
            </div>

            {wordSourceTab === 'ai' && (
              <div className="space-y-6">
                {/* 3 Length Distribution Sliders */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="text-xs font-bold text-slate-800">Word Length Distribution (Must total 100%)</div>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>Short (3–5 letters): e.g. SUN, SEA, CAT</span>
                        <span className="text-indigo-600 font-bold">{shortPct}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={50}
                        value={shortPct}
                        onChange={(e) => handleShortPctChange(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>Medium (6–8 letters): e.g. ISLAND, DOLPHIN</span>
                        <span className="text-indigo-600 font-bold">{medPct}%</span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={70}
                        value={medPct}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMedPct(val);
                          setLongPct(Math.max(10, 100 - shortPct - val));
                        }}
                        className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>Long (9–12 letters): e.g. NAVIGATION, SUBMARINE</span>
                        <span className="text-indigo-600 font-bold">{longPct}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={40}
                        value={longPct}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setLongPct(val);
                          setMedPct(Math.max(20, 100 - shortPct - val));
                        }}
                        className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Sample Chip Generator */}
                <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-indigo-900">Sample Vocabulary Preview</div>
                      <div className="text-[11px] text-indigo-700">
                        Previewing a balanced mix of short, medium, and long words for theme: {theme}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateSampleWords}
                      disabled={isGeneratingSamples}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={isGeneratingSamples ? 'animate-spin' : ''} />
                      <span>{isGeneratingSamples ? 'Generating...' : 'Regenerate Samples'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[48px] items-center">
                    {sampleChips.map((chip, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-indigo-200 text-indigo-900 font-bold text-xs shadow-2xs"
                      >
                        <span>{chip} ({chip.length}L)</span>
                        <button
                          type="button"
                          onClick={() => setSampleChips(sampleChips.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-indigo-200/50">
                    <input
                      type="text"
                      value={newChipInput}
                      onChange={(e) => setNewChipInput(e.target.value)}
                      placeholder="Add custom word..."
                      className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs font-medium text-slate-800 outline-none w-48"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newChipInput.trim()) {
                          setSampleChips([...sampleChips, newChipInput.trim().toUpperCase()]);
                          setNewChipInput('');
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newChipInput.trim()) {
                          setSampleChips([...sampleChips, newChipInput.trim().toUpperCase()]);
                          setNewChipInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {wordSourceTab === 'manual' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Your Word Pool (Reused across Word Fit puzzles)
                  </label>
                  <span className="text-xs font-bold text-indigo-600">
                    {customWordsParsed.length} words entered
                  </span>
                </div>

                <textarea
                  rows={8}
                  value={customWordListRaw}
                  onChange={(e) => setCustomWordListRaw(e.target.value)}
                  placeholder="Enter words with various lengths separated by commas:
SUN, SEA, BOAT, SHIP, OCEAN, BEACH, CORAL, SHARK, DOLPHIN, TURTLE, SEAHORSE, OCTOPUS, SUBMARINE, NAVIGATION..."
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Next: Preview &amp; Generate</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 3: Preview & Generate
         ───────────────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Summary Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Word Fit Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Book Title:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[200px]">{title || `${theme} Word Fit`}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Theme:</span>
                  <span className="font-bold text-slate-900">{theme}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Puzzles Count:</span>
                  <span className="font-bold text-slate-900">{pageCount} Crosswords</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Grid Size:</span>
                  <span className="font-bold text-slate-900">{gridSize} × {gridSize}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Trim Size:</span>
                  <span className="font-bold text-slate-900">{trimSize}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Estimated Pages:</span>
                  <span className="font-bold text-indigo-700">~{pageCount + (includeAnswers ? Math.ceil(pageCount / 4) : 0) + 2} Pages</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartGeneration}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  <span>{isSubmitting ? 'Compiling Crossword Engine...' : 'Generate Full Word Fit Book'}</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Generates all {pageCount} interlocking crossword puzzles with length-grouped word keys.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Word Settings</span>
            </button>
          </div>

          {/* Right Live Preview Panel */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Live Crossword Preview</h3>
                <div className="text-sm font-bold text-slate-900">Word Fit #1: {title || theme}</div>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">{livePreviewResult.placedWords.length} Words Interlocked</span>
            </div>

            {/* Word Fit Table Grid Preview */}
            <div className="flex justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <table className="border-collapse select-none">
                <tbody>
                  {livePreviewResult.grid.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => {
                        if (cell.isBlocked) {
                          return <td key={cIdx} className="w-6 h-6 bg-slate-900 border border-slate-800" />;
                        }
                        return (
                          <td
                            key={cIdx}
                            className="w-6 h-6 bg-white border border-slate-300 relative text-center text-[10px] font-bold text-slate-800"
                          >
                            {cell.number && (
                              <span className="absolute top-0 left-0.5 text-[7px] text-slate-400 font-extrabold leading-none">
                                {cell.number}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grouped by length footer preview */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Fill these words into the grid:
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                {Object.keys(groupedWords)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((len) => (
                    <div key={len} className="space-y-1">
                      <div className="font-extrabold text-[11px] text-indigo-900">{len} Letters:</div>
                      <div className="text-[11px] text-slate-600 font-medium">{groupedWords[Number(len)].join(', ')}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
