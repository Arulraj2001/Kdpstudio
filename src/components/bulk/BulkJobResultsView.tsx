/**
 * KDP Studio — Bulk Job Results Component
 * Phase 14B
 */

import React, { useState, useEffect } from 'react';
import {
  Download,
  Eye,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  Filter,
  Layers,
  Sparkles,
  Edit,
  Trash2,
  BookPlus,
} from 'lucide-react';
import { BulkJob, BulkVariation } from '../../types/bulk';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { useToastStore } from '../../lib/toastStore';
import { auth } from '../../lib/firebase';
import { getBulkJob } from '../../lib/bulkService';

interface BulkJobResultsViewProps {
  jobId: string;
  onBack: () => void;
  onNavigate: (route: PageRoute, params?: Record<string, string>) => void;
}

export const BulkJobResultsView: React.FC<BulkJobResultsViewProps> = ({
  jobId,
  onBack,
  onNavigate,
}) => {
  const { user, userDoc } = useAuthStore();
  const uid = user?.uid || userDoc?.uid || 'demo-user-123';

  const [job, setJob] = useState<BulkJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'status'>('order');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    getBulkJob(jobId)
      .then((j) => {
        setJob(j);
        if (j) {
          setSelectedIndices(
            j.variations.filter((v) => v.status === 'complete').map((v) => v.variationIndex)
          );
        }
      })
      .finally(() => setIsLoading(false));
  }, [jobId]);

  const handleDownloadZip = async () => {
    if (!job) return;
    if (job.zipUrl) {
      window.open(job.zipUrl, '_blank');
      return;
    }

    setIsZipping(true);
    try {
      const token = (await auth.currentUser?.getIdToken()) || '';
      const res = await fetch(`/api/bulk/export-zip/${job.id}`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'x-user-id': uid,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to prepare ZIP bundle');
      }

      setJob((prev) => (prev ? { ...prev, zipUrl: data.zipUrl } : null));
      useToastStore.getState().addToast({
        message: 'ZIP bundle downloaded! 📦',
        type: 'success',
      });
      window.open(data.zipUrl, '_blank');
    } catch (err: any) {
      useToastStore.getState().addToast({
        message: err.message || 'Failed to download ZIP',
        type: 'error',
      });
    } finally {
      setIsZipping(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    if (!job) return;
    if (selectedIndices.length === job.variations.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(job.variations.map((v) => v.variationIndex));
    }
  };

  if (isLoading || !job) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading batch results...</p>
      </div>
    );
  }

  // Filter & Sort Variations
  let displayedVariations = job.variations.filter((v) => {
    if (filterStatus === 'complete') return v.status === 'complete';
    if (filterStatus === 'failed') return v.status === 'failed';
    return true;
  });

  if (sortBy === 'title') {
    displayedVariations.sort((a, b) => a.resolvedTitle.localeCompare(b.resolvedTitle));
  } else if (sortBy === 'status') {
    displayedVariations.sort((a, b) => a.status.localeCompare(b.status));
  } else {
    displayedVariations.sort((a, b) => a.variationIndex - b.variationIndex);
  }

  const completedCount = job.variations.filter((v) => v.status === 'complete').length;
  const estimatedTotalPages = completedCount * 30; // Approx standard pages

  return (
    <div className="max-w-5xl mx-auto pb-24 text-slate-100 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Job Runner</span>
          </button>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {job.templateName} — Batch Results
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {completedCount} of {job.totalVariations} books created • Completed{' '}
            {new Date(job.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping || completedCount === 0}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-950/60 text-xs transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download size={16} />
          <span>{isZipping ? 'Preparing ZIP...' : '📦 Download ZIP Bundle'}</span>
        </button>
      </div>

      {/* Export Summary Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block">Total Books:</span>
          <span className="text-base font-bold text-white">{completedCount} books</span>
        </div>
        <div>
          <span className="text-slate-500 block">Total Pages:</span>
          <span className="text-base font-bold text-purple-300">~{estimatedTotalPages} pages</span>
        </div>
        <div>
          <span className="text-slate-500 block">Estimated Size:</span>
          <span className="text-base font-bold text-emerald-400">~{(completedCount * 1.5).toFixed(1)} MB</span>
        </div>
        <div>
          <span className="text-slate-500 block">Book Category:</span>
          <span className="text-base font-bold text-amber-400 capitalize">
            {job.bookType.replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* Filter & Bulk Actions Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Filter:</span>
          {(['all', 'complete', 'failed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg capitalize font-semibold transition-colors cursor-pointer ${
                filterStatus === st
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value="order">Original Order</option>
              <option value="title">Title (A-Z)</option>
              <option value="status">Status</option>
            </select>
          </div>

          <button
            onClick={() => {
              useToastStore.getState().addToast({
                message: `Added ${selectedIndices.length} books to series pipeline! 📚`,
                type: 'success',
              });
              onNavigate('series');
            }}
            disabled={selectedIndices.length === 0}
            className="px-3 py-1 rounded-lg bg-indigo-950 border border-indigo-700/60 hover:bg-indigo-900 text-indigo-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <BookPlus size={13} />
            <span>Add to Series ({selectedIndices.length})</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIndices.length === job.variations.length && job.variations.length > 0}
                    onChange={handleSelectAll}
                    className="rounded bg-slate-900 border-slate-700"
                  />
                </th>
                <th className="p-3.5">#</th>
                <th className="p-3.5">Resolved Title</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Book ID</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {displayedVariations.map((v) => {
                const isSelected = selectedIndices.includes(v.variationIndex);

                return (
                  <tr
                    key={v.variationIndex}
                    className="hover:bg-slate-850/60 transition-colors"
                  >
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(v.variationIndex)}
                        className="rounded bg-slate-900 border-slate-700"
                      />
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">#{v.variationIndex + 1}</td>
                    <td className="p-3.5 font-bold text-white">
                      <div>{v.resolvedTitle}</div>
                      {v.resolvedSubtitle && (
                        <div className="text-[11px] font-normal text-slate-400 italic">
                          {v.resolvedSubtitle}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          v.status === 'complete'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                            : v.status === 'failed'
                            ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                      {v.bookId || '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {v.status === 'complete' && v.pdfUrl && (
                          <>
                            <a
                              href={v.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] flex items-center gap-1"
                              title="Preview PDF"
                            >
                              <Eye size={12} />
                              <span>Preview</span>
                            </a>

                            <a
                              href={v.pdfUrl}
                              download={`${v.variationIndex + 1}_${v.resolvedTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1"
                              title="Download PDF"
                            >
                              <Download size={12} />
                              <span>Download</span>
                            </a>
                          </>
                        )}

                        {v.bookId && (
                          <button
                            onClick={() => onNavigate('studio')}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit size={12} />
                            <span>Edit Book</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
