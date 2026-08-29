import React, { useState } from 'react';
import { X, BookOpen, Sparkles, Check, BookMarked } from 'lucide-react';
import { TrimSize, PaperType, PageRoute } from '../../types';
import { useSeriesStore } from '../../lib/seriesStore';

interface NewBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBook: (bookData: { 
    title: string; 
    genre: string; 
    trimSize: TrimSize;
    seriesId?: string;
    volumeNumber?: number;
  }) => void;
}

export const NewBookModal: React.FC<NewBookModalProps> = ({
  isOpen,
  onClose,
  onCreateBook,
}) => {
  const { seriesList, addBookToSeries } = useSeriesStore();
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Fiction / Mystery');
  const [trimSize, setTrimSize] = useState<TrimSize>('6x9');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [volumeNumber, setVolumeNumber] = useState<number>(1);

  if (!isOpen) return null;

  const handleSeriesChange = (sId: string) => {
    setSelectedSeriesId(sId);
    if (sId) {
      const match = seriesList.find((s) => s.id === sId);
      if (match) {
        setVolumeNumber(match.bookIds.length + 1);
        if (match.genre) setGenre(match.genre);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateBook({ 
      title, 
      genre, 
      trimSize,
      seriesId: selectedSeriesId || undefined,
      volumeNumber: selectedSeriesId ? volumeNumber : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        id="new-book-modal"
        className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7c3aed] text-white flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Start New Book Project</h3>
              <p className="text-xs text-slate-500">Configure your manuscript settings</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Manuscript Title <span className="text-purple-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Midnight Detective"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
            >
              <option value="Fiction / Mystery">Fiction / Mystery & Thriller</option>
              <option value="Fiction / Sci-Fi & Fantasy">Fiction / Sci-Fi & Fantasy</option>
              <option value="Fiction / Romance">Fiction / Romance</option>
              <option value="Non-Fiction / Self-Help">Non-Fiction / Self-Help</option>
              <option value="Non-Fiction / Business">Non-Fiction / Business & Money</option>
              <option value="Low Content / Journal">Low Content / Planner & Journal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Trim Size</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '6x9', label: '6" × 9" (Standard US Trade)' },
                { id: '5.5x8.5', label: '5.5" × 8.5" (Trade)' },
                { id: '5x8', label: '5" × 8" (Pocket)' },
                { id: '8.5x11', label: '8.5" × 11" (Large / Workbook)' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setTrimSize(opt.id as TrimSize)}
                  className={`p-2.5 text-xs text-left rounded-xl border font-medium transition-colors ${
                    trimSize === opt.id
                      ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Series Association Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BookMarked size={14} className="text-purple-600" />
              <label className="text-xs font-semibold text-slate-700">
                Book Series <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <select
                  value={selectedSeriesId}
                  onChange={(e) => handleSeriesChange(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
                >
                  <option value="">Not part of a series</option>
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.genre})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSeriesId && (
                <div>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={volumeNumber}
                    onChange={(e) => setVolumeNumber(parseInt(e.target.value, 10) || 1)}
                    placeholder="Vol #"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>Create & Open Studio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
