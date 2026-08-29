'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { auth } from '../../../lib/firebase';
import type { SystemHealthReport } from '../../../types/admin';

export function SystemHealthPage() {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/system/health', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      console.error('[SystemHealthPage]', err);
      setError(err.message || 'Failed to generate system health report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleResolveError = async (errorId: string) => {
    setResolvingId(errorId);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await fetch('/api/admin/system/health', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ errorId }),
      });
      if (!res.ok) throw new Error('Failed to resolve error');
      setToast('✅ Error marked as resolved');
      setTimeout(() => setToast(''), 3000);
      fetchHealth();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResolvingId(null);
    }
  };

  const overall = report?.overallStatus || 'operational';
  const services = report?.services || [];
  const cronJobs = report?.cronJobs || [];
  const recentErrors = report?.recentErrors || [];
  const apiPerformance = report?.apiPerformance || [];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e35] border border-white/10 text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🔧</span> System Health & Service Monitor
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time latency probes, cron job executions, API performance, and error logs
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a2e] border border-white/10 hover:border-white/20 rounded-lg text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50"
        >
          <span>🔄</span> {loading ? 'Checking Probes…' : 'Run Diagnostics'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* ── Overall Status Banner ── */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between ${
          overall === 'operational'
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : overall === 'degraded'
            ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            : 'bg-red-950/40 border-red-500/30 text-red-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {overall === 'operational' ? '✅' : overall === 'degraded' ? '⚠️' : '🚨'}
          </span>
          <div>
            <h2 className="text-base font-bold text-white">
              {overall === 'operational'
                ? 'All Core Systems Operational'
                : overall === 'degraded'
                ? 'Some Integrations Degraded (Fallback Mode)'
                : 'Critical Incident Detected'}
            </h2>
            <p className="text-xs opacity-80 mt-0.5">
              Last probe checked: {report?.lastUpdated ? new Date(report.lastUpdated).toLocaleTimeString() : 'now'}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold uppercase px-3 py-1 bg-black/30 rounded-full border border-white/10">
          {overall}
        </span>
      </div>

      {/* ── Service Status Grid ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          Integration Probes & API Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map(s => {
            const isOp = s.status === 'operational';
            const isDeg = s.status === 'degraded';
            return (
              <div
                key={s.name}
                className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white truncate max-w-[170px]" title={s.name}>
                      {s.name}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOp
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : isDeg
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                          : 'bg-red-950/60 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {s.details || 'Operational and responsive'}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Latency:</span>
                  <span className="text-slate-300 font-semibold">
                    {s.latencyMs !== undefined ? `${s.latencyMs}ms` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Cron Jobs & API Response Times ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cron Job Table */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-white mb-1">⏰ Scheduled Background Jobs (Cron)</h2>
          <p className="text-xs text-slate-400 mb-4">Autonomous system jobs & maintenance triggers</p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 uppercase font-semibold">
                  <th className="pb-2">Job Name</th>
                  <th className="pb-2">Schedule</th>
                  <th className="pb-2">Last Run</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {cronJobs.map(job => (
                  <tr key={job.jobName} className="hover:bg-white/5">
                    <td className="py-2.5 font-medium text-white">{job.jobName}</td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-400">{job.schedule}</td>
                    <td className="py-2.5 text-slate-400">
                      {new Date(job.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          job.status === 'success'
                            ? 'bg-emerald-900/40 text-emerald-300'
                            : 'bg-red-900/40 text-red-300'
                        }`}
                      >
                        {job.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* API Response Times */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-white mb-1">⚡ Core API Endpoint Latencies</h2>
          <p className="text-xs text-slate-400 mb-4">Average response times in milliseconds</p>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={apiPerformance} layout="vertical" margin={{ left: 90, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} unit="ms" />
              <YAxis
                type="category"
                dataKey="route"
                tick={{ fill: '#d1d5db', fontSize: 10 }}
                width={85}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid #ffffff20',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
                formatter={(val: any) => [`${val} ms`, 'Avg Latency']}
              />
              <Bar dataKey="avgLatencyMs" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Recent Errors Log ── */}
      <section className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">🚨 Recent Application Errors (/errorLogs)</h2>
            <p className="text-xs text-slate-400">Captured failures across PDF exports, AI generation, and webhooks</p>
          </div>
          <span className="text-xs text-slate-500">{recentErrors.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Context</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {recentErrors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    🎉 Clean log! Zero unresolved system errors.
                  </td>
                </tr>
              ) : (
                recentErrors.map(err => (
                  <tr key={err.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(err.timestamp).toLocaleDateString()}{' '}
                      <span className="text-[10px] text-slate-600">
                        {new Date(err.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-red-300">
                      {err.type}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-200" title={err.message}>
                      {err.message}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400 max-w-[180px] truncate">
                      {JSON.stringify(err.context)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {!err.resolved ? (
                        <button
                          onClick={() => handleResolveError(err.id)}
                          disabled={resolvingId === err.id}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 text-xs rounded transition-colors"
                        >
                          {resolvingId === err.id ? 'Saving…' : 'Mark Resolved'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
