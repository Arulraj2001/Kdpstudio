/**
 * KDP Studio — Bulk Template Detail & Management View
 * Phase 14B
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Edit2,
  Play,
  Copy,
  Trash2,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Calendar,
  Grid,
} from 'lucide-react';
import { BulkTemplate, BulkJob, BULK_BOOK_TYPE_METADATA } from '../../types/bulk';
import { PageRoute } from '../../types';
import { useAuthStore } from '../../lib/authStore';
import { useToastStore } from '../../lib/toastStore';
import {
  getBulkTemplate,
  saveBulkTemplate,
  deleteBulkTemplate,
  createBulkJob,
  getUserBulkJobs,
} from '../../lib/bulkService';

interface BulkTemplateDetailViewProps {
  templateId: string;
  onBack: () => void;
  onNavigate: (route: PageRoute, params?: Record<string, string>) => void;
  onEditTemplate: (templateId: string) => void;
  onJobCreated: (jobId: string) => void;
}

export const BulkTemplateDetailView: React.FC<BulkTemplateDetailViewProps> = ({
  templateId,
  onBack,
  onNavigate,
  onEditTemplate,
  onJobCreated,
}) => {
  const { user, userDoc } = useAuthStore();
  const uid = user?.uid || userDoc?.uid || 'demo-user-123';

  const [template, setTemplate] = useState<BulkTemplate | null>(null);
  const [historyJobs, setHistoryJobs] = useState<BulkJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingBatch, setIsStartingBatch] = useState(false);
  const [expandedVars, setExpandedVars] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [tpl, allJobs] = await Promise.all([
          getBulkTemplate(templateId),
          getUserBulkJobs(uid),
        ]);
        setTemplate(tpl);
        if (tpl) {
          const tplJobs = allJobs.filter((j) => j.templateId === templateId);
          setHistoryJobs(tplJobs);
        }
      } catch (err) {
        console.warn('Failed to load template details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [templateId, uid]);

  const handleRunBatch = async () => {
    if (!template) return;
    setIsStartingBatch(true);
    try {
      const jobId = await createBulkJob(uid, template);
      useToastStore.getState().addToast({
        message: `Batch job started for "${template.name}"! 🚀`,
        type: 'success',
      });
      onJobCreated(jobId);
    } catch (err: any) {
      useToastStore.getState().addToast({
        message: err.message || 'Failed to start batch',
        type: 'error',
      });
    } finally {
      setIsStartingBatch(false);
    }
  };

  const handleDuplicate = async () => {
    if (!template) return;
    try {
      const copyPayload = {
        uid,
        name: `${template.name} (Copy)`,
        description: template.description,
        bookType: template.bookType,
        sharedSettings: template.sharedSettings,
        variables: template.variables,
        titleTemplate: template.titleTemplate,
        subtitleTemplate: template.subtitleTemplate,
        variationCount: template.variationCount,
      };

      const newId = await saveBulkTemplate(uid, copyPayload);
      useToastStore.getState().addToast({
        message: 'Template duplicated successfully! 📋',
        type: 'success',
      });
      onNavigate('bulk-template-new', { id: newId });
    } catch (err: any) {
      useToastStore.getState().addToast({ message: 'Failed to duplicate template', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!template) return;
    if (!confirm(`Are you sure you want to delete template "${template.name}"?`)) return;
    try {
      await deleteBulkTemplate(template.id);
      useToastStore.getState().addToast({ message: 'Template deleted', type: 'info' });
      onNavigate('bulk');
    } catch (err) {
      useToastStore.getState().addToast({ message: 'Failed to delete template', type: 'error' });
    }
  };

  const toggleVarExpand = (id: string) => {
    setExpandedVars((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading || !template) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading template details...</p>
      </div>
    );
  }

  const meta = BULK_BOOK_TYPE_METADATA[template.bookType] || { label: template.bookType };

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
            <span>Back to Templates</span>
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{template.name}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-700/60 text-purple-300 font-semibold capitalize">
              {meta.label}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            {template.variationCount} book variations • Last updated{' '}
            {new Date(template.updatedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onEditTemplate(template.id)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 size={13} />
            <span>Edit Template</span>
          </button>

          <button
            onClick={handleDuplicate}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Copy size={13} />
            <span>Duplicate</span>
          </button>

          <button
            onClick={handleDelete}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Delete Template"
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={handleRunBatch}
            disabled={isStartingBatch}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Play size={13} className="fill-slate-950" />
            <span>{isStartingBatch ? 'Queuing...' : 'Run New Batch'}</span>
          </button>
        </div>
      </div>

      {/* Shared Settings Grid */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Shared Book Specifications
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
            <span className="text-slate-500 block text-[11px]">Author Name</span>
            <span className="font-bold text-white mt-0.5 block">{template.sharedSettings.author || '—'}</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
            <span className="text-slate-500 block text-[11px]">Trim Size</span>
            <span className="font-bold text-white mt-0.5 block">{template.sharedSettings.trimSize}</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
            <span className="text-slate-500 block text-[11px]">Paper Type</span>
            <span className="font-bold text-white mt-0.5 capitalize block">{template.sharedSettings.paperType}</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
            <span className="text-slate-500 block text-[11px]">Page Count</span>
            <span className="font-bold text-white mt-0.5 block">{template.sharedSettings.pageCount} pages</span>
          </div>
        </div>

        {/* Title Templates */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-1 text-xs">
          <div>
            <span className="text-slate-500 mr-2">Title Pattern:</span>
            <span className="font-bold font-mono text-purple-300">{template.titleTemplate}</span>
          </div>
          {template.subtitleTemplate && (
            <div>
              <span className="text-slate-500 mr-2">Subtitle Pattern:</span>
              <span className="text-slate-300 italic">{template.subtitleTemplate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Variables Breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Configured Variables ({template.variables.length})
        </h2>

        <div className="space-y-2">
          {template.variables.map((v) => {
            const isExpanded = !!expandedVars[v.id];
            const allValues = v.values || v.generatedValues || v.selectedValues || [];

            return (
              <div
                key={v.id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden"
              >
                <div
                  onClick={() => toggleVarExpand(v.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-850/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/60">
                      {`{${v.name}}`}
                    </span>
                    <span className="text-xs font-bold text-white">{v.label}</span>
                    <span className="text-[10px] text-slate-400 capitalize">({v.type})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">
                      {v.type === 'color' ? v.colors?.length : allValues.length} items
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-800/80 bg-slate-950/40">
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      {v.type === 'color' ? (
                        v.colors?.map((col, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[10px]"
                          >
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: col }} />
                            <span className="font-mono text-slate-300">{col}</span>
                          </div>
                        ))
                      ) : (
                        allValues.map((val, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200"
                          >
                            {val}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Batch Run History */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Template Batch Run History ({historyJobs.length})
        </h2>

        {historyJobs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
            No batches have been executed from this template yet.
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Execution Date</th>
                  <th className="p-3.5">Books Created</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {historyJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="p-3.5 text-white font-medium">
                      {new Date(j.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {j.completedCount} / {j.totalVariations}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-950 border border-slate-800">
                        {j.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onNavigate('bulk-job-detail', { id: j.id })}
                        className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] cursor-pointer"
                      >
                        View Job
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
