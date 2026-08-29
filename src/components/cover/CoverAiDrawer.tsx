import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  X,
  RefreshCw,
  Check,
  Palette,
  Layers,
  ArrowRight,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { generateCoverImage, suggestCoverStyle, CoverStyleSuggestion } from '../../lib/imagen';
import { Book } from '../../types/index';

interface CoverAiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentBook: Book | null;
  onApplyImageToCanvas: (imageUrl: string, placement: 'full' | 'front' | 'custom') => void;
  onApplyStyleSuggestion: (suggestion: CoverStyleSuggestion) => void;
}

const QUICK_PROMPTS = [
  { label: 'Fantasy Landscape', prompt: 'Epic fantasy mountain fortress shrouded in glowing magical mist and starry nebula' },
  { label: 'Thriller Mystery', prompt: 'Silhouette of a mysterious figure walking down a dark rain-soaked cobblestone alley at night' },
  { label: 'Sci-Fi Cyberpunk', prompt: 'Futuristic neon skyline with towering skyscrapers, holographic signs and flying vehicles' },
  { label: 'Minimal Geometric', prompt: 'Clean modern minimalist geometric composition with subtle golden arches and terracotta tones' },
  { label: 'Nature & Wellness', prompt: 'Serene misty pine forest with morning golden sunrise filtering through trees and calm lake' },
  { label: 'Business & Finance', prompt: 'Abstract architectural glass skyscraper reflections with sleek modern golden lighting' },
];

const STYLE_OPTIONS = [
  'Digital art',
  'Photorealistic',
  'Watercolor',
  'Minimalist',
  'Vintage',
  'Cinematic',
  'Abstract',
  'Illustrated',
];

const MOOD_OPTIONS = [
  'Dramatic',
  'Peaceful',
  'Dark',
  'Bright',
  'Mysterious',
  'Energetic',
  'Nostalgic',
  'Moody',
];

export const CoverAiDrawer: React.FC<CoverAiDrawerProps> = ({
  isOpen,
  onClose,
  currentBook,
  onApplyImageToCanvas,
  onApplyStyleSuggestion,
}) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Digital art');
  const [mood, setMood] = useState('Dramatic');
  const [placement, setPlacement] = useState<'full' | 'front' | 'custom'>('front');

  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);

  const [isSuggestingStyle, setIsSuggestingStyle] = useState(false);
  const [styleSuggestion, setStyleSuggestion] = useState<CoverStyleSuggestion | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setSelectedVariation(null);

    try {
      // Generate 2 variations
      const [res1, res2] = await Promise.all([
        generateCoverImage(prompt, placement === 'full' ? '16:9' : '3:4', style, mood),
        generateCoverImage(`${prompt}, alternate artistic angle`, placement === 'full' ? '16:9' : '3:4', style, mood),
      ]);

      setVariations([res1.url, res2.url]);
    } catch (err: any) {
      console.error('Error generating AI cover image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestStyle = async () => {
    setIsSuggestingStyle(true);
    try {
      const suggestion = await suggestCoverStyle(
        currentBook?.title || 'Book Title',
        currentBook?.genre || 'Fiction',
        currentBook?.subtitle
      );
      setStyleSuggestion(suggestion);
    } catch (err) {
      console.error('Error suggesting style:', err);
    } finally {
      setIsSuggestingStyle(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-[#161626] border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-amber-500/10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-300">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">AI Cover Studio</h3>
            <p className="text-[11px] text-gray-500">Google Imagen & Style Intelligence</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
        {/* Style Intelligence Suggestion Card */}
        <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-200/70 dark:border-purple-800/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>AI Genre & Style Matching</span>
            </span>
            <button
              type="button"
              id="btn-ai-suggest-style"
              onClick={handleSuggestStyle}
              disabled={isSuggestingStyle}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs disabled:opacity-50"
            >
              {isSuggestingStyle ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              <span>Analyze Book</span>
            </button>
          </div>

          {styleSuggestion ? (
            <div className="space-y-2 pt-1 border-t border-purple-200 dark:border-purple-900/40 animate-in fade-in">
              <p className="text-[11px] text-purple-950 dark:text-purple-300 italic">
                "{styleSuggestion.styleDescription}"
              </p>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Fonts:</span>
                <span className="font-bold text-purple-800 dark:text-purple-300">
                  {styleSuggestion.primaryFont} + {styleSuggestion.secondaryFont}
                </span>
              </div>

              <div className="flex items-center gap-1 pt-1">
                {styleSuggestion.palette.map((color, i) => (
                  <div
                    key={i}
                    className="flex-1 h-5 rounded-md border border-black/10 shadow-2xs"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => onApplyStyleSuggestion(styleSuggestion)}
                className="w-full mt-2 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-[11px] hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Style & Palette to Canvas</span>
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Analyzes "{currentBook?.title || 'current book'}" ({currentBook?.genre || 'Fiction'}) to suggest the optimal color palette, font pairing, and mood.
            </p>
          )}
        </div>

        {/* Section 1: Prompt & Controls */}
        <div className="space-y-3">
          <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
            1. Describe Your Cover Artwork
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A dramatic silhouette of a mountain range at twilight with a lone wanderer holding a lantern..."
            className="w-full p-3 bg-gray-50 dark:bg-[#131320] border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="block text-[10px] text-gray-500 font-semibold mb-1">Art Style</span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full p-2 bg-gray-50 dark:bg-[#131320] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
              >
                {STYLE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[10px] text-gray-500 font-semibold mb-1">Mood</span>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full p-2 bg-gray-50 dark:bg-[#131320] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
              >
                {MOOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Quick Prompts */}
        <div className="space-y-2">
          <span className="block font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
            2. Quick Inspiration Prompts
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setPrompt(item.prompt)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 transition-colors text-[11px] font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Canvas Placement */}
        <div className="space-y-2">
          <span className="block font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
            3. Placement Target
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setPlacement('front')}
              className={`py-2 px-2 rounded-xl border text-center font-semibold transition-all ${
                placement === 'front'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Front Cover Only
            </button>
            <button
              type="button"
              onClick={() => setPlacement('full')}
              className={`py-2 px-2 rounded-xl border text-center font-semibold transition-all ${
                placement === 'full'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Full Wrap-Around
            </button>
            <button
              type="button"
              onClick={() => setPlacement('custom')}
              className={`py-2 px-2 rounded-xl border text-center font-semibold transition-all ${
                placement === 'custom'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Centered Layer
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          id="btn-generate-ai-cover"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Your Cover Art...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Artwork</span>
            </>
          )}
        </button>

        {/* Results & Variations */}
        {variations.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px]">
                Generated Variations
              </span>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {variations.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedVariation(url)}
                  className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-3/4 bg-gray-100 dark:bg-gray-800 ${
                    selectedVariation === url
                      ? 'border-purple-600 ring-2 ring-purple-600/40'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
                  }`}
                >
                  <img src={url} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-2 py-1 bg-white text-gray-900 rounded-md text-[10px] font-bold shadow-md">
                      Click to Place
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedVariation && (
              <button
                type="button"
                onClick={() => onApplyImageToCanvas(selectedVariation, placement)}
                className="w-full py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Place Selected Image on Canvas</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
