import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Search, 
  Sliders, 
  BookOpen, 
  Check, 
  HelpCircle, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Layers, 
  Zap,
  Info
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { WordSearchSettings, PuzzleTrimSize } from '../../types/puzzle';
import { generateWordSearchGrid, generateAnswerGrid, WordSearchResult } from '../../lib/puzzles/wordSearch';
import { callGemini } from '../../lib/gemini';
import { savePuzzleBook } from '../../lib/puzzleService';

interface WordSearchSetupViewProps {
  onBack?: () => void;
  onStartGenerating?: (bookId: string) => void;
}

export const WordSearchSetupView: React.FC<WordSearchSetupViewProps> = ({
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
  const [gridSize, setGridSize] = useState<10 | 12 | 15 | 20>(12);
  const [wordCount, setWordCount] = useState(12);
  const [directions, setDirections] = useState<('horizontal' | 'vertical' | 'diagonal' | 'reverse')[]>([
    'horizontal',
    'vertical',
    'diagonal',
  ]);
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [includeInstructions, setIncludeInstructions] = useState(true);

  // Step 2: Words
  const [wordSourceTab, setWordSourceTab] = useState<'ai' | 'manual'>('ai');
  const [wordLengthPreference, setWordLengthPreference] = useState('Mixed');
  const [includeProperNouns, setIncludeProperNouns] = useState(true);
  const [sampleChips, setSampleChips] = useState<string[]>([]);
  const [customWordListRaw, setCustomWordListRaw] = useState('');
  const [newChipInput, setNewChipInput] = useState('');

  // Step 3 / Status
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto pre-fill author name from profile
  useEffect(() => {
    if (userDoc?.name && !author) {
      setAuthor(userDoc.name);
    }
  }, [userDoc]);

  // Compute difficulty badge
  const difficultyBadge = useMemo(() => {
    if (gridSize === 10 && !directions.includes('reverse')) return { label: 'Easy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (gridSize === 12 && !directions.includes('reverse')) return { label: 'Medium', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (gridSize === 15 || directions.includes('reverse')) return { label: 'Hard', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    return { label: 'Expert', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  }, [gridSize, directions]);

  // Handle title suggestion via Gemini
  const handleSuggestTitle = async () => {
    if (!theme) {
      alert('Please enter a theme first to generate relevant titles!');
      return;
    }
    setIsSuggestingTitle(true);
    try {
      const prompt = `Suggest a catchy Amazon KDP bestselling book title for a word search puzzle book with the theme "${theme}". Return ONLY the title text, nothing else.`;
      const res = await callGemini(prompt);
      const cleanTitle = res.replace(/["'\n\r]/g, '').trim();
      if (cleanTitle) {
        setTitle(cleanTitle);
        if (!subtitle) {
          setSubtitle(`${pageCount} Themed Puzzles for All Ages & Skill Levels`);
        }
      }
    } catch {
      setTitle(`${theme.charAt(0).toUpperCase() + theme.slice(1)} Word Search`);
    } finally {
      setIsSuggestingTitle(false);
    }
  };

  // Toggle direction helper
  const handleToggleDirection = (dir: 'horizontal' | 'vertical' | 'diagonal' | 'reverse') => {
    if (directions.includes(dir)) {
      if (directions.length === 1) return; // Keep at least one
      setDirections(directions.filter((d) => d !== dir));
    } else {
      setDirections([...directions, dir]);
    }
  };

  // Sample word generation for Step 2
  const handleGenerateSampleWords = async () => {
    if (!theme) return;
    setIsGeneratingSamples(true);
    try {
      const res = await fetch('/api/puzzles/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          count: wordCount,
          wordLength: wordLengthPreference,
          includeProperNouns,
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

  // Trigger initial sample generation when entering step 2
  useEffect(() => {
    if (currentStep === 2 && sampleChips.length === 0 && theme) {
      handleGenerateSampleWords();
    }
  }, [currentStep]);

  // Clean custom word list
  const customWordsParsed = useMemo(() => {
    return customWordListRaw
      .split(/[\n,]+/)
      .map((w) => w.trim().toUpperCase().replace(/[^A-Z]/g, ''))
      .filter((w) => w.length >= 3);
  }, [customWordListRaw]);

  // Live preview generation in browser (Step 3)
  const previewWords = useMemo(() => {
    if (wordSourceTab === 'manual' && customWordsParsed.length >= 8) {
      return customWordsParsed.slice(0, wordCount);
    }
    if (sampleChips.length > 0) {
      return sampleChips.slice(0, wordCount);
    }
    return [
      'AMAZON', 'KINDLE', 'AUTHOR', 'PUBLISH', 'MANUSCRIPT',
      'FORMAT', 'COVER', 'PRINT', 'ROYALTY', 'BESTSELLER', 'KEYWORD', 'READER'
    ].slice(0, wordCount);
  }, [wordSourceTab, customWordsParsed, sampleChips, wordCount]);

  const livePreviewResult = useMemo<WordSearchResult>(() => {
    return generateWordSearchGrid(previewWords, gridSize, directions);
  }, [previewWords, gridSize, directions]);

  // Submit and start full generation
  const handleStartGeneration = async () => {
    const isFreePlan = (userDoc?.plan || 'free') === 'free';
    if (isFreePlan) {
      open('starter');
      return;
    }

    setIsSubmitting(true);
    const bookId = `puz_ws_${Date.now()}`;

    const settings: WordSearchSettings = {
      type: 'word-search',
      title: title || `${theme || 'Themed'} Word Search Puzzles`,
      subtitle: subtitle || `${pageCount} Puzzles for Enthusiasts`,
      author: author || userDoc?.name || 'Kindle Author',
      theme: theme || 'General Knowledge',
      difficulty: difficultyBadge.label.toLowerCase() as any,
      pageCount,
      trimSize,
      gridSize,
      wordCount,
      directions,
      includeAnswers,
      includeCoverPage: true,
      includeInstructions,
      paperType: 'white',
      aiGenerateWords: wordSourceTab === 'ai',
      wordList: wordSourceTab === 'manual' ? customWordsParsed : sampleChips,
    };

    try {
      // 1. Create initial placeholder book
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

      // 2. Trigger asynchronous server-side generation
      fetch('/api/puzzles/word-search/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, settings }),
      }).catch(console.error);

      // 3. Navigate to live progress screen
      if (onStartGenerating) {
        onStartGenerating(bookId);
      }
    } catch (err) {
      console.error('Error starting book generation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Puzzles Dashboard</span>
        </button>

        <div className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
          Word Search Generator
        </div>
      </div>

      {/* 3-Step Progress Indicator */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-200 z-0">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            />
          </div>

          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <button
              onClick={() => setCurrentStep(1)}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep >= 1
                  ? 'bg-purple-600 text-white ring-4 ring-purple-100 shadow-sm'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              1
            </button>
            <span className="text-[11px] font-bold text-slate-700">Book Details</span>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <button
              onClick={() => theme && setCurrentStep(2)}
              disabled={!theme}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep >= 2
                  ? 'bg-purple-600 text-white ring-4 ring-purple-100 shadow-sm'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </button>
            <span className="text-[11px] font-bold text-slate-700">Words &amp; List</span>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <button
              onClick={() => theme && setCurrentStep(3)}
              disabled={!theme}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep === 3
                  ? 'bg-purple-600 text-white ring-4 ring-purple-100 shadow-sm'
                  : 'bg-slate-100 text-slate-400'
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
              <BookOpen size={18} className="text-purple-600" />
              <span>Book Details</span>
            </h2>

            {/* Theme (Required) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Book Theme <span className="text-rose-500">* (Drives everything)</span>
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Ocean animals, Space exploration, Christmas, Cooking, 90s Music, Yoga..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500">
                The theme powers AI word selection, vocabulary categories, and cover metadata.
              </p>
            </div>

            {/* Title + AI Suggest Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Book Title</label>
                <button
                  type="button"
                  onClick={handleSuggestTitle}
                  disabled={!theme || isSuggestingTitle}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>{isSuggestingTitle ? 'Crafting title...' : 'AI Suggest Title'}</span>
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ocean Animals Word Search: 50 Fun Puzzles for Kids & Adults"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Subtitle (Optional)</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. 50 Challenging Puzzles with Solutions"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 outline-none transition-all"
                />
              </div>

              {/* Author Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Author Name</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your pen name or publishing brand"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-purple-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Book Structure & Trim Sizes */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Layers size={18} className="text-purple-600" />
              <span>Book Structure &amp; Trim Size</span>
            </h2>

            {/* Slider: Number of puzzles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Number of Puzzles</span>
                <span className="text-purple-600 font-extrabold text-sm">{pageCount} Puzzles</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full accent-purple-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Info size={12} className="text-purple-500" />
                <span>
                  Your book will have ~{pageCount + (includeAnswers ? Math.ceil(pageCount / 4) : 0) + 2} total interior pages (puzzles + cover + answer key).
                </span>
              </div>
            </div>

            {/* Trim Size Radio Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Trim Size</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: '6x9', title: '6" × 9"', desc: 'Standard Paperback (Popular)' },
                  { id: '8x5', title: '8" × 8"', desc: 'Square Activity Book' },
                  { id: '8.5x11', title: '8.5" × 11"', desc: 'Large Print (Highest Demand)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTrimSize(item.id as PuzzleTrimSize)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      trimSize === item.id
                        ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Puzzle Settings */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders size={18} className="text-purple-600" />
                <span>Puzzle &amp; Grid Difficulty</span>
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${difficultyBadge.color}`}>
                {difficultyBadge.label} Difficulty
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Grid Size */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Grid Matrix</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { size: 10, label: '10 × 10', desc: 'Easy (Kids / Beginners)' },
                    { size: 12, label: '12 × 12', desc: '12 × 12 (Recommended)' },
                    { size: 15, label: '15 × 15', desc: '15 × 15 (Challenging)' },
                    { size: 20, label: '20 × 20', desc: '20 × 20 (Expert Level)' },
                  ].map((g) => (
                    <button
                      key={g.size}
                      type="button"
                      onClick={() => setGridSize(g.size as any)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        gridSize === g.size
                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="text-xs">{g.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Words Per Puzzle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Words Per Puzzle</span>
                  <span className="text-purple-600 font-extrabold text-sm">{wordCount} Words</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={20}
                  step={1}
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full accent-purple-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Standard KDP word search puzzles feature 12–16 words placed in 3-column checklists.
                </p>
              </div>
            </div>

            {/* Placement Directions */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Allowed Placement Directions</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'horizontal', label: 'Horizontal (→)' },
                  { id: 'vertical', label: 'Vertical (↓)' },
                  { id: 'diagonal', label: 'Diagonal (↘)' },
                  { id: 'reverse', label: 'Reverse (← ↑ ↖)' },
                ].map((d) => {
                  const active = directions.includes(d.id as any);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleToggleDirection(d.id as any)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        active
                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>{d.label}</span>
                      {active && <Check size={14} className="text-purple-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggles: Answer Key & Instructions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={includeAnswers}
                  onChange={(e) => setIncludeAnswers(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Include Solution Answer Key in back</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={includeInstructions}
                  onChange={(e) => setIncludeInstructions(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Include Instructions Page (How to play)</span>
              </label>
            </div>
          </div>

          {/* Step 1 Footer */}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!theme}
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <span>Next: Add Words</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 2: Words
         ───────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Word Generation &amp; Vocabulary</h2>
                <p className="text-xs text-slate-500">Theme: <strong className="text-slate-800">{theme}</strong></p>
              </div>

              {/* Source Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setWordSourceTab('ai')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    wordSourceTab === 'ai' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  AI Generate Words
                </button>
                <button
                  type="button"
                  onClick={() => setWordSourceTab('manual')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    wordSourceTab === 'manual' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Enter My Own Words
                </button>
              </div>
            </div>

            {/* TAB 1: AI Generate Words */}
            {wordSourceTab === 'ai' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Length Preference */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Word Length Preference</label>
                    <select
                      value={wordLengthPreference}
                      onChange={(e) => setWordLengthPreference(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none"
                    >
                      <option value="Mixed">Mixed Lengths (Recommended)</option>
                      <option value="3-5 letters">3–5 Letters (Easy / Kids)</option>
                      <option value="5-8 letters">5–8 Letters (Standard)</option>
                      <option value="8+ letters">8+ Letters (Challenging)</option>
                    </select>
                  </div>

                  {/* Proper Nouns */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Proper Nouns (Names &amp; Places)</label>
                    <select
                      value={includeProperNouns ? 'yes' : 'no'}
                      onChange={(e) => setIncludeProperNouns(e.target.value === 'yes')}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none"
                    >
                      <option value="yes">Include Proper Nouns (e.g. Atlantic, Pacific)</option>
                      <option value="no">Dictionary Words Only</option>
                    </select>
                  </div>
                </div>

                {/* Sample Generator Area */}
                <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-purple-900">Sample Puzzle Words Preview</div>
                      <div className="text-[11px] text-purple-700">
                        AI will generate {wordCount} unique words for each of your {pageCount} puzzles during book compilation.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateSampleWords}
                      disabled={isGeneratingSamples}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={isGeneratingSamples ? 'animate-spin' : ''} />
                      <span>{isGeneratingSamples ? 'Generating...' : 'Regenerate Samples'}</span>
                    </button>
                  </div>

                  {/* Interactive Word Chips */}
                  <div className="flex flex-wrap gap-2 min-h-[48px] items-center">
                    {sampleChips.map((chip, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-purple-200 text-purple-900 font-bold text-xs shadow-2xs group"
                      >
                        <span>{chip}</span>
                        <button
                          type="button"
                          onClick={() => setSampleChips(sampleChips.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    {sampleChips.length === 0 && !isGeneratingSamples && (
                      <span className="text-xs text-purple-600/70">Click "Regenerate Samples" to load sample words.</span>
                    )}
                  </div>

                  {/* Add manual custom chip */}
                  <div className="flex items-center gap-2 pt-2 border-t border-purple-200/50">
                    <input
                      type="text"
                      value={newChipInput}
                      onChange={(e) => setNewChipInput(e.target.value)}
                      placeholder="Add a custom word..."
                      className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-xs font-medium text-slate-800 outline-none w-48"
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
                      className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Enter My Own Words */}
            {wordSourceTab === 'manual' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Your Word Pool (Reused across puzzles)
                  </label>
                  <span className="text-xs font-bold text-purple-600">
                    {customWordsParsed.length} words entered
                  </span>
                </div>

                <textarea
                  rows={8}
                  value={customWordListRaw}
                  onChange={(e) => setCustomWordListRaw(e.target.value)}
                  placeholder="Enter your words separated by commas or line breaks:
DOLPHIN, SHARK, CORAL, SEAHORSE, OCTOPUS, JELLYFISH, TURTLE, REEF, LOBSTER, CLAM, ANCHOR, SUBMARINE..."
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:border-purple-500 outline-none"
                />

                {customWordsParsed.length < 15 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <Info size={14} className="text-amber-600 shrink-0" />
                    <span>
                      Add at least 15 words for optimal puzzle generation density across your {pageCount} pages.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2 Navigation */}
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
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
                Book Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Book Title:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[200px]">{title || `${theme} Word Search`}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Theme:</span>
                  <span className="font-bold text-slate-900">{theme}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Number of Puzzles:</span>
                  <span className="font-bold text-slate-900">{pageCount} Puzzles</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Grid Size:</span>
                  <span className="font-bold text-slate-900">{gridSize} × {gridSize}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Words per Puzzle:</span>
                  <span className="font-bold text-slate-900">{wordCount} Words</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Trim Size:</span>
                  <span className="font-bold text-slate-900">{trimSize}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Estimated Total Pages:</span>
                  <span className="font-bold text-purple-700">~{pageCount + (includeAnswers ? Math.ceil(pageCount / 4) : 0) + 2} Pages</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartGeneration}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  <span>{isSubmitting ? 'Initializing Engine...' : 'Generate Full Book Now'}</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Generates all {pageCount} puzzle grids with solutions and KDP print styling.
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
                <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider">Live Browser Preview</h3>
                <div className="text-sm font-bold text-slate-900">Puzzle #1: {title || theme}</div>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Pure JS Instant Render</span>
            </div>

            {/* Themed Word Search Grid Preview */}
            <div className="flex justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <table className="border-collapse">
                <tbody>
                  {livePreviewResult.grid.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="w-7 h-7 text-center font-mono font-bold text-slate-800 text-xs select-none"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Word List 3-Column Checklist */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Words to Find ({livePreviewResult.placedWords.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {livePreviewResult.placedWords.map((pw, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-slate-800 font-semibold text-[11px]">
                    <span className="w-3 h-3 rounded-xs border border-slate-400 inline-block" />
                    <span>{pw.word}</span>
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
