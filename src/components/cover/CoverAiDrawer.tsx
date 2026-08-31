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
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200 text-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Cover Studio</h3>
            <p className="text-[11px] text-slate-500 font-medium">Google Imagen & Style Intelligence</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-900 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
        {/* Style Intelligence Suggestion Card */}
        <div className="p-3.5 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>AI Genre & Style Matching</span>
            </span>
            <button
              type="button"
              id="btn-ai-suggest-style"
              onClick={handleSuggestStyle}
              disabled={isSuggestingStyle}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSuggestingStyle ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              <span>Analyze Book</span>
            </button>
          </div>

          {styleSuggestion ? (
            <div className="space-y-2 pt-1 border-t border-purple-200 animate-in fade-in">
              <p className="text-[11px] text-purple-950 italic font-medium">
                "{styleSuggestion.styleDescription}"
              </p>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Fonts:</span>
                <span className="font-bold text-purple-900">
                  {styleSuggestion.primaryFont} + {styleSuggestion.secondaryFont}
                </span>
              </div>

              <div className="flex items-center gap-1 pt-1">
                {styleSuggestion.palette.map((color, i) => (
                  <div
                    key={i}
                    className="flex-1 h-5 rounded-md border border-slate-300 shadow-2xs"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => onApplyStyleSuggestion(styleSuggestion)}
                className="w-full mt-2 py-2 rounded-xl bg-purple-600 text-white font-bold text-[11px] hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Style & Palette to Canvas</span>
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-600">
              Analyzes "{currentBook?.title || 'current book'}" ({currentBook?.genre || 'Fiction'}) to suggest the optimal color palette, font pairing, and mood.
            </p>
          )}
        </div>

        {/* Section 1: Prompt & Controls */}
        <div className="space-y-3">
          <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            1. Describe Your Cover Artwork
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A dramatic silhouette of a mountain range at twilight with a lone wanderer holding a lantern..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="block text-[10px] text-slate-500 font-semibold mb-1">Art Style</span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
              >
                {STYLE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[10px] text-slate-500 font-semibold mb-1">Mood</span>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
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
          <span className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            2. Quick Inspiration Prompts
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setPrompt(item.prompt)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors text-[11px] font-semibold text-slate-700 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Canvas Placement */}
        <div className="space-y-2">
          <span className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            3. Placement Target
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setPlacement('front')}
              className={`py-2 px-2 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                placement === 'front'
                  ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              Front Cover
            </button>
            <button
              type="button"
              onClick={() => setPlacement('full')}
              className={`py-2 px-2 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                placement === 'full'
                  ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              Full Wrap
            </button>
            <button
              type="button"
              onClick={() => setPlacement('custom')}
              className={`py-2 px-2 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                placement === 'custom'
                  ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              Centered
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          id="btn-generate-ai-cover"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs cursor-pointer"
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
          <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Generated Variations
              </span>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="text-purple-700 hover:underline flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {variations.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedVariation(url);
                    onApplyImageToCanvas(url, placement);
                  }}
                  className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-3/4 bg-slate-100 ${
                    selectedVariation === url
                      ? 'border-purple-600 ring-2 ring-purple-600/40 shadow-md'
                      : 'border-slate-200 hover:border-purple-400'
                  }`}
                >
                  <img src={url} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-2.5 py-1 bg-white text-slate-900 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1">
                      <Check className="w-3 h-3 text-purple-600" /> Click to Place
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedVariation && (
              <button
                type="button"
                id="btn-place-selected-ai-image"
                onClick={() => onApplyImageToCanvas(selectedVariation, placement)}
                className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
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
