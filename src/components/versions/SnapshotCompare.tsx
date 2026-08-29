/**
 * KDP Studio — Snapshot Comparison & Diff Viewer
 * Phase 16B
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  GitCompare,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  Edit3,
  RotateCcw,
  BookOpen,
  Calendar,
  Layers,
  FileText,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { BookSnapshot, SnapshotDiff } from '../../types/versions';
import { Book } from '../../types';
import { calculateDiff, getSnapshotContent } from '../../lib/versionService';
import { RestoreModal } from './RestoreModal';

interface SnapshotCompareProps {
  initialSnapshot: BookSnapshot;
  allSnapshots: BookSnapshot[];
  currentBook: Book;
  uid: string;
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
}

export const SnapshotCompare: React.FC<SnapshotCompareProps> = ({
  initialSnapshot,
  allSnapshots,
  currentBook,
  uid,
  isOpen,
  onClose,
  onRestored,
}) => {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(initialSnapshot.id);
  const [loadedSnapshot, setLoadedSnapshot] = useState<BookSnapshot>(initialSnapshot);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // Convert currentBook into BookSnapshot shape for diff comparison
  const currentAsSnapshot: BookSnapshot = useMemo(() => {
    const chapters = (currentBook.chapters || []).map((c, i) => ({
      id: c.id || `ch_${i + 1}`,
      title: c.title || `Chapter ${i + 1}`,
      content: c.content || '',
      order: c.order ?? i,
      wordCount: c.wordCount || (c.content ? c.content.split(/\s+/).filter(Boolean).length : 0),
    }));

    const totalWordCount = chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);

    return {
      id: 'current_live',
      bookId: currentBook.id,
      uid,
      label: 'Current Live Version',
      trigger: 'manual',
      status: 'ready',
      bookData: {
        title: currentBook.title || 'Untitled',
        subtitle: currentBook.subtitle || '',
        author: currentBook.author || '',
        genre: currentBook.genre || '',
        trimSize: currentBook.trimSize || '6x9',
        paperType: currentBook.paperType || 'cream',
        language: currentBook.language || 'en',
        status: currentBook.status || 'draft',
      },
      chapters,
      frontMatter: currentBook.frontMatter || {
        titlePage: true,
        copyrightPage: true,
        dedication: '',
        tableOfContents: true,
        preface: '',
      },
      backMatter: currentBook.backMatter || {
        aboutAuthor: '',
        otherBooks: '',
        resources: '',
      },
      metadata: {
        description: currentBook.metadata?.description || '',
        keywords: currentBook.metadata?.keywords || [],
        categories: currentBook.metadata?.categories || [],
        price: currentBook.metadata?.price || 9.99,
        royaltyPlan: currentBook.metadata?.royaltyPlan || '70',
      },
      totalWordCount,
      chapterCount: chapters.length,
      storageRef: null,
      isCompressed: false,
      sizeBytes: 0,
      createdAt: new Date().toISOString(),
      restoredAt: null,
      restoredFrom: null,
    };
  }, [currentBook, uid]);

  // Fetch full content when selected snapshot changes
  useEffect(() => {
    async function loadContent() {
      if (!selectedSnapshotId) return;
      setIsLoadingContent(true);
      try {
        const full = await getSnapshotContent(selectedSnapshotId);
        if (full) {
          setLoadedSnapshot(full);
        }
      } catch (err) {
        console.warn('Failed to load snapshot content for compare:', err);
      } finally {
        setIsLoadingContent(false);
      }
    }

    loadContent();
  }, [selectedSnapshotId]);

  // Compute Diff
  const diff: SnapshotDiff = useMemo(() => {
    return calculateDiff(loadedSnapshot, currentAsSnapshot);
  }, [loadedSnapshot, currentAsSnapshot]);

  if (!isOpen) return null;

  const formattedSnapshotDate = new Date(loadedSnapshot.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-800/60 text-purple-400 flex items-center justify-center">
              <GitCompare size={20} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white">Compare Versions</h2>
              <p className="text-xs text-slate-400">Inspect changes between snapshot and current draft</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Snapshot Selector Dropdown */}
            <select
              value={selectedSnapshotId}
              onChange={(e) => setSelectedSnapshotId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none max-w-xs truncate"
            >
              {allSnapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  📷 {s.label} ({new Date(s.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoadingContent ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Loader2 size={28} className="animate-spin text-purple-500 mx-auto" />
              <p className="text-xs">Rehydrating snapshot content from storage...</p>
            </div>
          ) : (
            <>
              {/* Version Comparison Header Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Snapshot */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/60">
                      Saved Snapshot
                    </span>
                    <span className="text-[11px] text-slate-500">{formattedSnapshotDate}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{loadedSnapshot.label}</h3>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                    <span>{loadedSnapshot.chapterCount} chapters</span>
                    <span>{loadedSnapshot.totalWordCount.toLocaleString()} words</span>
                  </div>
                </div>

                {/* Right: Current Live Version */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                      Current Live Draft
                    </span>
                    <span className="text-[11px] text-slate-500">Active Editor State</span>
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{currentBook.title}</h3>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                    <span>{currentAsSnapshot.chapterCount} chapters</span>
                    <span>{currentAsSnapshot.totalWordCount.toLocaleString()} words</span>
                  </div>
                </div>
              </div>

              {/* Stats Diff Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Word Count Delta</span>
                  <div className="text-base font-extrabold mt-0.5 font-mono">
                    <span
                      className={
                        diff.wordCountDelta > 0
                          ? 'text-emerald-400'
                          : diff.wordCountDelta < 0
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }
                    >
                      {diff.wordCountDelta > 0 ? '+' : ''}
                      {diff.wordCountDelta.toLocaleString()} words
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Chapter Count Delta</span>
                  <div className="text-base font-extrabold mt-0.5 font-mono text-white">
                    {diff.chapterCountDelta > 0 ? '+' : ''}
                    {diff.chapterCountDelta} chapters
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Changelog Summary</span>
                  <div className="text-xs font-semibold text-purple-300 mt-1 truncate" title={diff.summary}>
                    {diff.summary}
                  </div>
                </div>
              </div>

              {/* Changed Chapters Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers size={13} className="text-purple-400" />
                  <span>Chapter Changes ({diff.changedChapters.length})</span>
                </h4>

                {diff.changedChapters.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>All chapter contents and ordering are identical.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {diff.changedChapters.map((ch) => {
                      const wordDelta = ch.wordCountAfter - ch.wordCountBefore;

                      if (ch.changeType === 'added') {
                        return (
                          <div
                            key={ch.chapterId}
                            className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <PlusCircle size={16} className="text-emerald-400 shrink-0" />
                              <div>
                                <span className="font-bold text-white">{ch.chapterTitle}</span>
                                <span className="text-[10px] text-emerald-400 font-semibold ml-2 uppercase px-1.5 py-0.2 rounded bg-emerald-950">
                                  New
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-emerald-400 font-bold">
                              +{ch.wordCountAfter.toLocaleString()} words
                            </span>
                          </div>
                        );
                      }

                      if (ch.changeType === 'removed') {
                        return (
                          <div
                            key={ch.chapterId}
                            className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/40 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <MinusCircle size={16} className="text-rose-400 shrink-0" />
                              <div>
                                <span className="font-bold text-white">{ch.chapterTitle}</span>
                                <span className="text-[10px] text-rose-400 font-semibold ml-2 uppercase px-1.5 py-0.2 rounded bg-rose-950">
                                  Removed
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-rose-400 font-bold">
                              -{ch.wordCountBefore.toLocaleString()} words
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={ch.chapterId}
                          className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <Edit3 size={16} className="text-amber-400 shrink-0" />
                            <div>
                              <span className="font-bold text-white">{ch.chapterTitle}</span>
                              <span className="text-[10px] text-amber-400 font-semibold ml-2 uppercase px-1.5 py-0.2 rounded bg-amber-950">
                                Modified
                              </span>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-slate-400 text-[11px]">
                              {ch.wordCountBefore} → {ch.wordCountAfter}
                            </span>
                            <span
                              className={`ml-2 font-bold ${
                                wordDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              ({wordDelta >= 0 ? '+' : ''}
                              {wordDelta} words)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Other Section Modifications */}
              {(diff.metadataChanged || diff.frontMatterChanged || diff.backMatterChanged) && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Structural &amp; Metadata Changes
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {diff.metadataChanged && (
                      <span className="px-3 py-1 rounded-xl bg-purple-950 border border-purple-800 text-purple-300 flex items-center gap-1.5">
                        <FileText size={12} />
                        <span>KDP Metadata / Keywords Modified</span>
                      </span>
                    )}
                    {diff.frontMatterChanged && (
                      <span className="px-3 py-1 rounded-xl bg-blue-950 border border-blue-800 text-blue-300 flex items-center gap-1.5">
                        <FileText size={12} />
                        <span>Front Matter Modified</span>
                      </span>
                    )}
                    {diff.backMatterChanged && (
                      <span className="px-3 py-1 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-300 flex items-center gap-1.5">
                        <BookmarkCheck size={12} />
                        <span>Back Matter Modified</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 md:p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Close Comparison
          </button>

          <button
            type="button"
            onClick={() => setIsRestoreModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Restore This Snapshot</span>
          </button>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {isRestoreModalOpen && (
        <RestoreModal
          snapshot={loadedSnapshot}
          currentBook={currentBook}
          uid={uid}
          isOpen={isRestoreModalOpen}
          onClose={() => setIsRestoreModalOpen(false)}
          onRestored={() => {
            onRestored();
            onClose();
          }}
        />
      )}
    </div>
  );
};
