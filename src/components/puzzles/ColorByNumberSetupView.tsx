import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Palette, 
  Layers, 
  BookOpen, 
  Zap, 
  Check,
  Info,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { ColorByNumberSettings, PuzzleTrimSize } from '../../types/puzzle';
import { callGemini } from '../../lib/gemini';
import { 
  generateFallbackColorByNumberScene, 
  generateColorByNumberSvg, 
  generateAnswerSvg 
} from '../../lib/puzzles/colorByNumber';
import { savePuzzleBook } from '../../lib/puzzleService';

interface ColorByNumberSetupViewProps {
  onBack?: () => void;
  onStartGenerating?: (bookId: string) => void;
}

const THEME_PRESETS = [
  'Wild Animals', 'Tropical Birds', 'Underwater Sea', 'Fairy Tale Kingdoms',
  'Classic Cars', 'Botanical Gardens', 'Space Adventures', 'Cozy Cottages'
];

export const ColorByNumberSetupView: React.FC<ColorByNumberSetupViewProps> = ({
  onBack,
  onStartGenerating,
}) => {
  const { user, userDoc } = useAuthStore();
  const { open } = useCheckoutStore();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Step 1: Settings
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [theme, setTheme] = useState('');
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [colorsCount, setColorsCount] = useState<5 | 8 | 12 | 16>(8);
  const [pageCount, setPageCount] = useState(20);
  const [trimSize, setTrimSize] = useState<PuzzleTrimSize>('8.5x11');
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [includeInstructions, setIncludeInstructions] = useState(true);

  // Step 2: Scenes
  const [sceneTab, setSceneTab] = useState<'ai' | 'custom'>('ai');
  const [sceneDescriptions, setSceneDescriptions] = useState<string[]>([]);
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewColorMode, setPreviewColorMode] = useState<'bw' | 'color'>('bw');

  useEffect(() => {
    if (userDoc?.name && !author) {
      setAuthor(userDoc.name);
    }
  }, [userDoc]);

  // AI Title Suggestion
  const handleSuggestTitle = async () => {
    if (!theme) {
      alert('Please enter or pick a theme first!');
      return;
    }
    setIsSuggestingTitle(true);
    try {
      const prompt = `Suggest a bestselling Amazon KDP Color by Number book title for theme "${theme}" with ${complexity} complexity. Return ONLY the title text, nothing else.`;
      const res = await callGemini(prompt);
      const clean = res.replace(/["'\n\r]/g, '').trim();
      if (clean) setTitle(clean);
    } catch {
      setTitle(`${theme} Color by Number: ${pageCount} Mosaic Art Scenes`);
    } finally {
      setIsSuggestingTitle(false);
    }
  };

  // Generate scene ideas for Step 2
  const handleGenerateSceneIdeas = async () => {
    if (!theme) return;
    setIsGeneratingIdeas(true);
    try {
      const prompt = `Generate a list of ${Math.min(10, pageCount)} distinct visual scene subjects for a "${theme}" color by number book. Return ONLY a JSON array of short descriptive strings. Example: ["Dolphin jumping near sunset", "Coral reef with sea turtles", "Hidden treasure chest on ocean floor"]`;
      const res = await callGemini(prompt);
      const clean = res.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSceneDescriptions(parsed.map((s) => String(s)));
      }
    } catch {
      setSceneDescriptions(
        Array.from({ length: Math.min(10, pageCount) }, (_, i) => `${theme} Mosaic Scene #${i + 1}`)
      );
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && sceneDescriptions.length === 0 && theme) {
      handleGenerateSceneIdeas();
    }
  }, [currentStep]);

  // Live preview sample scene
  const sampleScene = useMemo(() => {
    return generateFallbackColorByNumberScene(theme || 'Nature', 1, complexity);
  }, [theme, complexity]);

  const sampleSvg = useMemo(() => {
    return previewColorMode === 'bw'
      ? generateColorByNumberSvg(sampleScene)
      : generateAnswerSvg(sampleScene);
  }, [sampleScene, previewColorMode]);

  const handleStartGeneration = async () => {
    const isFreePlan = (userDoc?.plan || 'free') === 'free';
    if (isFreePlan) {
      open('starter');
      return;
    }

    setIsSubmitting(true);
    const bookId = `puz_cbn_${Date.now()}`;

    const settings: ColorByNumberSettings = {
      type: 'color-by-number',
      title: title || `${theme || 'Themed'} Color by Number`,
      subtitle: `${pageCount} Geometric Art Scenes with Color Keys`,
      author: author || userDoc?.name || 'Kindle Artist',
      theme: theme || 'General Mosaic',
      difficulty: complexity === 'simple' ? 'easy' : complexity === 'medium' ? 'medium' : 'hard',
      complexity,
      colorsCount,
      pageCount,
      trimSize,
      includeAnswers,
      includeCoverPage: true,
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
        totalPages: pageCount * 2 + (includeAnswers ? Math.ceil(pageCount / 4) : 0) + 2,
      });

      fetch('/api/puzzles/color-by-number/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          settings,
          sceneDescriptions,
        }),
      }).catch(console.error);

      if (onStartGenerating) {
        onStartGenerating(bookId);
      }
    } catch (err) {
      console.error('Error starting Color by Number generation:', err);
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

        <div className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          Color by Number Generator
        </div>
      </div>

      {/* 2-Step Progress Indicator */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-200 z-0">
            <div
              className="h-full bg-teal-600 transition-all duration-300"
              style={{ width: currentStep === 1 ? '0%' : '100%' }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <button
              onClick={() => setCurrentStep(1)}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep >= 1 ? 'bg-teal-600 text-white ring-4 ring-teal-100 shadow-sm' : 'bg-slate-100 text-slate-400'
              }`}
            >
              1
            </button>
            <span className="text-[11px] font-bold text-slate-700">Book &amp; Palette</span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <button
              onClick={() => theme && setCurrentStep(2)}
              disabled={!theme}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                currentStep === 2 ? 'bg-teal-600 text-white ring-4 ring-teal-100 shadow-sm' : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </button>
            <span className="text-[11px] font-bold text-slate-700">Scenes &amp; Generate</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STEP 1: Book & Palette Settings
         ───────────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-teal-600" />
              <span>Theme &amp; Book Details</span>
            </h2>

            {/* Theme */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Book Theme <span className="text-rose-500">* (Required)</span>
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Wildlife Safari, Tropical Birds, Cozy Countryside, Space Missions..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {THEME_PRESETS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setTheme(chip)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      theme === chip
                        ? 'bg-teal-100 text-teal-800 border-teal-300'
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
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>{isSuggestingTitle ? 'Crafting title...' : 'AI Suggest Title'}</span>
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Wildlife Safari: 20 Color by Number Geometric Art Scenes"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Author Name</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author or Publishing Brand"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-teal-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Trim Size</label>
                <select
                  value={trimSize}
                  onChange={(e) => setTrimSize(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-teal-500 outline-none"
                >
                  <option value="8.5x11">8.5" × 11" Letter (Recommended for Color by Number)</option>
                  <option value="8.5x8.5">8.5" × 8.5" Square</option>
                  <option value="6x9">6" × 9" Travel Size</option>
                </select>
              </div>
            </div>
          </div>

          {/* Complexity & Palette */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Palette size={18} className="text-teal-600" />
              <span>Complexity &amp; Color Palette</span>
            </h2>

            {/* Complexity Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Scene Complexity</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'simple',
                    title: '🟢 Simple (5–8 Regions)',
                    desc: 'Larger geometric shapes. Ideal for young children and quick wins.',
                  },
                  {
                    id: 'medium',
                    title: '🟡 Medium (8–12 Regions)',
                    desc: 'Balanced detail and recognizable silhouettes (Recommended).',
                  },
                  {
                    id: 'complex',
                    title: '🔴 Complex (12–16 Regions)',
                    desc: 'Higher challenge with intricate geometric mosaic layers.',
                  },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setComplexity(c.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      complexity === c.id
                        ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">{c.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors Count */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Colors Palette Count</label>
              <div className="grid grid-cols-4 gap-3">
                {[5, 8, 12, 16].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setColorsCount(num as any)}
                    className={`py-3 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      colorsCount === num
                        ? 'border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-200'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {num} Colors Key
                  </button>
                ))}
              </div>
            </div>

            {/* Page Count Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Number of Color by Number Pages</span>
                <span className="text-teal-600 font-extrabold text-sm">{pageCount} Pages</span>
              </div>
              <input
                type="range"
                min={10}
                max={30}
                step={5}
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full accent-teal-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
              />
            </div>

            {/* Toggles */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={includeAnswers}
                  onChange={(e) => setIncludeAnswers(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Include Full Color Answer Key at back</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={includeInstructions}
                  onChange={(e) => setIncludeInstructions(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Include How to Color Instructions</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!theme}
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <span>Next: Scenes &amp; Preview</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 2: Scenes & Preview
         ───────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Scene Prompts */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Scene Descriptions</h3>
                  <p className="text-xs text-slate-500">Each scene will be segmented into numbered geometric regions.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateSceneIdeas}
                  disabled={isGeneratingIdeas}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} className={isGeneratingIdeas ? 'animate-spin' : ''} />
                  <span>Re-Roll</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {sceneDescriptions.map((desc, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="w-6 text-center font-bold text-xs text-slate-400">#{idx + 1}</span>
                    <input
                      type="text"
                      value={desc}
                      onChange={(e) => {
                        const updated = [...sceneDescriptions];
                        updated[idx] = e.target.value;
                        setSceneDescriptions(updated);
                      }}
                      className="flex-1 bg-transparent text-xs font-medium text-slate-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSceneDescriptions(sceneDescriptions.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setSceneDescriptions([...sceneDescriptions, `${theme} Special Plate #${sceneDescriptions.length + 1}`])}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Scene Description</span>
              </button>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleStartGeneration}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  <span>{isSubmitting ? 'Compiling Vector Scenes...' : 'Generate Color by Number Book'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Settings</span>
            </button>
          </div>

          {/* Right Panel: Live SVG & Palette Preview */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-teal-700 uppercase tracking-wider">Live Sample Preview</h4>
                <div className="text-sm font-bold text-slate-900">Plate #1: {theme}</div>
              </div>

              <div className="flex p-0.5 bg-slate-100 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewColorMode('bw')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    previewColorMode === 'bw' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Puzzle Grid
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewColorMode('color')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    previewColorMode === 'color' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Color Key
                </button>
              </div>
            </div>

            {/* Vector Preview Frame */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center aspect-[4/5] max-h-[360px] overflow-hidden">
              <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: sampleSvg }}
              />
            </div>

            {/* Color Palette Key Preview */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Color Key:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sampleScene.colorKey.map((ck) => (
                  <div key={ck.number} className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold">
                    <span
                      className="w-4 h-4 rounded-md border border-slate-900/40 inline-block shrink-0"
                      style={{ backgroundColor: ck.color }}
                    />
                    <span className="truncate">{ck.number}. {ck.name}</span>
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
