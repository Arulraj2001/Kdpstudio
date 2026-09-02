import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  FileCode,
  Sparkles,
  Trash2,
  FileCheck2,
  Loader2,
  AlertCircle,
  Copy,
  Download,
  BookOpen,
  Check,
  ChevronDown,
} from 'lucide-react';
import mammoth from 'mammoth';
import { useToastStore } from '../../lib/toastStore';
import { SAMPLE_MANUSCRIPT_MD, MASTER_AI_MANUSCRIPT_PROMPT } from '../../data/sampleManuscriptPrompt';

interface FormatterInputPanelProps {
  rawText: string;
  onChangeText: (text: string) => void;
  onParse: () => void;
  isParsing: boolean;
  wordCount: number;
}

export const FormatterInputPanel: React.FC<FormatterInputPanelProps> = ({
  rawText,
  onChangeText,
  onParse,
  isParsing,
  wordCount,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [isDragging, setIsDragging] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isPromptMenuOpen, setIsPromptMenuOpen] = useState(false);
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { addToast } = useToastStore();

  const handleLoadSample = () => {
    onChangeText(SAMPLE_MANUSCRIPT_MD);
    setActiveTab('paste');
    addToast({
      type: 'success',
      title: 'Sample Template Loaded',
      message: 'Loaded full publication-grade non-fiction manuscript template. Parsing structure...',
    });
    setTimeout(() => onParse(), 100);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(MASTER_AI_MANUSCRIPT_PROMPT);
      setHasCopiedPrompt(true);
      setTimeout(() => setHasCopiedPrompt(false), 3000);
      addToast({
        type: 'success',
        title: 'Prompt Copied!',
        message: 'Paste this master prompt into Claude, ChatGPT, or Gemini to generate any book niche formatted for KDP Studio.',
      });
      setIsPromptMenuOpen(false);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleDownloadPrompt = () => {
    const blob = new Blob([MASTER_AI_MANUSCRIPT_PROMPT], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kdp-studio-manuscript-ai-prompt.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsPromptMenuOpen(false);

    addToast({
      type: 'info',
      title: 'Prompt Downloaded',
      message: 'Saved kdp-studio-manuscript-ai-prompt.md to your downloads.',
    });
  };

  const handleClear = () => {
    if (rawText.trim() && window.confirm('Are you sure you want to clear your manuscript text?')) {
      onChangeText('');
    }
  };

  const processUploadedFile = async (file: File) => {
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: 'File exceeds 5MB limit. Please split your manuscript into sections.',
      });
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    setIsFileLoading(true);

    try {
      if (ext === 'md' || ext === 'txt') {
        const text = await file.text();
        onChangeText(text);
        setActiveTab('paste');
        addToast({
          type: 'success',
          title: 'File Uploaded',
          message: `Loaded ${file.name} (${text.split(/\s+/).filter(Boolean).length.toLocaleString()} words). Parsing now...`,
        });
        setTimeout(() => onParse(), 100);
      } else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const extractedText = result.value;
        onChangeText(extractedText);
        setActiveTab('paste');
        addToast({
          type: 'success',
          title: 'Word Document Loaded',
          message: `Extracted text from ${file.name}. Parsing structure...`,
        });
        setTimeout(() => onParse(), 100);
      } else {
        addToast({
          type: 'error',
          title: 'Unsupported File Type',
          message: 'Please upload a .md, .txt, or .docx file.',
        });
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      addToast({
        type: 'error',
        title: 'File Load Error',
        message: err?.message || 'Failed to read file contents.',
      });
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const placeholderText = `Paste your manuscript here...

Supported formats:
• Markdown (# headings, **bold**, tables)
• Plain text with chapter labels
• Mixed markdown and plain text

The formatter will automatically detect:
• Chapter headings (# Chapter 1: Title)
• Exercise blocks (EXERCISE 1.1: Name)
• Scenario blocks (SCENARIO A: Name)
• Model responses (MODEL RESPONSE:)
• Debriefs (DEBRIEF:)
• Reflection prompts (REFLECTION PROMPT:)
• Tables
• Writing lines (___ underscores)`;

  return (
    <div className="flex-1 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden min-h-[550px] max-h-[calc(100vh-140px)]">
      {/* 1. Top Tabs & Template Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 pb-1 border-b border-slate-100 bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'paste'
                ? 'bg-white text-purple-700 border-purple-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <FileText size={15} />
            <span>Paste Text</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'upload'
                ? 'bg-white text-purple-700 border-purple-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <UploadCloud size={15} />
            <span>Upload File (.md, .docx)</span>
          </button>
        </div>

        {/* Template & Prompt Fast Actions */}
        <div className="flex items-center gap-2 pb-1.5">
          <button
            type="button"
            onClick={handleLoadSample}
            title="Load complete publication-grade non-fiction workbook markdown template"
            className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <BookOpen size={13} className="text-purple-600" />
            <span>Load Sample MD</span>
          </button>

          {/* AI Prompt Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPromptMenuOpen(!isPromptMenuOpen)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles size={13} />
              <span>AI Prompt</span>
              <ChevronDown size={12} className={`transition-transform ${isPromptMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPromptMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  AI Book Generation Prompt
                </div>
                
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-purple-50 text-xs font-semibold text-slate-700 hover:text-purple-800 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {hasCopiedPrompt ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-purple-600" />}
                  <div>
                    <div className="font-bold">Copy AI Prompt</div>
                    <div className="text-[10px] text-slate-500 font-normal">For Claude, ChatGPT &amp; Gemini</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPrompt}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-purple-50 text-xs font-semibold text-slate-700 hover:text-purple-800 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Download size={14} className="text-indigo-600" />
                  <div>
                    <div className="font-bold">Download Prompt (.md)</div>
                    <div className="text-[10px] text-slate-500 font-normal">Save prompt file locally</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleLoadSample();
                    setIsPromptMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-purple-50 text-xs font-semibold text-slate-700 hover:text-purple-800 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1 pt-2"
                >
                  <BookOpen size={14} className="text-emerald-600" />
                  <div>
                    <div className="font-bold">Load Sample Template</div>
                    <div className="text-[10px] text-slate-500 font-normal">Test formatter immediately</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Live Word Counter in Header */}
          <div className="text-xs font-medium text-slate-500 pl-2 border-l border-slate-200">
            Words: <span className="font-bold text-slate-800 font-mono">{wordCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 2. Tab Body Area */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
        {activeTab === 'paste' ? (
          <div className="flex-1 flex flex-col h-full space-y-3">
            <textarea
              value={rawText}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder={placeholderText}
              className="flex-1 w-full p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-[13px] font-mono leading-relaxed text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none overflow-y-auto"
              spellCheck={false}
            />

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-1 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!rawText.trim()}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Clear</span>
                </button>

                {!rawText.trim() && (
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-3 py-2 text-xs font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    <span>Try Sample Template</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                id="btn-parse-and-preview"
                onClick={onParse}
                disabled={!rawText.trim() || isParsing}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isParsing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Detecting Structure...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Parse &amp; Preview →</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Upload File Drag & Drop Zone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all ${
              isDragging
                ? 'border-purple-500 bg-purple-50/50'
                : 'border-slate-300 bg-slate-50/40 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  processUploadedFile(e.target.files[0]);
                }
              }}
              accept=".md,.txt,.docx"
              className="hidden"
            />

            {isFileLoading ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 size={36} className="animate-spin text-purple-600" />
                <p className="text-sm font-bold text-slate-800">Reading &amp; Extracting Manuscript...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-purple-100/80 border border-purple-200 text-purple-700 flex items-center justify-center shadow-xs">
                  <UploadCloud size={30} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Drop manuscript file here or click to browse
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Supports Markdown (<code>.md</code>), Plain Text (<code>.txt</code>), and Word Documents (<code>.docx</code>). Max file size 5MB.
                </p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <FileCode size={16} />
                  <span>Browse Files</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
