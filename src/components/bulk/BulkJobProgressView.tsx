/**
 * KDP Studio — Bulk Job Progress Component (SSE + Polling Live Runner)
 * Phase 14B
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  Download,
  Eye,
  RotateCcw,
  ArrowLeft,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BulkJob, BulkVariation } from '../../types/bulk';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { useToastStore } from '../../lib/toastStore';
import { auth } from '../../lib/firebase';
import {
  getBulkJob,
  updateJobStatus,
  updateVariationStatus,
} from '../../lib/bulkService';

interface BulkJobProgressViewProps {
  jobId: string;
  onBack: () => void;
  onNavigate: (route: PageRoute, params?: Record<string, string>) => void;
  onViewResults: (jobId: string) => void;
}

export const BulkJobProgressView: React.FC<BulkJobProgressViewProps> = ({
  jobId,
  onBack,
  onNavigate,
  onViewResults,
}) => {
  const { user, userDoc } = useAuthStore();
  const uid = user?.uid || userDoc?.uid || 'demo-user-123';

  const [job, setJob] = useState<BulkJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [retryingIndex, setRetryingIndex] = useState<number | null>(null);
  const [isFailedSectionOpen, setIsFailedSectionOpen] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<any>(null);

  // Initial Load & Start Processing
  useEffect(() => {
    let isMounted = true;

    async function initJob() {
      setIsLoading(true);
      try {
        const existingJob = await getBulkJob(jobId);
        if (existingJob && isMounted) {
          setJob(existingJob);
          setIsPaused(existingJob.status === 'paused');

          // If queued or running, start SSE processing stream
          if (existingJob.status === 'queued' || existingJob.status === 'running') {
            startJobStream();
          }
        }
      } catch (err) {
        console.warn('Failed to load initial job:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initJob();

    // Polling fallback every 5 seconds to sync state
    pollingTimerRef.current = setInterval(async () => {
      try {
        const freshJob = await getBulkJob(jobId);
        if (freshJob && isMounted) {
          setJob((prev) => {
            if (!prev) return freshJob;
            return {
              ...prev,
              ...freshJob,
              variations: freshJob.variations || prev.variations,
            };
          });
        }
      } catch (err) {
        // silent
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [jobId]);

  // Start SSE processing stream
  const startJobStream = async () => {
    try {
      const token = (await auth.currentUser?.getIdToken()) || '';

      // Direct POST trigger to backend processor
      fetch(`/api/bulk/process/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: token ? `Bearer ${token}` : '',
          'x-user-id': uid,
        },
      }).then(async (response) => {
        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.replace('data: ', ''));
                handleStreamEvent(event);
              } catch (e) {}
            }
          }
        }
      }).catch((err) => {
        console.warn('SSE stream error, falling back to background polling:', err);
        setIsReconnecting(true);
        setTimeout(() => setIsReconnecting(false), 3000);
      });
    } catch (err) {
      console.warn('Failed to start stream:', err);
    }
  };

  const handleStreamEvent = (event: any) => {
    if (event.type === 'progress') {
      setJob((prev) => {
        if (!prev) return null;
        const newVariations = [...prev.variations];
        const vIdx = event.variationIndex;

        if (newVariations[vIdx]) {
          newVariations[vIdx] = {
            ...newVariations[vIdx],
            status: event.status,
            bookId: event.bookId || newVariations[vIdx].bookId,
            error: event.error || null,
          };
        }

        return {
          ...prev,
          status: 'running',
          currentVariationIndex: vIdx,
          completedCount: event.completed,
          failedCount: event.failed,
          variations: newVariations,
        };
      });
    } else if (event.type === 'complete') {
      setJob((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'complete',
          completedCount: event.completedCount,
          failedCount: event.failedCount,
          zipUrl: event.zipUrl || prev.zipUrl,
        };
      });
      useToastStore.getState().addToast({
        message: `🎉 Batch completed! ${event.completedCount} books ready.`,
        type: 'success',
      });
    }
  };

  const handlePauseResume = async () => {
    if (!job) return;
    const newStatus = isPaused ? 'running' : 'paused';
    setIsPaused(!isPaused);
    await updateJobStatus(job.id, newStatus);
    setJob((prev) => (prev ? { ...prev, status: newStatus } : null));

    if (newStatus === 'running') {
      startJobStream();
      useToastStore.getState().addToast({ message: 'Batch generation resumed.', type: 'info' });
    } else {
      useToastStore.getState().addToast({ message: 'Batch generation paused.', type: 'info' });
    }
  };

  const handleCancelJob = async () => {
    if (!job) return;
    if (!confirm('Are you sure you want to cancel this batch? Generated books will remain saved.')) {
      return;
    }
    await updateJobStatus(job.id, 'cancelled');
    setJob((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    useToastStore.getState().addToast({ message: 'Batch job cancelled.', type: 'info' });
  };

  const handleRetryVariation = async (variationIndex: number) => {
    if (!job) return;
    setRetryingIndex(variationIndex);
    try {
      const token = (await auth.currentUser?.getIdToken()) || '';
      const res = await fetch('/api/bulk/retry-variation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-user-id': uid,
        },
        body: JSON.stringify({ jobId: job.id, variationIndex }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Retry failed');
      }

      useToastStore.getState().addToast({
        message: `Book #${variationIndex + 1} generated successfully! ✅`,
        type: 'success',
      });

      if (data.job) {
        setJob(data.job);
      }
    } catch (err: any) {
      useToastStore.getState().addToast({
        message: err.message || 'Retry failed',
        type: 'error',
      });
    } finally {
      setRetryingIndex(null);
    }
  };

  const handleRetryAllFailed = async () => {
    if (!job) return;
    const failedList = job.variations.filter((v) => v.status === 'failed');
    if (!failedList.length) return;

    useToastStore.getState().addToast({
      message: `Retrying ${failedList.length} failed variations sequentially... 🔄`,
      type: 'info',
    });

    for (const fv of failedList) {
      await handleRetryVariation(fv.variationIndex);
    }
  };

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
        message: 'ZIP bundle prepared! Downloading now...',
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

  if (isLoading || !job) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading batch job progress...</p>
      </div>
    );
  }

  const total = job.totalVariations || 1;
  const completed = job.completedCount || 0;
  const failed = job.failedCount || 0;
  const remaining = Math.max(0, total - completed - failed);

  // Percentage logic: 99% max until ZIP ready, 100% when complete & ZIP ready
  let progressPercent = Math.floor(((completed + failed) / total) * 100);
  if (progressPercent >= 100 && !job.zipUrl) {
    progressPercent = 99;
  }
  if (job.status === 'complete' && job.zipUrl) {
    progressPercent = 100;
  }

  const remainingSeconds = Math.max(0, remaining * 45);
  const remainingMinutes = Math.ceil(remainingSeconds / 60);

  const currentVar = job.variations[job.currentVariationIndex || 0];
  const failedVariations = job.variations.filter((v) => v.status === 'failed');

  return (
    <div className="max-w-5xl mx-auto pb-24 text-slate-100 space-y-6">
      {/* Reconnecting banner */}
      {isReconnecting && (
        <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between animate-pulse">
          <span>Reconnecting to live progress stream...</span>
          <Clock size={14} />
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Bulk Hub</span>
          </button>

          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>{job.templateName}</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                job.status === 'complete'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  : job.status === 'running'
                  ? 'bg-blue-950 text-blue-300 border-blue-600 animate-pulse'
                  : job.status === 'failed'
                  ? 'bg-rose-950 text-rose-300 border-rose-600'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              {job.status}
            </span>
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Started: {new Date(job.createdAt).toLocaleTimeString()} • {job.bookType.replace('-', ' ')} • {total} total variations
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {job.status === 'running' && (
            <button
              onClick={handlePauseResume}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Pause size={14} />
              <span>Pause Job</span>
            </button>
          )}

          {job.status === 'paused' && (
            <button
              onClick={handlePauseResume}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Play size={14} className="fill-white" />
              <span>Resume Job</span>
            </button>
          )}

          {job.status !== 'complete' && job.status !== 'cancelled' && (
            <button
              onClick={handleCancelJob}
              className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel Batch
            </button>
          )}

          {job.status === 'complete' && (
            <button
              onClick={() => onViewResults(job.id)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Eye size={14} />
              <span>View Results</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PROGRESS OVERVIEW SECTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-300">
            Batch Generation Progress
          </span>
          <span className="font-mono font-bold text-purple-300 text-sm">
            {progressPercent}%
          </span>
        </div>

        {/* Full-width Progress Bar */}
        <div className="w-full h-3.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 transition-all duration-500 shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-slate-400 block text-[11px]">✅ Completed</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">
              {completed} / {total}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-slate-400 block text-[11px]">⏳ Remaining</span>
            <span className="text-base font-extrabold text-amber-400 font-mono">
              {remaining}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-slate-400 block text-[11px]">❌ Failed</span>
            <span className="text-base font-extrabold text-rose-400 font-mono">
              {failed}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <span className="text-slate-400 block text-[11px]">⏱️ Est. Time Left</span>
            <span className="text-base font-extrabold text-purple-300 font-mono">
              ~{remainingMinutes} min
            </span>
          </div>
        </div>

        {/* Currently Generating Indicator */}
        {job.status === 'running' && currentVar && (
          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">
                Currently Generating:
              </span>
              <span className="text-xs font-bold text-white truncate block">
                {currentVar.resolvedTitle}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUCCESS BANNER & ZIP DOWNLOAD */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {job.status === 'complete' && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-900/60 border border-emerald-600 text-emerald-300">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">🎉 Batch Complete!</h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                {completed} books generated successfully. {failed > 0 ? `${failed} failed.` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-950/60 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={15} />
              <span>{isZipping ? 'Preparing ZIP...' : '📦 Download All as ZIP'}</span>
            </button>

            <button
              onClick={() => onViewResults(job.id)}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              View Results
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BOOK VARIATIONS GRID */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Book Variations Progress ({job.variations.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {job.variations.map((v) => {
            const isGenerating = v.status === 'generating';
            const isDone = v.status === 'complete';
            const isFailed = v.status === 'failed';

            return (
              <div
                key={v.variationIndex}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isGenerating
                    ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30 animate-pulse'
                    : isDone
                    ? 'bg-slate-900/90 border-emerald-700/40 shadow-sm'
                    : isFailed
                    ? 'bg-rose-950/30 border-rose-800/60'
                    : 'bg-slate-950/70 border-slate-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{v.variationIndex + 1}
                    </span>

                    <span className="text-base">
                      {isDone && '✅'}
                      {isGenerating && '⟳'}
                      {isFailed && '❌'}
                      {v.status === 'pending' && '⏳'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                    {v.resolvedTitle}
                  </h4>

                  {v.resolvedSubtitle && (
                    <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-1">
                      {v.resolvedSubtitle}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-850/80 flex items-center justify-between">
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                      isDone
                        ? 'text-emerald-400 bg-emerald-950'
                        : isGenerating
                        ? 'text-purple-300 bg-purple-950'
                        : isFailed
                        ? 'text-rose-400 bg-rose-950'
                        : 'text-slate-500 bg-slate-900'
                    }`}
                  >
                    {v.status}
                  </span>

                  {isDone && v.pdfUrl && (
                    <a
                      href={v.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      Preview PDF
                    </a>
                  )}

                  {isFailed && (
                    <button
                      onClick={() => handleRetryVariation(v.variationIndex)}
                      disabled={retryingIndex === v.variationIndex}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                    >
                      {retryingIndex === v.variationIndex ? 'Retrying...' : 'Retry'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FAILED BOOKS SECTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {failedVariations.length > 0 && (
        <div className="rounded-2xl bg-rose-950/40 border border-rose-800/60 overflow-hidden">
          <div
            onClick={() => setIsFailedSectionOpen(!isFailedSectionOpen)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-950/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400" />
              <span className="text-xs font-bold text-rose-200">
                {failedVariations.length} Failed Book Variations
              </span>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleRetryAllFailed}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Retry All Failed
              </button>
              {isFailedSectionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {isFailedSectionOpen && (
            <div className="p-4 pt-0 space-y-2 border-t border-rose-900/40">
              {failedVariations.map((fv) => (
                <div
                  key={fv.variationIndex}
                  className="p-3 rounded-xl bg-slate-950 border border-rose-900/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">
                      #{fv.variationIndex + 1} — {fv.resolvedTitle}
                    </span>
                    <span className="text-[11px] text-rose-400 block mt-0.5">
                      Error: {fv.error || 'Generation timed out or failed'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRetryVariation(fv.variationIndex)}
                    disabled={retryingIndex === fv.variationIndex}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    {retryingIndex === fv.variationIndex ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
