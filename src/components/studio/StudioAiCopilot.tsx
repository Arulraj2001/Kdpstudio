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
      desc: 'Add sensory details & atmosphere',
      placeholder: 'E.g., Describe the thunderstorm outside the tavern in vivid detail...',
    },
    {
      id: 'dialogue' as const,
      label: 'Polish Dialogue',
      icon: MessageSquare,
      desc: 'Sharpen subtext & character voice',
      placeholder: 'E.g., Make the argument between the two detectives more intense...',
    },
    {
      id: 'show_dont_tell' as const,
      label: 'Show, Don\'t Tell',
      icon: Eye,
      desc: 'Convert passive exposition into scenes',
      placeholder: 'E.g., Show his panic through physical actions...',
    },
    {
      id: 'twist' as const,
      label: 'Plot Twister',
      icon: Shuffle,
      desc: 'Surprising cliffhangers & turns',
      placeholder: 'E.g., Suggest 3 unexpected revelations to end this chapter...',
    },
    {
      id: 'summary' as const,
      label: 'Chapter Beats',
      icon: FileText,
      desc: 'Extract key plot points & arcs',
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
    <div className="flex flex-col h-full bg-white text-xs text-slate-800">
      {/* Preset Action Grid */}
      <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Author Actions</span>
          </span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none"
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
                className={`flex items-start gap-1.5 p-2 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-purple-50 border-purple-400 text-purple-950 shadow-2xs font-semibold'
                    : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`} />
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] truncate">{p.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input / Customization Box */}
      <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/50">
        {selectedText ? (
          <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-[11px]">
            <span className="font-bold text-purple-700">Selected in Editor:</span>
            <p className="text-slate-600 line-clamp-2 italic mt-0.5">
              "{selectedText}"
            </p>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500">
            Targeting: <span className="font-medium text-slate-800">{activeChapter?.title || 'Current Chapter'}</span>
          </div>
        )}

        <textarea
          rows={2}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={presets.find((p) => p.id === activePreset)?.placeholder || 'Additional instructions...'}
          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
        />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors"
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
      <div className="flex-1 overflow-y-auto p-3 flex flex-col justify-between bg-white">
        {generatedOutput ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Generated Draft</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                  title="Copy text"
                >
                  {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 max-h-56 overflow-y-auto select-text prose prose-xs"
              dangerouslySetInnerHTML={{ __html: generatedOutput }}
            />

            {/* Insertion Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onInsertContent(generatedOutput)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl font-semibold text-[11px] transition-colors border border-purple-300"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span>Insert at Cursor</span>
              </button>

              {selectedText && (
                <button
                  type="button"
                  onClick={() => onReplaceSelection(generatedOutput)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl font-semibold text-[11px] transition-colors border border-emerald-300"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Replace Selection</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
            <Sparkles className="w-8 h-8 text-purple-400/40 mb-2" />
            <p className="font-semibold text-slate-700 text-xs">Your AI Co-Writer is Ready</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              Select an action above to expand scenes, polish dialogue, or generate plot twists directly into your manuscript.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
