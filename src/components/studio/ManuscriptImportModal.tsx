/**
 * KDP Studio — Enterprise SaaS Manuscript Importer Modal
 * Supports Microsoft Word (.docx), EPUB (.epub), Markdown (.md), and TXT (.txt)
 * Features direct file upload, direct markdown text pasting, intelligent chapter splitting,
 * bulk deletion/selection, and replace vs append import strategies.
 */

import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Check, 
  Loader2, 
  AlertCircle, 
  Scissors, 
  BookOpen, 
  Sparkles,
  Layers,
  Edit2,
  Trash2,
  Merge,
  Eye,
  CheckCircle2,
  ArrowRight,
  ClipboardList,
  RefreshCw
} from 'lucide-react';
import { 
  importManuscriptFile, 
  importManuscriptString, 
  ParsedManuscript 
} from '../../lib/manuscriptImport';

interface ManuscriptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  onImportChapters: (
    chapters: { title: string; content: string; wordCount: number }[],
    frontMatter?: ParsedManuscript['frontMatter'],
    backMatter?: ParsedManuscript['backMatter'],
    strategy?: 'replace' | 'append'
  ) => void;
}

export const ManuscriptImportModal: React.FC<ManuscriptImportModalProps> = ({
  isOpen,
  onClose,
  bookTitle,
  onImportChapters,
}) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [uploadTab, setUploadTab] = useState<'file' | 'paste'>('file');
  const [importStrategy, setImportStrategy] = useState<'replace' | 'append'>('replace');
  const [pastedText, setPastedText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileFormat, setFileFormat] = useState<'docx' | 'epub' | 'md' | 'txt' | 'other'>('docx');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState('');
  
  // Parsed Chapters for interactive review
  const [chapters, setChapters] = useState<{
    id: string;
    title: string;
    content: string;
    wordCount: number;
    selected: boolean;
    type?: string;
  }[]>([]);
  const [frontMatter, setFrontMatter] = useState<ParsedManuscript['frontMatter']>({});
  const [backMatter, setBackMatter] = useState<ParsedManuscript['backMatter']>({});
  const [previewChapterId, setPreviewChapterId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [imported, setImported] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleApplyParsedResult = (parsed: ParsedManuscript, sourceName: string, sourceSize: string, format: any) => {
    if (!parsed || parsed.chapters.length === 0) {
      throw new Error('No readable chapters or content could be found in the manuscript.');
    }

    setFileName(sourceName);
    setFileSize(sourceSize);
    setFileFormat(format);
    setFrontMatter(parsed.frontMatter || {});
    setBackMatter(parsed.backMatter || {});
    setChapters(
      parsed.chapters.map((ch, idx) => ({
        id: ch.id || `ch_${idx + 1}`,
        title: ch.title || `Chapter ${idx + 1}`,
        content: ch.content,
        wordCount: ch.wordCount,
        selected: true,
      }))
    );

    setStep('preview');
  };

  const processFile = async (file: File) => {
    setError('');
    setIsProcessing(true);
    setProgressPercent(10);
    setProgressText(`Reading ${file.name}...`);

    const lowerName = file.name.toLowerCase();
    let detectedFormat: 'docx' | 'epub' | 'md' | 'txt' | 'other' = 'docx';
    if (lowerName.endsWith('.docx')) detectedFormat = 'docx';
    else if (lowerName.endsWith('.epub')) detectedFormat = 'epub';
    else if (lowerName.endsWith('.md')) detectedFormat = 'md';
    else if (lowerName.endsWith('.txt')) detectedFormat = 'txt';
    else detectedFormat = 'other';

    try {
      const parsed = await importManuscriptFile(file, {
        bookTitle,
        onProgress: (percent, statusText) => {
          setProgressPercent(percent);
          setProgressText(statusText);
        },
      });

      handleApplyParsedResult(parsed, file.name, formatBytes(file.size), detectedFormat);
    } catch (err: any) {
      console.error('[ManuscriptImportModal] Error parsing file:', err);
      setError(err.message || 'Failed to parse file. Please verify the document format and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processPastedText = async () => {
    if (!pastedText.trim()) {
      setError('Please paste your Markdown or text manuscript content.');
      return;
    }

    setError('');
    setIsProcessing(true);
    setProgressPercent(20);
    setProgressText('Analyzing pasted manuscript...');

    try {
      const parsed = await importManuscriptString(pastedText, 'md', {
        bookTitle,
        onProgress: (percent, statusText) => {
          setProgressPercent(percent);
          setProgressText(statusText);
        },
      });

      handleApplyParsedResult(
        parsed,
        parsed.title || 'Pasted Manuscript.md',
        `${pastedText.length.toLocaleString()} characters`,
        'md'
      );
    } catch (err: any) {
      console.error('[ManuscriptImportModal] Error parsing pasted text:', err);
      setError(err.message || 'Failed to parse pasted text. Please verify formatting.');
    } finally {
      setIsProcessing(false);
    }
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

  const handleToggleSelect = (id: string) => {
    setChapters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleToggleSelectAll = (select: boolean) => {
    setChapters((prev) => prev.map((c) => ({ ...c, selected: select })));
  };

  const handleDeleteChapter = (id: string) => {
    setChapters((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDeleteSelected = () => {
    setChapters((prev) => prev.filter((c) => !c.selected));
  };

  const handleMergeWithPrevious = (index: number) => {
    if (index <= 0) return;
    setChapters((prev) => {
      const nextList = [...prev];
      const prevChap = nextList[index - 1];
      const currentChap = nextList[index];
      nextList[index - 1] = {
        ...prevChap,
        content: `${prevChap.content}<hr class="scene-break" />${currentChap.content}`,
        wordCount: prevChap.wordCount + currentChap.wordCount,
      };
      nextList.splice(index, 1);
      return nextList;
    });
  };

  const handleSaveTitleEdit = (id: string) => {
    if (tempTitle.trim()) {
      setChapters((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: tempTitle.trim() } : c))
      );
    }
    setEditingTitleId(null);
    setTempTitle('');
  };

  const handleImport = () => {
    const selectedChapters = chapters.filter((c) => c.selected);
    if (selectedChapters.length === 0) {
      setError('Please select at least one chapter to import.');
      return;
    }

    onImportChapters(
      selectedChapters.map((c) => ({
        title: c.title,
        content: c.content,
        wordCount: c.wordCount,
      })),
      frontMatter,
      backMatter,
      importStrategy
    );

    setImported(true);
    setTimeout(() => {
      onClose();
      setImported(false);
      setStep('upload');
      setChapters([]);
      setFileName('');
      setPastedText('');
    }, 1200);
  };

  const selectedChaptersCount = chapters.filter((c) => c.selected).length;
  const totalSelectedWords = chapters
    .filter((c) => c.selected)
    .reduce((sum, c) => sum + c.wordCount, 0);

  const previewChapter = chapters.find((c) => c.id === previewChapterId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <UploadCloud size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Import Manuscript
              </h2>
              <p className="text-xs text-slate-500">
                Word (.docx), EPUB (.epub), Markdown (.md), or Plain Text (.txt)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────
              STEP 1: Upload / Paste Mode Switcher
             ───────────────────────────────────────── */}
          {step === 'upload' && (
            <div className="space-y-5">
              {/* Tab Selector */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit max-w-full">
                <button
                  type="button"
                  onClick={() => setUploadTab('file')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    uploadTab === 'file'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud size={14} />
                  <span>Upload File (.docx, .epub, .md, .txt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadTab('paste')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    uploadTab === 'paste'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ClipboardList size={14} />
                  <span>Paste Markdown / Text</span>
                </button>
              </div>

              {/* TAB 1: File Dropzone */}
              {uploadTab === 'file' && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !isProcessing && fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                    dragOver
                      ? 'border-purple-600 bg-purple-50/80 scale-[0.99]'
                      : 'border-slate-300 hover:border-purple-400 bg-slate-50/50 hover:bg-slate-50'
                  } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".docx,.epub,.md,.txt,.html,.htm,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/epub+zip,text/plain,text/markdown"
                    onChange={handleFileInput}
                    className="hidden"
                  />

                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center space-y-3 py-4">
                      <Loader2 size={36} className="text-purple-600 animate-spin" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">{progressText}</p>
                        <div className="w-56 h-2 bg-slate-200 rounded-full overflow-hidden mx-auto">
                          <div
                            className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                        <UploadCloud size={28} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-bold text-slate-800">
                          Drag and drop your manuscript file here
                        </p>
                        <p className="text-xs text-slate-500">
                          or click to browse from your computer
                        </p>
                      </div>

                      {/* Supported Formats Badges */}
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
                          .DOCX (Word)
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                          .EPUB (eBook)
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold">
                          .MD (Markdown)
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
                          .TXT (Plain Text)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Direct Markdown / Text Paste */}
              {uploadTab === 'paste' && (
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      rows={10}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste your Markdown or Text manuscript here... (Supports # Headings, GFM tables, exercises, bold/italics, and fill-in lines)"
                      className="w-full p-4 rounded-2xl border border-slate-300 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 bg-slate-50/50"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={processPastedText}
                      disabled={!pastedText.trim() || isProcessing}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Parse & Review Chapters</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Sparkles size={14} className="text-purple-600" />
                    <span>Preserves Rich Styling</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Retains GFM tables, exercise lines, bold, italics, blockquotes, and scene dividers.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Scissors size={14} className="text-purple-600" />
                    <span>Auto-Detects Chapters</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Identifies Roman numerals, custom chapter headings, prologues, and epilogues.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Layers size={14} className="text-purple-600" />
                    <span>Front & Back Matter</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Automatically extracts Dedication, Copyright, and Author Bios into book settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────
              STEP 2: Interactive Review & Chapter Splitter
             ───────────────────────────────────────── */}
          {step === 'preview' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* File Info & Strategy Bar */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {fileFormat}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                      {fileName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {fileSize} • {chapters.length} sections found • {totalSelectedWords.toLocaleString()} total words
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setChapters([]);
                  }}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                >
                  Choose Different File
                </button>
              </div>

              {/* Import Strategy Options */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="text-purple-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">Import Mode:</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-white text-xs font-bold cursor-pointer transition-all hover:border-purple-300">
                    <input
                      type="radio"
                      name="importStrategy"
                      value="replace"
                      checked={importStrategy === 'replace'}
                      onChange={() => setImportStrategy('replace')}
                      className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-slate-800">Replace Existing Chapters</span>
                  </label>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-white text-xs font-bold cursor-pointer transition-all hover:border-purple-300">
                    <input
                      type="radio"
                      name="importStrategy"
                      value="append"
                      checked={importStrategy === 'append'}
                      onChange={() => setImportStrategy('append')}
                      className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-slate-800">Append to Existing</span>
                  </label>
                </div>
              </div>

              {/* Selection & Bulk Deletion Controls */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-2.5 gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(true)}
                    className="font-bold text-purple-700 hover:underline cursor-pointer"
                  >
                    Select All ({chapters.length})
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(false)}
                    className="font-semibold text-slate-500 hover:underline cursor-pointer"
                  >
                    Deselect All
                  </button>

                  {/* Bulk Delete Selected */}
                  {selectedChaptersCount > 0 && (
                    <>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Delete Selected ({selectedChaptersCount})</span>
                      </button>
                    </>
                  )}
                </div>

                <span className="font-bold text-slate-800">
                  {selectedChaptersCount} of {chapters.length} chapters selected
                </span>
              </div>

              {/* Chapters List Table */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {chapters.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-600">All chapters were removed from preview.</p>
                    <button
                      type="button"
                      onClick={() => setStep('upload')}
                      className="mt-2 text-xs font-bold text-purple-600 hover:underline"
                    >
                      Upload or paste a new manuscript
                    </button>
                  </div>
                ) : (
                  chapters.map((chap, index) => {
                    const isEditing = editingTitleId === chap.id;

                    return (
                      <div
                        key={chap.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          chap.selected
                            ? 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs'
                            : 'bg-slate-50/70 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={chap.selected}
                            onChange={() => handleToggleSelect(chap.id)}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />

                          {/* Order Index */}
                          <span className="w-6 text-xs font-mono font-bold text-slate-400">
                            #{index + 1}
                          </span>

                          {/* Title (Editable) */}
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={tempTitle}
                                  onChange={(e) => setTempTitle(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitleEdit(chap.id)}
                                  autoFocus
                                  className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 text-slate-900 bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveTitleEdit(chap.id)}
                                  className="p-1 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700"
                                >
                                  <Check size={13} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {chap.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTitleId(chap.id);
                                    setTempTitle(chap.title);
                                  }}
                                  className="text-slate-400 hover:text-slate-700 p-0.5"
                                  title="Edit Title"
                                >
                                  <Edit2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Meta & Actions */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {chap.wordCount.toLocaleString()} words
                          </span>

                          {/* Preview Content Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewChapterId(chap.id)}
                            className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Preview Content"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Merge with previous (if index > 0) */}
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMergeWithPrevious(index)}
                              className="p-1.5 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Merge with Previous Chapter"
                            >
                              <Merge size={15} />
                            </button>
                          )}

                          {/* Delete Chapter */}
                          <button
                            type="button"
                            onClick={() => handleDeleteChapter(chap.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove Chapter"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          {step === 'upload' ? (
            <div className="text-xs text-slate-500">
              Need sample manuscripts? Supports all standard Word and eBook export formats.
            </div>
          ) : (
            <div className="text-xs font-medium text-slate-600">
              Ready to import <strong className="text-purple-900">{selectedChaptersCount} chapters</strong> ({totalSelectedWords.toLocaleString()} words) using <strong className="text-purple-900">{importStrategy === 'replace' ? 'Replace' : 'Append'} mode</strong>.
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {step === 'preview' && (
              <button
                type="button"
                id="manuscript-commit-import-btn"
                onClick={handleImport}
                disabled={selectedChaptersCount === 0 || imported}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {imported ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Imported Successfully!</span>
                  </>
                ) : (
                  <>
                    <span>Import {selectedChaptersCount} Chapters</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Content Preview Modal */}
      {previewChapter && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{previewChapter.title}</h3>
                <p className="text-xs text-slate-500">{previewChapter.wordCount.toLocaleString()} words</p>
              </div>
              <button
                onClick={() => setPreviewChapterId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto prose prose-sm max-w-none text-slate-800 leading-relaxed font-serif">
              <div dangerouslySetInnerHTML={{ __html: previewChapter.content }} />
            </div>
            <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setPreviewChapterId(null)}
                className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
