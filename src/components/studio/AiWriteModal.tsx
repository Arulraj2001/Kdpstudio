import React, { useState } from 'react';
import { X, Sparkles, Loader2, Check, RotateCcw, Copy } from 'lucide-react';
import { streamGemini } from '../../lib/gemini';

interface AiWriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  bookGenre: string;
  chapterTitle: string;
  onAcceptContent: (htmlContent: string) => void;
}

const TONES = [
  'Professional',
  'Casual',
  'Storytelling',
  'Educational',
  'Motivational',
];

const LENGTH_OPTIONS = [
  { id: 'short', label: 'Short (~500 words)', wordTarget: 500 },
  { id: 'medium', label: 'Medium (~1,000 words)', wordTarget: 1000 },
  { id: 'long', label: 'Long (~2,000 words)', wordTarget: 2000 },
];

export const AiWriteModal: React.FC<AiWriteModalProps> = ({
  isOpen,
  onClose,
  bookTitle,
  bookGenre,
  chapterTitle,
  onAcceptContent,
}) => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMessage('Please describe what this chapter should cover.');
      return;
    }

    setErrorMessage('');
    setIsGenerating(true);
    setStreamedText('');
    setHasGenerated(true);

    const lengthConfig = LENGTH_OPTIONS.find((l) => l.id === length);
    const targetWords = lengthConfig ? lengthConfig.wordTarget : 1000;

    const systemPrompt = `You are a bestselling author and expert book ghostwriter.
Write an engaging, publication-ready chapter for a book.
Book Title: "${bookTitle}"
Genre: ${bookGenre}
Chapter Title: "${chapterTitle}"
Tone: ${tone}
Target Length: Approximately ${targetWords} words.

Guidelines:
- Write in clean HTML paragraphs (<p>...</p>), with subheadings (<h2>...</h2> or <h3>...</h3>) where appropriate.
- Include vivid real-world examples, actionable takeaways, narrative flow, or gripping dialogue matching the genre.
- Do NOT output markdown code blocks like \`\`\`html. Output raw HTML tags directly so it can render directly in the editor.`;

    const userPrompt = `Write the full content for chapter "${chapterTitle}".
Chapter Subject and Outline Focus:
"${topic}"

Please write the complete chapter content now in valid HTML paragraph tags.`;

    try {
      await streamGemini(
        userPrompt,
        systemPrompt,
        (chunk) => {
          setStreamedText((prev) => prev + chunk);
        },
        () => {
          setIsGenerating(false);
        },
        (err) => {
          console.error(err);
          setErrorMessage(err.message || 'Generation encountered an error');
          setIsGenerating(false);
        }
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate');
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    // Convert plain text to HTML paragraphs if not already wrapped
    let finalHtml = streamedText;
    if (!finalHtml.includes('<p>') && !finalHtml.includes('<h2>')) {
      finalHtml = finalHtml
        .split('\n\n')
        .map((p) => `<p>${p.trim()}</p>`)
        .join('');
    }
    onAcceptContent(finalHtml);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#151525]">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                AI Write Chapter
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Drafting: <span className="font-medium text-gray-700 dark:text-gray-300">{chapterTitle}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!hasGenerated || isGenerating ? (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  What should this chapter be about? <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Introduce the 3 foundational pillars of async systems, a real-world case study of a team failing without them, and the 5-step transition framework..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                    Writing Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                    Target Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#131320] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {LENGTH_OPTIONS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {errorMessage && (
                <p className="text-xs text-red-500 font-medium">{errorMessage}</p>
              )}

              {isGenerating && (
                <div className="mt-4 p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gemini AI is writing your chapter in real-time...</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {streamedText || 'Initiating stream...'}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Chapter Generated Successfully
                </span>
                <span className="text-xs text-gray-400">
                  {streamedText.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <div 
                className="max-h-96 overflow-y-auto p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#131320] text-sm text-gray-800 dark:text-gray-200 prose dark:prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: streamedText }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#151525]">
          {hasGenerated && !isGenerating ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setHasGenerated(false);
                  setStreamedText('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Discard & Rewrite</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-accept-ai-chapter"
                  onClick={handleAccept}
                  className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Insert into Chapter</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-run-ai-write-chapter"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Chapter</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
