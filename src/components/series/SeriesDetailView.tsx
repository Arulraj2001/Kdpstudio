/**
 * Series Detail & Management View
 * Phase 12B — KDP Studio
 */

import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Trash2, 
  Layers, 
  Palette, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Download, 
  ExternalLink, 
  Plus, 
  Edit3, 
  Save, 
  Check, 
  FileText, 
  Info,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { useSeriesStore } from '../../lib/seriesStore';
import { useBookStore } from '../../lib/store';
import { useToastStore } from '../../lib/toastStore';
import { BookSeries, SeriesVolume } from '../../types/series';
import { PageRoute } from '../../types';

interface SeriesDetailViewProps {
  seriesId: string;
  onNavigate: (route: PageRoute, params?: Record<string, string>) => void;
}

export const SeriesDetailView: React.FC<SeriesDetailViewProps> = ({ seriesId, onNavigate }) => {
  const { currentSeries, volumes, selectSeries, updateSeries, deleteSeries, addBookToSeries, isSaving } = useSeriesStore();
  const { books, addBook, setCurrentBook } = useBookStore();
  const { addToast } = useToastStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [amazonUrl, setAmazonUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isImprovingDesc, setIsImprovingDesc] = useState(false);
  const [isExportingBible, setIsExportingBible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApplyAllModal, setShowApplyAllModal] = useState(false);
  const [isApplyingAll, setIsApplyingAll] = useState(false);

  useEffect(() => {
    if (seriesId) {
      selectSeries(seriesId);
    }
  }, [seriesId, selectSeries]);

  useEffect(() => {
    if (currentSeries) {
      setEditedTitle(currentSeries.title);
      setAmazonUrl(currentSeries.amazonSeriesUrl || '');
      setDescription(currentSeries.description || '');
    }
  }, [currentSeries]);

  if (!currentSeries) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Loading series details...</p>
      </div>
    );
  }

  const createdCount = currentSeries.bookIds.length;
  const totalCount = Math.max(currentSeries.totalVolumes, createdCount);
  const completionPercent = Math.round((createdCount / totalCount) * 100);

  // Save Title
  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return;
    await updateSeries(currentSeries.id, { title: editedTitle.trim() });
    setIsEditingTitle(false);
  };

  // Save Amazon URL
  const handleSaveAmazonUrl = async () => {
    await updateSeries(currentSeries.id, { amazonSeriesUrl: amazonUrl.trim() });
  };

  // Save Description
  const handleSaveDescription = async () => {
    await updateSeries(currentSeries.id, { description: description.trim() });
  };

  // AI Improve Description
  const handleImproveDescription = async () => {
    setIsImprovingDesc(true);
    try {
      const res = await fetch('/api/series/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentSeries.title,
          genre: currentSeries.genre,
          theme: description,
          targetAudience: currentSeries.targetAudience,
          totalVolumes: totalCount,
        }),
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
        await updateSeries(currentSeries.id, { description: data.description });
        addToast({ type: 'success', title: 'Description Improved', message: 'Series description optimized by AI.' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Could not improve description.' });
    } finally {
      setIsImprovingDesc(false);
    }
  };

  // Write Next Volume / Write Planned Volume
  const handleWriteVolume = (volNum: number, existingTitle?: string) => {
    const newBookTitle = existingTitle || `${currentSeries.title} Vol. ${volNum}`;
    const newBook = addBook({
      title: newBookTitle,
      subtitle: `A ${currentSeries.title} Novel`,
      author: 'Kindle Author',
      genre: currentSeries.genre,
      trimSize: '6x9',
      paperType: 'white',
    });

    addBookToSeries(currentSeries.id, newBook.id, volNum);
    setCurrentBook(newBook.id);
    onNavigate('studio');
  };

  // Open existing book in studio
  const handleOpenBook = (bookId: string) => {
    setCurrentBook(bookId);
    onNavigate('studio');
  };

  // Add Another Volume Slot
  const handleAddVolumeSlot = async () => {
    const newTotal = totalCount + 1;
    await updateSeries(currentSeries.id, { totalVolumes: newTotal });
  };

  // Export Series Bible PDF
  const handleExportSeriesBible = async () => {
    setIsExportingBible(true);
    try {
      const res = await fetch('/api/series/export-bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId: currentSeries.id }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentSeries.title.replace(/[^a-z0-9]/gi, '_')}_Series_Bible.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const html = await res.text();
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
        }
      }
      addToast({ type: 'success', title: 'Series Bible Ready', message: 'Export completed.' });
    } catch {
      addToast({ type: 'error', title: 'Export Failed', message: 'Could not export Series Bible.' });
    } finally {
      setIsExportingBible(false);
    }
  };

  // Delete Series
  const handleDeleteSeries = async () => {
    await deleteSeries(currentSeries.id);
    setShowDeleteModal(false);
    onNavigate('series');
  };

  // Copy Keywords
  const handleCopyKeywords = () => {
    const kwText = (currentSeries.seriesKeywords || []).join(', ');
    navigator.clipboard.writeText(kwText);
    addToast({ type: 'success', title: 'Keywords Copied', message: 'Copied all series keywords to clipboard.' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Top Back Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('series')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to All Series</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={currentSeries.status}
            onChange={(e) => updateSeries(currentSeries.id, { status: e.target.value as any })}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white cursor-pointer"
          >
            <option value="planning">Status: Planning</option>
            <option value="active">Status: Active</option>
            <option value="complete">Status: Complete</option>
          </select>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
            title="Delete Series"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Hero Series Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-2.5"
          style={{
            backgroundColor:
              currentSeries.colorScheme.primaryColors?.[0] ||
              currentSeries.colorScheme.palette?.[0] ||
              '#7c3aed',
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-2">
          <div className="space-y-1 max-w-2xl">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-600">
              {currentSeries.genre} Series
            </span>

            {isEditingTitle ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-purple-400 text-xl font-black text-slate-900 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
                >
                  <Save size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {currentSeries.title}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="text-slate-400 hover:text-purple-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            )}

            {currentSeries.subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium">{currentSeries.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportSeriesBible}
              disabled={isExportingBible}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>{isExportingBible ? 'Exporting...' : 'Export Series Bible (PDF)'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar Strip */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">Volumes Created</div>
            <div className="text-base font-black text-slate-900 mt-0.5">{createdCount} / {totalCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">Completion</div>
            <div className="text-base font-black text-purple-600 mt-0.5">{completionPercent}%</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">Cover Layout</div>
            <div className="text-base font-black text-slate-900 mt-0.5 capitalize">{currentSeries.coverStyle.layout}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">Color Mode</div>
            <div className="text-base font-black text-slate-900 mt-0.5 capitalize">{currentSeries.colorScheme.mode}</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: VOLUME ROADMAP & TIMELINE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Volume Roadmap & Timeline</h3>
            <p className="text-xs text-slate-500">Track each volume from planning to published.</p>
          </div>
          <button
            type="button"
            onClick={handleAddVolumeSlot}
            className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Volume Slot</span>
          </button>
        </div>

        {/* Horizontal Timeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {volumes.map((vol, idx) => {
            const hasBook = Boolean(vol.bookId);
            const volColor = currentSeries.colorScheme.primaryColors?.[idx] || '#7c3aed';

            return (
              <div
                key={vol.volumeNumber}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  hasBook
                    ? 'bg-white border-slate-200 shadow-2xs hover:shadow-sm'
                    : 'bg-slate-50/60 border-dashed border-slate-300'
                }`}
              >
                <div>
                  {/* Top Volume Badge & Color Tag */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                        style={{ backgroundColor: volColor }}
                      />
                      <span className="text-xs font-black text-slate-900">
                        Vol. {vol.volumeNumber}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        vol.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : hasBook
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {vol.status}
                    </span>
                  </div>

                  {/* Thumbnail / Placeholder */}
                  <div
                    className="h-28 rounded-xl flex flex-col items-center justify-center text-center p-2 mb-3 relative overflow-hidden border border-slate-200/80 shadow-inner"
                    style={{ backgroundColor: volColor + '15' }}
                  >
                    <BookOpen size={24} style={{ color: volColor }} />
                    <div className="text-[11px] font-bold text-slate-800 truncate max-w-[160px] mt-1.5">
                      {vol.title}
                    </div>
                    {vol.pageCount && (
                      <div className="text-[9px] text-slate-500">{vol.pageCount} Pages</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {hasBook ? (
                  <button
                    type="button"
                    onClick={() => handleOpenBook(vol.bookId!)}
                    className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    Open in Studio →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleWriteVolume(vol.volumeNumber, vol.title)}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Write Now</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: SERIES VISUAL IDENTITY */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900">Series Visual Identity & Covers</h3>
            <p className="text-xs text-slate-500">Live preview of 3 sequential covers in this series.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('cover')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Palette size={14} />
            <span>Open Cover Builder</span>
          </button>
        </div>

        {/* 3 Covers Mockup Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-900">
          {[1, 2, 3].map((volNum) => {
            const volColor = currentSeries.colorScheme.primaryColors?.[volNum - 1] || currentSeries.colorScheme.palette?.[0] || '#7c3aed';
            const volumeBadgeText = currentSeries.coverStyle.volumeNumberStyle.replace('1', volNum.toString());

            return (
              <div
                key={volNum}
                className="aspect-[1/1.5] rounded-2xl p-4 flex flex-col justify-between text-white shadow-xl relative overflow-hidden border border-white/10 transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: volColor }}
              >
                {/* Series Title (if visible) */}
                {currentSeries.coverStyle.seriesTitleVisible && (
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-white/80 text-center pt-1">
                    {currentSeries.title}
                  </div>
                )}

                {/* Main Volume Title */}
                <div className="text-center my-auto">
                  <div className="text-base font-black text-white leading-tight">
                    {volumes[volNum - 1]?.title || `Volume ${volNum}`}
                  </div>
                  <div className="text-[10px] text-white/70 mt-1">A {currentSeries.genre} Novel</div>
                </div>

                {/* Bottom Volume Badge & Author */}
                <div className="flex items-center justify-between pt-2 border-t border-white/20 text-[10px] font-bold">
                  <span className="bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-xs">
                    {volumeBadgeText}
                  </span>
                  <span className="text-white/80">KDP Author</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: AMAZON KDP METADATA */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Amazon KDP Series Metadata</h3>
            <p className="text-xs text-slate-500">Shared keywords, series name, and Amazon series URL.</p>
          </div>
        </div>

        {/* Amazon KDP Dedicated Reminder */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3 text-xs">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong>KDP Dedicated "Series" Field:</strong> Amazon has a dedicated Series metadata box in KDP. Enter <em>"{currentSeries.title}"</em> in that field for every volume to link them on Amazon automatically.
          </div>
        </div>

        {/* Series Keywords */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Series Shared Keywords</label>
            <button
              type="button"
              onClick={handleCopyKeywords}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
            >
              <Copy size={12} />
              <span>Copy All Keywords</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            {(currentSeries.seriesKeywords || []).map((k, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-xl bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200"
              >
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* Amazon Series URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Amazon Series Page URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={amazonUrl}
              onChange={(e) => setAmazonUrl(e.target.value)}
              placeholder="https://amazon.com/dp/B0..."
              className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={handleSaveAmazonUrl}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
            >
              Save URL
            </button>
          </div>
        </div>

        {/* Series Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Series Description (Back Cover & Amazon)</label>
            <button
              type="button"
              onClick={handleImproveDescription}
              disabled={isImprovingDesc}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={12} />
              <span>{isImprovingDesc ? 'Improving...' : 'AI Improve'}</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSaveDescription}
            className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
          />
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Delete Series Grouping?</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                <strong>Your books will not be deleted</strong> — only the series grouping and continuity settings will be removed. All individual books will remain safe in My Books.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSeries}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Yes, Delete Series
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
