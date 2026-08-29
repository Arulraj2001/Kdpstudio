import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Palette, 
  Layers, 
  BookOpen, 
  RefreshCw, 
  Zap,
  Info,
  CheckCircle2,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { ColoringSettings, PuzzleTrimSize } from '../../types/puzzle';
import { callGemini } from '../../lib/gemini';
import { savePuzzleBook } from '../../lib/puzzleService';

interface ColoringSetupViewProps {
  onBack?: () => void;
  onStartGenerating?: (bookId: string) => void;
}

const THEME_CHIPS = [
  'Mandalas', 'Ocean Life', 'Fantasy Castles', 'Garden Flowers',
  'Wild Animals', 'Space Scenes', 'Christmas', 'Yoga Poses',
  'Geometric Patterns', 'Butterflies', 'Fairy Tales', 'Cats & Dogs'
];

export const ColoringSetupView: React.FC<ColoringSetupViewProps> = ({
  onBack,
  onStartGenerating,
}) => {
  const { user, userDoc } = useAuthStore();
  const { open } = useCheckoutStore();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Step 1: Book & Style Settings
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [theme, setTheme] = useState('');
  const [illustrationStyle, setIllustrationStyle] = useState<'simple' | 'detailed' | 'mandala' | 'character'>('detailed');
  const [targetAge, setTargetAge] = useState<'Kids (3-8)' | 'Older Kids (8-12)' | 'Adults' | 'All Ages'>('Adults');
  const [pageCount, setPageCount] = useState(20);
  const [trimSize, setTrimSize] = useState<PuzzleTrimSize>('8.5x8.5');
  const [lineThickness, setLineThickness] = useState<'thin' | 'medium' | 'thick'>('medium');
  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [includeInstructions, setIncludeInstructions] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Step 2: Prompts
  const [promptTab, setPromptTab] = useState<'ai' | 'manual'>('ai');
  const [promptsList, setPromptsList] = useState<string[]>([]);
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userDoc?.name && !author) {
      setAuthor(userDoc.name);
    }
  }, [userDoc]);

  // AI Title Suggestion
  const handleSuggestTitle = async () => {
    if (!theme) {
      alert('Please select or enter a theme first!');
      return;
    }
    setIsSuggestingTitle(true);
    try {
      const prompt = `Suggest a bestselling Amazon KDP coloring book title for theme "${theme}" targeting ${targetAge}. Return ONLY the title text, nothing else.`;
      const res = await callGemini(prompt);
      const clean = res.replace(/["'\n\r]/g, '').trim();
      if (clean) setTitle(clean);
    } catch {
      setTitle(`${theme} Coloring Book: Relaxing Art for ${targetAge}`);
    } finally {
      setIsSuggestingTitle(false);
    }
  };

  // Fetch AI Image Prompts
  const handleFetchPrompts = async () => {
    if (!theme) return;
    setIsLoadingPrompts(true);
    try {
      const res = await fetch('/api/puzzles/coloring/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          style: illustrationStyle,
          targetAge,
          pageCount,
          lineThickness,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.prompts)) {
        setPromptsList(data.prompts.slice(0, pageCount));
      }
    } catch (err) {
      console.warn('Error fetching prompts:', err);
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && promptsList.length === 0 && theme) {
      handleFetchPrompts();
    }
  }, [currentStep]);

  const handleUpdatePrompt = (index: number, val: string) => {
    const updated = [...promptsList];
    updated[index] = val;
    setPromptsList(updated);
  };

  const handleRemovePrompt = (index: number) => {
    setPromptsList(promptsList.filter((_, i) => i !== index));
  };

  const handleAddPrompt = () => {
    setPromptsList([...promptsList, `Detailed illustration of ${theme || 'artwork'}, coloring book style`]);
  };

  const handleStartGeneration = async () => {
    const isFreePlan = (userDoc?.plan || 'free') === 'free';
    if (isFreePlan) {
      open('starter');
      return;
    }

    setIsSubmitting(true);
    const bookId = `puz_col_${Date.now()}`;

    const settings: ColoringSettings = {
      type: 'coloring',
      title: title || `${theme || 'Themed'} Coloring Book`,
      subtitle: `${pageCount} Coloring Pages for ${targetAge}`,
      author: author || userDoc?.name || 'Kindle Artist',
      theme: theme || 'General Art',
      difficulty: 'medium',
      pageCount: promptsList.length || pageCount,
      trimSize,
      illustrationStyle,
      targetAge,
      lineThickness,
      includeAnswers: false,
      includeCoverPage: includeTitlePage,
      includeInstructions,
      paperType: 'white',
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
        totalPages: (promptsList.length || pageCount) * 2 + 2,
      });

      fetch('/api/puzzles/coloring/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          prompts: promptsList,
          settings,
        }),
      }).catch(console.error);

      if (onStartGenerating) {
        onStartGenerating(bookId);
      }
    } catch (err) {
      console.error('Error starting coloring generation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Puzzles Dashboard</span>
        </button>

        <div className="text-xs font-bold text-pink-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
          Coloring Book Generator
        </div>
      </div>

      {/* 2-Step Progress Indicator */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-200 z-0">
            <div
              className="h-full bg-pink-600 transition-all duration-300"
              style={{ width: currentStep === 1 ? '0%' : '100%' }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <button
              onClick={() => setCurrentStep(1)}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep >= 1 ? 'bg-pink-600 text-white ring-4 ring-pink-100 shadow-sm' : 'bg-slate-100 text-slate-400'
              }`}
            >
              1
            </button>
            <span className="text-[11px] font-bold text-slate-700">Book &amp; Art Style</span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <button
              onClick={() => theme && setCurrentStep(2)}
              disabled={!theme}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep === 2 ? 'bg-pink-600 text-white ring-4 ring-pink-100 shadow-sm' : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </button>
            <span className="text-[11px] font-bold text-slate-700">Image Prompts &amp; Create</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STEP 1: Book & Art Style
         ───────────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-pink-600" />
              <span>Theme &amp; Book Details</span>
            </h2>

            {/* Theme & Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Coloring Theme <span className="text-rose-500">* (Required)</span>
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Majestic Mandalas, Deep Sea Wonders, Enchanted Fairies..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {THEME_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setTheme(chip)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      theme === chip
                        ? 'bg-pink-100 text-pink-800 border-pink-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Title + Suggest */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Book Title</label>
                <button
                  type="button"
                  onClick={handleSuggestTitle}
                  disabled={!theme || isSuggestingTitle}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 hover:text-pink-700 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>{isSuggestingTitle ? 'Crafting title...' : 'AI Suggest Title'}</span>
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep Sea Wonders: 20 Relaxing Coloring Pages"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-pink-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Author Name</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author or Studio Brand"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-pink-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Target Audience</label>
                <select
                  value={targetAge}
                  onChange={(e) => setTargetAge(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-pink-500 outline-none"
                >
                  <option value="Kids (3-8)">👶 Kids (3–8) — Simple, bold, chunky outlines</option>
                  <option value="Older Kids (8-12)">🧒 Older Kids (8–12) — More detail &amp; fun scenes</option>
                  <option value="Adults">👨 Adults — Intricate detail, therapeutic</option>
                  <option value="All Ages">👪 All Ages — Moderate detail</option>
                </select>
              </div>
            </div>
          </div>

          {/* Style & Visual Settings */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Palette size={18} className="text-pink-600" />
              <span>Illustration Style &amp; Sizing</span>
            </h2>

            {/* 4 Style Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Illustration Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'simple',
                    title: '🌿 Simple',
                    desc: 'Clean bold outlines, minimal detail. Great for kids.',
                  },
                  {
                    id: 'detailed',
                    title: '🎨 Detailed',
                    desc: 'Rich linework with texture and shading lines. Great for adults.',
                  },
                  {
                    id: 'mandala',
                    title: '⭕ Mandala',
                    desc: 'Circular geometric patterns. Meditative and relaxing.',
                  },
                  {
                    id: 'character',
                    title: '🐾 Character',
                    desc: 'Cute illustrated characters with personality and clean lines.',
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setIllustrationStyle(s.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      illustrationStyle === s.id
                        ? 'border-pink-600 bg-pink-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">{s.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Page Count Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Number of Coloring Pages</span>
                <span className="text-pink-600 font-extrabold text-sm">{pageCount} Pages</span>
              </div>
              <input
                type="range"
                min={10}
                max={40}
                step={5}
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full accent-pink-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>10 Pages (Starter)</span>
                <span>40 Pages (Deluxe Volume)</span>
              </div>
            </div>

            {/* Trim Size */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Trim Size</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: '8.5x8.5', title: '8.5" × 8.5" Square', desc: 'Industry standard for coloring & mandala books' },
                  { id: '8.5x11', title: '8.5" × 11" Letter', desc: 'Maximum drawing surface area' },
                  { id: '6x9', title: '6" × 9" Travel', desc: 'Compact pocket edition' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTrimSize(item.id as PuzzleTrimSize)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      trimSize === item.id
                        ? 'border-pink-600 bg-pink-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Line Thickness */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Line Thickness</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'thin', label: 'Thin Lines', desc: 'Delicate fine art' },
                  { id: 'medium', label: 'Medium (Recommended)', desc: 'Balanced contrast' },
                  { id: 'thick', label: 'Thick Bold Lines', desc: 'Ideal for crayons/markers' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLineThickness(l.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      lineThickness === l.id
                        ? 'border-pink-600 bg-pink-50/60 font-bold'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs text-slate-800">{l.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Badge */}
            <div className="p-3.5 rounded-2xl bg-pink-50 border border-pink-100 text-pink-900 text-xs flex items-center gap-2">
              <Info size={16} className="text-pink-600 shrink-0" />
              <span>
                <strong>Single-sided printing:</strong> Coloring pages are automatically followed by a blank back page to prevent marker bleed-through on physical Amazon paperbacks.
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!theme}
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <span>Next: Image Prompts</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 2: Prompts & Generation
         ───────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Coloring Illustration Prompts</h2>
                <p className="text-xs text-slate-500">
                  Review and customize the {pageCount} illustration descriptions that will be generated.
                </p>
              </div>

              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPromptTab('ai')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    promptTab === 'ai' ? 'bg-white text-pink-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  AI Generated Prompts
                </button>
                <button
                  type="button"
                  onClick={() => setPromptTab('manual')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    promptTab === 'manual' ? 'bg-white text-pink-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Write Custom Prompts
                </button>
              </div>
            </div>

            {/* Prompt list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700">
                  {promptsList.length} Prompts Prepared
                </div>
                {promptTab === 'ai' && (
                  <button
                    type="button"
                    onClick={handleFetchPrompts}
                    disabled={isLoadingPrompts}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw size={12} className={isLoadingPrompts ? 'animate-spin' : ''} />
                    <span>{isLoadingPrompts ? 'Generating...' : 'Regenerate Prompts with AI'}</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {promptsList.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="w-7 text-center font-bold text-xs text-slate-400">#{idx + 1}</span>
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => handleUpdatePrompt(idx, e.target.value)}
                      className="flex-1 bg-transparent text-xs font-medium text-slate-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePrompt(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove prompt"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleAddPrompt}
                  className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Custom Prompt</span>
                </button>

                <span className="text-[11px] text-slate-400">
                  Style modifiers and black &amp; white constraints will be applied automatically.
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
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
              onClick={handleStartGeneration}
              disabled={isSubmitting || promptsList.length === 0}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <Zap size={16} />
              <span>{isSubmitting ? 'Initializing Engine...' : 'Generate My Coloring Book'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
