/**
 * KDP Studio — Version History Restore Confirmation Modal
 * Phase 16B
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  RotateCcw,
  CheckSquare,
  Square,
  Loader2,
  ShieldAlert,
  Info,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { BookSnapshot } from '../../types/versions';
import { Book } from '../../types';
import { restoreSnapshot } from '../../lib/versionService';
import { useToastStore } from '../../lib/toastStore';

interface RestoreModalProps {
  snapshot: BookSnapshot;
  currentBook: Book;
  uid: string;
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({
  snapshot,
  currentBook,
  uid,
  isOpen,
  onClose,
  onRestored,
}) => {
  const [acknowledgedReplaced, setAcknowledgedReplaced] = useState(false);
  const [acknowledgedBackup, setAcknowledgedBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isOpen) return null;

  const isRestoreEnabled = acknowledgedReplaced && acknowledgedBackup && !isRestoring;

  const handleRestore = async () => {
    if (!isRestoreEnabled) return;

    setIsRestoring(true);
    try {
      await restoreSnapshot(snapshot.id, uid, currentBook);

      useToastStore.getState().addToast({
        message:
          "Version restored! Your previous version was saved as 'Auto-save before restore'. 🔄",
        type: 'success',
      });

      onRestored();
      onClose();
    } catch (err: any) {
      console.error('Failed to restore snapshot:', err);
      useToastStore.getState().addToast({
        message: err.message || 'Restoration failed. Your current version is unchanged.',
        type: 'error',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const formattedDate = new Date(snapshot.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950 border border-amber-800/60 text-amber-400 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Restore This Version?</h2>
              <p className="text-xs text-slate-400">Roll back manuscript to earlier state</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRestoring}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Target Snapshot Details */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span className="text-base">📷</span>
              <span className="line-clamp-1">{snapshot.label}</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-purple-400" />
                <span>{formattedDate}</span>
              </span>
              <span className="flex items-center gap-1 font-mono">
                <BookOpen size={12} className="text-emerald-400" />
                <span>
                  {snapshot.chapterCount} ch · {snapshot.totalWordCount.toLocaleString()} words
                </span>
              </span>
            </div>
          </div>

          {/* Warning Callout Box */}
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/50 space-y-1.5 text-xs text-amber-200">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <ShieldAlert size={15} />
              <span>Safety Backup Guaranteed</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              Your CURRENT live manuscript will be replaced with this version. KDP Studio will
              automatically save a safety backup of your current work before restoring.
            </p>
          </div>

          {/* Mandatory Checkboxes */}
          <div className="space-y-2.5 pt-1">
            <label
              onClick={() => setAcknowledgedReplaced(!acknowledgedReplaced)}
              className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-slate-700 cursor-pointer select-none transition-colors"
            >
              <div className="mt-0.5 text-purple-400">
                {acknowledgedReplaced ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-600" />}
              </div>
              <span className="text-xs text-slate-300">
                I understand my current editor changes will be replaced by this snapshot.
              </span>
            </label>

            <label
              onClick={() => setAcknowledgedBackup(!acknowledgedBackup)}
              className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-slate-700 cursor-pointer select-none transition-colors"
            >
              <div className="mt-0.5 text-purple-400">
                {acknowledgedBackup ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-600" />}
              </div>
              <span className="text-xs text-slate-300">
                I acknowledge a safety backup of my current version will be preserved automatically.
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isRestoring}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRestore}
            disabled={!isRestoreEnabled}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            {isRestoring ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Creating backup &amp; restoring...</span>
              </>
            ) : (
              <>
                <RotateCcw size={14} />
                <span>Restore Version</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
