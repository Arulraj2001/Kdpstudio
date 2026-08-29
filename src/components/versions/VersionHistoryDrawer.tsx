/**
 * KDP Studio — Version History Drawer Component
 * Phase 16B
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  History,
  Camera,
  RotateCcw,
  GitCompare,
  MoreVertical,
  Trash2,
  Edit2,
  Lock,
  Sparkles,
  Calendar,
  Layers,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { BookSnapshot, SnapshotTrigger } from '../../types/versions';
import { Book } from '../../types';
import {
  getBookSnapshots,
  createSnapshot,
  deleteSnapshot,
  renameSnapshot,
  SNAPSHOT_LIMITS,
} from '../../lib/versionService';
import { useAuthStore } from '../../lib/authStore';
import { useToastStore } from '../../lib/toastStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import { SnapshotCompare } from './SnapshotCompare';
import { RestoreModal } from './RestoreModal';

interface VersionHistoryDrawerProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
}

// Relative time formatting helper
function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Trigger badge styling
function getTriggerBadge(trigger: SnapshotTrigger) {
  switch (trigger) {
    case 'manual':
      return { label: 'Manual', bg: 'bg-purple-950/80 text-purple-300 border-purple-800/60' };
    case 'pre-export-pdf':
      return { label: 'PDF Export', bg: 'bg-blue-950/80 text-blue-300 border-blue-800/60' };
    case 'pre-export-epub':
      return { label: 'EPUB Export', bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60' };
    case 'auto-daily':
      return { label: 'Auto Daily', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    case 'milestone':
      return { label: 'Milestone', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60' };
    default:
      return { label: 'Snapshot', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
  }
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  book,
  isOpen,
  onClose,
  onRestored,
}) => {
  const user = useAuthStore((state) => state.user);
  const userPlan = user?.plan || 'free';
  const openCheckout = useCheckoutStore((state) => state.open);

  const [snapshots, setSnapshots] = useState<BookSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Snapshot Input Form state
  const [isAddingSnapshot, setIsAddingSnapshot] = useState(false);
  const [newSnapshotLabel, setNewSnapshotLabel] = useState('');
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);

  // Inline Rename state
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  // Active Menu dropdown state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modals state
  const [comparingSnapshot, setComparingSnapshot] = useState<BookSnapshot | null>(null);
  const [restoringSnapshot, setRestoringSnapshot] = useState<BookSnapshot | null>(null);

  const isFreePlan = userPlan === 'free';
  const maxSnapshots = SNAPSHOT_LIMITS[userPlan] ?? SNAPSHOT_LIMITS.free;

  // Load snapshots
  const loadSnapshots = useCallback(async () => {
    if (!user?.uid || !book.id || isFreePlan) return;
    setIsLoading(true);
    try {
      const list = await getBookSnapshots(book.id, user.uid);
      setSnapshots(list);
    } catch (err) {
      console.warn('Failed to load snapshots:', err);
    } finally {
      setIsLoading(false);
    }
  }, [book.id, user?.uid, isFreePlan]);

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen, loadSnapshots]);

  if (!isOpen) return null;

  // Handle Save Manual Snapshot
  const handleSaveSnapshot = async () => {
    if (!user?.uid) return;
    setIsSavingSnapshot(true);
    try {
      const snapId = await createSnapshot(
        user.uid,
        book.id,
        book,
        'manual',
        newSnapshotLabel.trim() || undefined
      );

      if (snapId) {
        useToastStore.getState().addToast({
          message: 'Snapshot captured successfully! 📷',
          type: 'success',
        });
        setNewSnapshotLabel('');
        setIsAddingSnapshot(false);
        await loadSnapshots();
      }
    } catch (err: any) {
      useToastStore.getState().addToast({
        message: err.message || 'Failed to capture snapshot',
        type: 'error',
      });
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  // Handle Delete Snapshot
  const handleDeleteSnapshot = async (snapId: string) => {
    if (!user?.uid) return;

    if (snapshots.length === 1) {
      const confirmSingle = window.confirm(
        'This is your only saved snapshot version for this book. Are you sure you want to delete it?'
      );
      if (!confirmSingle) return;
    } else {
      const confirmDel = window.confirm('Are you sure you want to delete this snapshot version?');
      if (!confirmDel) return;
    }

    try {
      await deleteSnapshot(snapId, user.uid);
      useToastStore.getState().addToast({
        message: 'Snapshot deleted',
        type: 'info',
      });
      await loadSnapshots();
    } catch (err: any) {
      useToastStore.getState().addToast({
        message: err.message || 'Failed to delete snapshot',
        type: 'error',
      });
    } finally {
      setActiveMenuId(null);
    }
  };

  // Handle Inline Rename Submit
  const handleRenameSubmit = async (snapId: string) => {
    if (!user?.uid || !editingLabel.trim()) {
      setEditingSnapshotId(null);
      return;
    }

    try {
      await renameSnapshot(snapId, user.uid, editingLabel.trim());
      setSnapshots((prev) =>
        prev.map((s) => (s.id === snapId ? { ...s, label: editingLabel.trim() } : s))
      );
    } catch (err) {
      console.warn('Failed to rename snapshot:', err);
    } finally {
      setEditingSnapshotId(null);
      setActiveMenuId(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-84 sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-slide-left overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800/60 text-purple-400 flex items-center justify-center">
              <History size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Version History</h3>
              <p className="text-[11px] text-slate-400">Snapshots &amp; Rollback Points</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Free Plan Lock Gate */}
        {isFreePlan ? (
          <div className="p-6 text-center flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-purple-950/80 border border-purple-800/60 text-purple-400 flex items-center justify-center">
              <Lock size={26} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Starter Plan Feature</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Version History and disaster recovery snapshots require a Starter plan or higher.
                Save up to 5 snapshots per book with rollback protection.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                openCheckout('starter');
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Upgrade to Starter ($9/mo)</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Top Bar: Limits + Snapshot Trigger */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/30 space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Snapshot Usage</span>
                <span className="font-mono text-purple-300 font-bold">
                  {snapshots.length}{' '}
                  {maxSnapshots === -1 ? 'snapshots (Unlimited)' : `/ ${maxSnapshots} max`}
                </span>
              </div>

              {!isAddingSnapshot ? (
                <button
                  type="button"
                  onClick={() => setIsAddingSnapshot(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera size={14} />
                  <span>Save Snapshot Now</span>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-950 border border-purple-850 space-y-2.5 animate-scale-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Snapshot Label (Optional)
                    </label>
                    <input
                      type="text"
                      value={newSnapshotLabel}
                      onChange={(e) => setNewSnapshotLabel(e.target.value)}
                      placeholder="e.g. Before chapter 5 rewrite"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingSnapshot(false);
                        setNewSnapshotLabel('');
                      }}
                      disabled={isSavingSnapshot}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSnapshot}
                      disabled={isSavingSnapshot}
                      className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      {isSavingSnapshot ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Snapshots List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Loader2 size={24} className="animate-spin text-purple-500 mx-auto" />
                  <p className="text-xs">Loading snapshot history...</p>
                </div>
              ) : snapshots.length === 0 ? (
                <div className="py-12 text-center space-y-3 text-slate-500">
                  <Camera size={32} className="mx-auto text-slate-600" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400">No snapshots saved yet</p>
                    <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto">
                      Save a manual snapshot or export to auto-record book versions.
                    </p>
                  </div>
                </div>
              ) : (
                snapshots.map((snap) => {
                  const badge = getTriggerBadge(snap.trigger);
                  const isEditingThis = editingSnapshotId === snap.id;
                  const isMenuOpen = activeMenuId === snap.id;

                  return (
                    <div
                      key={snap.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5 relative group"
                    >
                      {/* Top Row: Label & Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {isEditingThis ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingLabel}
                                onChange={(e) => setEditingLabel(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameSubmit(snap.id);
                                  if (e.key === 'Escape') setEditingSnapshotId(null);
                                }}
                                onBlur={() => handleRenameSubmit(snap.id)}
                                className="w-full bg-slate-900 border border-purple-500 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <h4
                              onClick={() => {
                                setEditingSnapshotId(snap.id);
                                setEditingLabel(snap.label);
                              }}
                              className="text-xs font-bold text-white truncate hover:text-purple-300 cursor-pointer flex items-center gap-1.5"
                              title="Click to rename"
                            >
                              <span>{snap.label}</span>
                              <Edit2 size={10} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </h4>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatTimeAgo(snap.createdAt)}
                          </p>
                        </div>

                        {/* More Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(isMenuOpen ? null : snap.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 top-6 w-32 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1 z-30 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSnapshotId(snap.id);
                                  setEditingLabel(snap.label);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-2.5 py-1.5 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
                              >
                                <Edit2 size={12} />
                                <span>Rename</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSnapshot(snap.id)}
                                className="w-full px-2.5 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-950/50 rounded-lg flex items-center gap-2"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle Row: Badge & Stats */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <span
                          className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>

                        <span className="font-mono text-[10px]">
                          {snap.chapterCount} ch · {snap.totalWordCount.toLocaleString()} words
                        </span>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="pt-2 border-t border-slate-900 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setComparingSnapshot(snap)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <GitCompare size={12} />
                          <span>Compare</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestoringSnapshot(snap)}
                          className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-800/60 text-purple-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Restore</span>
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

      {/* Snapshot Compare Modal */}
      {comparingSnapshot && (
        <SnapshotCompare
          initialSnapshot={comparingSnapshot}
          allSnapshots={snapshots}
          currentBook={book}
          uid={user?.uid || ''}
          isOpen={Boolean(comparingSnapshot)}
          onClose={() => setComparingSnapshot(null)}
          onRestored={() => {
            loadSnapshots();
            onRestored();
          }}
        />
      )}

      {/* Restore Confirmation Modal */}
      {restoringSnapshot && (
        <RestoreModal
          snapshot={restoringSnapshot}
          currentBook={book}
          uid={user?.uid || ''}
          isOpen={Boolean(restoringSnapshot)}
          onClose={() => setRestoringSnapshot(null)}
          onRestored={() => {
            loadSnapshots();
            onRestored();
          }}
        />
      )}
    </>
  );
};
