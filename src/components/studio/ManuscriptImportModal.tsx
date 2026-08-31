import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Check, Loader2, AlertCircle, Scissors, BookOpen } from 'lucide-react';

interface ManuscriptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  onImportChapters: (chapters: { title: string; content: string; wordCount: number }[]) => void;
}

type ImportMode = 'auto-split' | 'single-chapter';

interface ParsedChapter {
  title: string;
  content: string;
  wordCount: number;
}

// Chapter detection patterns (common chapter heading patterns)
const CHAPTER_PATTERNS = [
  /^chapter\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|\w+)/i,
  /^ch\.\s*(\d+)/i,
  /^part\s+(\d+|one|two|three|\w+)/i,
  /^epilogue/i,
  /^prologue/i,
  /^afterword/i,
  /^introduction/i,
  /^(\d+)\./,
  /^(\d+)\s*\n/,
];

function isChapterHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 100) return false;
  return CHAPTER_PATTERNS.some((p) => p.test(trimmed));
}

function parseTextIntoChapters(text: string): ParsedChapter[] {
  const lines = text.split('\n');
  const chapters: ParsedChapter[] = [];
  let currentTitle = 'Chapter 1';
  let currentLines: string[] = [];
  let chapterCount = 0;

  for (const line of lines) {
    if (isChapterHeading(line) && chapterCount > 0) {
      // Save previous chapter
      const content = currentLines.join('\n').trim();
      if (content.length > 50) {
        const words = content.split(/\s+/).filter(Boolean);
        chapters.push({
          title: currentTitle,
          content: textToHtml(content),
          wordCount: words.length,
        });
      }
      currentTitle = line.trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
    if (isChapterHeading(line)) chapterCount++;
  }

  // Last chapter
  const content = currentLines.join('\n').trim();
  if (content.length > 50) {
    chapters.push({
      title: currentTitle,
      content: textToHtml(content),
      wordCount: content.split(/\s+/).filter(Boolean).length,
    });
  }

  // If no chapters found, treat as single chapter
  if (chapters.length === 0) {
    const words = text.split(/\s+/).filter(Boolean);
    return [{
      title: 'Imported Chapter',
      content: textToHtml(text.trim()),
      wordCount: words.length,
    }];
  }

  return chapters;
}

function textToHtml(text: string): string {
  // Convert plain text paragraphs to HTML
  return text
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0)
    .map((p) => `<p>${p.trim().replace(/\n/g, ' ')}</p>`)
    .join('');
}

export const ManuscriptImportModal: React.FC<ManuscriptImportModalProps> = ({
  isOpen,
  onClose,
  bookTitle,
  onImportChapters,
}) => {
  const [importMode, setImportMode] = useState<ImportMode>('auto-split');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [imported, setImported] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    setError('');
    setIsProcessing(true);
    setFileName(file.name);

    try {
      let text = '';

      if (file.name.endsWith('.txt') || file.type === 'text/plain') {
        text = await file.text();
      } else if (file.name.endsWith('.md')) {
        text = await file.text();
        // Strip markdown headers and formatting
        text = text
          .replace(/^#{1,6}\s+/gm, '')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/__([^_]+)__/g, '$1')
          .replace(/_([^_]+)_/g, '$1');
      } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX: requires mammoth.js — show note about .txt export
        setError('DOCX import requires the "mammoth" library. Please export your manuscript as .txt from Word, then re-import. We\'ll add full DOCX support soon!');
        setIsProcessing(false);
        return;
      } else {
        setError('Unsupported file type. Please use .txt or .md files.');
        setIsProcessing(false);
        return;
      }

      if (!text.trim()) {
        setError('The file appears to be empty.');
        setIsProcessing(false);
        return;
      }

      const chapters = importMode === 'auto-split'
        ? parseTextIntoChapters(text)
        : [{
            title: file.name.replace(/\.[^.]+$/, ''),
            content: textToHtml(text.trim()),
            wordCount: text.split(/\s+/).filter(Boolean).length,
          }];

      setParsedChapters(chapters);
      setStep('preview');
    } catch (err) {
      setError('Failed to read the file. Please try again.');
    }

    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = () => {
    if (parsedChapters.length === 0) return;
    onImportChapters(parsedChapters);
    setImported(true);
    setTimeout(() => {
      onClose();
      setImported(false);
      setStep('upload');
      setParsedChapters([]);
      setFileName('');
    }, 1500);
  };

  const totalWords = parsedChapters.reduce((sum, c) => sum + c.wordCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <Upload className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Import Manuscript</h2>
              <p className="text-xs text-slate-500">Import from .txt or .md — auto-splits into chapters</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 'upload' && (
            <div className="p-6">
              {/* Import Mode Toggle */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-600 mb-2">Import Mode</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setImportMode('auto-split')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${importMode === 'auto-split' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-200'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Scissors className="w-3.5 h-3.5 text-violet-600" />
                      <span className="text-xs font-bold text-slate-800">Auto-Split Chapters</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Detects "Chapter 1", "Part Two" etc. and splits automatically</p>
                  </button>
                  <button
                    onClick={() => setImportMode('single-chapter')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${importMode === 'single-chapter' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-200'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-violet-600" />
                      <span className="text-xs font-bold text-slate-800">Single Chapter</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Import entire file as one chapter without splitting</p>
                  </button>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-violet-500 bg-violet-50' : 'border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50/50'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.md,.docx"
                  onChange={handleFileInput}
                  className="hidden"
                />
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                    <p className="text-sm text-violet-700 font-semibold">Parsing manuscript...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 mb-1">Drop your manuscript here</p>
                      <p className="text-xs text-slate-500">or click to browse your files</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {['.txt', '.md'].map((ext) => (
                        <span key={ext} className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs font-mono">{ext}</span>
                      ))}
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-mono">.docx (soon)</span>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <div className="mt-4 text-xs text-slate-400 text-center">
                📌 Tip: Export from Microsoft Word via <strong>File → Save As → Plain Text (.txt)</strong> for best results
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {parsedChapters.length} chapter{parsedChapters.length !== 1 ? 's' : ''} detected
                  </h3>
                  <p className="text-xs text-slate-500">{totalWords.toLocaleString()} total words from "{fileName}"</p>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="text-xs text-slate-500 hover:text-violet-700 underline"
                >
                  ← Upload different file
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {parsedChapters.map((ch, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{ch.title}</p>
                      <p className="text-xs text-slate-500">{ch.wordCount.toLocaleString()} words</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={imported}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm shadow transition-all ${
                    imported ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'
                  }`}
                >
                  {imported ? (
                    <><Check className="w-4 h-4" /> Chapters Imported!</>
                  ) : (
                    <>Import {parsedChapters.length} Chapter{parsedChapters.length !== 1 ? 's' : ''} into "{bookTitle}"</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
