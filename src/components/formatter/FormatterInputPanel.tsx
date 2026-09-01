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
} from 'lucide-react';
import mammoth from 'mammoth';
import { useToastStore } from '../../lib/toastStore';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { addToast } = useToastStore();

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
      {/* 1. Top Tabs Bar */}
      <div className="flex items-center justify-between px-4 pt-3 border-b border-slate-100 bg-slate-50/60 shrink-0">
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
            <span>Upload File (.md, .txt, .docx)</span>
          </button>
        </div>

        {/* Live Word Counter in Header */}
        <div className="text-xs font-medium text-slate-500 pb-2">
          Words: <span className="font-bold text-slate-800 font-mono">{wordCount.toLocaleString()}</span>
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
              <button
                type="button"
                onClick={handleClear}
                disabled={!rawText.trim()}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Clear Text</span>
              </button>

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
