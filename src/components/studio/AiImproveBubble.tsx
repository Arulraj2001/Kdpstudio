import React, { useState } from 'react';
import {
  Sparkles,
  Scissors,
  Maximize2,
  CheckCircle,
  Wand2,
  HelpCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { improveText } from '../../lib/gemini';

interface AiImproveBubbleProps {
  selectedText: string;
  onApplyImprovement: (newText: string) => void;
  onClose: () => void;
}

export const AiImproveBubble: React.FC<AiImproveBubbleProps> = ({
  selectedText,
  onApplyImprovement,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleImprove = async (
    type: 'shorter' | 'longer' | 'grammar' | 'tone' | 'simplify',
    toneName?: string
  ) => {
    if (!selectedText.trim() || isLoading) return;
    setIsLoading(true);
    setActiveAction(type);

    try {
      const improved = await improveText(selectedText, type, toneName);
      if (improved) {
        onApplyImprovement(improved);
      }
    } catch (err) {
      console.error('Failed to improve text', err);
    } finally {
      setIsLoading(false);
      setActiveAction(null);
      onClose();
    }
  };

  return (
    <div className="absolute z-40 bg-gray-900 text-white rounded-xl shadow-2xl p-1.5 border border-purple-500/40 flex items-center gap-1 text-xs animate-in fade-in zoom-in-95">
      <div className="flex items-center gap-1 px-1.5 py-1 text-purple-300 font-semibold border-r border-gray-700">
        <Sparkles className="w-3.5 h-3.5" />
        <span>AI Edit</span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 px-3 py-1 text-purple-300">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Refining with Gemini...</span>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => handleImprove('shorter')}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800 hover:text-purple-300 transition-colors"
            title="Trim words and tighten prose"
          >
            <Scissors className="w-3 h-3" />
            <span>Shorter</span>
          </button>

          <button
            type="button"
            onClick={() => handleImprove('longer')}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800 hover:text-purple-300 transition-colors"
            title="Expand with descriptions and depth"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Longer</span>
          </button>

          <button
            type="button"
            onClick={() => handleImprove('grammar')}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800 hover:text-purple-300 transition-colors"
            title="Fix grammar, typos and punctuation"
          >
            <CheckCircle className="w-3 h-3" />
            <span>Fix Grammar</span>
          </button>

          <button
            type="button"
            onClick={() => handleImprove('simplify')}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800 hover:text-purple-300 transition-colors"
            title="Make clear and easy to read"
          >
            <Wand2 className="w-3 h-3" />
            <span>Simplify</span>
          </button>
        </>
      )}
    </div>
  );
};
