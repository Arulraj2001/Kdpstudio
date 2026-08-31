import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  MessageSquare,
  Eye,
  Shuffle,
  FileText,
  Copy,
  Check,
  CornerDownLeft,
  Loader2,
  ChevronDown,
  Wand2,
} from 'lucide-react';
import { callGemini, streamGemini } from '../../lib/gemini';
import { Book, Chapter } from '../../types';

interface StudioAiCopilotProps {
  book: Book;
  activeChapter: Chapter | null;
  selectedText: string;
  onInsertContent: (htmlOrText: string) => void;
  onReplaceSelection: (htmlOrText: string) => void;
}

type CopilotPreset = 'expand' | 'dialogue' | 'show_dont_tell' | 'twist' | 'summary' | 'custom';

export const StudioAiCopilot: React.FC<StudioAiCopilotProps> = ({
  book,
  activeChapter,
  selectedText,
  onInsertContent,
  onReplaceSelection,
}) => {
  const [activePreset, setActivePreset] = useState<CopilotPreset>('expand');
  const [customPrompt, setCustomPrompt] = useState('');
  const [tone, setTone] = useState<string>('Vivid & Engaging');
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const presets = [
    {
      id: 'expand' as const,
      label: 'Expand Scene',
      icon: Wand2,
      desc: 'Add sensory details, atmosphere & depth',
      placeholder: 'E.g., Describe the thunderstorm outside the tavern in vivid detail...',
    },
    {
      id: 'dialogue' as const,
      label: 'Polish Dialogue',
      icon: MessageSquare,
      desc: 'Sharpen subtext, banter & character voice',
      placeholder: 'E.g., Make the argument between the two detectives more intense...',
    },
    {
      id: 'show_dont_tell' as const,
      label: 'Show, Don\'t Tell',
      icon: Eye,
      desc: 'Convert passive exposition into active scenes',
      placeholder: 'E.g., Show his panic through physical actions instead of stating he was scared...',
    },
    {
      id: 'twist' as const,
      label: 'Plot Twister',
      icon: Shuffle,
      desc: 'Generate surprising cliffhangers & turns',
      placeholder: 'E.g., Suggest 3 unexpected revelations to end this chapter...',
    },
    {
      id: 'summary' as const,
      label: 'Chapter Beats',
      icon: FileText,
      desc: 'Extract key plot points & continuity notes',
      placeholder: 'Summarize the core character arc and decisions in this scene...',
    },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedOutput('');

    let prompt = '';
    const chapterContext = activeChapter?.content?.replace(/<[^>]*>/g, ' ').slice(-800) || '';
    const focusContext = selectedText || chapterContext;

    if (activePreset === 'expand') {
      prompt = `You are a bestselling fiction author writing a ${book.genre} book titled "${book.title}".
Tone: ${tone}.
Task: Expand this scene with rich sensory immersion, emotional resonance, and cinematic atmosphere.
Context / Input: "${focusContext}"
${customPrompt ? `Specific Author Instructions: "${customPrompt}"` : ''}

Output strictly polished manuscript text in clean HTML paragraphs (<p>...</p>). No commentary.`;
    } else if (activePreset === 'dialogue') {
      prompt = `You are an elite dialogue editor specializing in ${book.genre}.
Tone: ${tone}.
Task: Polish and elevate the following dialogue with sharp subtext, character rhythm, and authentic tension.
Context / Input: "${focusContext}"
${customPrompt ? `Specific Instructions: "${customPrompt}"` : ''}

Output strictly the improved dialogue scene formatted in HTML paragraphs (<p>...</p>).`;
    } else if (activePreset === 'show_dont_tell') {
      prompt = `You are a master creative writing coach for ${book.genre}.
Task: Rewrite the following passive or explanatory passage using the "Show, Don't Tell" technique with visceral physical actions, internal sensations, and sensory cues.
Context / Input: "${focusContext}"
${customPrompt ? `Specific Instructions: "${customPrompt}"` : ''}

Output strictly the rewritten passage in HTML paragraphs (<p>...</p>).`;
    } else if (activePreset === 'twist') {
      prompt = `You are a veteran book plotter in ${book.genre}.
Book Title: "${book.title}"
Current Chapter: "${activeChapter?.title || 'Chapter'}"
Current Scene: "${chapterContext}"
Task: Brainstorm 3 dramatic plot twists or high-stakes cliffhangers that will make readers turn pages immediately.
${customPrompt ? `Instructions: "${customPrompt}"` : ''}

Format as a clear bulleted list in clean HTML with <b>Headline</b> followed by a brief narrative paragraph for each option.`;
    } else if (activePreset === 'summary') {
      prompt = `Analyze this chapter manuscript for "${book.title}":
"${activeChapter?.content?.replace(/<[^>]*>/g, ' ') || 'Empty chapter'}"

Extract:
1. <b>Core Plot Beats:</b> What fundamentally changed in this chapter?
2. <b>Character Arc & Decisions:</b> Key emotional shifts.
3. <b>Unresolved Threads & Hooks:</b> What questions remain open for the next chapter?

Format in clean, structured HTML.`;
    } else {
      prompt = `You are a co-author assisting on the ${book.genre} book "${book.title}".
Author Request: ${customPrompt}
Current Chapter Context: "${chapterContext}"
Selected Text: "${selectedText}"
Tone: ${tone}.

Output clean formatted HTML for the manuscript.`;
    }

    try {
      await streamGemini(
        prompt,
        'You are an award-winning publishing co-writer and book development editor.',
        (chunk) => {
          setGeneratedOutput((prev) => prev + chunk);
        },
        () => {
          setIsGenerating(false);
        },
        (err) => {
          console.warn('AI Copilot streaming fallback:', err);
          setIsGenerating(false);
        }
      );
    } catch {
      try {
        const fallbackRes = await callGemini(prompt);
        setGeneratedOutput(fallbackRes);
      } catch (e: any) {
        setGeneratedOutput(`Error generating: ${e.message || 'Please try again.'}`);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleCopy = () => {
    const plainText = generatedOutput.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    navigator.clipboard.writeText(plainText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#131320] text-xs">
      {/* Preset Action Grid */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>AI Author Actions</span>
          </span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 focus:outline-none"
          >
            <option value="Vivid & Engaging">Vivid & Engaging</option>
            <option value="Fast-Paced & Tense">Fast-Paced & Tense</option>
            <option value="Lyrical & Literary">Lyrical & Literary</option>
            <option value="Dark & Atmospheric">Dark & Atmospheric</option>
            <option value="Witty & Humorous">Witty & Humorous</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {presets.map((p) => {
            const Icon = p.icon;
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePreset(p.id)}
                className={`flex items-start gap-1.5 p-2 rounded-lg text-left border transition-all ${
                  isSelected
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-950 dark:text-purple-200 shadow-xs'
                    : 'bg-gray-50/50 dark:bg-[#1a1a2e] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate">{p.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input / Customization Box */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-2 bg-gray-50/30 dark:bg-[#16162a]">
        {selectedText ? (
          <div className="p-2 rounded bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-[11px]">
            <span className="font-bold text-purple-700 dark:text-purple-300">Selected in Editor:</span>
            <p className="text-gray-600 dark:text-gray-400 line-clamp-2 italic mt-0.5">
              "{selectedText}"
            </p>
          </div>
        ) : (
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            Targeting: <span className="font-medium text-gray-700 dark:text-gray-300">{activeChapter?.title || 'Current Chapter'}</span>
          </div>
        )}

        <textarea
          rows={2}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={presets.find((p) => p.id === activePreset)?.placeholder || 'Additional instructions...'}
          className="w-full p-2 bg-white dark:bg-[#131320] border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
        />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Co-writing with Gemini...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Generate with Copilot</span>
            </>
          )}
        </button>
      </div>

      {/* Output / Insertion Panel */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col justify-between">
        {generatedOutput ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              <span>Generated Draft</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Copy text"
                >
                  {hasCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div
              className="p-3 bg-gray-50 dark:bg-[#18182c] border border-gray-200 dark:border-gray-800 rounded-lg text-xs leading-relaxed text-gray-800 dark:text-gray-200 max-h-56 overflow-y-auto select-text prose prose-xs dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: generatedOutput }}
            />

            {/* Insertion Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onInsertContent(generatedOutput)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg font-semibold text-[11px] transition-colors border border-purple-300 dark:border-purple-700"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span>Insert at Cursor</span>
              </button>

              {selectedText && (
                <button
                  type="button"
                  onClick={() => onReplaceSelection(generatedOutput)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-lg font-semibold text-[11px] transition-colors border border-emerald-300 dark:border-emerald-700"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Replace Selection</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
            <Sparkles className="w-8 h-8 text-purple-400/40 mb-2" />
            <p className="font-semibold text-gray-600 dark:text-gray-300 text-xs">Your AI Co-Writer is Ready</p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
              Select an action above to expand scenes, polish dialogue, or generate plot twists directly into your manuscript.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
