/**
 * KDP Studio — Bulk Book Generator Hub View
 * Phase 14B
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Plus,
  Play,
  Edit2,
  Trash2,
  Download,
  Eye,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Lock,
  ArrowRight,
  FileText,
  Grid,
  Palette,
  Calendar,
  BookHeart,
} from 'lucide-react';
import { BulkTemplate, BulkJob, BULK_BOOK_TYPE_METADATA } from '../../types/bulk';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { useGeoStore } from '../../lib/geoStore';
import { useToastStore } from '../../lib/toastStore';
import { useCheckoutStore } from '../../lib/checkoutStore';
import {
  getUserBulkTemplates,
  getUserBulkJobs,
  createBulkJob,
  deleteBulkTemplate,
  updateJobStatus,
} from '../../lib/bulkService';

interface BulkGeneratorHubViewProps {
  onNavigate: (route: PageRoute, params?: Record<string, string>) => void;
  onSelectJob: (jobId: string) => void;
  onSelectTemplate: (templateId: string) => void;
  onEditTemplate: (templateId: string) => void;
}

export const BulkGeneratorHubView: React.FC<BulkGeneratorHubViewProps> = ({
  onNavigate,
  onSelectJob,
  onSelectTemplate,
  onEditTemplate,
}) => {
  const { user, userDoc } = useAuthStore();
  const { currency, getFormattedPrice } = useGeoStore();
  const plan = userDoc?.plan || 'free';
  const isAgency = plan === 'agency' || plan === 'lifetime';
  const uid = user?.uid || userDoc?.uid || 'demo-user-123';

  const [templates, setTemplates] = useState<BulkTemplate[]>([]);
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningBatchId, setRunningBatchId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [uid]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tplList, jobList] = await Promise.all([
        getUserBulkTemplates(uid),
        getUserBulkJobs(uid),
      ]);
      setTemplates(tplList);
      setJobs(jobList);
    } catch (err) {
      console.warn('Failed to load bulk hub data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBatch = async (template: BulkTemplate) => {
    if (!isAgency) {
      useCheckoutStore.getState().open('agency', 'monthly');
      return;
    }

    setRunningBatchId(template.id);
    try {
      const jobId = await createBulkJob(uid, template);
      useToastStore.getState().addToast({
        message: `Batch job queued with ${template.variationCount} books! 🚀`,
        type: 'success',
      });
      onSelectJob(jobId);
    } catch (err: any) {
      useToastStore.getState().addToast({
        message: err.message || 'Failed to start batch job',
        type: 'error',
      });
    } finally {
      setRunningBatchId(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await deleteBulkTemplate(templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      useToastStore.getState().addToast({ message: 'Template deleted', type: 'info' });
    } catch (err) {
      useToastStore.getState().addToast({ message: 'Failed to delete template', type: 'error' });
    }
  };

  const handleCancelJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateJobStatus(jobId, 'cancelled');
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'cancelled' } : j))
      );
      useToastStore.getState().addToast({ message: 'Job cancelled', type: 'info' });
    } catch (err) {
      useToastStore.getState().addToast({ message: 'Failed to cancel job', type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'running':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60 animate-pulse';
      case 'failed':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60';
      case 'cancelled':
        return 'bg-slate-900 text-slate-500 border-slate-800';
      case 'queued':
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
    }
  };

  const getBookTypeIcon = (type: string) => {
    switch (type) {
      case 'word-search':
      case 'word-fit':
        return <Grid size={18} className="text-purple-400" />;
      case 'coloring-book':
      case 'color-by-number':
        return <Palette size={18} className="text-pink-400" />;
      case 'planner':
        return <Calendar size={18} className="text-emerald-400" />;
      case 'journal':
        return <BookHeart size={18} className="text-indigo-400" />;
      default:
        return <FileText size={18} className="text-blue-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 text-slate-100 space-y-8">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PLAN GATE BANNER (FOR NON-AGENCY USERS) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {!isAgency && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/50 p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-amber-300">
            <Layers size={220} />
          </div>
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles size={14} className="text-amber-400" />
              <span>Agency Plan Exclusive</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Bulk Book Generator
            </h1>
            <p className="mt-2 text-sm md:text-base text-amber-200/90 max-w-2xl leading-relaxed">
              Create 5–20 book variations in a single automated run. Define dynamic variables once and generate a complete publishing catalog in minutes.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm text-amber-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Generate 20 word search books with different themes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Create a complete journal series in one click</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Export all print-ready books as a single ZIP bundle</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Saves dozens of hours of repetitive interior formatting</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => useCheckoutStore.getState().open('agency', 'monthly')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-extrabold shadow-lg shadow-amber-950/60 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>⚡ Upgrade to Agency Plan</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => onNavigate('pricing')}
                className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-medium transition-colors cursor-pointer"
              >
                Compare All Plans
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HEADER & NEW TEMPLATE CTA */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md shadow-amber-900/30">
              <Layers size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Bulk Book Generator
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/50 text-amber-300 font-semibold uppercase">
                  Agency
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                Automate multi-book catalog production from reusable variable templates.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('bulk-template-new')}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-950/40 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Bulk Template</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: MY TEMPLATES */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>📋 My Templates</span>
            <span className="text-xs text-slate-400 font-normal">({templates.length})</span>
          </h2>
        </div>

        {templates.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-purple-400">
              <Layers size={28} />
            </div>
            <h3 className="text-base font-bold text-white">No bulk templates yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              A template defines the book structure (trim size, page layout). Dynamic variables define what changes between book variations (themes, titles, colors).
            </p>
            <button
              onClick={() => onNavigate('bulk-template-new')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Create Your First Template</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => {
              const meta = BULK_BOOK_TYPE_METADATA[tpl.bookType] || {
                label: tpl.bookType,
                description: '',
              };

              return (
                <div
                  key={tpl.id}
                  onClick={() => onSelectTemplate(tpl.id)}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between cursor-pointer group shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                          {getBookTypeIcon(tpl.bookType)}
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 capitalize">
                          {meta.label}
                        </span>
                      </div>

                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 font-bold text-slate-200">
                        {tpl.variationCount} variations
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors mt-2">
                      {tpl.name}
                    </h3>

                    {tpl.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                    )}

                    {/* Variable Chips */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Variables:</span>
                      {tpl.variables?.map((v) => (
                        <span
                          key={v.id}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-[10px] text-slate-300 font-mono"
                        >
                          {v.type === 'color' ? '🎨' : v.type === 'ai-generate' ? '🤖' : '🔤'} {v.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-850 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500">
                      Updated {new Date(tpl.updatedAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEditTemplate(tpl.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleRunBatch(tpl)}
                        disabled={runningBatchId === tpl.id}
                        className="px-3 py-1 rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <Play size={12} className="fill-white" />
                        <span>{runningBatchId === tpl.id ? 'Queuing...' : 'Run Batch'}</span>
                      </button>

                      <button
                        onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: RECENT JOBS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>⚡ Recent Batch Runs</span>
            <span className="text-xs text-slate-400 font-normal">({jobs.length})</span>
          </h2>
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            No batch jobs executed yet. Pick a template and click "Run Batch" to start!
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Template Name</th>
                    <th className="p-3.5">Book Type</th>
                    <th className="p-3.5">Variations</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Started At</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {jobs.slice(0, 10).map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => onSelectJob(job.id)}
                      className="hover:bg-slate-850/60 transition-colors cursor-pointer"
                    >
                      <td className="p-3.5 font-bold text-white">{job.templateName}</td>
                      <td className="p-3.5 text-slate-300 capitalize">
                        {job.bookType.replace('-', ' ')}
                      </td>
                      <td className="p-3.5 font-mono text-slate-200">
                        {job.completedCount} / {job.totalVariations}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {job.startedAt
                          ? new Date(job.startedAt).toLocaleDateString()
                          : new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {job.status === 'complete' && job.zipUrl && (
                            <a
                              href={job.zipUrl}
                              download
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <Download size={12} />
                              <span>ZIP</span>
                            </a>
                          )}

                          <button
                            onClick={() => onSelectJob(job.id)}
                            className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>{job.status === 'running' ? 'Progress' : 'View'}</span>
                          </button>

                          {job.status === 'queued' && (
                            <button
                              onClick={(e) => handleCancelJob(job.id, e)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Cancel Job"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
