import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Layout,
  Calculator,
  Check,
  Info,
} from 'lucide-react';
import { Book, TrimSize, PaperType } from '../../types/index';
import { getCoverDimensions, getTrimDimensions, estimatePageCount } from '../../lib/kdp';

interface CoverSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  selectedBook: Book | null;
  onApplySetup: (config: {
    trimSize: TrimSize;
    pageCount: number;
    paperType: PaperType;
    bookId?: string;
  }) => void;
}

export const CoverSetupModal: React.FC<CoverSetupModalProps> = ({
  isOpen,
  onClose,
  books,
  selectedBook,
  onApplySetup,
}) => {
  const [mode, setMode] = useState<'book' | 'manual'>('book');
  const [selectedBookId, setSelectedBookId] = useState<string>(selectedBook?.id || (books[0]?.id ?? ''));
  const [trimSize, setTrimSize] = useState<TrimSize>(selectedBook?.trimSize || '6x9');
  const [paperType, setPaperType] = useState<PaperType>(selectedBook?.paperType || 'white');
  const [pageCount, setPageCount] = useState<number>(() => {
    if (selectedBook) {
      const words = selectedBook.chapters.reduce(
        (sum, c) => sum + (c.wordCount || c.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length),
        0
      );
      return Math.max(24, estimatePageCount(words || 30000, selectedBook.trimSize || '6x9', '11pt'));
    }
    return 150;
  });

  // Update fields when selected book changes
  useEffect(() => {
    if (mode === 'book' && selectedBookId) {
      const book = books.find((b) => b.id === selectedBookId);
      if (book) {
        setTrimSize(book.trimSize || '6x9');
        setPaperType(book.paperType || 'white');
        const words = book.chapters.reduce(
          (sum, c) => sum + (c.wordCount || c.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length),
          0
        );
        const estimated = Math.max(24, estimatePageCount(words || 25000, book.trimSize || '6x9', '11pt'));
        setPageCount(estimated);
      }
    }
  }, [selectedBookId, mode, books]);

  if (!isOpen) return null;

  const dims = getCoverDimensions(trimSize, pageCount, paperType);

  const handleCreateCanvas = () => {
    onApplySetup({
      trimSize,
      pageCount: Math.max(24, pageCount),
      paperType,
      bookId: mode === 'book' ? selectedBookId : undefined,
    });
    onClose();
  };

  const trimOptions: { value: TrimSize; label: string; desc: string }[] = [
    { value: '5x8', label: '5" × 8"', desc: 'Fiction / Novellas' },
    { value: '5.5x8.5', label: '5.5" × 8.5"', desc: 'Memoirs & Trade' },
    { value: '6x9', label: '6" × 9"', desc: 'Industry Standard' },
    { value: '8.5x11', label: '8.5" × 11"', desc: 'Workbooks / Manuals' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-6 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-100 rounded-xl text-purple-700">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">KDP Cover Canvas Setup</h2>
              <p className="text-xs text-slate-500 font-medium">
                Calculates wrap-around paperback dimensions with spine and 0.125" bleed.
              </p>
            </div>
          </div>
        </div>

        {/* Setup Source Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('book')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'book'
                ? 'bg-white text-purple-700 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Select Existing Book</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'manual'
                ? 'bg-white text-purple-700 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Enter Manually</span>
          </button>
        </div>

        {/* Mode: From Book */}
        {mode === 'book' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Manuscript Project
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.trimSize}, {b.paperType}) — {b.chapters.length} chapters
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Trim & Page Parameters */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Trim Size
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {trimOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTrimSize(opt.value)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    trimSize === opt.value
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 truncate">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Page Count (min 24)
              </label>
              <input
                type="number"
                min={24}
                max={1000}
                value={pageCount}
                onChange={(e) => setPageCount(Math.max(24, parseInt(e.target.value) || 24))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Paper Stock
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperType('white')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    paperType === 'white'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  White Paper
                </button>
                <button
                  type="button"
                  onClick={() => setPaperType('cream')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    paperType === 'cream'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Cream Paper
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calculated Specification Readout */}
        <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 space-y-2 text-xs">
          <div className="font-bold text-purple-950 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Info className="w-3.5 h-3.5 text-purple-600" />
            <span>Calculated KDP Wrap-Around Cover Specs</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
            <div className="p-2 bg-white rounded-lg border border-purple-100 shadow-2xs">
              <div className="text-[10px] text-slate-500 font-sans">Full Canvas Size</div>
              <div className="font-bold text-slate-900">
                {dims.totalWidth}" × {dims.totalHeight}"
              </div>
            </div>

            <div className="p-2 bg-white rounded-lg border border-purple-100 shadow-2xs">
              <div className="text-[10px] text-slate-500 font-sans">Spine Width</div>
              <div className="font-bold text-purple-700">
                {dims.spineWidth}"
              </div>
            </div>

            <div className="p-2 bg-white rounded-lg border border-purple-100 shadow-2xs">
              <div className="text-[10px] text-slate-500 font-sans">300 DPI Export</div>
              <div className="font-bold text-slate-900">
                {Math.round(dims.totalWidth * 300)} × {Math.round(dims.totalHeight * 300)} px
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-create-cover-canvas"
            onClick={handleCreateCanvas}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Create Canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
