'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { auth } from '../../../lib/firebase';
import type { AuditReportSummary } from '../../../types/admin';

export function AuditReportsPage() {
  const [reports, setReports] = useState<AuditReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AuditReportSummary | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/content/audits', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('[AuditReportsPage]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📋</span> Manuscript Quality & Compliance Audits
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit scores, KDP rejection risk evaluations, and editorial health metrics across all user books
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a2e] border border-white/10 hover:border-white/20 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
        >
          <span>🔄</span> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Book Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No audit reports found in system
                  </td>
                </tr>
              ) : (
                reports.map(r => (
                  <tr key={r.id} className="hover:bg-white/5">
                    {/* Score */}
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          r.score >= 85
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : r.score >= 70
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            : 'bg-red-950 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {r.score}/100
                      </span>
                    </td>

                    {/* Book */}
                    <td className="px-4 py-3 font-semibold text-white max-w-[170px] truncate">
                      {r.bookTitle}
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{r.userName}</p>
                      <p className="text-slate-500 font-mono text-[11px]">{r.userEmail}</p>
                    </td>

                    {/* Audit Type */}
                    <td className="px-4 py-3 uppercase font-mono text-purple-300">
                      {r.auditType}
                    </td>

                    {/* Risk */}
                    <td className="px-4 py-3 uppercase font-bold text-[10px]">
                      <span
                        className={
                          r.kdpRisk === 'low'
                            ? 'text-emerald-400'
                            : r.kdpRisk === 'moderate'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }
                      >
                        ● {r.kdpRisk} Risk
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded text-xs font-semibold transition-colors"
                      >
                        View Summary
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                  {selectedReport.auditType} Quality Audit
                </span>
                <h3 className="text-base font-bold text-white mt-1">{selectedReport.bookTitle}</h3>
                <p className="text-xs text-slate-400">
                  Author: {selectedReport.userName} ({selectedReport.userEmail})
                </p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-around text-center">
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-semibold">Compliance Score</p>
                <p className="text-2xl font-bold text-emerald-400 mt-0.5">{selectedReport.score}%</p>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-semibold">Issues Detected</p>
                <p className="text-2xl font-bold text-amber-400 mt-0.5">{selectedReport.issuesCount}</p>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-semibold">KDP Risk</p>
                <p className="text-xs font-bold uppercase text-purple-300 mt-2">{selectedReport.kdpRisk}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
